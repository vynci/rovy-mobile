import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.rovy.mobile",
  appName: "rovy-mobile",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
