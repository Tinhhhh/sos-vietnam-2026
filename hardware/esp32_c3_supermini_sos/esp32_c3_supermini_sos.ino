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
int pressStep = 0; // Dem lan nhan: 1 = Cong an don vi, 2 = Canh sat giao thong, 3 = PCCC va CNCH
unsigned long lastSendMillis = 0;
const unsigned long COOLDOWN_MS = 1200; // Chong doi nut giua cac lan nhan

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(ssid, password);

  // Giam cong suat phat WiFi xuong 8.5dBm giup ESP32-C3 SuperMini bat WiFi nhanh va mat mach
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

// Phat coi bip & nhay LED theo so lan nhan (1 bip = Cong an, 2 bip = CSGT, 3 bip = PCCC & CNCH)
void beepAndBlinkByStep(int stepCount) {
  for (int i = 0; i < stepCount; i++) {
    digitalWrite(LED_PIN, LOW);     // Bat LED
    digitalWrite(BUZZER_PIN, HIGH); // Bat coi
    delay(180);
    digitalWrite(BUZZER_PIN, LOW);  // Tat coi
    digitalWrite(LED_PIN, HIGH);    // Tat LED
    if (i < stepCount - 1) {
      delay(140);
    }
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
      isAlertSent = true;
      lastSendMillis = millis();

      // Tang thu tu lan nhan: 1 -> 2 -> 3 -> quay vong ve 1
      pressStep = (pressStep % 3) + 1;

      if (pressStep == 1) {
        Serial.println("[SOS - LAN 1] BAO VE CONG AN DON VI!");
      } else if (pressStep == 2) {
        Serial.println("[SOS - LAN 2] BAO VE CANH SAT GIAO THONG (CSGT)!");
      } else {
        Serial.println("[SOS - LAN 3] BAO VE PCCC VA CNCH!");
      }

      // 1. Bao hieu bang coi va den LED theo dung so lan nhan (1, 2 hoac 3 tieng bip)
      beepAndBlinkByStep(pressStep);

      // 2. Gui tin hieu SOS tuong ung len Web sos-vietnam-2026.onrender.com
      digitalWrite(LED_PIN, LOW); // Giu sang den trong luc dang gui HTTP
      sendMiniSOSToWeb(pressStep);
      digitalWrite(LED_PIN, HIGH);
    }
  }

  if (digitalRead(RF_BUTTON_PIN) == HIGH && digitalRead(ONBOARD_BTN_PIN) == HIGH) {
    isAlertSent = false;
  }

  delay(10); // Nhuong CPU cho stack Wi-Fi cua ESP32-C3 hoat dong muot ma
}

void sendMiniSOSToWeb(int step) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Cho phep ket noi HTTPS onrender.com muot ma

    HTTPClient http;
    http.setConnectTimeout(10000);
    http.setTimeout(15000);

    if (!http.begin(client, serverUrl)) {
      Serial.println("[ERROR] Khong the khoi tao ket noi HTTP!");
      return;
    }

    http.addHeader("Content-Type", "application/json");

    String agency = "police";
    String incidentType = "BAO_CONG_AN_DON_VI";
    String addressNote = "Tin hieu tu Vong deo co khan cap IoT Mini (Nhan lan 1: Bao Cong An Don Vi)";

    if (step == 2) {
      agency = "csgt";
      incidentType = "BAO_CANH_SAT_GIAO_THONG";
      addressNote = "Tin hieu tu Vong deo co khan cap IoT Mini (Nhan lan 2: Bao Canh Sat Giao Thong)";
    } else if (step == 3) {
      agency = "fire";
      incidentType = "BAO_PCCC_VA_CNCH";
      addressNote = "Tin hieu tu Vong deo co khan cap IoT Mini (Nhan lan 3: Bao PCCC va CNCH)";
    }

    String jsonPayload = "{"
      "\"device_id\": \"WEARABLE-SOS-MINI-01\","
      "\"press_step\": " + String(step) + ","
      "\"agency\": \"" + agency + "\","
      "\"citizen_name\": \"Cu Nguyen Van A (78 tuoi - Thiet bi deo co SOS Mini)\","
      "\"phone\": \"0988113114\","
      "\"incident_type\": \"" + incidentType + "\","
      "\"latitude\": 10.0452,"
      "\"longitude\": 105.7469,"
      "\"address\": \"" + addressNote + "\","
      "\"source\": \"WEARABLE_IOT_BUTTON\""
    "}";

    int httpCode = http.POST(jsonPayload);
    if (httpCode > 0) {
      Serial.println("[OK] Da bao ve Cong Truc Ban thanh cong (Lan " + String(step) + " - " + agency + ")! Ma HTTP: " + String(httpCode));
    } else {
      Serial.println("[ERROR] Loi gui tin hieu: " + String(httpCode) + " (" + http.errorToString(httpCode) + ")");
    }
    http.end();
  } else {
    Serial.println("[ERROR] Mat ket noi Wi-Fi, khong the gui tin hieu SOS!");
  }
}
