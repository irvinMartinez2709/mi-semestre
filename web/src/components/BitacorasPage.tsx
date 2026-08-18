import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useBitacoras } from "../hooks/useBitacoras";
import { useHorario } from "../hooks/useHorario";
import { useMaterias } from "../hooks/useMaterias";
import { colorDeMateria, coloresDeMaterias, materiasActivas } from "../lib/materias";
import { formatoFechaCorta, isoDe, isoHoy } from "../lib/fechas";
import { uid } from "../lib/storage";
import { useAjustes, useConfirmar } from "../contexto/Ajustes";
import { estilos, IconoBoton, Modal } from "./UI";
import type { Adjunto, Bitacora, Vista } from "../types";
import { VolverInicio } from "./VolverInicio";

type Filtro = "__todas__" | string;

export function BitacorasPage({ alNavegar }: { alNavegar: (v: Vista) => void }) {
  const { t, locale } = useAjustes();
  const { confirmar } = useConfirmar();
  const { horario } = useHorario();
  const { materias: catalogo } = useMaterias();
  const { bitacoras, agregarBitacora, editarBitacora, eliminarBitacora } = useBitacoras();
  const materias = materiasActivas(horario, catalogo);
  const mapaColores = useMemo(
    () => coloresDeMaterias(horario, catalogo),
    [horario, catalogo]
  );
  const [filtro, setFiltro] = useState<Filtro>("__todas__");
  const [modal, setModal] = useState<null | { bit?: Bitacora }>(null);

  const visibles = [...bitacoras]
    .filter((b) => filtro === "__todas__" || b.materia === filtro)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{t("bit.titulo")}</h1>
          <p className="mt-0.5 text-xs text-sub">{t("bit.sub")}</p>
        </div>
        <VolverInicio alNavegar={alNavegar} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <ChipFiltro activo={filtro === "__todas__"} color="#2E7CF6" onClick={() => setFiltro("__todas__")}>
            {t("bit.todas")}
          </ChipFiltro>
          {materias.map((m) => (
            <ChipFiltro key={m.nombre} activo={filtro === m.nombre} color={m.color} onClick={() => setFiltro(m.nombre)}>
              {m.nombre}
            </ChipFiltro>
          ))}
        </div>
        <button onClick={() => setModal({})} className={`${estilos.boton} ${estilos.primario} shrink-0`}>
          {t("bit.nueva")}
        </button>
      </div>

      {materias.length === 0 && (
        <section className="rounded-xl border border-borde bg-card p-6 text-center text-sm text-sub">
          {t("bit.sinMaterias")}
        </section>
      )}

      {visibles.length === 0 ? (
        <section className="rounded-xl border border-dashed border-borde bg-card p-6 text-center text-sm text-sub">
          {t("bit.vacio")}
        </section>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((b) => (
            <BitacoraCard
              key={b.id}
              bit={b}
              locale={locale}
              color={mapaColores.get(b.materia) || colorDeMateria(b.materia)}
              onEditar={() => setModal({ bit: b })}
              onEliminar={async () => {
                const ok = await confirmar({
                  mensaje: t("bit.confirmEliminar", b.titulo),
                  confirmarTexto: t("comun.eliminar"),
                  peligro: true,
                });
                if (ok) eliminarBitacora(b.id);
              }}
            />
          ))}
        </div>
      )}

      {modal && (
        <BitacoraModal
          materias={materias.map((m) => m.nombre)}
          bit={modal.bit}
          onCerrar={() => setModal(null)}
          onGuardar={(datos) => {
            if (modal.bit) editarBitacora(modal.bit.id, datos);
            else agregarBitacora(datos);
            setModal(null);
          }}
        />
      )}

      <VolverInicio alNavegar={alNavegar} />
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

