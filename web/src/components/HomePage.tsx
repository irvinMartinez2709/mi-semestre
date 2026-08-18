import { useMemo } from "react";
import { useHorario } from "../hooks/useHorario";
import { useMaterias } from "../hooks/useMaterias";
import { useAusencias } from "../hooks/useAusencias";
import { useCalificaciones } from "../hooks/useCalificaciones";
import { useBitacoras } from "../hooks/useBitacoras";
import { useTareas } from "../hooks/useTareas";
import { useAjustes } from "../contexto/Ajustes";
import { coloresDeMaterias, materiasActivas } from "../lib/materias";
import { redondear } from "../lib/storage";
import { promedioMateria } from "../lib/utp";
import { estadoTarea, fechaLimite } from "../lib/tareas";
import { claseActiva, diaDeHoy, hoyMinutos, nombreMateria, totalClases } from "../lib/hora";
import { formatoFechaCorta } from "../lib/fechas";
import { Icono } from "./Icono";
import type { NombreIcono } from "./Icono";
import type { Vista } from "../types";

interface Props {
  alNavegar: (v: Vista) => void;
}

export function Home({ alNavegar }: Props) {
  const { t, locale, colores } = useAjustes();
  const { horario } = useHorario();
  const { materias } = useMaterias();
  const { semanas } = useAusencias();
  const { porMateria } = useCalificaciones();
  const { bitacoras } = useBitacoras();
  const { tareas } = useTareas();

  const stats = useMemo(() => {
    let presentes = 0;
    let faltas = 0;
    for (const s of semanas)
      for (const v of Object.values(s.registros)) {
        if (v === true || v === "cancelled") presentes++;
        else if (v === false) faltas++;
      }
    const notas = Object.values(porMateria)
      .map((secciones) => promedioMateria(secciones).promedio)
      .filter((p): p is number => p !== null);
    const promedio = notas.length === 0 ? null : notas.reduce((a, b) => a + b, 0) / notas.length;

    const hoy = diaDeHoy();
    const prox = hoy ? claseActiva(horario[hoy], hoyMinutos()).proxima : null;
    const materiasInfo = materiasActivas(horario, materias);
    return { materias: materiasInfo, clasesSemana: totalClases(horario), presentes, faltas, promedio, nBitacoras: bitacoras.length, prox };
  }, [horario, materias, semanas, porMateria, bitacoras]);

  const pendientes = useMemo(
    () =>
      tareas
        .filter((x) => estadoTarea(x) === "pendiente")
        .sort((a, b) => fechaLimite(a).getTime() - fechaLimite(b).getTime())
        .slice(0, 5),
    [tareas]
  );

  const mapaColores = useMemo(
    () => coloresDeMaterias(horario, materias),
    [horario, materias]
  );

  const saludo = saludoKey();

  const tarjetas = [
    { id: "horario" as Vista, nombre: t("sec.horario"), desc: t("sec.horario.desc"), color: colores.horario },
    { id: "ausencias" as Vista, nombre: t("sec.ausencias"), desc: t("sec.ausencias.desc"), color: colores.ausencias },
    { id: "calificaciones" as Vista, nombre: t("sec.calificaciones"), desc: t("sec.calificaciones.desc"), color: colores.calificaciones },
    { id: "bitacoras" as Vista, nombre: t("sec.bitacoras"), desc: t("sec.bitacoras.desc"), color: colores.bitacoras },
    { id: "materias" as Vista, nombre: t("sec.materias"), desc: t("sec.materias.desc"), color: colores.materias },
    { id: "tareas" as Vista, nombre: t("sec.tareas"), desc: t("sec.tareas.desc"), color: colores.tareas },
    { id: "config" as Vista, nombre: t("sec.config"), desc: t("sec.config.desc"), color: colores.config },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-borde bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-sub">{t(saludo)}</p>
        <h1 className="mt-1 text-2xl font-bold">{t("home.resumen")}</h1>
        <p className="mt-1 text-sm text-sub">{t("home.sub")}</p>
        <p className="mt-2 text-sm text-sub">
          {t("home.info", stats.materias.length, stats.clasesSemana)}
        </p>
        {stats.prox && (
          <div
            className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white"
            style={{ backgroundColor: colores.acento }}
          >
            <span>
              <Icono nombre="horario" className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <b>{t("home.siguiente")}</b> {nombreMateria(stats.prox.materia)} · {stats.prox.hora}
            </span>
          </div>
        )}
        <button
          onClick={() => alNavegar("horario")}
          className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: colores.acento }}
        >
          <Icono nombre="horario" className="h-4 w-4" />
          {t("home.verHorario")}
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat etiqueta={t("stat.asistencias")} valor={`✓ ${stats.presentes}`} sub={t("stat.faltas", stats.faltas)} color="#10B981" />
        <MiniStat etiqueta={t("stat.promedio")} valor={stats.promedio === null ? "—" : redondear(stats.promedio, 1)} sub={t("stat.general")} color={colores.calificaciones} />
        <MiniStat etiqueta={t("stat.bitacoras")} valor={stats.nBitacoras} sub={t("stat.registradas")} color={colores.bitacoras} />
        <MiniStat etiqueta={t("stat.semana")} valor={stats.clasesSemana} sub={t("stat.clases")} color={colores.horario} />
      </section>

      {pendientes.length > 0 && (
        <section className="rounded-xl border border-borde bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2
              className="text-sm font-bold"
              style={{ color: colores.tareas }}
            >
              {t("home.tareasPendientes")}
            </h2>
            <button
              onClick={() => alNavegar("tareas")}
              className="text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ color: colores.tareas }}
            >
              {t("home.verTareas")}
            </button>
          </div>
          <ul className="mt-2 space-y-1.5">
            {pendientes.map((x) => {
              const c = mapaColores.get(x.materia) || colores.tareas;
              return (
                <li key={x.id}>
                  <button
                    onClick={() => alNavegar("tareas")}
                    className="flex w-full items-center gap-2 rounded-lg bg-card2 px-3 py-2 text-left"
                  >
                    <i
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: c }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {x.titulo}
                    </span>
                    <span className="shrink-0 text-[11px] text-sub">
                      {formatoFechaCorta(x.fecha, locale)}
                      {x.hora ? ` · ${x.hora}` : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((c) => (
          <button
            key={c.id}
            onClick={() => alNavegar(c.id)}
            className="flex w-full items-center gap-3 rounded-xl border border-borde bg-card p-3.5 text-left transition-transform active:scale-[0.99]"
          >
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white"
              style={{ backgroundColor: c.color }}
            >
              <Icono nombre={c.id as NombreIcono} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{c.nombre}</span>
              <span className="block text-xs text-sub">{c.desc}</span>
            </span>
            <Icono nombre="flecha" className="h-4 w-4 shrink-0 text-sub" />
          </button>
        ))}
      </section>
    </div>
  );
}

function saludoKey(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "home.dias";
  if (h >= 12 && h < 19) return "home.tardes";
  return "home.noches";
}

function MiniStat({
  etiqueta,
  valor,
  sub,
  color,
}: {
  etiqueta: string;
  valor: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-borde bg-card p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-sub">{etiqueta}</p>
      <p className="mt-0.5 text-2xl font-bold" style={{ color }}>{valor}</p>
      <p className="text-[11px] text-sub">{sub}</p>
    </div>
  );
}