import { useMemo, useState } from "react";
import { useCalificaciones } from "../hooks/useCalificaciones";
import { useHorario } from "../hooks/useHorario";
import { useMaterias } from "../hooks/useMaterias";
import { colorDeMateria, materiasActivas } from "../lib/materias";
import { redondear } from "../lib/storage";
import {
  colorDeLetra,
  indiceAcademico,
  letraDeNota,
  promSeccion,
  promedioMateria,
  promedioPonderado,
} from "../lib/utp";
import { useAjustes, useConfirmar } from "../contexto/Ajustes";
import { Chips, estilos, IconoBoton, Modal } from "./UI";
import type { Calificacion, SeccionNota, Vista } from "../types";
import { VolverInicio } from "./VolverInicio";

export function CalificacionesPage({ alNavegar }: { alNavegar: (v: Vista) => void }) {
  const { t, colores } = useAjustes();
  const { confirmar } = useConfirmar();
  const { horario } = useHorario();
  const materiasHook = useMaterias();
  const cal = useCalificaciones();
  const materiasAct = materiasActivas(horario, materiasHook.materias);
  const [seleccion, setSeleccion] = useState<string>("");
  const activa = seleccion || materiasAct[0]?.nombre || "";

  const [modalSeccion, setModalSeccion] = useState<null | { sec?: SeccionNota }>(null);
  const [modalNota, setModalNota] = useState<null | { secId: string; nota?: Calificacion }>(null);
  const [modalCreditos, setModalCreditos] = useState(false);

  const secciones = activa ? cal.seccionesDe(activa) : [];
  const prom = promedioMateria(secciones);
  const pesos = secciones.reduce((a, s) => a + s.porcentaje, 0);

  const creditos = useMemo(() => {
    const m: Record<string, number> = { ...cal.creditos };
    for (const ma of materiasAct) m[ma.nombre] = ma.creditos ?? 3;
    return m;
  }, [materiasAct, cal.creditos]);

  const indice = indiceAcademico(cal.porMateria, creditos);
  const ponderado = promedioPonderado(cal.porMateria, creditos);

  const fijarCreditosGlobal = (nombre: string, n: number) => {
    const existe = materiasHook.materias.some(
      (m) =>
        (m.nombre || "").trim().toUpperCase() === (nombre || "").trim().toUpperCase()
    );
    if (existe) materiasHook.fijarCreditos(nombre, n);
    else cal.fijarCreditos(nombre, n);
  };

  const disponible = (sec?: SeccionNota): number => {
    const otras = secciones
      .filter((s) => s.id !== sec?.id)
      .reduce((a, s) => a + s.porcentaje, 0);
    return Math.max(0, 100 - otras);
  };

  if (materiasAct.length === 0) {
    return (
      <div className="space-y-4">
        <Titulo alNavegar={alNavegar} />
        <section className="rounded-xl border border-borde bg-card p-6 text-center text-sm text-sub">
          {t("cal.sinMaterias", t("sec.horario"))}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Titulo alNavegar={alNavegar} />

      <section className="rounded-xl border border-borde bg-card p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-sub">{t("cal.indice")}</p>
        <div className="mt-1 flex flex-wrap items-start gap-6">
          <div>
            <p className="text-3xl font-bold" style={{ color: colores.calificaciones }}>
              {indice.indice === null ? "—" : redondear(indice.indice, 2)}
            </p>
            <p className="text-[11px] text-sub">{t("cal.indice.sub")}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-sub">{t("cal.ponderado")}</p>
            <p className="text-2xl font-bold" style={{ color: colores.calificaciones }}>
              {ponderado === null ? "—" : `${redondear(ponderado, 1)}%`}
            </p>
            <p className="text-[11px] text-sub">{t("cal.creditos")}: {indice.creditos}</p>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-sub">{t("cal.escala")}</p>
      </section>

      <section className="rounded-xl border border-borde bg-card p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sub">{t("cal.creditosSeccion")}</p>
          <button onClick={() => setModalCreditos(true)} className={`${estilos.boton} ${estilos.secundario} px-3 py-1.5 text-xs`}>
            {t("cal.ajustarCreditos")}
          </button>
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {materiasAct.map((m) => (
            <div key={m.nombre} className="flex items-center gap-2 rounded-lg bg-card2 px-3 py-1.5">
              <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold">{m.nombre}</span>
              <span className="shrink-0 text-xs font-bold">{creditos[m.nombre] ?? m.creditos ?? 3}</span>
            </div>
          ))}
        </div>
      </section>

      <Chips
        opciones={materiasAct.map((m) => ({ id: m.nombre, etiqueta: m.nombre }))}
        seleccion={activa}
        onChange={setSeleccion}
        color={(v) => colorDeMateria(v)}
      />

      <section className="rounded-xl border border-borde bg-card p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-sub">{t("cal.resumen")}</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold" style={{ color: colorDeMateria(activa) }}>
              {prom.promedio === null ? "—" : redondear(prom.promedio, 2)}
            </p>
            {prom.promedio !== null && (
              <span
                className="grid h-8 w-8 place-items-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: colorDeLetra(letraDeNota(prom.promedio)) }}
                title={t("cal.letra")}
              >
                {letraDeNota(prom.promedio)}
              </span>
            )}
          </div>
          <button onClick={() => setModalSeccion({})} className={`${estilos.boton} ${estilos.primario}`}>
            {t("cal.seccion")}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-sub">{t("cal.pesos", pesos)}</p>
      </section>

      {pesos > 100 && (
        <div className="rounded-xl border border-amber-400/60 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          {t("cal.avisoPesos")}
        </div>
      )}

      <p className="text-[11px] font-semibold uppercase tracking-wide text-sub">{t("cal.seccionesTitulo")}</p>

      {secciones.length === 0 && (
        <section className="rounded-xl border border-dashed border-borde bg-card p-6 text-center text-sm text-sub">
          {t("cal.sinSecciones")}
        </section>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
      {secciones.map((s) => (
        <SeccionCard
          key={s.id}
          seccion={s}
          color={colorDeMateria(activa)}
          onEditar={() => setModalSeccion({ sec: s })}
          onEliminar={async () => {
            const ok = await confirmar({
              mensaje: t("cal.confirmSeccion", s.nombre),
              confirmarTexto: t("comun.eliminar"),
              peligro: true,
            });
            if (ok) cal.eliminarSeccion(activa, s.id);
          }}
          onAgregarNota={() => setModalNota({ secId: s.id })}
          onEditarNota={(n) => setModalNota({ secId: s.id, nota: n })}
          onEliminarNota={async (id) => {
            const ok = await confirmar({
              mensaje: t("cal.confirmNota"),
              confirmarTexto: t("comun.eliminar"),
              peligro: true,
            });
            if (ok) cal.eliminarCalificacion(activa, s.id, id);
          }}
        />
      ))}
      </div>

      {modalSeccion && (
        <SeccionModal
          materia={activa}
          sec={modalSeccion.sec}
          disponible={disponible(modalSeccion.sec)}
          onCerrar={() => setModalSeccion(null)}
          onGuardar={(nombre, pct) => {
            if (modalSeccion.sec) cal.editarSeccion(activa, modalSeccion.sec.id, nombre, pct);
            else cal.agregarSeccion(activa, nombre, pct);
            setModalSeccion(null);
          }}
        />
      )}

      {modalNota && (
        <NotaModal
          nota={modalNota.nota}
          onCerrar={() => setModalNota(null)}
          onGuardar={(nombre, valor, extra) => {
            if (modalNota.nota)
              cal.editarCalificacion(activa, modalNota.secId, modalNota.nota.id, nombre, valor, extra);
            else cal.agregarCalificacion(activa, modalNota.secId, nombre, valor, extra);
            setModalNota(null);
          }}
        />
      )}

      {modalCreditos && (
        <CreditosModal
          materias={materiasAct.map((m) => m.nombre)}
          creditos={creditos}
          onCerrar={() => setModalCreditos(false)}
          onGuardar={fijarCreditosGlobal}
        />
      )}

      <VolverInicio alNavegar={alNavegar} />
    </div>
  );
}

function Titulo({ alNavegar }: { alNavegar: (v: Vista) => void }) {
  const { t } = useAjustes();
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <h1 className="text-xl font-bold">{t("cal.titulo")}</h1>
        <p className="mt-0.5 text-xs text-sub">{t("cal.sub")}</p>
      </div>
      <VolverInicio alNavegar={alNavegar} />
    </div>
  );
}

function SeccionCard({
  seccion,
  color,
  onEditar,
  onEliminar,
  onAgregarNota,
  onEditarNota,
  onEliminarNota,
}: {
  seccion: SeccionNota;
  color: string;
  onEditar: () => void;
  onEliminar: () => void;
  onAgregarNota: () => void;
  onEditarNota: (n: Calificacion) => void;
  onEliminarNota: (id: string) => void;
}) {
  const { t } = useAjustes();
  const prom = promSeccion(seccion);
  return (
    <section className="rounded-xl border border-borde bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="truncate text-sm font-bold">{seccion.nombre}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-md px-2 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: color }}>
            {seccion.porcentaje}%
          </span>
          <span className="text-sm font-bold" style={{ color }}>
            {prom === null ? "–" : redondear(prom, 2)}
          </span>
          <IconoBoton nombre="editar" aria={t("cal.editarSeccion")} onClick={onEditar} />
          <IconoBoton nombre="borrar" aria={t("comun.eliminar")} peligro onClick={onEliminar} />
        </div>
      </div>

      {seccion.calificaciones.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {seccion.calificaciones.map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded-lg bg-card2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.nombre}</p>
                <BarraNota valor={c.nota} color={color} />
              </div>
              <span className="shrink-0 text-sm font-bold" style={{ color: colorNota(c.nota) }}>
                {redondear(c.nota, 1)}
                {c.extra && <span className="ml-0.5 text-[9px] font-bold text-amber-500">+</span>}
              </span>
              <div className="flex shrink-0 gap-1">
                <IconoBoton nombre="editar" aria={t("cal.editarCal")} onClick={() => onEditarNota(c)} />
                <IconoBoton nombre="borrar" aria={t("comun.eliminar")} peligro onClick={() => onEliminarNota(c.id)} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-sub">{t("cal.sinNotas")}</p>
      )}

      <button onClick={onAgregarNota} className={`${estilos.boton} ${estilos.secundario} mt-3 w-full`}>
        {t("cal.agregarCal")}
      </button>
    </section>
  );
}

function BarraNota({ valor, color }: { valor: number; color: string }) {
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-borde">
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, valor))}%`, backgroundColor: color }} />
    </div>
  );
}

function colorNota(n: number): string {
  return n >= 60 ? "#10B981" : "#EF4444";
}

function SeccionModal({
  materia,
  sec,
  disponible,
  onCerrar,
  onGuardar,
}: {
  materia: string;
  sec?: SeccionNota;
  disponible: number;
  onCerrar: () => void;
  onGuardar: (nombre: string, porcentaje: number) => void;
}) {
  const { t } = useAjustes();
  const { notificar } = useConfirmar();
  const [nombre, setNombre] = useState(sec?.nombre ?? "");
  const [pct, setPct] = useState(sec ? String(sec.porcentaje) : "");

  const enviar = () => {
    if (!nombre.trim() || pct.trim() === "") {
      void notificar(t("comun.camposReq"));
      return;
    }
    const p = parseFloat(pct);
    if (Number.isNaN(p)) {
      void notificar(t("comun.camposReq"));
      return;
    }
    if (p > disponible) {
      void notificar(t("cal.pesosExcedido", disponible));
      return;
    }
    onGuardar(nombre.trim(), Math.max(0, Math.min(disponible, p)));
  };

  return (
    <Modal titulo={sec ? t("cal.editarSeccion") : t("cal.nuevaSeccion")} onCerrar={onCerrar}>
      <p className="mb-3 text-xs text-sub">{t("cal.paraMateria", materia)}</p>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t("cal.nombre")}</label>
          <input className={estilos.inputClase} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t("cal.placeholder.seccion")} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t("cal.porcentaje")}</label>
          <input type="number" min={0} max={disponible} step="0.1" className={estilos.inputClase} value={pct} onChange={(e) => setPct(e.target.value)} placeholder={t("cal.placeholder.pct")} />
          <p className="mt-1 text-[11px] text-sub">{t("cal.pesosDisp", disponible)}</p>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onCerrar} className={`${estilos.boton} ${estilos.secundario}`}>{t("comun.cancelar")}</button>
          <button onClick={enviar} className={`${estilos.boton} ${estilos.primario}`}>
            {sec ? t("comun.guardar") : t("cal.crearSeccion")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function NotaModal({
  nota,
  onCerrar,
  onGuardar,
}: {
  nota?: Calificacion;
  onCerrar: () => void;
  onGuardar: (nombre: string, valor: number, extra: boolean) => void;
}) {
  const { t } = useAjustes();
  const { notificar } = useConfirmar();
  const [nombre, setNombre] = useState(nota?.nombre ?? "");
  const [val, setVal] = useState(nota ? String(nota.nota) : "");
  const [extra, setExtra] = useState(nota?.extra ?? false);
  const max = extra ? 150 : 100;

  const enviar = () => {
    if (!nombre.trim() || val.trim() === "") {
      void notificar(t("comun.camposReq"));
      return;
    }
    const n = parseFloat(val);
    if (Number.isNaN(n)) {
      void notificar(t("comun.camposReq"));
      return;
    }
    onGuardar(nombre.trim(), Math.max(0, Math.min(max, n)), extra);
  };

  return (
    <Modal titulo={nota ? t("cal.editarCal") : t("cal.nuevaCal")} onCerrar={onCerrar}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t("cal.nombre")}</label>
          <input className={estilos.inputClase} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t("cal.placeholder.cal")} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t("cal.nota")}</label>
          <input type="number" min={0} max={max} step="0.5" className={estilos.inputClase} value={val} onChange={(e) => setVal(e.target.value)} placeholder={t("cal.placeholder.nota")} />
        </div>
        <button
          onClick={() => setExtra((x) => !x)}
          className={`${estilos.boton} w-full ${extra ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : estilos.secundario}`}
        >
          {extra ? t("cal.quitarExtra") : t("cal.puntosExtra")}
        </button>
        {extra && <p className="text-[11px] text-sub">{t("cal.notaExtra")}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onCerrar} className={`${estilos.boton} ${estilos.secundario}`}>{t("comun.cancelar")}</button>
          <button onClick={enviar} className={`${estilos.boton} ${estilos.primario}`}>
            {nota ? t("comun.guardar") : t("comun.añadir")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreditosModal({
  materias,
  creditos,
  onCerrar,
  onGuardar,
}: {
  materias: string[];
  creditos: Record<string, number>;
  onCerrar: () => void;
  onGuardar: (materia: string, n: number) => void;
}) {
  const { t } = useAjustes();
  const [valores, setValores] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const nombre of materias) m[nombre] = String(creditos[nombre] ?? 3);
    return m;
  });

  const guardar = () => {
    for (const [nombre, str] of Object.entries(valores)) {
      const n = parseInt(str, 10);
      onGuardar(nombre, Number.isNaN(n) ? 0 : Math.max(0, Math.min(30, n)));
    }
    onCerrar();
  };

  return (
    <Modal titulo={t("cal.ajustarCreditos")} onCerrar={onCerrar}>
      <p className="mb-3 text-xs text-sub">{t("cal.indice.sub")}</p>
      <div className="space-y-2">
        {materias.map((nombre) => (
          <div key={nombre} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{nombre}</span>
            <input
              type="number"
              min={0}
              max={30}
              step="1"
              className={`${estilos.inputClase} w-20`}
              value={valores[nombre]}
              onChange={(e) => setValores((x) => ({ ...x, [nombre]: e.target.value }))}
              aria-label={`${t("cal.creditos")} ${nombre}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-3">
        <button onClick={onCerrar} className={`${estilos.boton} ${estilos.secundario}`}>{t("comun.cancelar")}</button>
        <button onClick={guardar} className={`${estilos.boton} ${estilos.primario}`}>{t("comun.guardar")}</button>
      </div>
    </Modal>
  );
}