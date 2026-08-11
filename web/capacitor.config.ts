import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.misemestre.app",
  appName: "Mi Semestre",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;