#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// ============================================================================
// CHƯƠNG TRÌNH TÍCH HỢP KIT 4G GPS ESP32-C3 TDM2421 (QUECTEL EG800K)
// HỆ THỐNG CỨU HỘ KHẨN CẤP QUỐC GIA - SOS VIỆT NAM 2026
// - Kết nối độc lập qua SIM 4G LTE (Không cần Wi-Fi) + Định vị vệ tinh GPS/GNSS
// - Hỗ trợ nút bấm khẩn cấp 3 mức với thời gian chờ xác nhận 5 giây:
//   + Nhấn 1 lần (sau 5s): Báo Công An Địa Phương (theo tọa độ GPS thực tế)
//   + Nhấn 2 lần (sau 5s): Báo Cảnh Sát Giao Thông (CSGT)
//   + Nhấn 3 lần (sau 5s): Báo Cảnh Sát PCCC và CNCH
// ============================================================================

// 1. CẤU HÌNH CHÂN KẾT NỐI NỘI BỘ TRÊN KIT 4G GPS ESP32-C3 TDM2421
// Lưu ý trong Arduino IDE:
// - Board: "ESP32C3 Dev Module"
// - Tools -> USB CDC On Boot -> BẮT BUỘC chọn "Enabled"
#define SIM_PWR_PIN      2   // IO2: Chân điều khiển nguồn module 4G EG800K (LOW = Tắt, HIGH = Bật)
#define SIM_DTR_PIN      0   // IO0: Chân DTR điều khiển chế độ ngủ (LOW = Đánh thức module)
#define SIM_RX_PIN       20  // GPIO 20 (RXD của ESP32-C3 nối với TX của EG800K)
#define SIM_TX_PIN       21  // GPIO 21 (TXD của ESP32-C3 nối với RX của EG800K)
#define LED_PIN          10  // GPIO 10 (IO10): Đèn LED trạng thái tích hợp trên bo TDM2421

// 2. CẤU HÌNH NÚT BẤM KHẨN CẤP & CÒI BÁO TRÊN MẠCH
#define RF_BUTTON_PIN    3   // GPIO 3: Nối mạch thu nút đeo cổ RF (nếu có)
#define ONBOARD_BTN_PIN  9   // GPIO 9: Nút bấm BOOT có sẵn ngay trên mạch ESP32-C3 TDM2421
#define BUZZER_PIN       4   // GPIO 4: Nối còi báo Buzzer

// 3. ĐỊA CHỈ MÁY CHỦ TRỰC BAN SOS VIỆT NAM 2026
const char* SERVER_POST_URL = "https://sos-vietnam-2026.onrender.com/api/hardware-sos";
const char* SERVER_GET_PUSH = "https://sos-vietnam-2026.onrender.com/api/hardware-sos/push";
const char* DEVICE_ID       = "TDM2421-4G-GPS-01";
const char* CITIZEN_NAME    = "Cụ Nguyễn Văn A (78 tuổi)";
const char* CITIZEN_PHONE   = "0988113114";

// (Tùy chọn) Wi-Fi dự phòng nếu chưa lắp thẻ SIM 4G (Để trống "" nếu chỉ dùng SIM 4G)
const char* BACKUP_WIFI_SSID = "";
const char* BACKUP_WIFI_PASS = "";

// 4. KHỞI TẠO UART1 GIAO TIẾP VỚI MODULE 4G QUECTEL EG800K
HardwareSerial simSerial(1);

// 5. BIẾN TRẠNG THÁI ĐỊNH VỊ VỆ TINH GPS/GNSS & SÓNG 4G
double currentLat       = 10.04520; // Tọa độ mặc định khi trong nhà chưa chốt vệ tinh
double currentLng       = 105.74690;
float  currentHdop      = 1.2;
float  currentAltitude  = 12.0;
bool   hasGpsFix        = false;
int    currentCsq       = 0;
bool   simReady         = false;

unsigned long lastGpsCheck      = 0;
const unsigned long GPS_INTERVAL = 10000; // Đọc tọa độ GPS mỗi 10 giây

