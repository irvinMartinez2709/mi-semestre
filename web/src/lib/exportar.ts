import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { VERSION, CLAVE_HORARIO, CLAVE_MATERIAS, CLAVE_AUSENCIAS, CLAVE_CALIFICACIONES, CLAVE_CREDITOS, CLAVE_BITACORAS } from "./version";
import { cargar } from "./storage";
import { DIAS, nombreMateria } from "./hora";
import { materiasActivas } from "./materias";
import { formatoFechaCorta, sumarDiasISO } from "./fechas";
import { claveFeriado } from "./asistencia";
import { indiceAcademico, letraDeNota, promSeccion, promedioMateria } from "./utp";
import type { CalificacionesPorMateria, Horario, Materia, Semana, Bitacora } from "../types";
import type { jsPDF } from "jspdf";

// ---------------------------------------------------------------------------
// Respaldo JSON (exportar / importar)
// ---------------------------------------------------------------------------

export interface Respaldo {
  app: string;
  version: string;
  exportado: string;
  datos: Record<string, unknown>;
}

export function reunirRespaldo(): Respaldo {
  const datos: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith("ms.")) continue;
    const raw = localStorage.getItem(k);
    if (raw == null) continue;
    try {
      datos[k] = JSON.parse(raw);
    } catch {
      datos[k] = raw;
    }
  }
  return {
    app: "Mi Semestre",
    version: VERSION,
    exportado: new Date().toISOString(),
    datos,
  };
}

function descargarArchivo(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function nombreArchivo(ext: string): string {
  const d = new Date();
  const p = (n: number) => `${n}`.padStart(2, "0");
  return `mi-semestre-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.${ext}`;
}

export type ResultadoExportar = "compartido" | "descargado" | "cancelado";

async function blobABase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  const trozo = 0x8000;
  for (let i = 0; i < bytes.length; i += trozo) {
    bin += String.fromCharCode(...bytes.subarray(i, i + trozo));
  }
  return btoa(bin);
}

// Guarda o comparte el archivo según el contexto:
// 1) Web Share API (escritorio / iOS)
// 2) App nativa (Capacitor): lo escribe en caché y abre la hoja nativa de Android,
//    donde el usuario elige dónde guardarlo o con qué app compartirlo.
// 3) Descarga clásica (navegador de escritorio).
async function guardarOCompartir(file: File, texto: string): Promise<ResultadoExportar> {
  if (navigator.share) {
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Mi Semestre", text: texto });
        return "compartido";
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelado";
      // si falla por otra razón, intentamos con la app nativa o la descarga
    }
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const b64 = await blobABase64(file);
      const ruta = `respaldo/${file.name}`;
      await Filesystem.writeFile({
        path: ruta,
        data: b64,
        directory: Directory.Cache,
        recursive: true,
      });
      const { uri } = await Filesystem.getUri({ path: ruta, directory: Directory.Cache });
      await Share.share({ files: [uri], title: "Mi Semestre", text: texto });
      void Filesystem.deleteFile({ path: ruta, directory: Directory.Cache }).catch(() => undefined);
      return "compartido";
    } catch {
      // si el plugin falla, caemos en la descarga clásica
    }
  }

  descargarArchivo(file);
  return "descargado";
}

export async function exportarJSON(): Promise<ResultadoExportar> {
  const data = reunirRespaldo();
  const file = new File([JSON.stringify(data, null, 2)], nombreArchivo("json"), {
    type: "application/json",
  });
  return guardarOCompartir(file, "Respaldo de datos");
}

export function validarRespaldo(texto: string): Respaldo | null {
  try {
    const data = JSON.parse(texto) as Respaldo;
    if (!data || typeof data !== "object" || !data.datos || typeof data.datos !== "object") return null;
    if (data.app && data.app !== "Mi Semestre") return null;
    return data;
  } catch {
    return null;
  }
}

