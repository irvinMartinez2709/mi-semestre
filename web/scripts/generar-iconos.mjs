import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("public/icono-app.png");
const ANDROID = path.resolve("android/app/src/main/res");

// Escalar la fuente (123x129) a una base grande UNA sola vez.
// A partir de la base hacemos solo downscaling, que es fiable y de buena calidad.
const BASE = await sharp(SRC)
  .ensureAlpha()
  .resize(1024, 1024, { fit: "cover" })
  .png()
  .toBuffer();

const DENSIDADES = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

// Canvas del ícono adaptativo por densidad (108dp base): mdpi=108, hdpi=162,
// xhdpi=216, xxhdpi=324, xxxhdpi=432
const CANVAS = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

// Ícono legacy: imagen completa con esquinas redondeadas (squircle).
async function legacy(tam) {
  const mascara = Buffer.from(
    `<svg width="${tam}" height="${tam}"><rect width="${tam}" height="${tam}" rx="${Math.round(tam * 0.22)}" fill="white"/></svg>`
  );
  return sharp(BASE)
    .resize(tam, tam, { fit: "cover" })
    .composite([{ input: mascara, blend: "dest-in" }])
    .png()
    .toBuffer();
}

// Imagen completa de la base (sin recorte) para evitar re-upscale dentro de extend
async function fullCanvas(tam) {
  return sharp(BASE).resize(tam, tam, { fit: "cover" }).png().toBuffer();
}

// Foreground adaptativo: imagen centrada dentro de la zona segura (66%).
async function foreground(canvas) {
  const inner = Math.round(canvas * 0.9); // casi a todo el canvas para que se vea el squircle completo
  const pad = Math.round((canvas - inner) / 2);
  const img = await sharp(BASE).resize(inner, inner, { fit: "cover" }).png().toBuffer();
  return sharp(img)
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

// Color de fondo a partir de la esquina superior-izquierda de la base
const muestra = await sharp(BASE).resize(1, 1).toBuffer();
const { data } = await sharp(muestra).raw().toBuffer({ resolveWithObject: true });
const hex = [data[0], data[1], data[2]]
  .map((n) => n.toString(16).padStart(2, "0"))
  .join("");

fs.mkdirSync(path.join(ANDROID, "values"), { recursive: true });
fs.writeFileSync(
  path.join(ANDROID, "values", "ic_launcher_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>
<resources><color name="ic_launcher_background">#${hex}</color></resources>`
);

for (const d of Object.keys(DENSIDADES)) {
  const dir = path.join(ANDROID, `mipmap-${d}`);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir))
    if (/^ic_launcher/.test(f)) fs.rmSync(path.join(dir, f), { force: true });
}

for (const [d, tam] of Object.entries(DENSIDADES)) {
  const dir = path.join(ANDROID, `mipmap-${d}`);

  const leg = await legacy(tam);
  const fg = await foreground(CANVAS[d]);

  await sharp(leg).png().toFile(path.join(dir, "ic_launcher.png"));
  await sharp(leg).png().toFile(path.join(dir, "ic_launcher_round.png"));
  await sharp(fg).png().toFile(path.join(dir, "ic_launcher_foreground.png"));
  console.log(`mipmap-${d}: legacy ${tam}px, foreground ${CANVAS[d]}px`);
}

const xml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/ic_launcher_background"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
const anydpi = path.join(ANDROID, "mipmap-anydpi-v26");
fs.mkdirSync(anydpi, { recursive: true });
fs.writeFileSync(path.join(anydpi, "ic_launcher.xml"), xml);
fs.writeFileSync(path.join(anydpi, "ic_launcher_round.xml"), xml);

console.log("Iconos escritos directamente en android/app/src/main/res");
