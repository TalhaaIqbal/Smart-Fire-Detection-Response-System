// Every 5 seconds:

// 1. Read sensors
int smoke = analogRead(34);           // MQ-2 on GPIO 34
int flame = digitalRead(27);          // Flame sensor on GPIO 27
float temp = dht.readTemperature();   // DHT22
float hum  = dht.readHumidity();      // DHT22

// 2. Get timestamp from NTP
time_t now = time(nullptr);

// 3. Build JSON string
String payload = "{";
payload += "\"device_id\":\"ESP32_FB01\",";
payload += "\"timestamp\":" + String(now) + ",";
payload += "\"smoke\":" + String(smoke) + ",";
payload += "\"flame\":" + String(flame) + ",";
payload += "\"temperature\":" + String(temp) + ",";
payload += "\"humidity\":" + String(hum);
payload += "}";

// 4. Publish to ThingSpeak via MQTT
client.publish("channels/3365081/publish", payload);