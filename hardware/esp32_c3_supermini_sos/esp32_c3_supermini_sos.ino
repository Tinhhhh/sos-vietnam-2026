#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// 1. DIEN WIFI (Hoac Hotspot 4G phat tu dien thoai nguoi gia)
const char* ssid = "TEN_WIFI_CUA_ANH";
const char* password = "MAT_KHAU_WIFI";

// 2. API TREN WEB SOS VIET NAM
const char* serverUrl = "https://sos-vietnam-2026.onrender.com/api/hardware-sos";

// 3. CHAN CAM TREN MACH SIEU NHO ESP32-C3 SUPERMINI
const int RF_BUTTON_PIN = 3;   // Chan GPIO 3 noi mach thu nut deo co RF
const int ONBOARD_BTN_PIN = 9; // Nut bam co san ngay tren mach ESP32-C3 (Nut BOOT)
const int BUZZER_PIN = 4;      // Chan GPIO 4 noi coi bao
const int LED_PIN = 8;         // Den LED xanh co san tren mach ESP32-C3 SuperMini

bool isAlertSent = false;
unsigned long lastSendMillis = 0;
const unsigned long COOLDOWN_MS = 5000; // Chong gui trung tin hieu trong 5 giay

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(ssid, password);

  // Giam cong suat phat WiFi xuong 8.5dBm: khac phuc triet de loi nhiễu anten va tut ap tren ESP32-C3 SuperMini
  WiFi.setTxPower(WIFI_POWER_8_5dBm);

  Serial.print("Dang ket noi Wi-Fi");
  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - startAttempt < 20000)) {
    delay(400);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[OK] Thiet bi deo co SOS Mini da ket noi Wi-Fi!");
    Serial.print("[IP] Dia chi IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WARN] Chua ket noi duoc Wi-Fi, mach se tu dong thu lai khi bam nut.");
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(RF_BUTTON_PIN, INPUT_PULLUP);
  pinMode(ONBOARD_BTN_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, HIGH); // Tat LED (LED tren C3 SuperMini sang o muc LOW)

  connectWiFi();
}

void loop() {
  // Kiem tra khi nguoi gia bam nut deo co (GPIO 3) HOAC bam nut tren mach (GPIO 9)
  bool pressed = (digitalRead(RF_BUTTON_PIN) == LOW) || (digitalRead(ONBOARD_BTN_PIN) == LOW);

  if (pressed && !isAlertSent && (millis() - lastSendMillis >= COOLDOWN_MS)) {
    delay(50); // Chong nhieu nut nhan
    if ((digitalRead(RF_BUTTON_PIN) == LOW) || (digitalRead(ONBOARD_BTN_PIN) == LOW)) {
      Serial.println("[SOS] PHAT HIEN NGUOI GIA BAM NUT DEO CO KHAN CAP!");

      // 1. Sang den LED & keu coi bip bao hieu thiet bi da nhan lenh
      digitalWrite(LED_PIN, LOW);
      digitalWrite(BUZZER_PIN, HIGH);

      // 2. Gui tin hieu SOS len Web sos-vietnam-2026.onrender.com
      sendMiniSOSToWeb();

      isAlertSent = true;
      lastSendMillis = millis();
      delay(2000);
      digitalWrite(BUZZER_PIN, LOW);
      digitalWrite(LED_PIN, HIGH);
    }
  }

  if (digitalRead(RF_BUTTON_PIN) == HIGH && digitalRead(ONBOARD_BTN_PIN) == HIGH) {
    isAlertSent = false;
  }

  delay(10); // Nhuong CPU cho stack Wi-Fi cua ESP32-C3 hoat dong muot ma
}

void sendMiniSOSToWeb() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Bo qua kiem tra chung chi SSL goc de ket noi HTTPS onrender.com muot ma

    HTTPClient http;
    http.setConnectTimeout(10000);
    http.setTimeout(15000);

    if (!http.begin(client, serverUrl)) {
      Serial.println("[ERROR] Khong the khoi tao ket noi HTTP!");
      return;
    }

    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{"
      "\"device_id\": \"WEARABLE-SOS-MINI-01\","
      "\"citizen_name\": \"Cu Nguyen Van A (78 tuoi - Thiet bi deo co SOS Mini)\","
      "\"phone\": \"0988113114\","
      "\"incident_type\": \"CAP_CUU_NGUOI_CAO_TUOI\","
      "\"latitude\": 10.0452,"
      "\"longitude\": 105.7469,"
      "\"address\": \"Tin hieu tu Vong deo co khan cap IoT Mini\","
      "\"source\": \"WEARABLE_IOT_BUTTON\""
    "}";

    int httpCode = http.POST(jsonPayload);
    if (httpCode > 0) {
      Serial.println("[OK] Da bao ve Cong Truc Ban thanh cong! Ma HTTP: " + String(httpCode));
    } else {
      Serial.println("[ERROR] Loi gui tin hieu: " + String(httpCode) + " (" + http.errorToString(httpCode) + ")");
    }
    http.end();
  } else {
    Serial.println("[ERROR] Mat ket noi Wi-Fi, khong the gui tin hieu SOS!");
  }
}
