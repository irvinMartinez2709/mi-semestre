import { readFileSync, writeFileSync } from "node:fs";

const ruta = "android/app/build.gradle";
let s = readFileSync(ruta, "utf8");

if (!s.includes("signingConfigs {")) {
  const bloque =
    "signingConfigs {\n" +
    "    release {\n" +
    '        storeFile file("../../keystore/mi-semestre.p12")\n' +
    '        storeType "pkcs12"\n' +
    '        storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")\n' +
    '        keyAlias System.getenv("ANDROID_KEY_ALIAS")\n' +
    '        keyPassword System.getenv("ANDROID_KEYSTORE_PASSWORD")\n' +
    "    }\n" +
    "}\n";
  s = s.replace("android {", "android {\n    " + bloque);
  console.log("signingConfigs.release agregado");
} else {
  console.log("signingConfigs ya presente, se omite");
}

if (!/signingConfig signingConfigs\.release/.test(s)) {
  s = s.replace(
    /release \{\n(\s+)minifyEnabled (true|false)/,
    (_m, esp, val) =>
      `release {\n${esp}signingConfig signingConfigs.release\n${esp}minifyEnabled ${val}`
  );
  console.log("release usa signingConfig.release");
} else {
  console.log("release ya firmado, se omite");
}

writeFileSync(ruta, s);