// 6. BIẾN ĐẾM ĐA NHẤN (CHỜ 5 GIÂY ĐỂ XÁC NHẬN SỐ LẦN NHẤN)
const unsigned long CONFIRM_WINDOW_MS = 5000; // Đúng 5 giây không nhấn tiếp sẽ xác nhận
const unsigned long DEBOUNCE_MS       = 45;
int pressCount                        = 0;
unsigned long lastPressTime           = 0;
unsigned long lastDebounceTime        = 0;
bool lastReading                      = false;
bool stableButtonState                = false;

// ============================================================================
// HÀM TIỆN ÍCH CÒI BÁO & GIAO TIẾP AT COMMAND VỚI QUECTEL EG800K
// ============================================================================

void beepBuzzer(int count, int durationMs) {
  for (int i = 0; i < count; i++) {
    digitalWrite(LED_PIN, HIGH);
    digitalWrite(BUZZER_PIN, HIGH);
    delay(durationMs);
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_PIN, LOW);
    if (i < count - 1) {
      delay(130);
    }
  }
}

String sendATCommand(const String& cmd, unsigned long timeoutMs = 2000, bool printLog = true) {
  while (simSerial.available()) {
    simSerial.read();
  }
  if (printLog) {
    Serial.println("\n>> Gửi lệnh: " + cmd);
  }
  simSerial.println(cmd);

  String response = "";
  unsigned long startTime = millis();
  while (millis() - startTime < timeoutMs) {
    while (simSerial.available()) {
      char c = (char)simSerial.read();
      response += c;
    }
    if (response.indexOf("\r\nOK\r\n") != -1 ||
        response.indexOf("\r\nERROR\r\n") != -1 ||
        response.indexOf("+CME ERROR:") != -1) {
      break;
    }
    delay(2);
  }
  if (printLog) {
    Serial.print("<< Phản hồi: ");
    Serial.println(response);
  }
  return response;
}

bool waitForModemToken(const String& token, unsigned long timeoutMs, String* outBuffer = nullptr) {
  String buf = "";
  unsigned long start = millis();
  while (millis() - start < timeoutMs) {
    while (simSerial.available()) {
      char c = (char)simSerial.read();
      buf += c;
    }
    if (buf.indexOf(token) != -1) {
      if (outBuffer) *outBuffer = buf;
      return true;
    }
    if (buf.indexOf("+CME ERROR:") != -1 || buf.indexOf("\r\nERROR\r\n") != -1) {
      if (outBuffer) *outBuffer = buf;
      return false;
    }
    delay(2);
  }
  if (outBuffer) *outBuffer = buf;
  return false;
}

// ============================================================================
// KHỞI ĐỘNG NGUỒN MODULE 4G QUECTEL EG800K TRÊN KIT TDM2421
// ============================================================================

void powerOnModule() {
  Serial.println("Đang bật nguồn cho module 4G Quectel EG800K trên Kit TDM2421...");
  pinMode(SIM_PWR_PIN, OUTPUT);
  pinMode(SIM_DTR_PIN, OUTPUT);

  digitalWrite(SIM_DTR_PIN, LOW); // Đánh thức module (không sleep)

  // Theo thiết kế TDM2421: IO2 ở mức LOW sẽ tắt nguồn, kéo lên HIGH để cấp/bật nguồn
  digitalWrite(SIM_PWR_PIN, LOW);
  delay(1000);
  digitalWrite(SIM_PWR_PIN, HIGH);

  // Chờ khoảng 8 giây để module EG800K khởi động hoàn tất
  for (int i = 0; i < 8; i++) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    delay(1000);
    Serial.print(".");
  }
  digitalWrite(LED_PIN, HIGH);
  Serial.println("\nĐã cấp nguồn xong cho module 4G EG800K!");
}

// ============================================================================
// ĐỌC CƯỜNG ĐỘ SÓNG 4G (CSQ) & TỌA ĐỘ VỆ TINH GPS/GNSS (AT+QGPSLOC=2)
// ============================================================================

void updateSignalStrength() {
  String res = sendATCommand("AT+CSQ", 1000, false);
  int idx = res.indexOf("+CSQ:");
  if (idx != -1) {
    int commaIdx = res.indexOf(",", idx);
    if (commaIdx != -1) {
      String csqStr = res.substring(idx + 5, commaIdx);
      csqStr.trim();
      int val = csqStr.toInt();
      if (val >= 0 && val <= 31) {
        currentCsq = val;
      }
    }
  }
}

