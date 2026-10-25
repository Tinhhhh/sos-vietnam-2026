package com.sosvietnam.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sosvietnam.model.payload.enums.EmergencyType;
import com.sosvietnam.model.payload.enums.IncidentStatus;
import com.sosvietnam.model.payload.request.DispatchRequest;
import com.sosvietnam.model.payload.response.IncidentResponse;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.File;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Hệ thống Điều Phối Bot Zalo Phân Tầng & Tiếp Nhận 2 Chiều (Spring Boot Java 21).
 *
 * Tính năng cốt lõi:
 *  1. 1 Bot Zalo Tổng (`https://bot-api.zaloplatforms.com/bot<TOKEN>/...`) tự động định tuyến theo
 *     { province, ward, agency, level } — không bao giờ gửi nhầm Xã/Phường khác.
 *  2. Liên kết không cần SĐT cá nhân: tạo Nhóm Zalo đơn vị -> gõ `/ketnoi <unitCode>`
 *     (VD: `/ketnoi cap_tanan`, `/ketnoi csgt_cantho`, `/ketnoi pccc_cantho`, `/ketnoi chihuy_cantho`).
 *  3. Tiếp nhận 2 chiều ngay trên điện thoại khi cán bộ đi ăn cơm / tuần tra:
 *     - Bấm 1 chạm vào Link Tiếp Nhận ký số HMAC-SHA256 (`/api/zalo/quick-accept`)
 *     - Hoặc nhắn trả lời `TN` / `TN <MÃ_CA>` ngay trong nhóm Zalo.
 *  4. Nhắc khẩn lần 2 sau 3 phút (hoặc 20 giây ở chế độ Demo) & Cảnh báo Leo thang lên Chỉ Huy Tỉnh/TP sau 15 phút (45 giây Demo).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ZaloBotDispatchService {

    private final IncidentService incidentService;
    private final ObjectMapper objectMapper;

    @Value("${sos.zalo.config-file:./data/zalo-bot-config.json}")
    private String configFilePath;

    @Value("${sos.zalo.bot-token:}")
    private String defaultBotToken;

    @Value("${sos.zalo.public-base-url:}")
    private String defaultPublicBaseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    private final Map<String, ScheduledFuture<?>> reminderTasks = new ConcurrentHashMap<>();
    private final Map<String, ScheduledFuture<?>> escalationTasks = new ConcurrentHashMap<>();
    private final Map<String, String> lastPendingIncidentByChat = new ConcurrentHashMap<>();
    private final Set<String> processedMessageIds = Collections.newSetFromMap(new ConcurrentHashMap<>());

    private ZaloConfigState state = new ZaloConfigState();

    @Data
    public static class ZaloBinding {
        private String chatId;
        private String chatTitle;
        private String chatType = "GROUP";
        private String senderName;
        private String officerName;
        private String unitCode;
        private String unitName;
        private String agency = "police"; // police | csgt | fire | hospital | all
        private String agencyLabel;
        private String level = "ward";    // ward | province | national
        private String province;
        private String ward;
        private String defaultOfficerName = "Cán bộ trực ban Zalo";
        private String defaultOfficerRank = "Cán bộ";
        private String defaultPhone = "113";
        private boolean enabled = true;
        private String linkedAt;
    }

    @Data
    public static class ZaloConfigState {
        private boolean enabled = true;
        private String botToken = "";
        private String apiBaseUrl = "https://bot-api.zaloplatforms.com";
        private String publicBaseUrl = "";
        private String webhookSecret = UUID.randomUUID().toString().replace("-", "");
        private String hmacSecret = UUID.randomUUID().toString() + UUID.randomUUID();
        private boolean webhookActive = false;
        private boolean demoFastMode = false;
        private boolean requirePairingPassword = true;
        private Map<String, String> unitPasswords = new ConcurrentHashMap<>();
        private int reminderSeconds = 180;
        private int escalationSeconds = 900;
        private int demoReminderSeconds = 20;
        private int demoEscalationSeconds = 45;
        private List<ZaloBinding> bindings = new CopyOnWriteArrayList<>();
        private Map<String, ZaloBinding> customUnits = new ConcurrentHashMap<>();
        private List<Map<String, Object>> outboxLog = new CopyOnWriteArrayList<>();
    }

    private static final List<ZaloBinding> PRESETS = List.of(
            preset("cap_tanan", "Công An Phường Tân An, TP. Cần Thơ", "police", "Công An Cấp Xã/Phường", "ward", "Cần Thơ", "Phường Tân An", "Trung tá", "Nguyễn Minh Hoàng", "02923820113"),
            preset("cap_ninhkieu", "Công An Phường Ninh Kiều, TP. Cần Thơ", "police", "Công An Cấp Xã/Phường", "ward", "Cần Thơ", "Phường Ninh Kiều", "Trung tá", "Trần Quốc Tuấn", "02923812113"),
            preset("cap_longtuyen", "Công An Phường Long Tuyền, TP. Cần Thơ", "police", "Công An Cấp Xã/Phường", "ward", "Cần Thơ", "Phường Long Tuyền", "Thiếu tá", "Lê Văn Khải", "02923841113"),
            preset("cap_cairang", "Công An Phường Cái Răng, TP. Cần Thơ", "police", "Công An Cấp Xã/Phường", "ward", "Cần Thơ", "Phường Cái Răng", "Thiếu tá", "Phạm Hữu Nghĩa", "02923910113"),
            preset("csgt_cantho", "Phòng Cảnh Sát Giao Thông (PC08) - Công An TP. Cần Thơ", "csgt", "Cảnh Sát Giao Thông (CSGT)", "province", "Cần Thơ", "", "Thượng tá", "Võ Thành Trung", "02923822113"),
            preset("pccc_cantho", "Phòng Cảnh Sát PCCC & CNCH (PC07) - Công An TP. Cần Thơ", "fire", "Cảnh Sát PCCC & CNCH", "province", "Cần Thơ", "", "Thượng tá", "Đặng Quốc Việt", "114"),
            preset("capcuu_cantho", "Trung Tâm Cấp Cứu Y Tế 115 TP. Cần Thơ", "hospital", "Cấp Cứu Y Tế 115", "province", "Cần Thơ", "", "Bác sĩ CKII", "Huỳnh Minh Tâm", "115"),
            preset("chihuy_cantho", "Trung Tâm Chỉ Huy Công An TP. Cần Thơ (Nhận Leo Thang 15 Phút)", "all", "Chỉ Huy Cấp Tỉnh/Thành Phố", "province", "Cần Thơ", "", "Đại tá", "Trực Ban Chỉ Huy Thành Phố", "113"),
            preset("tongtrucban", "Tổng Trực Ban Trung Tâm Chỉ Huy Quốc Gia (Giám Sát Toàn Quốc)", "all", "Trung Tâm Chỉ Huy Tác Chiến Quốc Gia", "national", "Toàn Quốc", "", "Đại tá", "Tổng Trực Ban C4ISR", "113")
    );

    private static ZaloBinding preset(String code, String name, String agency, String label, String level, String prov, String ward, String rank, String officer, String phone) {
        ZaloBinding b = new ZaloBinding();
        b.setUnitCode(code);
        b.setUnitName(name);
        b.setAgency(agency);
        b.setAgencyLabel(label);
        b.setLevel(level);
        b.setProvince(prov);
        b.setWard(ward);
        b.setDefaultOfficerRank(rank);
        b.setDefaultOfficerName(officer);
        b.setDefaultPhone(phone);
        return b;
    }

    @PostConstruct
    public void init() {
        loadState();
        if ((state.getBotToken() == null || state.getBotToken().isBlank()) && defaultBotToken != null && !defaultBotToken.isBlank()) {
            state.setBotToken(defaultBotToken.trim());
        }
        if ((state.getPublicBaseUrl() == null || state.getPublicBaseUrl().isBlank()) && defaultPublicBaseUrl != null && !defaultPublicBaseUrl.isBlank()) {
            state.setPublicBaseUrl(defaultPublicBaseUrl.trim());
        }
    }

    @PreDestroy
    public void shutdown() {
        scheduler.shutdownNow();
    }

    private synchronized void loadState() {
        try {
            File f = new File(configFilePath);
            if (f.exists()) {
                state = objectMapper.readValue(f, ZaloConfigState.class);
            }
        } catch (Exception e) {
            log.warn("[ZALO-BOT] Khởi tạo cấu hình mặc định: {}", e.getMessage());
        }
    }

    private synchronized void saveState() {
        try {
            File f = new File(configFilePath);
            if (f.getParentFile() != null && !f.getParentFile().exists()) {
                f.getParentFile().mkdirs();
            }
            if (state.getOutboxLog().size() > 60) {
                List<Map<String, Object>> trimmed = new ArrayList<>(state.getOutboxLog().subList(state.getOutboxLog().size() - 60, state.getOutboxLog().size()));
                state.setOutboxLog(new CopyOnWriteArrayList<>(trimmed));
            }
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(f, state);
        } catch (Exception e) {
            log.warn("[ZALO-BOT] Không thể lưu cấu hình: {}", e.getMessage());
        }
    }

    public static String stripTones(String input) {
        if (input == null) return "";
        String norm = Normalizer.normalize(input, Normalizer.Form.NFD);
        return norm.replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replace('đ', 'd').replace('Đ', 'D');
    }

    public static String normalizeGeoSlug(String raw) {
        String s = stripTones(raw).toLowerCase(Locale.ROOT).trim();
        s = s.replaceAll("^(thanh pho|tp\\.?|tinh|quan|huyen|thi xa|phuong|xa|thi tran|p\\.|x\\.)\\s+", "");
        s = s.replaceAll("[^a-z0-9]+", " ").trim();
        return s;
    }

    private String mapEmergencyTypeToAgency(EmergencyType type) {
        if (type == null) return "police";
        return switch (type) {
            case TRAFFIC -> "csgt";
            case FIRE -> "fire";
            case AMBULANCE -> "hospital";
            default -> "police";
        };
    }

    public String signQuickAccept(String incidentId, String chatId) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(state.getHmacSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal((incidentId + "|" + (chatId == null ? "" : chatId)).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 16 && i < raw.length; i++) {
                sb.append(String.format("%02x", raw[i]));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("HMAC error", e);
        }
    }

    public boolean verifyQuickAccept(String incidentId, String chatId, String sig) {
        if (incidentId == null || sig == null || sig.isBlank()) return false;
        String expected = signQuickAccept(incidentId, chatId);
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), sig.trim().getBytes(StandardCharsets.UTF_8));
    }

    public String buildQuickAcceptUrl(String incidentId, String chatId, String fallbackOrigin) {
        String base = (state.getPublicBaseUrl() != null && !state.getPublicBaseUrl().isBlank())
                ? state.getPublicBaseUrl().replaceAll("/+$", "")
                : (fallbackOrigin != null && !fallbackOrigin.isBlank() ? fallbackOrigin.replaceAll("/+$", "") : "https://sos-vietnam-2026.onrender.com");
        String sig = signQuickAccept(incidentId, chatId);
        return base + "/api/zalo/quick-accept?id=" + URLEncoder.encode(incidentId, StandardCharsets.UTF_8)
                + "&chat=" + URLEncoder.encode(chatId == null ? "" : chatId, StandardCharsets.UTF_8)
                + "&sig=" + sig;
    }

    public ZaloBinding resolveUnitByCode(String rawCode) {
        if (rawCode == null) return null;
        String code = stripTones(rawCode).toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "");
        for (ZaloBinding p : PRESETS) {
            if (p.getUnitCode().equalsIgnoreCase(code)) return p;
        }
        return state.getCustomUnits().get(code);
    }

    public ZaloBinding registerCustomUnit(Map<String, Object> body) {
        String province = String.valueOf(body.getOrDefault("province", "Cần Thơ"));
        String ward = String.valueOf(body.getOrDefault("ward", ""));
        String agency = String.valueOf(body.getOrDefault("agency", "police"));
        String level = String.valueOf(body.getOrDefault("level", ward.isBlank() ? "province" : "ward"));
        String provSlug = normalizeGeoSlug(province).replace(" ", "");
        String wardSlug = normalizeGeoSlug(ward).replace(" ", "");
        String prefix = "csgt".equals(agency) ? "csgt" : ("fire".equals(agency) ? "pccc" : ("hospital".equals(agency) ? "capcuu" : ("province".equals(level) ? "chihuy" : "cap")));
        String rawCode = String.valueOf(body.getOrDefault("unitCode", ""));
        String code = rawCode.isBlank()
                ? (wardSlug.isBlank() ? prefix + "_" + provSlug : prefix + "_" + wardSlug + "_" + provSlug.substring(0, Math.min(4, provSlug.length())))
                : stripTones(rawCode).toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "");

        ZaloBinding def = new ZaloBinding();
        def.setUnitCode(code);
        def.setUnitName(String.valueOf(body.getOrDefault("unitName", ward.isBlank() ? "Trực Ban " + prefix.toUpperCase() + " " + province : "Công An " + ward + ", " + province)));
        def.setAgency(agency);
        def.setAgencyLabel("police".equals(agency) ? "Công An Cấp Xã/Phường" : ("csgt".equals(agency) ? "Cảnh Sát Giao Thông" : ("fire".equals(agency) ? "Cảnh Sát PCCC & CNCH" : "Đơn vị Trực ban")));
        def.setLevel(level);
        def.setProvince(province);
        def.setWard(ward);
        state.getCustomUnits().put(code, def);
        saveState();
        return def;
    }

    public List<ZaloBinding> resolveTargetBindings(IncidentResponse inc, String stage) {
        if (inc == null || !state.isEnabled()) return List.of();
        String incAgency = mapEmergencyTypeToAgency(inc.getEmergencyType());
        String incProv = normalizeGeoSlug(inc.getProvince());
        String incWard = normalizeGeoSlug(inc.getWard());
        String incLevel = "police".equals(incAgency) ? "ward" : "province";

        List<ZaloBinding> matched = new ArrayList<>();
        for (ZaloBinding b : state.getBindings()) {
            if (!b.isEnabled() || b.getChatId() == null || b.getChatId().isBlank()) continue;
            if ("national".equals(b.getLevel())) {
                matched.add(b);
                continue;
            }
            String bProv = normalizeGeoSlug(b.getProvince());
            String bWard = normalizeGeoSlug(b.getWard());
            if (!incProv.isBlank() && !bProv.isBlank() && !incProv.equals(bProv)) continue;

            if ("escalated".equals(stage)) {
                if ("province".equals(b.getLevel()) && ("all".equals(b.getAgency()) || incAgency.equals(b.getAgency()))) {
                    matched.add(b);
                }
                continue;
            }

            if ("police".equals(incAgency) && "ward".equals(incLevel)) {
                if (!bWard.isBlank() && bWard.equals(incWard) && ("police".equals(b.getAgency()) || "all".equals(b.getAgency()))) {
                    matched.add(b);
                }
            } else if (incAgency.equals(b.getAgency())) {
                if (bWard.isBlank() || incWard.isBlank() || bWard.equals(incWard)) {
                    matched.add(b);
                }
            }
        }
        return matched;
    }

    public Map<String, Object> sendZaloMessage(String chatId, String text, Map<String, Object> meta) {
        String safeText = text == null ? "" : (text.length() > 1950 ? text.substring(0, 1950) : text);
        String token = state.getBotToken() == null ? "" : state.getBotToken().trim();
        Map<String, Object> logItem = new LinkedHashMap<>(meta == null ? Map.of() : meta);
        logItem.put("timestamp", Instant.now().toString());
        logItem.put("chatId", chatId);
        logItem.put("text", safeText);

        if (token.isBlank()) {
            logItem.put("delivered", false);
            logItem.put("simulated", true);
            state.getOutboxLog().add(logItem);
            saveState();
            return Map.of("ok", true, "simulated", true);
        }

        try {
            String url = state.getApiBaseUrl().replaceAll("/+$", "") + "/bot" + token + "/sendMessage";
            String payload = objectMapper.writeValueAsString(Map.of("chat_id", chatId, "text", safeText));
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(8))
                    .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            boolean ok = resp.statusCode() >= 200 && resp.statusCode() < 300;
            logItem.put("delivered", ok);
            logItem.put("simulated", false);
            state.getOutboxLog().add(logItem);
            saveState();
            return Map.of("ok", ok, "status", resp.statusCode());
        } catch (Exception e) {
            logItem.put("delivered", false);
            logItem.put("error", e.getMessage());
            state.getOutboxLog().add(logItem);
            saveState();
            return Map.of("ok", false, "error", e.getMessage());
        }
    }

    public Map<String, Object> broadcastAnnouncement(Map<String, Object> body) {
        String message = String.valueOf(body.getOrDefault("message", "")).trim();
        if (message.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập nội dung thông báo khẩn cấp / bảo trì cần phát đi!");
        }
        String category = String.valueOf(body.getOrDefault("category", "maintenance")).trim().toLowerCase(Locale.ROOT);
        String title = String.valueOf(body.getOrDefault("title", "")).trim();
        String scope = String.valueOf(body.getOrDefault("targetScope", "all")).trim().toLowerCase(Locale.ROOT);
        String provSlug = normalizeGeoSlug(String.valueOf(body.getOrDefault("provinceFilter", "")));
        String senderLabel = String.valueOf(body.getOrDefault("senderLabel", "")).trim();
        if (senderLabel.isBlank()) senderLabel = "Trung Tâm Chỉ Huy SOS Việt Nam 2026";

        Set<String> seenChats = new LinkedHashSet<>();
        List<ZaloBinding> targets = new ArrayList<>();
        for (ZaloBinding b : state.getBindings()) {
            if (!b.isEnabled() || b.getChatId() == null || b.getChatId().isBlank()) continue;
            String chatKey = b.getChatId().trim();
            if (!seenChats.add(chatKey)) continue;

            String ag = String.valueOf(b.getAgency()).toLowerCase(Locale.ROOT);
            String lv = String.valueOf(b.getLevel()).toLowerCase(Locale.ROOT);
            if ("police".equals(scope) && !"police".equals(ag)) continue;
            if ("csgt".equals(scope) && !"csgt".equals(ag)) continue;
            if ("fire".equals(scope) && !"fire".equals(ag)) continue;
            if ("hospital".equals(scope) && !"hospital".equals(ag) && !"ambulance".equals(ag)) continue;
            if ("province_hq".equals(scope) && !"province".equals(lv) && !"national".equals(lv)) continue;

            if (!provSlug.isBlank() && !"national".equals(lv)) {
                if (!normalizeGeoSlug(b.getProvince()).equals(provSlug)) continue;
            }
            targets.add(b);
        }

        if (targets.isEmpty()) {
            throw new IllegalArgumentException("Hiện chưa có nhóm/cán bộ Zalo nào khớp phạm vi nhận thông báo. Hãy liên kết nhóm Zalo trước!");
        }

        String header = switch (category) {
            case "emergency" -> "🚨📢 [CÔNG ĐIỆN KHẨN — TRUNG TÂM CHỈ HUY SOS VIỆT NAM]";
            case "maintenance" -> "🔧🛠️ [THÔNG BÁO BẢO TRÌ & CẬP NHẬT HỆ THỐNG]";
            case "weather" -> "⛈️🌊 [CẢNH BÁO THIÊN TAI & TRỰC CỨU HỘ KHẨN CẤP]";
            case "recovery" -> "✅🟢 [THÔNG BÁO HOÀN TẤT NÂNG CẤP — HỆ THỐNG THÔNG SUỐT]";
            default -> "📢 [THÔNG BÁO ĐIỀU HÀNH TRỰC BAN TOÀN HỆ THỐNG]";
        };
        String timeVN = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"))
                .format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy"));

        List<String> lines = new ArrayList<>();
        lines.add(header);
        if (!title.isBlank()) lines.add("📌 Chủ đề: " + title);
        lines.add("🏛️ Phát lệnh từ: " + senderLabel);
        lines.add("⏱️ Thời gian phát: " + timeVN);
        lines.add("━━━━━━━━━━━━━━━━━━━━");
        lines.add(message);
        lines.add("━━━━━━━━━━━━━━━━━━━━");
        lines.add("💬 Hệ thống Điều phối Trực ban 2 chiều — SOS Việt Nam 2026");

        String formattedText = String.join("\n", lines);
        if (formattedText.length() > 1900) formattedText = formattedText.substring(0, 1900);

        int deliveredCount = 0;
        int simulatedCount = 0;
        int failedCount = 0;
        List<Map<String, Object>> results = new ArrayList<>();

        for (ZaloBinding t : targets) {
            Map<String, Object> sendRes = sendZaloMessage(t.getChatId(), formattedText, Map.of(
                    "stage", "system_broadcast",
                    "category", category,
                    "title", title,
                    "unitCode", t.getUnitCode() == null ? "" : t.getUnitCode(),
                    "unitName", t.getUnitName() == null ? "" : t.getUnitName()
            ));
            boolean ok = Boolean.TRUE.equals(sendRes.get("ok"));
            boolean sim = Boolean.TRUE.equals(sendRes.get("simulated"));
            if (ok && !sim) deliveredCount++;
            else if (sim) simulatedCount++;
            else failedCount++;

            Map<String, Object> item = new LinkedHashMap<>(sendRes);
            item.put("chatId", t.getChatId());
            item.put("unitCode", t.getUnitCode());
            item.put("unitName", t.getUnitName());
            results.add(item);
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("ok", true);
        resp.put("category", category);
        resp.put("title", title);
        resp.put("senderLabel", senderLabel);
        resp.put("targetScope", scope);
        resp.put("timeVN", timeVN);
        resp.put("totalMatched", targets.size());
        resp.put("sentCount", deliveredCount + simulatedCount);
        resp.put("deliveredCount", deliveredCount);
        resp.put("simulatedCount", simulatedCount);
        resp.put("failedCount", failedCount);
        resp.put("formattedText", formattedText);
        resp.put("results", results);
        return resp;
    }

    public void onIncidentCreated(IncidentResponse inc, String origin, String extraSourceLabel) {
        if (inc == null || !state.isEnabled()) return;
        List<ZaloBinding> targets = resolveTargetBindings(inc, "initial");
        String gmaps = "https://www.google.com/maps/dir/?api=1&destination=" + inc.getLatitude() + "," + inc.getLongitude();

        for (ZaloBinding b : targets) {
            String quickUrl = buildQuickAcceptUrl(inc.getId(), b.getChatId(), origin);
            String msg = String.join("\n",
                    "🚨 [BÁO ĐỘNG KHẨN CẤP SOS VIỆT NAM]",
                    "🆔 Mã sự cố: #" + inc.getId(),
                    "🏢 Đơn vị phụ trách: " + b.getUnitName(),
                    "📋 Nội dung: " + (extraSourceLabel != null && !extraSourceLabel.isBlank() ? extraSourceLabel : (inc.getDescription() != null ? inc.getDescription() : "Cần hỗ trợ khẩn cấp")),
                    "👤 Người báo: " + inc.getCitizenName() + " — SĐT: " + inc.getPhone(),
                    "📍 Địa điểm: " + (inc.getAddress() != null && !inc.getAddress().isBlank() ? inc.getAddress() : (inc.getWard() + ", " + inc.getProvince())),
                    "",
                    "🧭 Dẫn đường Google Maps:",
                    gmaps,
                    "",
                    "✅ BẤM 1 CHẠM ĐỂ TIẾP NHẬN NGAY TRÊN ĐIỆN THOẠI:",
                    quickUrl,
                    "",
                    "💬 Hoặc trả lời tin nhắn này: TN"
            );
            lastPendingIncidentByChat.put(b.getChatId(), inc.getId());
            sendZaloMessage(b.getChatId(), msg, Map.of("incidentId", inc.getId(), "stage", "initial", "unitCode", b.getUnitCode()));
        }

        int remSec = state.isDemoFastMode() ? state.getDemoReminderSeconds() : state.getReminderSeconds();
        int escSec = state.isDemoFastMode() ? state.getDemoEscalationSeconds() : state.getEscalationSeconds();

        if (!targets.isEmpty()) {
            ScheduledFuture<?> remFuture = scheduler.schedule(() -> sendReminderIfPending(inc.getId(), origin), remSec, TimeUnit.SECONDS);
            reminderTasks.put(inc.getId(), remFuture);
        }

        ScheduledFuture<?> escFuture = scheduler.schedule(() -> escalateIfPending(inc.getId(), origin), escSec, TimeUnit.SECONDS);
        escalationTasks.put(inc.getId(), escFuture);
    }

    private void sendReminderIfPending(String incidentId, String origin) {
        IncidentResponse latest = findRecentIncident(incidentId);
        if (latest == null || latest.getStatus() != IncidentStatus.OPEN) return;
        for (ZaloBinding b : resolveTargetBindings(latest, "reminder")) {
            String quickUrl = buildQuickAcceptUrl(incidentId, b.getChatId(), origin);
            String msg = "⚠️ [NHẮC KHẨN LẦN 2 - CHƯA AI TIẾP NHẬN!]\n🆔 Mã hồ sơ: #" + incidentId
                    + "\n👤 Người dân: " + latest.getCitizenName() + " (" + latest.getPhone() + ")"
                    + "\n✅ Bấm tiếp nhận ngay:\n" + quickUrl + "\n💬 Hoặc trả lời: TN";
            sendZaloMessage(b.getChatId(), msg, Map.of("incidentId", incidentId, "stage", "reminder_3m"));
        }
    }

    private void escalateIfPending(String incidentId, String origin) {
        IncidentResponse latest = findRecentIncident(incidentId);
        if (latest == null || latest.getStatus() != IncidentStatus.OPEN) return;
        for (ZaloBinding b : resolveTargetBindings(latest, "escalated")) {
            String quickUrl = buildQuickAcceptUrl(incidentId, b.getChatId(), origin);
            String msg = "🚨⚡ [BÁO ĐỘNG LEO THANG CẤP TỈNH/TP]\n🆔 Mã hồ sơ: #" + incidentId
                    + "\n🏛️ Chuyển quyền chỉ huy lên: " + b.getUnitName()
                    + "\n👤 Người dân: " + latest.getCitizenName() + " (" + latest.getPhone() + ")"
                    + "\n✅ Tiếp nhận chỉ đạo ngay:\n" + quickUrl;
            lastPendingIncidentByChat.put(b.getChatId(), incidentId);
            sendZaloMessage(b.getChatId(), msg, Map.of("incidentId", incidentId, "stage", "escalated_province_hq"));
        }
    }

    public void cancelTimers(String incidentId) {
        ScheduledFuture<?> r = reminderTasks.remove(incidentId);
        if (r != null) r.cancel(false);
        ScheduledFuture<?> e = escalationTasks.remove(incidentId);
        if (e != null) e.cancel(false);
    }

    private IncidentResponse findRecentIncident(String id) {
        return incidentService.getRecentIncidents().stream()
                .filter(i -> Objects.equals(i.getId(), id))
                .findFirst()
                .orElse(null);
    }

    public synchronized Map<String, Object> acceptFromZalo(String incidentId, String chatId, String senderName, String via) {
        ZaloBinding binding = state.getBindings().stream()
                .filter(b -> Objects.equals(b.getChatId(), chatId))
                .findFirst()
                .orElse(null);
        String officer = (senderName != null && !senderName.isBlank())
                ? senderName
                : (binding != null && binding.getOfficerName() != null && !binding.getOfficerName().isBlank()
                        ? binding.getOfficerName()
                        : (binding != null && binding.getSenderName() != null && !binding.getSenderName().isBlank()
                                ? binding.getSenderName()
                                : (binding != null ? binding.getDefaultOfficerRank() + " " + binding.getDefaultOfficerName() : "Cán bộ trực ban Zalo")));

        DispatchRequest dReq = new DispatchRequest();
        dReq.setDispatcherName(officer);
        dReq.setNote("Tiếp nhận 2 chiều qua Zalo Bot (" + via + ")" + (binding != null ? " — " + binding.getUnitName() : ""));

        IncidentResponse updated = incidentService.dispatchIncident(incidentId, dReq);
        cancelTimers(incidentId);
        return Map.of("ok", true, "incident", updated, "binding", binding != null ? binding : Map.of(), "officer", officer);
    }

    public static String stripBotMentions(String rawText) {
        if (rawText == null) return "";
        String text = rawText.trim();
        if (text.startsWith("@")) {
            String ascii = stripTones(text);
            Matcher tail = Pattern.compile("^@[^\\n]{1,65}?\\s+(/(?:ketnoi|ket_noi|lienket|pair|huyketnoi|unlink|danhsach|status|tn|tiepnhan|nhanca)\\b[\\s\\S]*|(?:ketnoi|ket_noi|lienket|pair)\\s+[\\s\\S]+|(?:tn|tiep\\s*nhan|nhan\\s*ca)(?:\\s+#?[a-zA-Z0-9-]+)?)\\s*$", Pattern.CASE_INSENSITIVE).matcher(ascii);
            if (tail.find()) {
                int len = tail.group(1).length();
                text = text.substring(text.length() - len).trim();
            } else {
                text = text.replaceAll("^(?:@\\S+[,:\\s]+)+", "").trim();
            }
        }
        return text.replaceAll("\\s+@bot\\S*$", "").trim();
    }

    public ZaloBinding resolveUnitByCodeOrQuery(String rawInput) {
        ZaloBinding direct = resolveUnitByCode(rawInput);
        if (direct != null) return direct;
        if (rawInput == null || rawInput.isBlank()) return null;
        String cleaned = rawInput.trim();
        Matcher wp = Pattern.compile("(?:công\\s*an\\s+|trực\\s*ban\\s+|ca\\s+)?((?:phường|xã|thị\\s*trấn|đặc\\s*khu)\\s+[^,|-]+)(?:[,|-]\\s*(.+))?$", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE).matcher(cleaned);
        if (wp.find()) {
            String ward = wp.group(1).trim();
            String prov = wp.group(2) != null && !wp.group(2).isBlank() ? wp.group(2).trim() : "Cần Thơ";
            for (ZaloBinding p : PRESETS) {
                if (normalizeGeoSlug(p.getWard()).equals(normalizeGeoSlug(ward)) && normalizeGeoSlug(p.getProvince()).equals(normalizeGeoSlug(prov))) {
                    return p;
                }
            }
            return registerCustomUnit(Map.of("province", prov, "ward", ward, "agency", "police", "level", "ward", "unitName", "Công An " + ward + ", " + prov));
        }
        return null;
    }

    public String resolveDefaultPasswordForUnit(ZaloBinding unit) {
        if (unit == null) return "Congan@113";
        String code = unit.getUnitCode() == null ? "" : unit.getUnitCode().toLowerCase(Locale.ROOT).trim();
        if (!code.isBlank() && state.getUnitPasswords() != null && state.getUnitPasswords().containsKey(code)) {
            String custom = state.getUnitPasswords().get(code);
            if (custom != null && !custom.isBlank()) return custom.trim();
        }
        if ("national".equalsIgnoreCase(unit.getLevel()) || "tongtrucban".equals(code) || "admin".equals(code)) {
            return "Admin";
        }
        String agency = unit.getAgency() == null ? "police" : unit.getAgency().toLowerCase(Locale.ROOT);
        return switch (agency) {
            case "csgt" -> "Csgt@113";
            case "fire" -> "Pccc@114";
            case "hospital", "ambulance" -> "Capcuu@115";
            case "traffic-rescue" -> "Cuuhoxe@113";
            default -> "Congan@113";
        };
    }

    public boolean verifyUnitPairingPassword(ZaloBinding unit, String rawPassword) {
        String pwd = rawPassword == null ? "" : rawPassword.trim();
        if (pwd.isBlank() || "2002".equals(pwd)) return false;
        String expected = resolveDefaultPasswordForUnit(unit);
        if (expected.equalsIgnoreCase(pwd)) return true;
        if ("national".equalsIgnoreCase(unit.getLevel()) || "tongtrucban".equalsIgnoreCase(unit.getUnitCode())) {
            return "admin@2026".equalsIgnoreCase(pwd) || "admin123".equalsIgnoreCase(pwd);
        }
        if ("fire".equalsIgnoreCase(unit.getAgency()) && "cuuho@114".equalsIgnoreCase(pwd)) return true;
        return false;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> handleWebhookPayload(Map<String, Object> payload, String origin) {
        return handleWebhookPayload(payload, origin, false);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> handleWebhookPayload(Map<String, Object> payload, String origin, boolean skipPasswordCheck) {
        List<Map<String, Object>> msgs = extractMessages(payload);
        List<Map<String, Object>> outcomes = new ArrayList<>();
        Pattern ketnoiPattern = Pattern.compile("^/?(?:ketnoi|ket_noi|lienket|pair)\\s+([\\s\\S]+)$", Pattern.CASE_INSENSITIVE);
        Pattern tnPattern = Pattern.compile("^/?(?:tn|tiep\\s*nhan|nhan\\s*ca)(?:\\s+#?([A-Za-z0-9_-]+))?$", Pattern.CASE_INSENSITIVE);

        for (Map<String, Object> m : msgs) {
            String msgId = String.valueOf(m.getOrDefault("messageId", ""));
            if (!msgId.isBlank() && !processedMessageIds.add(msgId)) continue;

            String chatId = String.valueOf(m.get("chatId"));
            String chatTitle = String.valueOf(m.get("chatTitle"));
            String senderName = String.valueOf(m.get("senderName"));
            String cleaned = stripBotMentions(String.valueOf(m.get("text")));

            Matcher km = ketnoiPattern.matcher(cleaned);
            if (km.find()) {
                String[] parts = km.group(1).split("\\|", 2);
                String seg0 = parts[0].trim();
                String customTitle = parts.length > 1 ? parts[1].trim() : chatTitle;
                String[] tokens = seg0.split("\\s+");
                String unitArg = seg0;
                String suppliedPass = "";
                ZaloBinding unit = tokens.length > 0 ? resolveUnitByCode(tokens[0]) : null;
                if (unit != null) {
                    unitArg = tokens[0];
                    suppliedPass = tokens.length >= 2 ? String.join(" ", Arrays.copyOfRange(tokens, 1, tokens.length)).trim() : "";
                } else if (tokens.length >= 2) {
                    String lastTok = tokens[tokens.length - 1];
                    String prefix = seg0.substring(0, seg0.lastIndexOf(lastTok)).replaceAll("[\\s,;-]+$", "").trim();
                    if (lastTok.length() >= 4 && lastTok.matches(".*[0-9@#$!%^&*_=+~].*")) {
                        unitArg = prefix;
                        suppliedPass = lastTok;
                    }
                    unit = resolveUnitByCodeOrQuery(unitArg);
                } else {
                    unit = resolveUnitByCodeOrQuery(unitArg);
                }

                if (unit == null) {
                    sendZaloMessage(chatId, "❌ Không nhận diện được đơn vị \"" + unitArg + "\". Thử: /ketnoi cap_tanan <Mật_khẩu_trực_ban>", Map.of("stage", "cmd_ketnoi_invalid"));
                    outcomes.add(Map.of("action", "ketnoi_invalid", "code", unitArg));
                    continue;
                }
                if (state.isRequirePairingPassword() && !skipPasswordCheck) {
                    if (suppliedPass.isBlank()) {
                        sendZaloMessage(chatId, "🔒 YÊU CẦU MẬT KHẨU TRỰC BAN ĐỂ KẾT NỐI ĐƠN VỊ!\n🏢 Đơn vị: " + unit.getUnitName() + "\n👉 Cú pháp: /ketnoi " + unit.getUnitCode() + " <Mật_khẩu_trực_ban>", Map.of("stage", "cmd_ketnoi_missing_pass", "unitCode", unit.getUnitCode()));
                        outcomes.add(Map.of("action", "ketnoi_missing_password", "unitCode", unit.getUnitCode()));
                        continue;
                    }
                    if (!verifyUnitPairingPassword(unit, suppliedPass)) {
                        sendZaloMessage(chatId, "⛔ SAI MẬT KHẨU TRỰC BAN — TỪ CHỐI KẾT NỐI!\n🏢 Đơn vị: " + unit.getUnitName() + " (" + unit.getUnitCode() + ")", Map.of("stage", "cmd_ketnoi_denied", "unitCode", unit.getUnitCode()));
                        outcomes.add(Map.of("action", "ketnoi_wrong_password", "unitCode", unit.getUnitCode()));
                        continue;
                    }
                }
                ZaloBinding bound = bindChat(chatId, customTitle, senderName, unit);
                sendZaloMessage(chatId, "✅ LIÊN KẾT BOT TRỰC BAN THÀNH CÔNG!\n🏢 Đơn vị: " + bound.getUnitName() + "\n🔐 Xác thực mật khẩu trực ban: HỢP LỆ\n👮 Cán bộ kích hoạt: " + senderName + "\n💡 Khi có sự cố, bấm Link Tiếp Nhận hoặc gõ /tn (hoặc @TênBot TN) để nhận ca!", Map.of("stage", "cmd_ketnoi_ok", "unitCode", bound.getUnitCode()));
                outcomes.add(Map.of("action", "ketnoi_ok", "unitCode", bound.getUnitCode(), "binding", bound));
                continue;
            }

            Matcher tm = tnPattern.matcher(stripTones(cleaned).trim());
            if (tm.matches()) {
                String incId = tm.group(1) != null ? tm.group(1).toUpperCase(Locale.ROOT) : lastPendingIncidentByChat.get(chatId);
                if (incId == null) {
                    sendZaloMessage(chatId, "✅ Đường truyền phản hồi 2 chiều HOẠT ĐỘNG TỐT!\n👮 Đã nhận diện cán bộ: " + senderName + "\nℹ️ Hiện chưa có ca SOS khẩn cấp nào đang chờ tiếp nhận tại nhóm này.", Map.of("stage", "cmd_tn_empty"));
                    outcomes.add(Map.of("action", "tn_no_incident", "officerName", senderName));
                    continue;
                }
                Map<String, Object> res = acceptFromZalo(incId, chatId, senderName, "zalo_chat");
                IncidentResponse inc = (IncidentResponse) res.get("incident");
                sendZaloMessage(chatId, "✅ ĐÃ XÁC NHẬN TIẾP NHẬN CA #" + inc.getId() + "!\n👮 Cán bộ nhận ca: " + senderName + "\n🧭 Google Maps: https://www.google.com/maps/dir/?api=1&destination=" + inc.getLatitude() + "," + inc.getLongitude(), Map.of("stage", "cmd_tn_ok", "incidentId", inc.getId()));
                outcomes.add(Map.of("action", "tn_accepted", "incidentId", inc.getId(), "officerName", senderName));
            }
        }
        return Map.of("ok", true, "count", msgs.size(), "outcomes", outcomes);
    }

    private ZaloBinding bindChat(String chatId, String chatTitle, String senderName, ZaloBinding unit) {
        state.getBindings().removeIf(b -> Objects.equals(b.getChatId(), chatId));
        ZaloBinding copy = new ZaloBinding();
        copy.setChatId(chatId);
        copy.setChatTitle(chatTitle == null || chatTitle.isBlank() ? "Nhóm Zalo — " + unit.getUnitName() : chatTitle);
        copy.setSenderName(senderName);
        copy.setOfficerName(senderName != null && !senderName.isBlank() ? senderName : unit.getDefaultOfficerName());
        copy.setUnitCode(unit.getUnitCode());
        copy.setUnitName(unit.getUnitName());
        copy.setAgency(unit.getAgency());
        copy.setAgencyLabel(unit.getAgencyLabel());
        copy.setLevel(unit.getLevel());
        copy.setProvince(unit.getProvince());
        copy.setWard(unit.getWard());
        copy.setDefaultOfficerName(copy.getOfficerName());
        copy.setDefaultOfficerRank(unit.getDefaultOfficerRank());
        copy.setDefaultPhone(unit.getDefaultPhone());
        copy.setLinkedAt(Instant.now().toString());
        state.getBindings().add(copy);
        saveState();
        return copy;
    }

    public ZaloBinding updateBinding(Map<String, Object> body) {
        String chatId = String.valueOf(body.getOrDefault("chatId", "")).trim();
        ZaloBinding existing = state.getBindings().stream()
                .filter(b -> Objects.equals(b.getChatId(), chatId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm Zalo đã liên kết."));

        String unitCode = String.valueOf(body.getOrDefault("unitCode", "")).trim();
        String province = String.valueOf(body.getOrDefault("province", existing.getProvince())).trim();
        String ward = String.valueOf(body.getOrDefault("ward", existing.getWard())).trim();
        String agency = String.valueOf(body.getOrDefault("agency", existing.getAgency())).trim();
        String level = String.valueOf(body.getOrDefault("level", existing.getLevel())).trim();
        String chatTitle = String.valueOf(body.getOrDefault("chatTitle", existing.getChatTitle())).trim();
        String officerName = String.valueOf(body.getOrDefault("officerName", existing.getOfficerName() != null ? existing.getOfficerName() : "")).trim();

        ZaloBinding target = !unitCode.isBlank() ? resolveUnitByCode(unitCode) : null;
        if (target == null && (!ward.isBlank() || !province.isBlank())) {
            target = registerCustomUnit(Map.of("province", province, "ward", "ward".equals(level) ? ward : "", "agency", agency, "level", level));
        }
        if (target != null) {
            existing.setUnitCode(target.getUnitCode());
            existing.setUnitName(target.getUnitName());
            existing.setAgency(target.getAgency());
            existing.setAgencyLabel(target.getAgencyLabel());
            existing.setLevel(target.getLevel());
            existing.setProvince(target.getProvince());
            existing.setWard(target.getWard());
        }
        if (!chatTitle.isBlank()) existing.setChatTitle(chatTitle);
        if (!officerName.isBlank()) {
            existing.setOfficerName(officerName);
            existing.setDefaultOfficerName(officerName);
        }
        saveState();

        if (!Boolean.FALSE.equals(body.get("notifyChat"))) {
            sendZaloMessage(chatId, "🔄 [CẬP NHẬT ĐỊA BÀN TRỰC BAN THÀNH CÔNG]\n🏷️ Tên nhóm: " + existing.getChatTitle() + "\n🏢 Đơn vị: " + existing.getUnitName(), Map.of("stage", "binding_updated_web"));
        }
        return existing;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractMessages(Map<String, Object> payload) {
        if (payload == null) return List.of();
        List<Map<String, Object>> raw = new ArrayList<>();
        Object r = payload.get("result");
        if (r instanceof List<?> list) {
            for (Object item : list) if (item instanceof Map<?, ?> m) raw.add((Map<String, Object>) m);
        } else if (r instanceof Map<?, ?> m) {
            raw.add((Map<String, Object>) m);
        } else {
            raw.add(payload);
        }

        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> item : raw) {
            Object msgObj = item.get("message");
            if (!(msgObj instanceof Map<?, ?> msg)) continue;
            Map<String, Object> chat = msg.get("chat") instanceof Map<?, ?> c ? (Map<String, Object>) c : Map.of();
            Map<String, Object> from = msg.get("from") instanceof Map<?, ?> f ? (Map<String, Object>) f : Map.of();
            String chatId = String.valueOf(chat.getOrDefault("id", from.getOrDefault("id", ""))).trim();
            String text = String.valueOf(msg.getOrDefault("text", "")).trim();
            if (chatId.isBlank() || text.isBlank()) continue;
            String sender = String.valueOf(from.getOrDefault("display_name", "Cán bộ Zalo"));
            String title = String.valueOf(chat.getOrDefault("title", sender));
            String messageId = String.valueOf(msg.getOrDefault("message_id", chatId + "_" + System.currentTimeMillis()));
            out.add(Map.of("messageId", messageId, "chatId", chatId, "chatTitle", title, "senderName", sender, "text", text));
        }
        return out;
    }

    public Map<String, Object> getPublicStatus() {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("ok", true);
        res.put("enabled", state.isEnabled());
        res.put("hasToken", state.getBotToken() != null && !state.getBotToken().isBlank());
        res.put("maskedToken", state.getBotToken() != null && state.getBotToken().length() > 8
                ? state.getBotToken().substring(0, 5) + "••••••••" + state.getBotToken().substring(state.getBotToken().length() - 4) : "");
        res.put("demoFastMode", state.isDemoFastMode());
        res.put("requirePairingPassword", state.isRequirePairingPassword());
        res.put("viewerPairingCommand", state.isRequirePairingPassword() ? "/ketnoi cap_tanan Congan@113" : "/ketnoi cap_tanan");
        res.put("effectiveReminderSeconds", state.isDemoFastMode() ? state.getDemoReminderSeconds() : state.getReminderSeconds());
        res.put("effectiveEscalationSeconds", state.isDemoFastMode() ? state.getDemoEscalationSeconds() : state.getEscalationSeconds());
        res.put("bindingsCount", state.getBindings().size());
        res.put("bindings", state.getBindings());
        List<Map<String, Object>> presetList = new ArrayList<>();
        for (ZaloBinding p : PRESETS) {
            Map<String, Object> pm = objectMapper.convertValue(p, new TypeReference<Map<String, Object>>() {});
            String pass = resolveDefaultPasswordForUnit(p);
            pm.put("pairingCommand", state.isRequirePairingPassword() ? ("/ketnoi " + p.getUnitCode() + " " + pass) : ("/ketnoi " + p.getUnitCode()));
            presetList.add(pm);
        }
        res.put("presets", presetList);
        res.put("recentOutbox", state.getOutboxLog());
        return res;
    }

    public Map<String, Object> updateConfig(Map<String, Object> patch) {
        if (patch.containsKey("enabled")) state.setEnabled(Boolean.parseBoolean(String.valueOf(patch.get("enabled"))));
        if (patch.containsKey("demoFastMode")) state.setDemoFastMode(Boolean.parseBoolean(String.valueOf(patch.get("demoFastMode"))));
        if (patch.containsKey("requirePairingPassword")) state.setRequirePairingPassword(Boolean.parseBoolean(String.valueOf(patch.get("requirePairingPassword"))));
        if (patch.containsKey("publicBaseUrl")) state.setPublicBaseUrl(String.valueOf(patch.get("publicBaseUrl")).trim());
        if (patch.containsKey("botToken")) {
            String tok = String.valueOf(patch.get("botToken")).trim();
            if (!tok.contains("••••")) state.setBotToken(tok);
        }
        saveState();
        return getPublicStatus();
    }

    public int unlinkChat(String chatId, String unitCode) {
        int before = state.getBindings().size();
        state.getBindings().removeIf(b -> Objects.equals(b.getChatId(), chatId) && (unitCode == null || unitCode.isBlank() || Objects.equals(b.getUnitCode(), unitCode)));
        saveState();
        return before - state.getBindings().size();
    }

    public String renderQuickAcceptHtml(boolean ok, String title, String message, IncidentResponse inc) {
        String accent = ok ? "#10b981" : "#ef4444";
        String mapsBtn = (inc != null && inc.getLatitude() != null && inc.getLongitude() != null)
                ? "<a href=\"https://www.google.com/maps/dir/?api=1&destination=" + inc.getLatitude() + "," + inc.getLongitude() + "\" style=\"display:block;padding:15px;border-radius:14px;background:#10b981;color:#fff;font-weight:800;text-align:center;text-decoration:none;margin-top:14px;\">🧭 MỞ GOOGLE MAPS DẪN ĐƯỜNG TỚI NẠN NHÂN</a>"
                : "";
        String telBtn = (inc != null && inc.getPhone() != null)
                ? "<a href=\"tel:" + inc.getPhone() + "\" style=\"display:block;padding:14px;border-radius:14px;background:#0ea5e9;color:#fff;font-weight:800;text-align:center;text-decoration:none;margin-top:10px;\">📞 GỌI NGAY CHO NGƯỜI DÂN (" + inc.getPhone() + ")</a>"
                : "";
        return "<!DOCTYPE html><html lang=\"vi\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" + title + "</title></head>"
                + "<body style=\"margin:0;background:#060b14;color:#f8fafc;font-family:system-ui,sans-serif;padding:24px;display:flex;justify-content:center;align-items:center;min-height:100vh;\">"
                + "<div style=\"max-width:440px;width:100%;background:#0f172a;border:1px solid " + accent + ";border-radius:22px;padding:24px;\">"
                + "<h2 style=\"color:" + accent + ";margin-top:0;\">" + title + "</h2>"
                + "<p style=\"line-height:1.5;color:#cbd5e1;\">" + message + "</p>"
                + mapsBtn + telBtn
                + "</div></body></html>";
    }
}