function BitacoraCard({
  bit,
  locale,
  color,
  onEditar,
  onEliminar,
}: {
  bit: Bitacora;
  locale: string;
  color: string;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const { t } = useAjustes();
  const imagenes = bit.adjuntos?.filter((a): a is Extract<Adjunto, { tipo: "imagen" }> => a.tipo === "imagen") ?? [];
  const enlaces = bit.adjuntos?.filter((a): a is Extract<Adjunto, { tipo: "enlace" }> => a.tipo === "enlace") ?? [];

  return (
    <section className="rounded-xl border border-borde bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: color + "22", color }}>
            {bit.materia}
          </span>
          <span className="rounded-md bg-card2 px-2 py-0.5 text-[11px] font-semibold text-sub">
            {formatoFechaCorta(bit.fecha, locale)}
          </span>
        </div>
        <div className="flex shrink-0 gap-1">
          <IconoBoton nombre="editar" aria={t("bit.editarB")} onClick={onEditar} />
          <IconoBoton nombre="borrar" aria={t("comun.eliminar")} peligro onClick={onEliminar} />
        </div>
      </div>
      <h3 className="mt-2 text-sm font-bold">{bit.titulo}</h3>
      {bit.contenido && <p className="mt-1 whitespace-pre-wrap text-sm text-tinta/90">{bit.contenido}</p>}

      {imagenes.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {imagenes.map((img) => (
            <a key={img.id} href={img.valor} target="_blank" rel="noreferrer" className="block">
              <img src={img.valor} alt={img.nombre ?? "imagen"} className="h-20 w-full rounded-lg border border-borde object-cover" />
            </a>
          ))}
        </div>
      )}

      {enlaces.length > 0 && (
        <ul className="mt-2 space-y-1">
          {enlaces.map((e) => (
            <li key={e.id}>
              <a
                href={e.valor}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-acento/10 px-2.5 py-1.5 text-xs font-semibold break-all"
                style={{ color: "var(--c-acento, #2E7CF6)" }}
              >
                <LinkSVG />
                {e.nombre || e.valor}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LinkSVG() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.5.6l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.6l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  );
}

interface DatosBitacora {
  fecha: string;
  materia: string;
  titulo: string;
  contenido: string;
  adjuntos: Adjunto[];
}

function BitacoraModal({
  materias,
  bit,
  onCerrar,
  onGuardar,
}: {
  materias: string[];
  bit?: Bitacora;
  onCerrar: () => void;
  onGuardar: (datos: DatosBitacora) => void;
}) {
  const { notificar } = useConfirmar();
  const tAjustes = useAjustes().t;
  const [fecha, setFecha] = useState(bit?.fecha ?? isoHoy());
  const [materia, setMateria] = useState(bit?.materia ?? materias[0] ?? "");
  const [titulo, setTitulo] = useState(bit?.titulo ?? "");
  const [contenido, setContenido] = useState(bit?.contenido ?? "");
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>(bit?.adjuntos ?? []);
  const [enlaceForm, setEnlaceForm] = useState(false);
  const [enlaceUrl, setEnlaceUrl] = useState("");
  const [enlaceNombre, setEnlaceNombre] = useState("");
  const refFile = useRef<HTMLInputElement>(null);

  const t2 = tAjustes;

  const agregarImagen = (file: File) => {
    if (file.size > 2_500_000) {
      void notificar(t2("bit.imagenGrande"));
      return;
    }
    const lector = new FileReader();
    lector.onload = () => {
      const valor = typeof lector.result === "string" ? lector.result : "";
      setAdjuntos((a) => [...a, { id: uid(), tipo: "imagen", nombre: file.name, valor }]);
    };
    lector.readAsDataURL(file);
  };

  const agregarEnlace = () => {
    const url = enlaceUrl.trim();
    if (!url) {
      void notificar(t2("bit.enlaceUrl"));
      return;
    }
    const completa = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    setAdjuntos((a) => [...a, { id: uid(), tipo: "enlace", nombre: enlaceNombre.trim() || completa, valor: completa }]);
    setEnlaceUrl("");
    setEnlaceNombre("");
    setEnlaceForm(false);
  };

  const quitar = (id: string) => setAdjuntos((a) => a.filter((x) => x.id !== id));

  const enviar = () => {
    if (!materia || !titulo.trim()) {
      void notificar(t2("comun.camposReq"));
      return;
    }
    onGuardar({ fecha, materia, titulo: titulo.trim(), contenido: contenido.trim(), adjuntos });
  };

  return (
    <Modal titulo={bit ? t2("bit.editarB") : t2("bit.nuevaB")} onCerrar={onCerrar}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t2("bit.fecha")}</label>
          <input type="date" className={estilos.inputClase} value={fecha} max={isoDe(new Date())} onChange={(e) => setFecha(e.target.value || isoHoy())} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t2("bit.materia")}</label>
          <select className={estilos.inputClase} value={materia} onChange={(e) => setMateria(e.target.value)}>
            <option value="" disabled>
              —
            </option>
            {materias.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t2("bit.form.titulo")}</label>
          <input className={estilos.inputClase} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={t2("bit.placeholder.titulo")} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t2("bit.contenido")}</label>
          <textarea className={`${estilos.inputClase} min-h-28 resize-y`} value={contenido} onChange={(e) => setContenido(e.target.value)} placeholder={t2("bit.placeholder.contenido")} />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-sub">{t2("bit.imagenes")}</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => refFile.current?.click()} className={`${estilos.boton} ${estilos.secundario} px-3 py-1.5 text-xs`}>
              {t2("bit.imagen")}
            </button>
            <button onClick={() => setEnlaceForm((v) => !v)} className={`${estilos.boton} ${estilos.secundario} px-3 py-1.5 text-xs`}>
              {t2("bit.enlace")}
            </button>
            <input ref={refFile} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) agregarImagen(f);
              e.target.value = "";
            }} />
          </div>

          {enlaceForm && (
            <div className="mt-2 space-y-2 rounded-lg bg-card2 p-2">
              <input className={estilos.inputClase} value={enlaceUrl} onChange={(e) => setEnlaceUrl(e.target.value)} placeholder="https://…" />
              <div className="flex gap-2">
                <input className={estilos.inputClase} value={enlaceNombre} onChange={(e) => setEnlaceNombre(e.target.value)} placeholder={t2("bit.enlaceTexto")} />
                <button onClick={agregarEnlace} className={`${estilos.boton} ${estilos.primario} shrink-0`}>{t2("comun.añadir")}</button>
              </div>
            </div>
          )}

          {adjuntos.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {adjuntos.map((a) => (
                <li key={a.id} className="flex items-center gap-2 rounded-lg bg-card2 px-2 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-tinta">
                    {a.tipo === "imagen" ? (a.nombre ?? "img") : a.nombre}
                  </span>
                  <button onClick={() => quitar(a.id)} className="shrink-0 text-xs font-bold text-red-500" aria-label={t2("bit.quitarAdjunto")}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onCerrar} className={`${estilos.boton} ${estilos.secundario}`}>{t2("comun.cancelar")}</button>
          <button onClick={enviar} className={`${estilos.boton} ${estilos.primario}`}>
            {bit ? t2("comun.guardar") : t2("bit.crearB")}
          </button>
        </div>
      </div>
    </Modal>
  );
}