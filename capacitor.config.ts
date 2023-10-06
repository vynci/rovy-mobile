import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.rovy.mobile",
  appName: "rovy-mobile",
  webDir: "dist",
  server: {
    url: "http://10.0.0.17:3001",
    cleartext: true,
  },
};

export default config;