bool parseQgpslocResponse(const String& res) {
  // Phản hồi mẫu của Quectel EG800K khi gọi AT+QGPSLOC=2:
  // +QGPSLOC: 091530.000,10.04516,105.74685,1.2,15.0,3,...
  int idx = res.indexOf("+QGPSLOC:");
  if (idx == -1) return false;

  int lineEnd = res.indexOf("\r", idx);
  String line = (lineEnd != -1) ? res.substring(idx + 9, lineEnd) : res.substring(idx + 9);
  line.trim();

  // Tách các trường cách nhau bởi dấu phẩy:
  // [0]=UTC, [1]=lat, [2]=lng, [3]=hdop, [4]=altitude, [5]=fix
  int c1 = line.indexOf(',');
  if (c1 == -1) return false;
  int c2 = line.indexOf(',', c1 + 1);
  if (c2 == -1) return false;
  int c3 = line.indexOf(',', c2 + 1);
  if (c3 == -1) return false;
  int c4 = line.indexOf(',', c3 + 1);
  int c5 = (c4 != -1) ? line.indexOf(',', c4 + 1) : -1;

  String latStr  = line.substring(c1 + 1, c2);
  String lngStr  = line.substring(c2 + 1, c3);
  String hdopStr = (c4 != -1) ? line.substring(c3 + 1, c4) : "1.0";
  String altStr  = (c4 != -1 && c5 != -1) ? line.substring(c4 + 1, c5) : "10.0";

  double parsedLat = latStr.toDouble();
  double parsedLng = lngStr.toDouble();

  if (parsedLat > 5.0 && parsedLat < 25.0 && parsedLng > 100.0 && parsedLng < 112.0) {
    currentLat      = parsedLat;
    currentLng      = parsedLng;
    currentHdop     = hdopStr.toFloat();
    currentAltitude = altStr.toFloat();
    hasGpsFix       = true;
    return true;
  }
  return false;
}

bool parseQlbsResponse(const String& res) {
  // Định vị trạm phát sóng 4G LBS dự phòng khi ở trong nhà kín (+QLBS: 0,10.0452,105.7469)
  int idx = res.indexOf("+QLBS:");
  if (idx == -1) return false;
  int c1 = res.indexOf(',', idx);
  if (c1 == -1) return false;
  int c2 = res.indexOf(',', c1 + 1);
  if (c2 == -1) return false;
  int lineEnd = res.indexOf('\r', c2 + 1);

  String latStr = res.substring(c1 + 1, c2);
  String lngStr = (lineEnd != -1) ? res.substring(c2 + 1, lineEnd) : res.substring(c2 + 1);
  double parsedLat = latStr.toDouble();
  double parsedLng = lngStr.toDouble();
  if (parsedLat > 5.0 && parsedLat < 25.0 && parsedLng > 100.0 && parsedLng < 112.0) {
    currentLat = parsedLat;
    currentLng = parsedLng;
    return true;
  }
  return false;
}

void checkAndReadGps(bool verbose = true) {
  // Lệnh lấy tọa độ GPS ở định dạng <latitude>,<longitude> dễ đọc (Mode 2)
  String res = sendATCommand("AT+QGPSLOC=2", 1500, verbose);
  if (parseQgpslocResponse(res)) {
    Serial.printf("[GPS VỆ TINH ĐÃ CHỐT FIX] Lat: %.6f, Lng: %.6f (HDOP: %.1f)\n",
                  currentLat, currentLng, currentHdop);
  } else {
    if (verbose && res.indexOf("516") != -1) {
      Serial.println("[GPS] Chưa chốt vệ tinh (+CME ERROR: 516 - Đang dùng tọa độ lưu/LBS 4G).");
    }
    // Thử hỏi tọa độ trạm phát sóng 4G (Cell LBS) nếu đang ở trong nhà
    String lbsRes = sendATCommand("AT+QLBS", 1500, false);
    parseQlbsResponse(lbsRes);
  }
}

