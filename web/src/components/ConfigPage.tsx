import { useRef, useState } from "react";
import { PRESETS_COLOR, useAjustes, useConfirmar } from "../contexto/Ajustes";
import type { KColor } from "../contexto/Ajustes";
import { estilos } from "./UI";
import { Icono } from "./Icono";
import { LogoApp } from "./LogoApp";
import { VolverInicio } from "./VolverInicio";
import type { Vista } from "../types";
import { VERSION } from "../lib/version";
import { exportarJSON, exportarPDF, importarJSON } from "../lib/exportar";

const CLAVE_COLOR: { clave: KColor; traduccion: string }[] = [
  { clave: "acento", traduccion: "cfg.color.acento" },
  { clave: "hoy", traduccion: "cfg.color.hoy" },
  { clave: "futura", traduccion: "cfg.color.futura" },
  { clave: "horario", traduccion: "cfg.color.horario" },
  { clave: "ausencias", traduccion: "cfg.color.ausencias" },
  { clave: "calificaciones", traduccion: "cfg.color.calificaciones" },
  { clave: "bitacoras", traduccion: "cfg.color.bitacoras" },
  { clave: "materias", traduccion: "cfg.color.materias" },
  { clave: "tareas", traduccion: "cfg.color.tareas" },
  { clave: "config", traduccion: "cfg.color.config" },
  { clave: "asistPresente", traduccion: "cfg.color.asistPresente" },
  { clave: "asistParcial", traduccion: "cfg.color.asistParcial" },
  { clave: "asistAusencia", traduccion: "cfg.color.asistAusencia" },
  { clave: "asistFeriado", traduccion: "cfg.color.asistFeriado" },
  { clave: "asistSinClases", traduccion: "cfg.color.asistSinClases" },
];

