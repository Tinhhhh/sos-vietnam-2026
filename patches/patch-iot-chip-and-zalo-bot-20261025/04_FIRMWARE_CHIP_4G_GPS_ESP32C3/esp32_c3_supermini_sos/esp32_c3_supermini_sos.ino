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

// 4. BIEN DEM SO LAN NHAN & THOI GIAN CHO XAC NHAN 5 GIAY
bool wasButtonPressed = false;
int clickCount = 0;                             // Dem so lan nhan trong phien hien tai
unsigned long lastClickMillis = 0;              // Thoi diem nhan nut gan nhat
const unsigned long CONFIRM_WAIT_MS = 5000;     // Cho dung 5 giay (5000ms) khong nhan tiep thi xac nhan gui

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

// Bip ngan 1 cai moi khi bam nut de nguoi dung biet mach da nhan nhip bam
void beepShortOnPress() {
  digitalWrite(LED_PIN, LOW);     // Bat LED
  digitalWrite(BUZZER_PIN, HIGH); // Bat coi
  delay(90);
  digitalWrite(BUZZER_PIN, LOW);  // Tat coi
  digitalWrite(LED_PIN, HIGH);    // Tat LED
}

// Sau khi het 5 giay cho, phat coi xac nhan theo so lan nhan (1, 2 hoac 3 tieng bip)
void beepAndBlinkConfirm(int stepCount) {
  for (int i = 0; i < stepCount; i++) {
    digitalWrite(LED_PIN, LOW);     // Bat LED
    digitalWrite(BUZZER_PIN, HIGH); // Bat coi
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);  // Tat coi
    digitalWrite(LED_PIN, HIGH);    // Tat LED
    if (i < stepCount - 1) {
      delay(150);
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
  // Kiem tra trang thai nut bam (GPIO 3 hoac GPIO 9)
  bool pressed = (digitalRead(RF_BUTTON_PIN) == LOW) || (digitalRead(ONBOARD_BTN_PIN) == LOW);

  // 1. Phat hien suon xuong (nguoi dung vua bam nut)
  if (pressed && !wasButtonPressed) {
    delay(45); // Chong doi phim (debounce)
    bool stillPressed = (digitalRead(RF_BUTTON_PIN) == LOW) || (digitalRead(ONBOARD_BTN_PIN) == LOW);
    if (stillPressed) {
      wasButtonPressed = true;
      clickCount++;
      if (clickCount > 3) {
        clickCount = 3; // Toi da 3 lan nhan (1: Cong an, 2: CSGT, 3: PCCC & CNCH)
      }
      lastClickMillis = millis(); // Reset bo dem 5 giay tinh tu lan nhan cuoi cung

      beepShortOnPress();

      Serial.print("[NHAN NUT] Da ghi nhan ");
      Serial.print(clickCount);
      Serial.println(" lan nhan. Dang cho 5 giay xem co nhan tiep khong...");
    }
  }

  // 2. Khi nguoi dung nha nut ra -> cho phep ghi nhan lan nhan tiep theo
  if (!pressed && wasButtonPressed) {
    delay(30); // Chong nhieu khi nha nut
    if (digitalRead(RF_BUTTON_PIN) == HIGH && digitalRead(ONBOARD_BTN_PIN) == HIGH) {
      wasButtonPressed = false;
    }
  }

  // 3. Kiem tra neu da co nhan nut (clickCount > 0) va da qua 5 giay (5000ms) khong nhan tiep
  if (clickCount > 0 && !wasButtonPressed && (millis() - lastClickMillis >= CONFIRM_WAIT_MS)) {
    int confirmedStep = clickCount;
    clickCount = 0; // Reset ve 0 cho dot bao dong tiep theo

    if (confirmedStep == 1) {
      Serial.println("[XAC NHAN 1 LAN NHAN - HET 5 GIAY CHO] BAO VE CONG AN DIA PHUONG!");
    } else if (confirmedStep == 2) {
      Serial.println("[XAC NHAN 2 LAN NHAN - HET 5 GIAY CHO] BAO VE CANH SAT GIAO THONG (CSGT)!");
    } else {
      Serial.println("[XAC NHAN 3 LAN NHAN - HET 5 GIAY CHO] BAO VE PCCC VA CNCH!");
    }

    // Phat coi & nhay den xac nhan so lan nhan
    beepAndBlinkConfirm(confirmedStep);

    // Giu sang den trong luc gui tin hieu HTTP len Web Truc Ban
    digitalWrite(LED_PIN, LOW);
    sendMiniSOSToWeb(confirmedStep);
    digitalWrite(LED_PIN, HIGH);
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
    String incidentType = "BAO_CONG_AN_DIA_PHUONG";
    String addressNote = "Tin hieu tu Vong deo co khan cap IoT Mini (Nhan 1 lan: Bao Cong An Dia Phuong)";

    if (step == 2) {
      agency = "csgt";
      incidentType = "BAO_CANH_SAT_GIAO_THONG";
      addressNote = "Tin hieu tu Vong deo co khan cap IoT Mini (Nhan 2 lan: Bao Canh Sat Giao Thong)";
    } else if (step >= 3) {
      agency = "fire";
      incidentType = "BAO_PCCC_VA_CNCH";
      addressNote = "Tin hieu tu Vong deo co khan cap IoT Mini (Nhan 3 lan: Bao PCCC va CNCH)";
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
      Serial.println("[OK] Da bao ve Cong Truc Ban thanh cong (Nhan " + String(step) + " lan - " + agency + ")! Ma HTTP: " + String(httpCode));
    } else {
      Serial.println("[ERROR] Loi gui tin hieu: " + String(httpCode) + " (" + http.errorToString(httpCode) + ")");
    }
    http.end();
  } else {
    Serial.println("[ERROR] Mat ket noi Wi-Fi, khong the gui tin hieu SOS!");
  }
}
