package com.sosvietnam.controller;

import com.sosvietnam.model.payload.response.IncidentResponse;
import com.sosvietnam.service.ZaloBotDispatchService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * REST Controller cho Hệ thống Bot Zalo Trực Ban Phân Tầng & Tiếp Nhận 2 Chiều.
 * Bao gồm:
 *  - Public Webhook (`/api/zalo/webhook`) nhận lệnh `/ketnoi <mã_đơn_vị>` và `TN` từ Zalo Bot Platform
 *  - Public 1-Tap Quick-Accept (`/api/zalo/quick-accept`) xác thực chữ ký số HMAC-SHA256
 *  - Quản trị cấu hình trên Bàn Trực Ban (`/api/dispatcher/zalo/*` & `/api/zalo/*`)
 */
@RestController
@RequiredArgsConstructor
public class ZaloBotController {

    private final ZaloBotDispatchService zaloBotService;

    @PostMapping("/api/zalo/webhook")
    public ResponseEntity<Map<String, Object>> receiveWebhook(
            @RequestBody(required = false) Map<String, Object> payload,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(zaloBotService.handleWebhookPayload(payload == null ? Map.of() : payload, buildOrigin(request)));
    }

    @GetMapping(value = "/api/zalo/quick-accept", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> quickAccept(
            @RequestParam("id") String incidentId,
            @RequestParam(value = "chat", defaultValue = "") String chatId,
            @RequestParam("sig") String sig
    ) {
        if (!zaloBotService.verifyQuickAccept(incidentId, chatId, sig)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    zaloBotService.renderQuickAcceptHtml(false, "⛔ Chữ ký bảo mật không hợp lệ", "Đường dẫn tiếp nhận nhanh không hợp lệ hoặc đã bị thay đổi.", null)
            );
        }
        try {
            Map<String, Object> res = zaloBotService.acceptFromZalo(incidentId, chatId, null, "zalo_link");
            IncidentResponse inc = (IncidentResponse) res.get("incident");
            return ResponseEntity.ok(
                    zaloBotService.renderQuickAcceptHtml(
                            true,
                            "✅ TIẾP NHẬN THÀNH CÔNG CA #" + inc.getId(),
                            "Hệ thống Trung tâm Chỉ huy đã ghi nhận đơn vị xuất phát, đồng thời tắt nhắc khẩn & hủy đếm ngược leo thang!",
                            inc
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    zaloBotService.renderQuickAcceptHtml(false, "⚠️ Không thể tiếp nhận ca #" + incidentId, e.getMessage(), null)
            );
        }
    }

    @GetMapping({"/api/dispatcher/zalo/status", "/api/zalo/status"})
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(zaloBotService.getPublicStatus());
    }

    @PostMapping({"/api/dispatcher/zalo/config", "/api/zalo/config"})
    public ResponseEntity<Map<String, Object>> saveConfig(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(zaloBotService.updateConfig(body));
    }

    @PostMapping({"/api/dispatcher/zalo/restore-backup", "/api/zalo/restore-backup"})
    public ResponseEntity<Map<String, Object>> restoreBackup(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(zaloBotService.restoreBackup(body == null ? Map.of() : body));
    }

    @PostMapping({"/api/dispatcher/zalo/register-unit", "/api/zalo/register-unit"})
    public ResponseEntity<Map<String, Object>> registerUnit(@RequestBody Map<String, Object> body) {
        ZaloBotDispatchService.ZaloBinding unit = zaloBotService.registerCustomUnit(body);
        String pass = zaloBotService.resolveDefaultPasswordForUnit(unit);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("ok", true);
        resp.put("unit", unit);
        resp.put("command", "/ketnoi " + unit.getUnitCode() + " " + pass);
        return ResponseEntity.ok(resp);
    }

