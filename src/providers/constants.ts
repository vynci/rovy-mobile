export const mqttTopic = "rovy/motor/c7de5c35-3882-48bc-bac6-f67fcf50da0f";

export const mqttConfig: any = {
  region: process.env.AWS_ROVY_REGION,
  host: process.env.AWS_ROVY_MQTT_ENDPOINT,
  clientId: "rovy_" + Math.random().toString(16).substr(2, 8),
  protocol: "wss",
  maximumReconnectTimeMs: 8000,
  accessKeyId: process.env.AWS_ROVY_KEY,
  secretKey: process.env.AWS_ROVY_SECRET,
};