void initModem4GAndGps() {
  sendATCommand("AT", 1000);
  sendATCommand("ATE0", 1000);       // Tắt nhại lệnh (Echo Off) để đọc phản hồi sạch
  sendATCommand("ATI", 1000);        // Xem thông tin tên module (Quectel EG800K)

  String cpin = sendATCommand("AT+CPIN?", 1500);
  simReady = (cpin.indexOf("READY") != -1);

  sendATCommand("AT+CSQ", 1000);     // Kiểm tra cường độ sóng (0-31)
  updateSignalStrength();
  sendATCommand("AT+CEREG?", 1000);  // Kiểm tra đăng ký mạng 4G LTE
  sendATCommand("AT+CGATT=1", 2000); // Đính kèm dịch vụ dữ liệu gói 4G

  // Kích hoạt PDP Context 1 cho kết nối Internet 4G LTE
  String qiact = sendATCommand("AT+QIACT?", 1500);
  if (qiact.indexOf("+QIACT: 1,1,1") == -1) {
    sendATCommand("AT+QIACT=1", 5000);
  }

  // Bật bộ thu định vị vệ tinh GPS / GNSS trên EG800K
  Serial.println("Đang kích hoạt bộ thu vệ tinh GPS (GNSS) trên Quectel EG800K...");
  sendATCommand("AT+QGPS=1", 2000);  // Nếu báo CME ERROR: 504 nghĩa là GPS đã bật sẵn
}

// ============================================================================
// GỬI TÍN HIỆU SOS QUA MẠNG 4G LTE (AT+QHTTPPOST / AT+QHTTPGET)
// ============================================================================

