import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.rovy.mobile",
  appName: "rovy-mobile",
  webDir: "dist",
  server: { cleartext: true, androidScheme: "https" },
};

export default config;
