import { useState } from "react";
import { useMaterias } from "../hooks/useMaterias";
import { useHorario } from "../hooks/useHorario";
import { materiasActivas, PALETA_MATERIAS } from "../lib/materias";
import { useAjustes, useConfirmar } from "../contexto/Ajustes";
import { estilos, IconoBoton, Modal } from "./UI";
import { VolverInicio } from "./VolverInicio";
import type { Materia, Vista } from "../types";

export function MateriasPage({ alNavegar }: { alNavegar: (v: Vista) => void }) {
  const { t } = useAjustes();
  const { confirmar } = useConfirmar();
  const { materias, agregarMateria, editarMateria, eliminarMateria } = useMaterias();
  const { horario } = useHorario();
  const activas = materiasActivas(horario, materias);
  const [form, setForm] = useState<null | { mat?: Materia }>(null);

  const guardar = (datos: Materia) => {
    if (form?.mat) editarMateria(form.mat.nombre, datos);
    else agregarMateria(datos);
    setForm(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{t("mat.titulo")}</h1>
          <p className="mt-0.5 text-xs text-sub">{t("mat.sub")}</p>
        </div>
        <VolverInicio alNavegar={alNavegar} />
      </div>

      <section className="flex items-center justify-between gap-3 rounded-xl border border-borde bg-card p-4">
        <div>
          <p className="text-sm font-bold">{t("mat.catalogo")}</p>
          <p className="text-xs text-sub">
            {activas.length} · {activas.reduce((a, m) => a + m.horas, 0)} {t("stat.clases")}
          </p>
        </div>
        <button onClick={() => setForm({})} className={`${estilos.boton} ${estilos.primario} shrink-0`}>
          {t("mat.añadir")}
        </button>
      </section>

      {activas.length === 0 ? (
        <section className="rounded-xl border border-dashed border-borde bg-card p-6 text-center text-sm text-sub">
          {t("mat.sinMaterias")}
        </section>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activas.map((m) => {
            const enCatalogo = materias.some(
              (x) => (x.nombre || "").trim() === m.nombre
            );
            return (
              <section key={m.nombre} className="rounded-xl border border-borde bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: m.color }} />
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold">{m.nombre}</h3>
                      <p className="text-[11px] text-sub">
                        {m.horas} {t("stat.clases")} · {m.creditos ?? 3} {t("cal.creditos").toLowerCase()}
                        {m.profesor ? ` · ${m.profesor}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <IconoBoton nombre="editar" aria={t("mat.editar")} onClick={() => setForm({ mat: { nombre: m.nombre, color: m.color, creditos: m.creditos, profesor: m.profesor } })} />
                    <IconoBoton
                      nombre="borrar"
                      aria={t("comun.eliminar")}
                      peligro
                      onClick={async () => {
                        const ok = await confirmar({
                          mensaje: t("mat.confirmEliminar", m.nombre),
                          confirmarTexto: t("comun.eliminar"),
                          peligro: true,
                        });
                        if (ok) eliminarMateria(m.nombre);
                      }}
                    />
                  </div>
                </div>
                {!enCatalogo && (
                  <p className="mt-2 rounded-md bg-card2 px-2 py-1 text-[10px] font-semibold text-sub">
                    {t("mat.desdeHorario")}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}

      <section className="rounded-xl border border-borde bg-card2 p-4 text-center">
        <p className="text-xs text-sub">{t("mat.aviso")}</p>
      </section>

      {form && (
        <MateriaModal
          mat={form.mat}
          existentes={activas.map((a) => a.nombre)}
          onCerrar={() => setForm(null)}
          onGuardar={guardar}
        />
      )}

      <VolverInicio alNavegar={alNavegar} />
    </div>
  );
}

function MateriaModal({
  mat,
  existentes,
  onCerrar,
  onGuardar,
}: {
  mat?: Materia;
  existentes: string[];
  onCerrar: () => void;
  onGuardar: (m: Materia) => void;
}) {
  const { t } = useAjustes();
  const { notificar } = useConfirmar();
  const [nombre, setNombre] = useState(mat?.nombre ?? "");
  const [color, setColor] = useState(mat?.color ?? "");
  const [creditos, setCreditos] = useState(mat ? String(mat.creditos ?? 3) : "3");
  const [profesor, setProfesor] = useState(mat?.profesor ?? "");

  const enviar = () => {
    const n = nombre.trim();
    if (!n) {
      void notificar(t("comun.camposReq"));
      return;
    }
    const duplicado = existentes.some(
      (e) => e.toUpperCase() === n.toUpperCase() && e !== mat?.nombre
    );
    if (duplicado) {
      void notificar(t("mat.yaExiste"));
      return;
    }
    const cr = parseInt(creditos, 10);
    onGuardar({
      nombre: n,
      color: color || undefined,
      creditos: Number.isNaN(cr) ? 3 : Math.max(1, Math.min(30, cr)),
      profesor: profesor.trim() || undefined,
    });
  };

  return (
    <Modal titulo={mat ? t("mat.editar") : t("mat.añadir")} onCerrar={onCerrar}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t("mat.nombre")}</label>
          <input className={estilos.inputClase} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t("mat.placeholder.nombre")} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t("mat.color")}</label>
          <div className="flex flex-wrap gap-1.5">
            {PALETA_MATERIAS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={c}
                className="h-7 w-7 rounded-full transition-transform"
                style={{
                  backgroundColor: c,
                  outline: color === c ? "2px solid var(--c-acento, #2E7CF6)" : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex-1 text-xs font-semibold text-sub">{t("mat.color.personalizado")}</span>
            <input
              type="color"
              value={color || "#2E7CF6"}
              onChange={(e) => setColor(e.target.value)}
              aria-label={t("mat.color.personalizado")}
              className="h-8 w-12 cursor-pointer rounded-lg border border-borde bg-card p-0.5"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-sub">{t("mat.creditos")}</label>
            <input type="number" min={1} max={30} step="1" className={estilos.inputClase} value={creditos} onChange={(e) => setCreditos(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-sub">{t("mat.profesor")}</label>
            <input className={estilos.inputClase} value={profesor} onChange={(e) => setProfesor(e.target.value)} placeholder={t("mat.placeholder.profesor")} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onCerrar} className={`${estilos.boton} ${estilos.secundario}`}>{t("comun.cancelar")}</button>
          <button onClick={enviar} className={`${estilos.boton} ${estilos.primario}`}>
            {mat ? t("comun.guardar") : t("mat.crear")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