bool sendSosVia4GModem(int step, const char* agencyCode, const char* incidentType, const char* stepLabel) {
  Serial.println("\n=== ĐANG PHÁT TÍN HIỆU SOS QUA MẠNG DI ĐỘNG 4G LTE (SIM) ===");

  // Đọc tọa độ GPS mới nhất ngay trước khi phát lệnh SOS
  checkAndReadGps(false);
  updateSignalStrength();

  // Đảm bảo PDP Context 1 đang mở
  String qiact = sendATCommand("AT+QIACT?", 1500, false);
  if (qiact.indexOf("+QIACT: 1,1,1") == -1) {
    sendATCommand("AT+QIACT=1", 4000, false);
  }

  // Cấu hình HTTP & SSL trên Quectel EG800K
  sendATCommand("AT+QHTTPCFG=\"contextid\",1", 1000, false);
  sendATCommand("AT+QHTTPCFG=\"requestheader\",0", 1000, false);
  sendATCommand("AT+QHTTPCFG=\"contenttype\",1", 1000, false); // 1 = application/json
  sendATCommand("AT+QHTTPCFG=\"sslctxid\",1", 1000, false);
  sendATCommand("AT+QSSLCFG=\"sslversion\",1,4", 1000, false);
  sendATCommand("AT+QSSLCFG=\"seclevel\",1,0", 1000, false);   // Bỏ qua kiểm tra CA file trên MCU
  sendATCommand("AT+QSSLCFG=\"sni\",1,1", 1000, false);        // Bật SNI cho Render/Cloudflare HTTPS

  // Tạo gói dữ liệu JSON kèm tọa độ GPS thực tế từ vệ tinh + thông số SIM 4G
  String gpsModeDesc = hasGpsFix
    ? "Định vị vệ tinh GPS/GNSS trực tiếp (Kit 4G GPS ESP32-C3 TDM2421)"
    : "Định vị trạm 4G LBS / Vị trí lưu gần nhất (Kit 4G GPS ESP32-C3 TDM2421)";

  String jsonPayload = "{";
  jsonPayload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  jsonPayload += "\"hardware_model\":\"Kit 4G GPS ESP32-C3 TDM2421 (Quectel EG800K)\",";
  jsonPayload += "\"network_mode\":\"4G_LTE_SIM\",";
  jsonPayload += "\"signal_csq\":" + String(currentCsq) + ",";
  jsonPayload += "\"gps_fix\":" + String(hasGpsFix ? "true" : "false") + ",";
  jsonPayload += "\"hdop\":" + String(currentHdop, 1) + ",";
  jsonPayload += "\"altitude\":" + String(currentAltitude, 1) + ",";
  jsonPayload += "\"citizen_name\":\"" + String(CITIZEN_NAME) + "\",";
  jsonPayload += "\"phone\":\"" + String(CITIZEN_PHONE) + "\",";
  jsonPayload += "\"press_step\":" + String(step) + ",";
  jsonPayload += "\"press_count\":" + String(step) + ",";
  jsonPayload += "\"agency\":\"" + String(agencyCode) + "\",";
  jsonPayload += "\"incident_type\":\"" + String(incidentType) + "\",";
  jsonPayload += "\"latitude\":" + String(currentLat, 6) + ",";
  jsonPayload += "\"longitude\":" + String(currentLng, 6) + ",";
  jsonPayload += "\"address\":\"" + gpsModeDesc + "\",";
  jsonPayload += "\"source\":\"WEARABLE_IOT_BUTTON\"";
  jsonPayload += "}";

  // Cách 1: Gửi HTTPS POST trực tiếp bằng AT+QHTTPPOST
  String urlStr = String(SERVER_POST_URL);
  while (simSerial.available()) simSerial.read();
  simSerial.printf("AT+QHTTPURL=%d,30\r\n", urlStr.length());

  String resp = "";
  if (waitForModemToken("CONNECT", 5000, &resp)) {
    simSerial.print(urlStr);
    if (waitForModemToken("OK", 5000, &resp)) {
      while (simSerial.available()) simSerial.read();
      simSerial.printf("AT+QHTTPPOST=%d,30,30\r\n", jsonPayload.length());
      if (waitForModemToken("CONNECT", 8000, &resp)) {
        simSerial.print(jsonPayload);
        if (waitForModemToken("+QHTTPPOST:", 20000, &resp)) {
          Serial.println("<< Kết quả QHTTPPOST: " + resp);
          if (resp.indexOf(",200") != -1) {
            Serial.printf("[THÀNH CÔNG 4G POST] Đã báo %s lên Trực Ban (Lat: %.6f, Lng: %.6f)!\n",
                          stepLabel, currentLat, currentLng);
            return true;
          }
        }
      }
    }
  }

  // Cách 2 (Dự phòng tự động trên 4G): Gửi qua AT+QHTTPGET nếu QHTTPPOST bị nghẽn header
  Serial.println("Đang chuyển sang kênh dự phòng nhanh 4G QHTTPGET...");
  String getUrl = String(SERVER_GET_PUSH)
    + "?device_id=" + String(DEVICE_ID)
    + "&press_step=" + String(step)
    + "&agency=" + String(agencyCode)
    + "&incident_type=" + String(incidentType)
    + "&lat=" + String(currentLat, 6)
    + "&lng=" + String(currentLng, 6)
    + "&gps_fix=" + String(hasGpsFix ? 1 : 0)
    + "&csq=" + String(currentCsq)
    + "&network_mode=4G_LTE_SIM";

  while (simSerial.available()) simSerial.read();
  simSerial.printf("AT+QHTTPURL=%d,30\r\n", getUrl.length());
  if (waitForModemToken("CONNECT", 5000, &resp)) {
    simSerial.print(getUrl);
    if (waitForModemToken("OK", 5000, &resp)) {
      while (simSerial.available()) simSerial.read();
      simSerial.println("AT+QHTTPGET=30");
      if (waitForModemToken("+QHTTPGET:", 20000, &resp)) {
        Serial.println("<< Kết quả QHTTPGET: " + resp);
        if (resp.indexOf(",200") != -1) {
          Serial.printf("[THÀNH CÔNG 4G GET] Đã báo %s lên Trực Ban (Lat: %.6f, Lng: %.6f)!\n",
                        stepLabel, currentLat, currentLng);
          return true;
        }
      }
    }
  }

  return false;
}

