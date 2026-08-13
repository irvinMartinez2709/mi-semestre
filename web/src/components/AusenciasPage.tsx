import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DIAS, nombreMateria } from "../lib/hora";
import { useAusencias } from "../hooks/useAusencias";
import { useHorario } from "../hooks/useHorario";
import { useMaterias } from "../hooks/useMaterias";
import { colorDeMateria, materiasActivas } from "../lib/materias";
import {
  estadoDeDia,
  limitesAsistencia,
  SEMANAS_SEMESTRE,
  type EstadoDia,
  type EstadoLimiteAsistencia,
  type LimiteAsistencia,
} from "../lib/asistencia";
import { redondear } from "../lib/storage";
import { formatoFechaCorta, formatoFechaNumero, isoHoy, lunesDeISO, sumarDiasISO } from "../lib/fechas";
import { useAjustes, useConfirmar, type Colores } from "../contexto/Ajustes";
import { estilos, IconoBoton } from "./UI";
import type { Dia, EstadoAsistencia, Horario, Semana, Vista } from "../types";
import { VolverInicio } from "./VolverInicio";

type Filtro = "__todas__" | string;

export function AusenciasPage({ alNavegar }: { alNavegar: (v: Vista) => void }) {
  const { t, locale, diasCorto, colores } = useAjustes();
  const { confirmar, notificar } = useConfirmar();
  const { horario } = useHorario();
  const { materias: catalogo } = useMaterias();
  const { semanas, agregarSemana, eliminarSemana, setRegistro, alternarFeriado } = useAusencias();
  const [inicioSemana, setInicioSemana] = useState(() => lunesDeISO(isoHoy()));
  const [filtro, setFiltro] = useState<Filtro>("__todas__");
  const [abiertas, setAbiertas] = useState<Record<string, boolean>>({});
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});

  const materias = materiasActivas(horario, catalogo);

  const creditos = useMemo(() => {
    const m: Record<string, number> = {};
    for (const ma of materias) m[ma.nombre] = ma.creditos ?? 3;
    return m;
  }, [materias]);

  const limites = useMemo(
    () => limitesAsistencia(horario, semanas, creditos),
    [horario, semanas, creditos]
  );

  const resumen = useMemo(() => {
    let pres = 0;
    let faltas = 0;
    let pend = 0;
    let feriados = 0;
    for (const s of semanas) {
      for (const dia of DIAS) {
        const claves = clavesDeDia(horario, dia);
        if (claves.length === 0) continue;
        const e = estadoDeDia(s.registros, dia, claves.map((c) => c.clave));
        if (e === "presente") pres++;
        else if (e === "falta") faltas++;
        else if (e === "feriado") feriados++;
        else pend++;
      }
    }
    return { semanas: semanas.length, pres, faltas, pend, feriados };
  }, [semanas, horario]);

  const semanasOrden = useMemo(
    () => [...semanas].sort((a, b) => a.numero - b.numero),
    [semanas]
  );

  const agregar = async () => {
    const ok = await confirmar({
      mensaje: t("aus.confirmAgregar"),
      confirmarTexto: t("comun.añadir"),
    });
    if (!ok) return;
    const nueva = agregarSemana(lunesDeISO(inicioSemana));
    if (nueva) {
      setAbiertas((x) => ({ ...x, [nueva.id]: true }));
      setAbiertos((x) => ({ ...x, [`${nueva.id}:${DIAS[0]}`]: true }));
    } else {
      await notificar(t("aus.yaExiste"));
    }
  };

  if (materias.length === 0) {
    return (
      <div className="space-y-4">
        <Titulo alNavegar={alNavegar} />
        <section className="rounded-xl border border-borde bg-card p-6 text-center text-sm text-sub">
          {t("aus.sinMaterias", t("sec.horario"))}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Titulo alNavegar={alNavegar} />

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Resumen valor={resumen.semanas} etiqueta={t("aus.semanas")} color="#2E7CF6" />
        <Resumen valor={resumen.pres} etiqueta={t("aus.diasPres")} color={colores.asistPresente} />
        <Resumen valor={resumen.faltas} etiqueta={t("aus.diasFalta")} color={colores.asistAusencia} />
        <Resumen valor={resumen.pend} etiqueta={t("aus.diasPend")} color="#94A3B8" />
        <Resumen valor={resumen.feriados} etiqueta={t("aus.diasFeriado")} color={colores.asistFeriado} />
      </section>

      <section className="rounded-xl border border-borde bg-card p-4">
        <h2 className="text-sm font-bold">{t("aus.limites.titulo")}</h2>
        <p className="mt-0.5 text-[11px] text-sub">{t("aus.limites.sub")}</p>
        <p className="mt-1 text-[10px] text-sub">{t("aus.limites.semanas", SEMANAS_SEMESTRE)}</p>

        {limites.length === 0 ? (
          <p className="mt-3 text-xs text-sub">{t("aus.limites.ninguna")}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {limites.map((l) => (
              <LimiteCard key={l.materia} l={l} t={t} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-borde bg-card p-4">
        <h2 className="mb-3 text-sm font-bold">{t("aus.añadirSemana")}</h2>
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-semibold text-sub">{t("aus.inicioSemana")}</label>
            <input
              type="date"
              className={estilos.inputClase}
              value={inicioSemana}
              onChange={(e) => setInicioSemana(e.target.value || lunesDeISO(isoHoy()))}
            />
          </div>
          <button onClick={agregar} className={`${estilos.boton} ${estilos.primario}`}>
            {t("comun.añadir")}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-sub">{t("aus.marcaDia")}</p>
      </section>

      <NormaLegend colores={colores} />

      <section className="rounded-xl border border-borde bg-card p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-sub">{t("aus.filtrar")}</p>
        <div className="flex flex-wrap gap-1.5">
          <FiltroChip activo={filtro === "__todas__"} color="#2E7CF6" onClick={() => setFiltro("__todas__")}>
            {t("aus.todas")}
          </FiltroChip>
          {materias.map((m) => (
            <FiltroChip key={m.nombre} activo={filtro === m.nombre} color={m.color} onClick={() => setFiltro(m.nombre)}>
              {m.nombre}
            </FiltroChip>
          ))}
        </div>
      </section>

      {semanasOrden.length === 0 ? (
        <section className="rounded-xl border border-dashed border-borde bg-card p-6 text-center text-sm text-sub">
          {t("aus.sinSemanas")}
        </section>
      ) : (
        <div className="space-y-3">
          {semanasOrden.map((s) => (
            <SemanaCard
              key={s.id}
              semana={s}
              horario={horario}
              filtro={filtro}
              colores={colores}
              diasCorto={diasCorto}
              locale={locale}
              t={t}
              abierta={abiertas[s.id] ?? false}
              onToggle={() => setAbiertas((x) => ({ ...x, [s.id]: !(x[s.id] ?? false) }))}
              diaAbierto={(dia) => abiertos[`${s.id}:${dia}`] ?? false}
              onToggleDia={(dia) =>
                setAbiertos((x) => ({ ...x, [`${s.id}:${dia}`]: !(x[`${s.id}:${dia}`] ?? false) }))
              }
              onEliminar={async () => {
                const ok = await confirmar({
                  mensaje: t("aus.confirmEliminar"),
                  confirmarTexto: t("comun.eliminar"),
                  peligro: true,
                });
                if (ok) eliminarSemana(s.id);
              }}
              onMarcarClase={(dia, clave, estado) => setRegistro(s.id, dia, clave, estado)}
              onFeriado={(dia) => alternarFeriado(s.id, dia, clavesDeDia(horario, dia).map((c) => c.clave))}
            />
          ))}
        </div>
      )}

      <VolverInicio alNavegar={alNavegar} />
    </div>
  );
}

function LimiteCard({
  l,
  t,
}: {
  l: LimiteAsistencia;
  t: (clave: string, ...args: (string | number)[]) => string;
}) {
  const color = colorLimite(l.estado);
  return (
    <div className="rounded-lg bg-card2 px-3 py-2">
      <div className="flex items-center gap-2">
        <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorDeMateria(l.materia) }} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{l.materia}</span>
        <span className="shrink-0 text-[10px] text-sub">
          {l.creditos} {t("cal.creditos")} · {t("aus.limites.horasSemana", redondear(l.horasSemanales, 2))}
        </span>
        <LimiteBadge estado={l.estado} t={t} />
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-borde">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, l.porcentaje)}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <span className="w-14 shrink-0 text-right text-[11px] font-bold" style={{ color }}>
          {redondear(l.porcentaje, 1)}%
        </span>
      </div>
      <p className="mt-1 text-[10px] text-sub">
        {t("aus.limites.faltas", redondear(l.horasFalta, 1), redondear(l.horasSemestre, 1))}
      </p>
      <p className="text-[10px] text-sub">
        {t("aus.limites.hasta", redondear(l.horasParaBaja, 1), redondear(l.horasParaPerdida, 1))}
      </p>
    </div>
  );
}

function LimiteBadge({
  estado,
  t,
}: {
  estado: EstadoLimiteAsistencia;
  t: (clave: string, ...args: (string | number)[]) => string;
}) {
  const texto =
    estado === "baja"
      ? t("aus.limites.baja")
      : estado === "perdida"
        ? t("aus.limites.perdida")
        : t("aus.limites.ok");
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
      style={{ backgroundColor: colorLimite(estado) }}
    >
      {texto}
    </span>
  );
}

function colorLimite(e: EstadoLimiteAsistencia): string {
  if (e === "baja") return "#F59E0B";
  if (e === "perdida") return "#EF4444";
  return "#10B981";
}

function Titulo({ alNavegar }: { alNavegar: (v: Vista) => void }) {
  const { t } = useAjustes();
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <h1 className="text-xl font-bold">{t("aus.titulo")}</h1>
        <p className="mt-0.5 text-xs text-sub">{t("aus.sub")}</p>
      </div>
      <VolverInicio alNavegar={alNavegar} />
    </div>
  );
}

function Resumen({ valor, etiqueta, color }: { valor: number; etiqueta: string; color: string }) {
  return (
    <div className="rounded-xl border border-borde bg-card p-3 text-center">
      <p className="text-xl font-bold" style={{ color }}>{valor}</p>
      <p className="text-[11px] font-semibold text-sub">{etiqueta}</p>
    </div>
  );
}

function NormaLegend({ colores }: { colores: Colores }) {
  const { t } = useAjustes();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-borde bg-card px-3 py-2 text-[11px] text-sub">
      <span className="flex items-center gap-1.5"><i className="h-4 w-4 rounded-md border border-borde" /> {t("aus.sinMarcar")}</span>
      <span className="flex items-center gap-1.5"><i className="h-4 w-4 rounded-md" style={{ backgroundColor: colores.asistPresente }} /> {t("aus.completo")}</span>
      <span className="flex items-center gap-1.5"><i className="h-4 w-4 rounded-md" style={{ backgroundColor: colores.asistParcial }} /> {t("aus.mixto")}</span>
      <span className="flex items-center gap-1.5"><i className="h-4 w-4 rounded-md" style={{ backgroundColor: colores.asistAusencia }} /> {t("aus.falta")}</span>
      <span className="flex items-center gap-1.5"><i className="h-4 w-4 rounded-md" style={{ backgroundColor: colores.asistFeriado }} /> {t("aus.feriado")}</span>
    </div>
  );
}