export function ConfigPage({ alNavegar }: { alNavegar: (v: Vista) => void }) {
  const {
    t,
    locale,
    dias,
    idioma,
    fijarIdioma,
    tema,
    alternarTema,
    colores,
    fijarColor,
    esPorDefecto,
    restablecerColores,
    aplicarPreset,
    titulo,
    subtitulo,
    fijarEncabezado,
  } = useAjustes();
  const { notificar, confirmar } = useConfirmar();

  const [tituloEd, setTituloEd] = useState(titulo);
  const [subEd, setSubEd] = useState(subtitulo);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const refArchivo = useRef<HTMLInputElement>(null);

  const oscuro = tema === "oscuro";

  const guardarEncabezado = async () => {
    fijarEncabezado(tituloEd, subEd);
    setTituloEd(tituloEd.trim() || titulo);
    setSubEd(subEd.trim() || subtitulo);
    await notificar(t("cfg.encabezado.guardar"));
  };

  const alExportarJSON = async () => {
    const r = await exportarJSON();
    if (r === "descargado") await notificar(t("cfg.exportar.listos"));
    else if (r === "compartido") await notificar(t("cfg.exportar.compartido"));
  };

  const alExportarPDF = async () => {
    setGenerandoPdf(true);
    try {
      const r = await exportarPDF({ t, locale, dias });
      if (r === "descargado") await notificar(t("cfg.pdf.listos"));
      else if (r === "compartido") await notificar(t("cfg.pdf.compartido"));
    } catch {
      await notificar(t("cfg.pdf.error"));
    } finally {
      setGenerandoPdf(false);
    }
  };

  const alImportarJSON = async (file: File) => {
    const ok = await confirmar({
      mensaje: t("cfg.importar.confirm"),
      confirmarTexto: t("comun.confirmar"),
      peligro: true,
    });
    if (!ok) return;
    const res = await importarJSON(file);
    if (!res.ok) {
      await notificar(t("cfg.importar.error"));
      return;
    }
    await notificar(t("cfg.importar.listos"));
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{t("cfg.titulo")}</h1>
          <p className="mt-0.5 text-xs text-sub">{t("cfg.sub")}</p>
        </div>
        <VolverInicio alNavegar={alNavegar} />
      </div>

      <section className="rounded-xl border border-borde bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg text-white" style={{ backgroundColor: colores.config }}>
              <Icono nombre={oscuro ? "luna" : "sol"} />
            </span>
            <div>
              <p className="font-semibold">{t("cfg.tema")}</p>
              <p className="text-xs text-sub">{oscuro ? t("cfg.temaOscuro") : t("cfg.temaClaro")}</p>
            </div>
          </div>
          <button
            onClick={alternarTema}
            aria-label="Cambiar tema"
            className="relative h-7 w-12 rounded-full transition-colors"
            style={{ backgroundColor: oscuro ? colores.config : colores.acento }}
          >
            <span className={`absolute top-1 left-1 grid h-5 w-5 place-items-center rounded-full bg-white transition-all ${oscuro ? "translate-x-5" : ""}`}>
              <Icono nombre={oscuro ? "luna" : "sol"} className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-borde bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg">
            <LogoApp className="h-10 w-10" />
          </span>
          <div>
            <p className="font-semibold">{t("cfg.encabezado")}</p>
            <p className="text-xs text-sub">{t("cfg.encabezado.sub")}</p>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-sub">{t("cfg.encabezado.titulo")}</label>
            <input
              className={estilos.inputClase}
              value={tituloEd}
              onChange={(e) => setTituloEd(e.target.value)}
              placeholder={t("cfg.encabezado.placeholderTitulo")}
              maxLength={40}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-sub">{t("cfg.encabezado.subtitulo")}</label>
            <input
              className={estilos.inputClase}
              value={subEd}
              onChange={(e) => setSubEd(e.target.value)}
              placeholder={t("cfg.encabezado.placeholderSub")}
              maxLength={60}
            />
          </div>
          <button onClick={guardarEncabezado} className={`${estilos.boton} ${estilos.primario} w-full`}>
            {t("cfg.encabezado.guardar")}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-borde bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg text-white" style={{ backgroundColor: colores.acento }}>
            <Icono nombre="config" />
          </span>
          <div>
            <p className="font-semibold">{t("cfg.idioma")}</p>
            <p className="text-xs text-sub">{t("cfg.idioma.sub")}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => fijarIdioma("es")}
            className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
              idioma === "es" ? "border-transparent text-white" : "border-borde text-tinta hover:border-acento"
            }`}
            style={idioma === "es" ? { backgroundColor: colores.acento } : undefined}
          >
            🇪🇸 Español
          </button>
          <button
            onClick={() => fijarIdioma("en")}
            className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
              idioma === "en" ? "border-transparent text-white" : "border-borde text-tinta hover:border-acento"
            }`}
            style={idioma === "en" ? { backgroundColor: colores.acento } : undefined}
          >
            🇺🇸 English
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-borde bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-semibold">{t("cfg.colores")}</p>
            <p className="text-xs text-sub">{t("cfg.colores.sub")}</p>
          </div>
          {!esPorDefecto && (
            <button onClick={restablecerColores} className={`${estilos.boton} ${estilos.secundario} px-3 py-1.5 text-xs`}>
              {t("cfg.restablecer")}
            </button>
          )}
        </div>
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold text-sub">{t("cfg.presets")}</p>
          <p className="mb-2 text-[11px] text-sub">{t("cfg.presets.sub")}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {PRESETS_COLOR.map((p) => (
              <button
                key={p.id}
                onClick={() => aplicarPreset(p.colores)}
                className="rounded-lg border border-borde p-2 text-left transition-colors hover:border-acento"
              >
                <span className="flex items-center gap-1">
                  {Object.values(p.colores).slice(0, 6).map((c, i) => (
                    <i key={i} className="h-3 w-3 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </span>
                <span className="mt-1.5 block truncate text-xs font-semibold">
                  {t(`cfg.presets.${p.id}`)}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CLAVE_COLOR.map((c) => (
            <label key={c.clave} className="flex items-center gap-2 rounded-lg border border-borde px-2.5 py-2">
              <input
                type="color"
                value={colores[c.clave]}
                onChange={(e) => fijarColor(c.clave, e.target.value)}
                className="h-7 w-9 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                aria-label={t(c.traduccion)}
              />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold">{t(c.traduccion)}</span>
              <span className="shrink-0 font-mono text-[10px] text-sub">{colores[c.clave].toUpperCase()}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-borde bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg text-white" style={{ backgroundColor: colores.acento }}>
            <Icono nombre="config" />
          </span>
          <div>
            <p className="font-semibold">{t("cfg.datos")}</p>
            <p className="text-xs text-sub">{t("cfg.datos.sub")}</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-sub">{t("cfg.datos.aviso")}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <button onClick={alExportarJSON} className={`${estilos.boton} ${estilos.secundario}`}>
            {t("cfg.exportar")}
          </button>
          <button onClick={() => refArchivo.current?.click()} className={`${estilos.boton} ${estilos.secundario}`}>
            {t("cfg.importar")}
          </button>
          <button onClick={alExportarPDF} disabled={generandoPdf} className={`${estilos.boton} ${estilos.primario}`}>
            {generandoPdf ? t("cfg.pdf.generando") : t("cfg.pdf")}
          </button>
        </div>
        <input
          ref={refArchivo}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void alImportarJSON(f);
            e.target.value = "";
          }}
        />
      </section>

      <section className="rounded-xl border border-borde bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-sub">{t("cfg.acercaDe")}</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-sub">{t("cfg.nombre")}</dt>
            <dd className="font-semibold">{titulo}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-sub">{t("cfg.version")}</dt>
            <dd className="font-semibold">{VERSION}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-sub">{t("cfg.plataforma")}</dt>
            <dd className="font-semibold">Android</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-borde bg-card2 p-4 text-center">
        <p className="text-xs text-sub">{t("cfg.local")}</p>
      </section>

      <VolverInicio alNavegar={alNavegar} />
    </div>
  );
}