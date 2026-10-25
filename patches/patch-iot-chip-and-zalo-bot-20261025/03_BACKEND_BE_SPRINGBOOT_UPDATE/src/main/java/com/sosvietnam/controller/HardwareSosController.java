package com.sosvietnam.controller;

import com.sosvietnam.model.payload.enums.EmergencyType;
import com.sosvietnam.model.payload.request.CreateIncidentRequest;
import com.sosvietnam.model.payload.response.CreateIncidentResponse;
import com.sosvietnam.model.payload.response.IncidentResponse;
import com.sosvietnam.service.IncidentService;
import com.sosvietnam.service.ZaloBotDispatchService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Gateway tiếp nhận tín hiệu khẩn cấp từ Mạch Phát Tín Hiệu Độc Lập
 * Kit 4G GPS ESP32-C3 TDM2421 (Quectel EG800K) & Vòng đeo cổ ESP32-C3 SuperMini.
 *
 * Quy tắc nút nhấn 5 giây:
 *  - Nhấn 1 lần -> EmergencyType.POLICE  (Công An Địa Phương / Xã Phường)
 *  - Nhấn 2 lần -> EmergencyType.TRAFFIC (Cảnh Sát Giao Thông - CSGT)
 *  - Nhấn 3 lần -> EmergencyType.FIRE    (Cảnh Sát PCCC & CNCH)
 */
@RestController
@RequestMapping({"/api/hardware-sos", "/api/sos/hardware"})
@RequiredArgsConstructor
public class HardwareSosController {

    private final IncidentService incidentService;
    private final ZaloBotDispatchService zaloBotDispatchService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getGatewayStatus(
            @RequestParam(value = "press_step", required = false) Integer pressStep,
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng,
            @RequestParam(value = "device_id", required = false) String deviceId,
            @RequestParam(value = "csq", required = false) Integer csq,
            @RequestParam(value = "gps_fix", required = false) Boolean gpsFix,
            @RequestParam(value = "citizen_name", required = false) String citizenName,
            @RequestParam(value = "phone", required = false) String phone,
            HttpServletRequest servletRequest
    ) {
        if (pressStep != null || lat != null) {
            return handleHardwareGetPush(pressStep, lat, lng, deviceId, csq, gpsFix, citizenName, phone, servletRequest);
        }

        List<IncidentResponse> recent = incidentService.getRecentIncidents();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", true);
        body.put("service", "SOS Vietnam 2026 - Kit 4G GPS ESP32-C3 TDM2421 (Quectel EG800K) Gateway");
        body.put("status", "ONLINE");
        body.put("supportedMethods", List.of("GET", "POST"));
        body.put("recentIncidentCount", recent.size());
        return ResponseEntity.ok(body);
    }