export async function importarJSON(file: File): Promise<{ ok: boolean }> {
  const texto = await file.text();
  const data = validarRespaldo(texto);
  if (!data) return { ok: false };
  for (const [k, v] of Object.entries(data.datos)) {
    if (typeof v === "string") localStorage.setItem(k, v);
    else localStorage.setItem(k, JSON.stringify(v));
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// PDF estructurado (jsPDF + jspdf-autotable)
// ---------------------------------------------------------------------------

export interface OpcionesPDF {
  t: (clave: string, ...args: (string | number)[]) => string;
  locale: string;
  dias: string[];      // [0]=Domingo ... [6]=Sábado (largos, traducidos)
}

export async function exportarPDF(o: OpcionesPDF): Promise<ResultadoExportar> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const t = o.t;
  const AZUL: [number, number, number] = [46, 124, 246];

  const horario = cargar<Horario>(CLAVE_HORARIO, {
    lunes: [],
    martes: [],
    miércoles: [],
    jueves: [],
    viernes: [],
  });
  const catalogo = cargar<Materia[]>(CLAVE_MATERIAS, []);
  const materias = materiasActivas(horario, catalogo);
  const profesores = new Map(materias.map((m) => [m.nombre, m.profesor || ""]));
  const semanas = cargar<Semana[]>(CLAVE_AUSENCIAS, []);
  const porMateria = cargar<CalificacionesPorMateria>(CLAVE_CALIFICACIONES, {});
  const creditos = cargar<Record<string, number>>(CLAVE_CREDITOS, {});
  const bitacoras = cargar<Bitacora[]>(CLAVE_BITACORAS, []);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const MARGEN = 14;
  const ANCHO = 210 - MARGEN * 2;
  const PIE = 285;
  const LIMITE = PIE - 14;

  const encabezado = (g: jsPDF) => {
    g.setFont("helvetica", "bold");
    g.setFontSize(8);
    g.setTextColor(150);
    g.text(`${t("app.titulo")} · v${VERSION}`, MARGEN, 8);
    const der = t("pdf.titulo");
    g.text(der, 210 - MARGEN - g.getTextWidth(der), 8);
    g.setTextColor(0);
    g.setFont("helvetica", "normal");
  };
  encabezado(doc);

  let y = 24;

  const nuevaPagina = () => {
    doc.addPage();
    y = 24;
    encabezado(doc);
  };

  const asegurarEspacio = (alto: number) => {
    if (y + alto > LIMITE) nuevaPagina();
  };

  const envolver = (g: jsPDF, s: string, anchoMax: number): string[] => {
    const lineas: string[] = [];
    let actual = "";
    for (const palabra of s.split(/\s+/)) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (g.getTextWidth(prueba) <= anchoMax) actual = prueba;
      else {
        if (actual) lineas.push(actual);
        actual = palabra;
      }
    }
    if (actual) lineas.push(actual);
    return lineas.length ? lineas : [""];
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(t("pdf.titulo"), MARGEN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(`${t("pdf.exportado")}: ${new Date().toLocaleString(o.locale)}`, MARGEN, y + 5);
  doc.setTextColor(0);
  y += 12;

  const titulo = (texto: string) => {
    asegurarEspacio(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30);
    for (const linea of envolver(doc, texto, ANCHO)) {
      doc.text(linea, MARGEN, y);
      y += 6;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);
  };

  const texto = (s: string) => {
    for (const linea of envolver(doc, s, ANCHO)) {
      asegurarEspacio(5);
      doc.text(linea, MARGEN, y);
      y += 5;
    }
  };

  const despuesDeTabla = () => {
    const ultima = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
    if (ultima !== undefined) y = ultima + 8;
    if (y > LIMITE) nuevaPagina();
  };

  // 1) Materias
  titulo(t("pdf.materias"));
  if (materias.length === 0) {
    texto(t("pdf.sinDatos"));
  } else {
    asegurarEspacio(20);
    autoTable(doc, {
      startY: y,
      head: [[t("pdf.materia"), t("pdf.horas"), t("pdf.creditos"), t("pdf.profesor")]],
      body: materias.map((m) => [m.nombre, String(m.horas), String(m.creditos ?? 3), m.profesor || "—"]),
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: AZUL, textColor: 255 },
      margin: { left: MARGEN, right: MARGEN },
      didDrawPage: () => encabezado(doc),
    });
    despuesDeTabla();
  }

  // 2) Horario
  titulo(t("pdf.horario"));
  const clases: Array<[string, string, string, string, string]> = [];
  for (const dia of DIAS) {
    for (const c of horario[dia]) {
      clases.push([o.dias[DIAS.indexOf(dia) + 1], c.hora, nombreMateria(c.materia), c.aula, profesores.get(nombreMateria(c.materia)) || c.profesor || "—"]);
    }
  }
  clases.sort((a, b) => o.dias.indexOf(a[0]) - o.dias.indexOf(b[0]) || a[1].localeCompare(b[1]));
  if (clases.length === 0) {
    texto(t("pdf.sinDatos"));
  } else {
    asegurarEspacio(20);
    autoTable(doc, {
      startY: y,
      head: [[t("pdf.dia"), t("pdf.hora"), t("pdf.materia"), t("pdf.aula"), t("pdf.profesor")]],
      body: clases,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: AZUL, textColor: 255 },
      margin: { left: MARGEN, right: MARGEN },
      didDrawPage: () => encabezado(doc),
    });
    despuesDeTabla();
  }

  // 3) Asistencias
  titulo(t("pdf.asistencias"));
  const semanasOrden = [...semanas].sort((a, b) => a.numero - b.numero);
  if (semanasOrden.length === 0) {
    texto(t("pdf.sinDatos"));
  } else {
    let totalPres = 0;
    let totalFaltas = 0;
    for (const s of semanasOrden) {
      const filas: Array<[string, string, string, string]> = [];
      for (const dia of DIAS) {
        const clasesDia = horario[dia] ?? [];
        if (clasesDia.length === 0) continue;
        const feriado = s.registros[claveFeriado(dia)] === true;
        for (const c of clasesDia) {
          const estadoTexto =
            feriado
              ? t("pdf.feriado")
              : s.registros[`${dia}|${c.hora}`] === true
                ? t("pdf.presente")
                : s.registros[`${dia}|${c.hora}`] === false
                  ? t("pdf.falta")
                  : t("pdf.pendiente");
          if (!feriado) {
            if (s.registros[`${dia}|${c.hora}`] === true) totalPres++;
            else if (s.registros[`${dia}|${c.hora}`] === false) totalFaltas++;
          }
          filas.push([
            o.dias[DIAS.indexOf(dia) + 1],
            formatoFechaCorta(sumarDiasISO(s.inicio, DIAS.indexOf(dia)), o.locale),
            nombreMateria(c.materia),
            estadoTexto,
          ]);
        }
      }
      if (filas.length > 0) {
        asegurarEspacio(20);
        autoTable(doc, {
          startY: y,
          head: [[t("pdf.semana", s.numero), t("pdf.fecha"), t("pdf.materia"), t("pdf.estado")]],
          body: filas,
          theme: "grid",
          styles: { fontSize: 8 },
          headStyles: { fillColor: AZUL, textColor: 255 },
          margin: { left: MARGEN, right: MARGEN },
          didDrawPage: () => encabezado(doc),
        });
        despuesDeTabla();
      }
    }
    doc.setFont("helvetica", "bold");
    texto(`${t("pdf.presente")}: ${totalPres}  ·  ${t("pdf.falta")}: ${totalFaltas}`);
    doc.setFont("helvetica", "normal");
    y += 4;
  }

  // 4) Calificaciones
  titulo(t("pdf.calificaciones"));
  const indice = indiceAcademico(porMateria, creditos);
  if (indice.indice !== null) {
    doc.setFont("helvetica", "bold");
    texto(`${t("pdf.indice")}: ${indice.indice.toFixed(2)}`);
    doc.setFont("helvetica", "normal");
    y += 2;
  }
  if (Object.keys(porMateria).length === 0) {
    texto(t("pdf.sinDatos"));
  } else {
    for (const nombre of Object.keys(porMateria).sort()) {
      const secciones = porMateria[nombre] ?? [];
      const prom = promedioMateria(secciones);
      titulo(nombre);
      asegurarEspacio(20);
      autoTable(doc, {
        startY: y,
        head: [[t("pdf.seccion"), t("pdf.porcentaje"), t("pdf.calificacionesSub"), t("pdf.promedio"), t("pdf.letra")]],
        body: secciones.map((s) => {
          const notas = s.calificaciones.map((c) => `${c.nombre}: ${c.nota}${c.extra ? "+" : ""}`).join("\n");
          const p = promSeccion(s);
          return [
            s.nombre,
            `${s.porcentaje}%`,
            notas || "—",
            p === null ? "—" : p.toFixed(2),
            p === null ? "—" : letraDeNota(p),
          ];
        }),
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: AZUL, textColor: 255 },
        margin: { left: MARGEN, right: MARGEN },
        didDrawPage: () => encabezado(doc),
      });
      despuesDeTabla();
      if (prom.promedio !== null) {
        doc.setFont("helvetica", "bold");
        texto(`${t("pdf.promedio")}: ${prom.promedio.toFixed(2)} (${letraDeNota(prom.promedio)})`);
        doc.setFont("helvetica", "normal");
        y += 4;
      }
    }
  }

  // 5) Bitácoras
  titulo(t("pdf.bitacoras"));
  if (bitacoras.length === 0) {
    texto(t("pdf.sinDatos"));
  } else {
    asegurarEspacio(20);
    autoTable(doc, {
      startY: y,
      head: [[t("pdf.fecha"), t("pdf.materia"), t("pdf.tituloBit"), t("pdf.contenido")]],
      body: bitacoras
        .slice()
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
        .map((b) => [
          formatoFechaCorta(b.fecha, o.locale),
          b.materia,
          b.titulo,
          (b.contenido || "").replace(/\n/g, " "),
        ]),
      theme: "grid",
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 38 },
        2: { cellWidth: 40 },
        3: { cellWidth: ANCHO - 24 - 38 - 40 },
      },
      headStyles: { fillColor: AZUL, textColor: 255 },
      margin: { left: MARGEN, right: MARGEN },
      didDrawPage: () => encabezado(doc),
    });
  }

  if (y > PIE - 12) nuevaPagina();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`${t("app.titulo")} · ${t("cfg.plataforma")} · v${VERSION}`, 210 / 2, PIE, { align: "center" });
  doc.setTextColor(0);

  const blob = doc.output("blob");
  const file = new File([blob], nombreArchivo("pdf"), { type: "application/pdf" });
  return guardarOCompartir(file, t("pdf.titulo"));
}