// Dự phòng qua Wi-Fi nếu người dùng có điền BACKUP_WIFI_SSID và mạch chưa lắp SIM
bool sendSosViaBackupWifi(int step, const char* agencyCode, const char* incidentType, const char* stepLabel) {
  if (strlen(BACKUP_WIFI_SSID) == 0) return false;

  if (WiFi.status() != WL_CONNECTED) {
    Serial.print("Đang kết nối Wi-Fi dự phòng...");
    WiFi.mode(WIFI_STA);
    WiFi.begin(BACKUP_WIFI_SSID, BACKUP_WIFI_PASS);
    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < 8000) {
      delay(300);
      Serial.print(".");
    }
    Serial.println();
  }
  if (WiFi.status() != WL_CONNECTED) return false;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.setTimeout(15000);
  if (!http.begin(client, SERVER_POST_URL)) return false;

  http.addHeader("Content-Type", "application/json");
  String payload = "{";
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"hardware_model\":\"Kit 4G GPS ESP32-C3 TDM2421 (Quectel EG800K)\",";
  payload += "\"network_mode\":\"WIFI_BACKUP\",";
  payload += "\"gps_fix\":" + String(hasGpsFix ? "true" : "false") + ",";
  payload += "\"citizen_name\":\"" + String(CITIZEN_NAME) + "\",";
  payload += "\"phone\":\"" + String(CITIZEN_PHONE) + "\",";
  payload += "\"press_step\":" + String(step) + ",";
  payload += "\"agency\":\"" + String(agencyCode) + "\",";
  payload += "\"incident_type\":\"" + String(incidentType) + "\",";
  payload += "\"latitude\":" + String(currentLat, 6) + ",";
  payload += "\"longitude\":" + String(currentLng, 6) + ",";
  payload += "\"source\":\"WEARABLE_IOT_BUTTON\"";
  payload += "}";

  int code = http.POST(payload);
  http.end();
  return (code >= 200 && code < 300);
}

// ============================================================================
// XỬ LÝ GỬI BÁO ĐỘNG SAU KHI ĐỦ 5 GIÂY XÁC NHẬN SỐ LẦN NHẤN
// ============================================================================

void triggerConfirmedSOS(int confirmedCount) {
  int step = confirmedCount;
  if (step < 1) step = 1;
  if (step > 3) step = 3;

  const char* agencyCode   = "police";
  const char* incidentType = "BAO_CONG_AN_DIA_PHUONG";
  const char* stepLabel    = "NHẤN 1 LẦN - BÁO CÔNG AN ĐỊA PHƯƠNG";

  if (step == 1) {
    agencyCode   = "police";
    incidentType = "BAO_CONG_AN_DIA_PHUONG";
    stepLabel    = "NHẤN 1 LẦN - BÁO CÔNG AN ĐỊA PHƯƠNG";
  } else if (step == 2) {
    agencyCode   = "csgt";
    incidentType = "BAO_CANH_SAT_GIAO_THONG";
    stepLabel    = "NHẤN 2 LẦN - BÁO CẢNH SÁT GIAO THÔNG (CSGT)";
  } else {
    agencyCode   = "fire";
    incidentType = "BAO_PCCC_VA_CNCH";
    stepLabel    = "NHẤN 3 LẦN - BÁO CẢNH SÁT PCCC VÀ CNCH";
  }

  Serial.printf("\n>>> ĐÃ HẾT 5 GIÂY CHỜ: XÁC NHẬN %d LẦN NHẤN -> %s <<<\n", step, stepLabel);

  // Kêu còi xác nhận số lần nhấn (1 tiếng, 2 tiếng hoặc 3 tiếng)
  beepBuzzer(step, 200);

  // Ưu tiên phát qua SIM 4G LTE trên module Quectel EG800K
  bool ok = sendSosVia4GModem(step, agencyCode, incidentType, stepLabel);
  if (!ok) {
    ok = sendSosViaBackupWifi(step, agencyCode, incidentType, stepLabel);
  }

  if (ok) {
    // Báo thành công: 2 tiếng bíp ngắn
    beepBuzzer(2, 100);
  } else {
    Serial.println("[CẢNH BÁO] Chưa gửi được lên máy chủ. Vui lòng kiểm tra SIM 4G và Anten!");
    beepBuzzer(4, 80);
  }
}

// ============================================================================
// SETUP & LOOP CHÍNH
// ============================================================================