function FiltroChip({
  activo,
  color,
  onClick,
  children,
}: {
  activo: boolean;
  color: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        activo ? "border-transparent text-white" : "border-borde text-sub hover:text-tinta"
      }`}
      style={activo ? { backgroundColor: color } : undefined}
    >
      {children}
    </button>
  );
}

function aMin(h: string): number {
  const m = h.replace(/\./g, "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return 0;
  let hh = parseInt(m[1], 10);
  if (/PM/i.test(h) && hh !== 12) hh += 12;
  if (/AM/i.test(h) && hh === 12) hh = 0;
  return hh * 60 + parseInt(m[2], 10);
}

interface ClaveDia {
  hora: string;
  clave: string;
  materia: string;
  aula: string;
}

function clavesDeDia(horario: Horario, dia: Dia): ClaveDia[] {
  return (horario[dia] ?? [])
    .map((c) => ({
      hora: c.hora,
      clave: `${dia}|${c.hora}`,
      materia: nombreMateria(c.materia),
      aula: c.aula,
    }))
    .sort((a, b) => aMin(a.hora) - aMin(b.hora));
}

function colorDeEstado(e: EstadoDia, colores: Colores): string {
  if (e === "presente") return colores.asistPresente;
  if (e === "parcial") return colores.asistParcial;
  if (e === "falta") return colores.asistAusencia;
  if (e === "feriado") return colores.asistFeriado;
  return "#94A3B8";
}

function siguienteClase(estado: EstadoAsistencia): EstadoAsistencia {
  if (estado === null) return true;
  if (estado === true) return false;
  return null;
}

function SemanaCard({
  semana,
  horario,
  filtro,
  colores,
  diasCorto,
  locale,
  t,
  abierta,
  onToggle,
  diaAbierto,
  onToggleDia,
  onEliminar,
  onMarcarClase,
  onFeriado,
}: {
  semana: Semana;
  horario: Horario;
  filtro: Filtro;
  colores: Colores;
  diasCorto: string[];
  locale: string;
  t: (clave: string, ...args: (string | number)[]) => string;
  abierta: boolean;
  onToggle: () => void;
  diaAbierto: (dia: Dia) => boolean;
  onToggleDia: (dia: Dia) => void;
  onEliminar: () => void;
  onMarcarClase: (dia: Dia, clave: string, estado: EstadoAsistencia) => void;
  onFeriado: (dia: Dia) => void;
}) {
  const hayDias = DIAS.some((dia) =>
    clavesDeDia(horario, dia).some((c) => filtro === "__todas__" || c.materia === filtro)
  );
  return (
    <section className="overflow-hidden rounded-xl border border-borde bg-card">
      <header className="flex items-center gap-2 bg-card2 px-3 py-2.5">
        <button
          onClick={onToggle}
          aria-label={abierta ? t("aus.colapsar") : t("aus.expandir")}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <Chevron abierta={abierta} />
          <span className="min-w-0">
            <span className="block text-sm font-bold">{t("aus.semana", semana.numero)}</span>
            <span className="block text-[11px] text-sub">
              {t("aus.inicia", formatoFechaCorta(semana.inicio, locale))}
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {DIAS.map((dia) => {
            const claves = clavesDeDia(horario, dia).map((c) => c.clave);
            const e = claves.length ? estadoDeDia(semana.registros, dia, claves) : "sin";
            const color = e === "sin" ? "transparent" : colorDeEstado(e, colores);
            return (
              <i
                key={dia}
                title={`${diasCorto[DIAS.indexOf(dia) + 1]}: ${e ?? "–"}`}
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color, border: e === "sin" ? "1px solid #94A3B8" : "none" }}
              />
            );
          })}
        </div>
        <IconoBoton nombre="borrar" aria={t("comun.eliminar")} peligro onClick={onEliminar} />
      </header>

      {abierta && (
        <ul className="divide-y divide-borde">
          {DIAS.map((dia, idx) => {
            const todas = clavesDeDia(horario, dia);
            if (todas.length === 0) return null;
            const visibles = todas.filter((c) => filtro === "__todas__" || c.materia === filtro);
            if (visibles.length === 0) return null;
            const estado = estadoDeDia(semana.registros, dia, todas.map((c) => c.clave));
            return (
              <li key={dia}>
                <DiaRow
                  idx={idx}
                  fecha={sumarDiasISO(semana.inicio, idx)}
                  diasCorto={diasCorto}
                  colores={colores}
                  abierto={diaAbierto(dia)}
                  onToggle={() => onToggleDia(dia)}
                  estado={estado}
                  onFeriado={() => onFeriado(dia)}
                  onMarcarClase={(clave, est) => onMarcarClase(dia, clave, est)}
                  clases={visibles}
                  registros={semana.registros}
                  t={t}
                />
              </li>
            );
          })}
          {!hayDias && (
            <li className="px-4 py-3 text-xs text-sub">{t("aus.sinClasesFiltro")}</li>
          )}
        </ul>
      )}
    </section>
  );
}

function DiaRow({
  idx,
  fecha,
  diasCorto,
  colores,
  abierto,
  onToggle,
  estado,
  onFeriado,
  onMarcarClase,
  clases,
  registros,
  t,
}: {
  idx: number;
  fecha: string;
  diasCorto: string[];
  colores: Colores;
  abierto: boolean;
  onToggle: () => void;
  estado: EstadoDia;
  onFeriado: () => void;
  onMarcarClase: (clave: string, estado: EstadoAsistencia) => void;
  clases: ClaveDia[];
  registros: Record<string, EstadoAsistencia>;
  t: (clave: string, ...args: (string | number)[]) => string;
}) {
  const esFeriado = estado === "feriado";
  return (
    <div className="bg-card">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={onToggle}
          aria-label={abierto ? t("aus.colapsar") : t("aus.expandir")}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <div className="w-11 shrink-0">
            <p className="text-[11px] font-bold">{diasCorto[idx + 1]}</p>
            <p className="text-[10px] text-sub">{formatoFechaNumero(fecha)}</p>
          </div>
          <span
            className="grid h-3 w-3 shrink-0 rounded-full"
            style={{
              backgroundColor: esFeriado ? colores.asistFeriado : colorDeEstado(estado, colores),
              border: estado === "sin" ? "1px solid #94A3B8" : "none",
            }}
          />
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-tinta">
            {diaTexto(estado, t)}
          </span>
          <Chevron abierta={abierto} />
        </button>
        <button
          onClick={onFeriado}
          aria-pressed={esFeriado}
          className={`flex h-8 shrink-0 items-center gap-1 rounded-lg border px-2.5 text-xs font-bold transition-colors ${
            esFeriado
              ? "border-transparent text-white"
              : "border-borde text-sub hover:border-acento hover:text-tinta"
          }`}
          style={esFeriado ? { backgroundColor: colores.asistFeriado } : undefined}
        >
          <FeriadoSVG className="h-3.5 w-3.5" />
          {t("aus.feriado")}
        </button>
      </div>

      {abierto && (
        <ul className="border-t border-borde/60 bg-fondo px-3 py-1">
          {clases.map((c) => {
            const r = registros[c.clave] ?? null;
            return (
              <li key={c.clave} className="flex items-center gap-2 py-1.5 text-xs">
                <span className="w-[76px] shrink-0 font-mono text-[10px] text-sub">{c.hora}</span>
                <i
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: colorDeMateria(c.materia) }}
                />
                <span className="min-w-0 flex-1 truncate font-semibold text-tinta">{c.materia}</span>
                <span className="hidden shrink-0 text-[10px] uppercase text-sub sm:block">{t("hor.aula", c.aula)}</span>
                <EstadoBoton estado={r} onClick={() => onMarcarClase(c.clave, siguienteClase(r))} t={t} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function diaTexto(e: EstadoDia, t: (clave: string) => string): string {
  if (e === "presente") return t("aus.completo");
  if (e === "parcial") return t("aus.mixto");
  if (e === "falta") return t("aus.falta");
  if (e === "feriado") return t("aus.feriado");
  return t("aus.sinMarcar");
}

function EstadoBoton({
  estado,
  onClick,
  t,
}: {
  estado: EstadoAsistencia;
  onClick: () => void;
  t: (clave: string) => string;
}) {
  if (estado === true)
    return (
      <button onClick={onClick} className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#10B981] px-2.5 text-xs font-bold text-white">
        <CheckSVG /> {t("aus.asisti")}
      </button>
    );
  if (estado === false)
    return (
      <button onClick={onClick} className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#EF4444] px-2.5 text-xs font-bold text-white">
        <XSVG /> {t("aus.falta")}
      </button>
    );
  return (
    <button onClick={onClick} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-borde text-sub" aria-label={t("aus.sinMarcar")}>
      <span className="text-base leading-none">–</span>
    </button>
  );
}

function FeriadoSVG({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function Chevron({ abierta }: { abierta: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 shrink-0 text-sub transition-transform ${abierta ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckSVG() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
function XSVG() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}