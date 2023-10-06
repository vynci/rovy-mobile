export const mqttTopic = "rovy/motor/c7de5c35-3882-48bc-bac6-f67fcf50da0f";

export const mqttConfig: any = {
  region: "us-east-1",
  host: "a2t5fqt4jh18lz-ats.iot.us-east-1.amazonaws.com",
  clientId: "rovy_" + Math.random().toString(16).substr(2, 8),
  protocol: "wss",
  maximumReconnectTimeMs: 8000,
  accessKeyId: process.env.KVS_KEY,
  secretKey: process.env.KVS_SECRET,
};