void setup() {
  // 1. Khởi tạo cổng USB Serial (Nhớ bật Tools -> USB CDC On Boot -> Enabled)
  Serial.begin(115200);
  delay(2000);
  Serial.println("\n=======================================================");
  Serial.println("=== KHỞI ĐỘNG KIT 4G GPS ESP32-C3 TDM2421 (EG800K) ===");
  Serial.println("=======================================================");

  // 2. Cấu hình chân nút bấm, còi báo và LED trạng thái
  pinMode(RF_BUTTON_PIN, INPUT_PULLUP);
  pinMode(ONBOARD_BTN_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  // 3. Khởi tạo UART1 giao tiếp với module 4G Quectel EG800K (Baudrate 115200)
  simSerial.begin(115200, SERIAL_8N1, SIM_RX_PIN, SIM_TX_PIN);

  // 4. Bật nguồn module SIM 4G EG800K và kích hoạt GPS/GNSS
  powerOnModule();
  initModem4GAndGps();

  Serial.println("\n=======================================================");
  Serial.println("HỆ THỐNG ĐÃ SẴN SÀNG HOẠT ĐỘNG ĐỘC LẬP QUA 4G + GPS!");
  Serial.println("- Nhấn 1 lần (chờ 5s): Báo Công An Địa Phương");
  Serial.println("- Nhấn 2 lần (chờ 5s): Báo Cảnh Sát Giao Thông (CSGT)");
  Serial.println("- Nhấn 3 lần (chờ 5s): Báo Cảnh Sát PCCC & CNCH");
  Serial.println("- Bạn cũng có thể gõ lệnh AT trực tiếp trên Serial Monitor");
  Serial.println("=======================================================\n");
}

void loop() {
  unsigned long now = millis();

  // 1. PHÁT HIỆN NHẤN NÚT (CHỐNG DỘI PHÍM & ĐẾM SỐ LẦN NHẤN TRONG 5 GIÂY)
  bool rawPressed = (digitalRead(RF_BUTTON_PIN) == LOW) || (digitalRead(ONBOARD_BTN_PIN) == LOW);

  if (rawPressed != lastReading) {
    lastDebounceTime = now;
    lastReading = rawPressed;
  }

  if ((now - lastDebounceTime) >= DEBOUNCE_MS) {
    if (rawPressed != stableButtonState) {
      stableButtonState = rawPressed;

      if (stableButtonState == true) {
        pressCount++;
        if (pressCount > 3) {
          pressCount = 3;
        }
        lastPressTime = now;

        // Kêu 1 tiếng bíp ngắn mỗi lần bấm để người già biết mạch đã nhận thao tác
        digitalWrite(LED_PIN, HIGH);
        digitalWrite(BUZZER_PIN, HIGH);
        delay(80);
        digitalWrite(BUZZER_PIN, LOW);
        digitalWrite(LED_PIN, LOW);

        Serial.printf("Đã ghi nhận lần nhấn thứ %d. Đang chờ đủ 5 giây để xác nhận...\n", pressCount);
      }
    }
  }

  // 2. NẾU ĐÃ NHẤN VÀ SAU 5 GIÂY KHÔNG NHẤN TIẾP -> CHỐT LỆNH GỬI SOS QUA 4G + GPS
  if (pressCount > 0 && !stableButtonState && (now - lastPressTime >= CONFIRM_WINDOW_MS)) {
    int confirmed = pressCount;
    pressCount = 0;
    triggerConfirmedSOS(confirmed);
  }

  // 3. ĐỊNH KỲ MỖI 10 GIÂY CẬP NHẬT TỌA ĐỘ VỆ TINH GPS (KHI KHÔNG ĐANG BẤM NÚT)
  if (pressCount == 0 && (now - lastGpsCheck >= GPS_INTERVAL)) {
    lastGpsCheck = now;
    checkAndReadGps(true);
  }

  // 4. CẦU NỐI SERIAL MONITOR <-> MODULE 4G EG800K (CHO PHÉP GÕ LỆNH AT TRỰC TIẾP)
  if (pressCount == 0 && Serial.available()) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.equalsIgnoreCase("TEST1")) {
      triggerConfirmedSOS(1);
    } else if (line.equalsIgnoreCase("TEST2")) {
      triggerConfirmedSOS(2);
    } else if (line.equalsIgnoreCase("TEST3")) {
      triggerConfirmedSOS(3);
    } else if (line.length() > 0) {
      simSerial.println(line);
    }
  }

  if (pressCount == 0 && simSerial.available()) {
    while (simSerial.available()) {
      Serial.write(simSerial.read());
    }
  }
}
