import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAjustes, useConfirmar } from "../contexto/Ajustes";
import { useHorario } from "../hooks/useHorario";
import { useMaterias } from "../hooks/useMaterias";
import { useTareas, type TareaDatos } from "../hooks/useTareas";
import { coloresDeMaterias, materiasActivas } from "../lib/materias";
import { solicitarPermiso, tienePermiso } from "../lib/notificaciones";
import { estadoTarea, fechaLimite, type EstadoTarea } from "../lib/tareas";
import { formatoFechaCorta, isoHoy } from "../lib/fechas";
import { estilos, IconoBoton, Modal } from "./UI";
import { VolverInicio } from "./VolverInicio";
import type { Tarea, TipoRecordatorio, Vista } from "../types";

type Filtro = "__todas__" | string;

const COLOR_ESTADO: Record<EstadoTarea, string> = {
  pendiente: "#94A3B8",
  aTiempo: "#10B981",
  tarde: "#F59E0B",
  vencida: "#EF4444",
};

export function TareasPage({ alNavegar }: { alNavegar: (v: Vista) => void }) {
  const { t, locale, colores } = useAjustes();
  const { confirmar, notificar } = useConfirmar();
  const { horario } = useHorario();
  const { materias: catalogo } = useMaterias();
  const {
    tareas,
    crearTarea,
    editarTarea,
    eliminarTarea,
    marcarCompletada,
    alternarItemChecklist,
    agregarItemChecklist,
    eliminarItemChecklist,
    reprogramar,
  } = useTareas();

  const materias = materiasActivas(horario, catalogo);
  const mapaColores = useMemo(
    () => coloresDeMaterias(horario, catalogo),
    [horario, catalogo]
  );
  const [filtro, setFiltro] = useState<Filtro>("__todas__");
  const [modal, setModal] = useState<null | { tarea?: Tarea }>(null);
  const [permiso, setPermiso] = useState<boolean | null>(null);

  useEffect(() => {
    let activo = true;
    void tienePermiso().then((ok) => {
      if (activo) setPermiso(ok);
    });
    return () => {
      activo = false;
    };
  }, []);

  const resumen = useMemo(() => {
    const r = { pendientes: 0, aTiempo: 0, tarde: 0, vencidas: 0 };
    for (const x of tareas) {
      const e = estadoTarea(x);
      if (e === "pendiente") r.pendientes++;
      else if (e === "aTiempo") r.aTiempo++;
      else if (e === "tarde") r.tarde++;
      else r.vencidas++;
    }
    return r;
  }, [tareas]);

  const visibles = useMemo(
    () =>
      [...tareas]
        .filter((x) => filtro === "__todas__" || x.materia === filtro)
        .sort(
          (a, b) => fechaLimite(a).getTime() - fechaLimite(b).getTime()
        ),
    [tareas, filtro]
  );

  const activarRecordatorios = async () => {
    const ok = await tienePermiso();
    if (ok) {
      reprogramar();
      return;
    }
    const concedido = await solicitarPermiso();
    if (concedido) {
      setPermiso(true);
      reprogramar();
      await notificar(t("tarea.notif.activadas"));
    } else {
      setPermiso(false);
      await notificar(t("tarea.notif.denegado"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{t("tarea.titulo")}</h1>
          <p className="mt-0.5 text-xs text-sub">{t("tarea.sub")}</p>
        </div>
        <VolverInicio alNavegar={alNavegar} />
      </div>

      {permiso === false && (
        <button
          onClick={activarRecordatorios}
          className="w-full rounded-xl border border-dashed px-4 py-2.5 text-xs font-semibold"
          style={{
            borderColor: colores.tareas + "88",
            color: colores.tareas,
            backgroundColor: colores.tareas + "11",
          }}
        >
          {t("tarea.notif.banner")}
        </button>
      )}

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Resumen
          valor={resumen.pendientes}
          etiqueta={t("tarea.stat.pendientes")}
          color={COLOR_ESTADO.pendiente}
        />
        <Resumen
          valor={resumen.aTiempo}
          etiqueta={t("tarea.stat.aTiempo")}
          color={COLOR_ESTADO.aTiempo}
        />
        <Resumen
          valor={resumen.tarde}
          etiqueta={t("tarea.stat.tarde")}
          color={COLOR_ESTADO.tarde}
        />
        <Resumen
          valor={resumen.vencidas}
          etiqueta={t("tarea.stat.falladas")}
          color={COLOR_ESTADO.vencida}
        />
      </section>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <ChipFiltro
            activo={filtro === "__todas__"}
            color="#2E7CF6"
            onClick={() => setFiltro("__todas__")}
          >
            {t("tarea.todas")}
          </ChipFiltro>
          {materias.map((m) => (
            <ChipFiltro
              key={m.nombre}
              activo={filtro === m.nombre}
              color={m.color}
              onClick={() => setFiltro(m.nombre)}
            >
              {m.nombre}
            </ChipFiltro>
          ))}
        </div>
        <button
          onClick={() => setModal({})}
          className={`${estilos.boton} ${estilos.primario} shrink-0`}
        >
          {t("tarea.nueva")}
        </button>
      </div>

      {materias.length === 0 && (
        <section className="rounded-xl border border-borde bg-card p-6 text-center text-sm text-sub">
          {t("tarea.sinMaterias", t("sec.horario"))}
        </section>
      )}

      {visibles.length === 0 ? (
        <section className="rounded-xl border border-dashed border-borde bg-card p-6 text-center text-sm text-sub">
          {filtro === "__todas__" ? t("tarea.sinTareas") : t("tarea.sinTareasFiltro")}
        </section>
      ) : (
        <div className="space-y-3">
          {visibles.map((x) => (
            <TareaCard
              key={x.id}
              tarea={x}
              locale={locale}
              colorMateria={(nom) => mapaColores.get(nom) || "#2E7CF6"}
              onToggle={() => marcarCompletada(x.id, !x.completada)}
              onAlternarItem={(itemId) => alternarItemChecklist(x.id, itemId)}
              onAgregarItem={(texto) => agregarItemChecklist(x.id, texto)}
              onQuitarItem={(itemId) => eliminarItemChecklist(x.id, itemId)}
              onEditar={() => setModal({ tarea: x })}
              onEliminar={async () => {
                const ok = await confirmar({
                  mensaje: t("tarea.confirmEliminar", x.titulo),
                  confirmarTexto: t("comun.eliminar"),
                  peligro: true,
                });
                if (ok) eliminarTarea(x.id);
              }}
            />
          ))}
        </div>
      )}

      {modal && (
        <TareaModal
          materias={materias.map((m) => m.nombre)}
          tarea={modal.tarea}
          onCerrar={() => setModal(null)}
          onGuardar={(datos) => {
            if (modal.tarea) editarTarea(modal.tarea.id, datos);
            else crearTarea(datos);
            setModal(null);
          }}
        />
      )}

      <VolverInicio alNavegar={alNavegar} />
    </div>
  );
}

function Resumen({
  valor,
  etiqueta,
  color,
}: {
  valor: number;
  etiqueta: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-borde bg-card p-3 text-center">
      <p className="text-xl font-bold" style={{ color }}>{valor}</p>
      <p className="text-[11px] font-semibold text-sub">{etiqueta}</p>
    </div>
  );
}

function ChipFiltro({
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

function TareaCard({
  tarea,
  locale,
  colorMateria,
  onToggle,
  onAlternarItem,
  onAgregarItem,
  onQuitarItem,
  onEditar,
  onEliminar,
}: {
  tarea: Tarea;
  locale: string;
  colorMateria: (nombre: string) => string;
  onToggle: () => void;
  onAlternarItem: (itemId: string) => void;
  onAgregarItem: (texto: string) => void;
  onQuitarItem: (itemId: string) => void;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const { t } = useAjustes();
  const estado = estadoTarea(tarea);
  const color = colorMateria(tarea.materia);
  const [nuevoItem, setNuevoItem] = useState("");

  const agregar = () => {
    onAgregarItem(nuevoItem);
    setNuevoItem("");
  };

  return (
    <section className="rounded-xl border border-borde bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <EstadoBoton estado={estado} onClick={onToggle} t={t} />
          <div className="min-w-0">
            <h3
              className={`truncate text-sm font-bold ${
                tarea.completada ? "line-through opacity-70" : ""
              }`}
            >
              {tarea.titulo}
            </h3>
            {tarea.materia && (
              <span
                className="mt-0.5 inline-block max-w-full truncate rounded-md px-2 py-0.5 text-[11px] font-bold"
                style={{ backgroundColor: color + "22", color }}
              >
                {tarea.materia}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <IconoBoton nombre="editar" aria={t("tarea.editar")} onClick={onEditar} />
          <IconoBoton nombre="borrar" aria={t("comun.eliminar")} peligro onClick={onEliminar} />
        </div>
      </div>

      {tarea.descripcion && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-tinta/90">{tarea.descripcion}</p>
      )}

      <p className="mt-2 text-[11px] font-semibold text-sub">
        {formatoFechaCorta(tarea.fecha, locale)}
        {tarea.hora ? ` · ${tarea.hora}` : ""}
        {" — "}
        <EtiquetaRecordatorio tarea={tarea} t={t} />
      </p>

      {tarea.checklist.length > 0 && (
        <ul className="mt-2 space-y-1">
          {tarea.checklist.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <button
                onClick={() => onAlternarItem(c.id)}
                aria-pressed={c.hecha}
                className="grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors"
                style={{
                  borderColor: c.hecha ? "#10B981" : "var(--c-acento, #2E7CF6)",
                  backgroundColor: c.hecha ? "#10B981" : "transparent",
                }}
              >
                {c.hecha && (
                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span
                className={`min-w-0 flex-1 truncate text-xs ${
                  c.hecha ? "line-through opacity-70" : "font-semibold text-tinta"
                }`}
              >
                {c.texto}
              </span>
              <button
                onClick={() => onQuitarItem(c.id)}
                aria-label={t("comun.eliminar")}
                className="shrink-0 text-xs font-bold text-red-500"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex gap-1.5">
        <input
          className={estilos.inputClase}
          value={nuevoItem}
          onChange={(e) => setNuevoItem(e.target.value)}
          placeholder={t("tarea.placeholder.item")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregar();
            }
          }}
        />
        <button onClick={agregar} className={`${estilos.boton} ${estilos.secundario} shrink-0 px-3 text-xs`}>
          {t("tarea.agregarItem")}
        </button>
      </div>
    </section>
  );
}

function EtiquetaRecordatorio({
  tarea,
  t,
}: {
  tarea: Tarea;
  t: (clave: string, ...args: (string | number)[]) => string;
}) {
  if (tarea.tipoRecordatorio === "unaVez") return <>{t("tarea.recordatorio.unaVez")}</>;
  if (tarea.tipoRecordatorio === "repetir")
    return (
      <>
        {t("tarea.recordatorio.repetir")} ({tarea.repetirCadaMinutos ?? 30} min)
      </>
    );
  const horas = tarea.horasRecordatorio?.filter(Boolean) ?? [];
  return (
    <>
      {t("tarea.recordatorio.horas")}: {horas.join(", ") || "—"}
    </>
  );
}

function EstadoBoton({
  estado,
  onClick,
  t,
}: {
  estado: EstadoTarea;
  onClick: () => void;
  t: (clave: string) => string;
}) {
  const color = COLOR_ESTADO[estado];
  if (estado === "aTiempo" || estado === "tarde")
    return (
      <button
        onClick={onClick}
        className="flex h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-white"
        style={{ backgroundColor: color }}
      >
        <CheckSVG />
        {t(estado === "aTiempo" ? "tarea.aTiempo" : "tarea.tarde")}
      </button>
    );
  if (estado === "vencida")
    return (
      <button
        onClick={onClick}
        className="flex h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-white"
        style={{ backgroundColor: color }}
      >
        <XSVG />
        {t("tarea.vencida")}
      </button>
    );
  return (
    <button
      onClick={onClick}
      className="flex h-9 shrink-0 items-center gap-1 rounded-lg border-2 px-2.5 text-xs font-bold text-sub"
      style={{ borderColor: color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {t("tarea.pendiente")}
    </button>
  );
}

function TareaModal({
  materias,
  tarea,
  onCerrar,
  onGuardar,
}: {
  materias: string[];
  tarea?: Tarea;
  onCerrar: () => void;
  onGuardar: (datos: TareaDatos) => void;
}) {
  const { t } = useAjustes();
  const { notificar } = useConfirmar();
  const [titulo, setTitulo] = useState(tarea?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(tarea?.descripcion ?? "");
  const [materia, setMateria] = useState(tarea?.materia ?? materias[0] ?? "");
  const [fecha, setFecha] = useState(tarea?.fecha ?? isoHoy());
  const [hora, setHora] = useState(tarea?.hora ?? "");
  const [tipoRec, setTipoRec] = useState<TipoRecordatorio>(
    tarea?.tipoRecordatorio ?? "unaVez"
  );
  const [cada, setCada] = useState(tarea?.repetirCadaMinutos ?? 30);
  const [horas, setHoras] = useState<string[]>(
    tarea?.horasRecordatorio?.length ? [...tarea.horasRecordatorio] : [""]
  );

  const enviar = () => {
    if (!titulo.trim() || !fecha) {
      void notificar(t("comun.camposReq"));
      return;
    }
    onGuardar({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      materia,
      fecha,
      hora: hora.trim(),
      tipoRecordatorio: tipoRec,
      repetirCadaMinutos: tipoRec === "repetir" ? cada : undefined,
      horasRecordatorio: tipoRec === "horas" ? horas : undefined,
    });
  };

  return (
    <Modal titulo={tarea ? t("tarea.editar") : t("tarea.crear")} onCerrar={onCerrar}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t("tarea.tituloCampo")}</label>
          <input
            className={estilos.inputClase}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder={t("tarea.placeholder.titulo")}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t("tarea.descripcion")}</label>
          <textarea
            className={`${estilos.inputClase} min-h-20 resize-y`}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder={t("tarea.placeholder.desc")}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t("tarea.materia")}</label>
          <select
            className={estilos.inputClase}
            value={materia}
            onChange={(e) => setMateria(e.target.value)}
          >
            <option value="" disabled>—</option>
            {materias.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-sub">{t("tarea.fecha")}</label>
            <input
              type="date"
              className={estilos.inputClase}
              value={fecha}
              onChange={(e) => setFecha(e.target.value || isoHoy())}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-sub">{t("tarea.hora")}</label>
            <input
              type="time"
              className={estilos.inputClase}
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-sub">{t("tarea.recordatorio")}</p>
          <div className="flex flex-wrap gap-1.5">
            {(["unaVez", "repetir", "horas"] as TipoRecordatorio[]).map((tp) => (
              <button
                key={tp}
                onClick={() => setTipoRec(tp)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tipoRec === tp
                    ? "border-transparent text-white"
                    : "border-borde text-sub hover:text-tinta"
                }`}
                style={tipoRec === tp ? { backgroundColor: "var(--c-acento, #2E7CF6)" } : undefined}
              >
                {t(`tarea.recordatorio.${tp}`)}
              </button>
            ))}
          </div>

          {tipoRec === "repetir" && (
            <div className="mt-2">
              <label className="mb-1 block text-xs font-semibold text-sub">{t("tarea.repetirCada")}</label>
              <input
                type="number"
                min={5}
                step={5}
                className={estilos.inputClase}
                value={cada}
                onChange={(e) => setCada(Math.max(5, Number(e.target.value) || 30))}
              />
            </div>
          )}

          {tipoRec === "horas" && (
            <div className="mt-2 space-y-1.5">
              <p className="text-[11px] font-semibold text-sub">{t("tarea.horasRecordatorio")}</p>
              {horas.map((h, i) => (
                <div key={i} className="flex gap-1.5">
                  <input
                    type="time"
                    className={estilos.inputClase}
                    value={h}
                    onChange={(e) =>
                      setHoras((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))
                    }
                  />
                  <button
                    onClick={() => setHoras((xs) => xs.filter((_, j) => j !== i))}
                    className={`${estilos.boton} ${estilos.secundario} shrink-0 px-3 text-xs`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => setHoras((xs) => [...xs, ""])}
                className={`${estilos.boton} ${estilos.secundario} px-3 py-1.5 text-xs`}
              >
                {t("tarea.agregarHora")}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onCerrar} className={`${estilos.boton} ${estilos.secundario}`}>
            {t("comun.cancelar")}
          </button>
          <button onClick={enviar} className={`${estilos.boton} ${estilos.primario}`}>
            {tarea ? t("comun.guardar") : t("tarea.crear")}
          </button>
        </div>
      </div>
    </Modal>
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