    @PostMapping({"/api/dispatcher/zalo/simulate-pair", "/api/zalo/simulate-pair"})
    public ResponseEntity<Map<String, Object>> simulatePair(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request
    ) {
        String unitCode = String.valueOf(body.getOrDefault("unitCode", "cap_tanan")).trim();
        String chatId = String.valueOf(body.getOrDefault("chatId", "sim_zalo_" + unitCode)).trim();
        String chatTitle = String.valueOf(body.getOrDefault("chatTitle", "Nhóm Zalo Giả Lập (" + unitCode + ")")).trim();
        String senderName = String.valueOf(body.getOrDefault("senderName", "Cán bộ trực ban")).trim();

        Map<String, Object> fakeWebhook = Map.of(
                "result", Map.of(
                        "message", Map.of(
                                "message_id", "sim_" + System.currentTimeMillis(),
                                "chat", Map.of("id", chatId, "title", chatTitle, "chat_type", "GROUP"),
                                "from", Map.of("id", "sim_user", "display_name", senderName),
                                "text", "/ketnoi " + unitCode
                        )
                )
        );
        zaloBotService.handleWebhookPayload(fakeWebhook, buildOrigin(request), true);
        return ResponseEntity.ok(zaloBotService.getPublicStatus());
    }

    @PostMapping({"/api/dispatcher/zalo/test-send", "/api/zalo/test-send"})
    public ResponseEntity<Map<String, Object>> testSend(@RequestBody Map<String, Object> body) {
        String chatId = String.valueOf(body.getOrDefault("chatId", "")).trim();
        Map<String, Object> sendRes = zaloBotService.sendZaloMessage(
                chatId,
                "🔔 [KIỂM TRA ĐƯỜNG TRUYỀN TRỰC BAN SOS VIỆT NAM 2026]\n✅ Tín hiệu báo động khẩn cấp từ Bàn Chỉ Huy tới Zalo đơn vị đang hoạt động thông suốt!",
                Map.of("stage", "manual_test")
        );
        Map<String, Object> out = new LinkedHashMap<>(sendRes);
        out.put("status", zaloBotService.getPublicStatus());
        return ResponseEntity.ok(out);
    }

    @PostMapping({"/api/dispatcher/zalo/broadcast", "/api/zalo/broadcast"})
    public ResponseEntity<Map<String, Object>> broadcast(@RequestBody Map<String, Object> body) {
        try {
            Map<String, Object> out = new LinkedHashMap<>(zaloBotService.broadcastAnnouncement(body == null ? Map.of() : body));
            out.put("status", zaloBotService.getPublicStatus());
            return ResponseEntity.ok(out);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "error", e.getMessage()));
        }
    }

    @PostMapping({"/api/dispatcher/zalo/update-binding", "/api/zalo/update-binding"})
    public ResponseEntity<Map<String, Object>> updateBinding(@RequestBody Map<String, Object> body) {
        ZaloBotDispatchService.ZaloBinding updated = zaloBotService.updateBinding(body);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("ok", true);
        resp.put("binding", updated);
        resp.put("status", zaloBotService.getPublicStatus());
        return ResponseEntity.ok(resp);
    }

    @PostMapping({"/api/dispatcher/zalo/unlink", "/api/zalo/unlink"})
    public ResponseEntity<Map<String, Object>> unlink(@RequestBody Map<String, Object> body) {
        String chatId = String.valueOf(body.getOrDefault("chatId", "")).trim();
        String unitCode = String.valueOf(body.getOrDefault("unitCode", "")).trim();
        int removed = zaloBotService.unlinkChat(chatId, unitCode);
        Map<String, Object> resp = new LinkedHashMap<>(zaloBotService.getPublicStatus());
        resp.put("removed", removed);
        return ResponseEntity.ok(resp);
    }

    private String buildOrigin(HttpServletRequest req) {
        String proto = req.getHeader("X-Forwarded-Proto");
        if (proto == null || proto.isBlank()) proto = req.getScheme();
        String host = req.getHeader("X-Forwarded-Host");
        if (host == null || host.isBlank()) {
            host = req.getServerName() + (req.getServerPort() == 80 || req.getServerPort() == 443 ? "" : ":" + req.getServerPort());
        }
        return proto + "://" + host;
    }
}