    @GetMapping("/push")
    public ResponseEntity<Map<String, Object>> handleHardwareGetPush(
            @RequestParam(value = "press_step", defaultValue = "1") Integer pressStep,
            @RequestParam(value = "lat", defaultValue = "10.03642") Double lat,
            @RequestParam(value = "lng", defaultValue = "105.78754") Double lng,
            @RequestParam(value = "device_id", defaultValue = "TDM2421-4G-GPS-01") String deviceId,
            @RequestParam(value = "csq", defaultValue = "26") Integer csq,
            @RequestParam(value = "gps_fix", defaultValue = "true") Boolean gpsFix,
            @RequestParam(value = "citizen_name", defaultValue = "Cụ Nguyễn Văn A (78 tuổi)") String citizenName,
            @RequestParam(value = "phone", defaultValue = "0988113114") String phone,
            HttpServletRequest servletRequest
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("device_id", deviceId);
        payload.put("hardware_model", "Kit 4G GPS ESP32-C3 TDM2421 (Quectel EG800K)");
        payload.put("network_mode", "4G_LTE_SIM");
        payload.put("signal_csq", csq);
        payload.put("gps_fix", gpsFix);
        payload.put("press_step", pressStep);
        payload.put("latitude", lat);
        payload.put("longitude", lng);
        payload.put("citizen_name", citizenName);
        payload.put("phone", phone);
        return receiveHardwareSos(payload, servletRequest);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> receiveHardwareSos(
            @RequestBody Map<String, Object> payload,
            HttpServletRequest servletRequest
    ) {
        int step = parseIntOrDefault(payload.getOrDefault("press_step", payload.get("pressStep")), 1);
        if (step < 1 || step > 3) step = 1;

        String deviceId = String.valueOf(payload.getOrDefault("device_id", payload.getOrDefault("deviceId", "TDM2421-4G-GPS-01")));
        String hwModel = String.valueOf(payload.getOrDefault("hardware_model", "Kit 4G GPS ESP32-C3 TDM2421 (Quectel EG800K)"));
        String netMode = String.valueOf(payload.getOrDefault("network_mode", "4G_LTE_SIM"));
        int csq = parseIntOrDefault(payload.get("signal_csq"), 26);
        double lat = parseDoubleOrDefault(payload.getOrDefault("latitude", payload.get("lat")), 10.03642);
        double lng = parseDoubleOrDefault(payload.getOrDefault("longitude", payload.get("lng")), 105.78754);
        String citizenName = String.valueOf(payload.getOrDefault("citizen_name", payload.getOrDefault("reporterName", "Cụ Nguyễn Văn A (78 tuổi)")));
        String phone = String.valueOf(payload.getOrDefault("phone", payload.getOrDefault("reporterPhone", "0988113114")));

        EmergencyType emergencyType;
        String stepLabel;
        if (step == 2) {
            emergencyType = EmergencyType.TRAFFIC;
            stepLabel = "Báo động khẩn cấp về Cảnh Sát Giao Thông - CSGT (Nhấn 2 lần - Thiết bị 4G GPS)";
        } else if (step == 3) {
            emergencyType = EmergencyType.FIRE;
            stepLabel = "Báo động khẩn cấp về Cảnh Sát PCCC và CNCH (Nhấn 3 lần - Thiết bị 4G GPS)";
        } else {
            emergencyType = EmergencyType.POLICE;
            stepLabel = "Báo động khẩn cấp về Công An Địa Phương (Nhấn 1 lần - Thiết bị 4G GPS)";
        }

        List<String> tags = new ArrayList<>();
        tags.add(stepLabel);
        tags.add("Thiết bị: " + deviceId + " (" + netMode + " · CSQ " + csq + "/31)");

        CreateIncidentRequest req = new CreateIncidentRequest();
        req.setCitizenName(citizenName);
        req.setPhone(phone);
        req.setEmergencyType(emergencyType);
        req.setIncidentTags(tags);
        req.setDescription(stepLabel + " | Phần cứng: " + hwModel + " (" + deviceId + ")");
        req.setAddress(String.valueOf(payload.getOrDefault("address", "")));
        req.setLatitude(lat);
        req.setLongitude(lng);
        req.setAccuracy(10);

        CreateIncidentResponse created = incidentService.createIncident(req);
        IncidentResponse inc = created.getIncident();

        String origin = buildOrigin(servletRequest);
        zaloBotDispatchService.onIncidentCreated(inc, origin, stepLabel);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("ok", true);
        resp.put("message", "Đã tiếp nhận tín hiệu khẩn cấp từ mạch 4G GPS & định tuyến Zalo Bot");
        resp.put("pressStep", step);
        resp.put("incident", inc);
        resp.put("citizenAccessToken", created.getCitizenAccessToken());
        return ResponseEntity.ok(resp);
    }

    private String buildOrigin(HttpServletRequest req) {
        String proto = req.getHeader("X-Forwarded-Proto");
        if (proto == null || proto.isBlank()) proto = req.getScheme();
        String host = req.getHeader("X-Forwarded-Host");
        if (host == null || host.isBlank()) host = req.getServerName() + (req.getServerPort() == 80 || req.getServerPort() == 443 ? "" : ":" + req.getServerPort());
        return proto + "://" + host;
    }

    private int parseIntOrDefault(Object raw, int fallback) {
        if (raw == null) return fallback;
        try { return Integer.parseInt(String.valueOf(raw).trim()); } catch (Exception e) { return fallback; }
    }

    private double parseDoubleOrDefault(Object raw, double fallback) {
        if (raw == null) return fallback;
        try { return Double.parseDouble(String.valueOf(raw).trim()); } catch (Exception e) { return fallback; }
    }
}
