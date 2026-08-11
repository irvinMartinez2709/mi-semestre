import { useEffect, useMemo, useState } from "react";
import { DIAS, aMinutos, claseActiva, diaDeHoy, hoyMinutos, nombreMateria } from "../lib/hora";
import { colorDeMateria, materiasDe } from "../lib/materias";
import { useHorario } from "../hooks/useHorario";
import { useAjustes, useConfirmar } from "../contexto/Ajustes";
import { estilos, IconoBoton, Modal } from "./UI";
import type { Clase, Dia, Vista } from "../types";
import { Icono } from "./Icono";
import { VolverInicio } from "./VolverInicio";

type EstadoCelda = "pasada" | "actual" | "futura";

function estadoDe(diaIdx: number, hora: string): EstadoCelda {
  const hoyDia = new Date().getDay();
  const diaReal = diaIdx + 1;
  if (diaReal < hoyDia) return "pasada";
  if (diaReal > hoyDia) return "futura";
  const ahora = hoyMinutos();
  const [i, f] = hora.split("-");
  const ini = aMinutos(i);
  const fin = aMinutos(f);
  if (ahora < ini) return "futura";
  if (ahora > fin) return "pasada";
  return "actual";
}

interface FormEstado {
  dia: Dia;
  clase?: Clase;
  indice?: number;
}

export function HorarioPage({ alNavegar }: { alNavegar: (v: Vista) => void }) {
  const { t, colores, dias } = useAjustes();
  const { confirmar } = useConfirmar();
  const { horario, agregarClase, editarClase, eliminarClase } = useHorario();
  const [form, setForm] = useState<FormEstado | null>(null);

  const franjas = useMemo(() => {
    const set = new Set<string>();
    for (const dia of DIAS) for (const c of horario[dia]) set.add(c.hora);
    return Array.from(set).sort((a, b) => aMinutos(a) - aMinutos(b));
  }, [horario]);

  const hoy = diaDeHoy();
  const activas = hoy ? claseActiva(horario[hoy], hoyMinutos()) : null;
  const total = DIAS.reduce((n, d) => n + horario[d].length, 0);

  const guardarClase = (clase: Clase) => {
    if (!form) return;
    if (form.clase && form.indice !== undefined) editarClase(form.dia, form.indice, clase);
    else agregarClase(form.dia, clase);
    setForm(null);
  };

  const eliminar = async (dia: Dia, i: number) => {
    const c = horario[dia][i];
    const ok = await confirmar({
      mensaje: t("hor.confirmEliminar", c.materia, dias[DIAS.indexOf(dia) + 1]),
      confirmarTexto: t("comun.eliminar"),
      peligro: true,
    });
    if (ok) eliminarClase(dia, i);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{t("hor.titulo")}</h1>
          <p className="mt-0.5 text-xs text-sub">
            {materiasDe(horario).length} · {total} · {t("stat.clases")}
          </p>
        </div>
        <VolverInicio alNavegar={alNavegar} />
      </div>

      {activas?.proxima && (
        <div
          className="flex items-center gap-3 rounded-xl border p-3.5"
          style={{ borderColor: colores.acento + "66" }}
        >
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white"
            style={{ backgroundColor: colores.acento }}
          >
            <Icono nombre="horario" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: colores.acento }}>
              {t("hor.siguiente")}
            </p>
            <p className="truncate font-semibold">{nombreMateria(activas.proxima.materia)}</p>
            <p className="text-xs text-sub">
              {activas.proxima.hora} · {t("hor.aula", activas.proxima.aula)}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-borde bg-card">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] table-fixed border-separate border-spacing-1">
          <colgroup>
            <col className="w-16 sm:w-20" />
            {DIAS.map((d) => (
              <col key={d} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="py-1 text-left text-[9px] font-semibold uppercase tracking-wide text-sub" />
              {DIAS.map((d, i) => {
                const esHoy = hoy === d;
                return (
                  <th key={d} className="p-0">
                    <div
                      className="overflow-hidden rounded-md px-0.5 py-1 text-center text-[9px] font-bold uppercase tracking-wide"
                      style={esHoy ? { backgroundColor: colores.acento, color: "#fff" } : undefined}
                    >
                      <span className={esHoy ? "block truncate" : "block truncate text-sub"}>{dias[i + 1].slice(0, 3)}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {franjas.map((hora) => (
              <tr key={hora}>
                <td className="whitespace-nowrap overflow-hidden py-1 pr-1 font-mono text-[9px] text-sub">
                  {hora.replace(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})(AM|PM)/i, "$1:$2–$3$5")}
                </td>
                {DIAS.map((dia, i) => {
                  const clase = horario[dia].find((c) => c.hora === hora);
                  return (
                    <td key={dia} className="p-0.5">
                      {clase ? (
                        <Celda clase={clase} estado={estadoDe(i, hora)} />
                      ) : (
                        <div className="min-h-11 rounded-md bg-card2/50" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-sub">
        <span className="flex items-center gap-1.5">
          <i className="h-3 w-3 rounded bg-card2 ring-1 ring-borde" /> {t("hor.pasada")}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-3 w-3 rounded" style={{ backgroundColor: colores.hoy }} /> {t("hor.actual")}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-3 w-3 rounded ring-1 ring-borde" style={{ backgroundColor: colores.futura + "44" }} />{" "}
          {t("hor.futura")}
        </span>
      </div>

      <section className="rounded-xl border border-borde bg-card p-4">
        <h2 className="mb-3 text-sm font-bold">{t("hor.gestionar")}</h2>
        <FormClase onGuardar={guardarClase} form={form} onCerrar={() => setForm(null)} />
        <div className="mt-4 space-y-4">
          {DIAS.map((dia, idx) => (
            <div key={dia}>
              <div className="flex items-center justify-between border-b border-borde pb-1.5">
                <h3 className="text-sm font-semibold">{dias[idx + 1]}</h3>
                <button onClick={() => setForm({ dia })} className={`${estilos.boton} ${estilos.secundario} px-3 py-1.5`}>
                  {t("hor.añadir")}
                </button>
              </div>
              {horario[dia].length === 0 ? (
                <p className="py-2 text-xs text-sub">{t("hor.sinClases")}</p>
              ) : (
                <ul>
                  {horario[dia].map((c, i) => (
                    <li key={`${c.hora}-${i}`} className="flex items-center gap-2 border-b border-borde/50 py-2 text-sm">
                      <span className="w-20 shrink-0 font-mono text-[10px] text-sub">{c.hora}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold" style={{ color: colorDeMateria(nombreMateria(c.materia)) }}>
                          {c.materia}
                        </p>
                        <p className="truncate text-[10px] text-sub">
                          {t("hor.aula", c.aula)} · {c.profesor?.trim() || "—"}
                        </p>
                      </div>
                      <span className="flex shrink-0 gap-1">
                        <IconoBoton nombre="editar" aria={t("hor.editar")} onClick={() => setForm({ dia, clase: c, indice: i })} />
                        <IconoBoton nombre="borrar" aria={t("comun.eliminar")} peligro onClick={() => eliminar(dia, i)} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <VolverInicio alNavegar={alNavegar} />
    </div>
  );
}

function Celda({ clase, estado }: { clase: Clase; estado: EstadoCelda }) {
  const { colores, tema } = useAjustes();
  const nombre = nombreMateria(clase.materia);
  if (estado === "actual") {
    return (
      <div className="min-h-11 rounded-md px-1 py-1 text-white" style={{ backgroundColor: colores.hoy }}>
        <p className="truncate text-[11px] font-bold">{nombre}</p>
        <p className="text-[9px] uppercase opacity-80">{clase.aula}</p>
      </div>
    );
  }
  if (estado === "pasada") {
    return (
      <div className="min-h-11 rounded-md bg-card2 px-1 py-1 opacity-60">
        <p className="truncate text-[11px] font-semibold text-sub">{nombre}</p>
        <p className="text-[9px] uppercase text-sub/80">{clase.aula}</p>
      </div>
    );
  }
  return (
    <div
      className="min-h-11 rounded-md px-1 py-1"
      style={{ backgroundColor: colores.futura + "55", borderLeft: `3px solid ${colores.futura}` }}
    >
      <p className="truncate text-[11px] font-bold" style={{ color: tema === "oscuro" ? "#F9FAFB" : "#1F2937" }}>
        {nombre}
      </p>
      <p className="text-[9px] uppercase text-sub">{clase.aula}</p>
    </div>
  );
}

function FormClase({
  form,
  onGuardar,
  onCerrar,
}: {
  form: FormEstado | null;
  onGuardar: (c: Clase) => void;
  onCerrar: () => void;
}) {
  const { t, dias } = useAjustes();
  const { horario } = useHorario();
  const { notificar } = useConfirmar();
  const existentes = useMemo(
    () => Array.from(new Set(DIAS.flatMap((d) => horario[d].map((c) => c.materia)))),
    [horario]
  );

  const [hora, setHora] = useState("");
  const [materia, setMateria] = useState("");
  const [aula, setAula] = useState("");
  const [profesor, setProfesor] = useState("");

  useEffect(() => {
    setHora(form?.clase?.hora ?? "");
    setMateria(form?.clase?.materia ?? "");
    setAula(form?.clase?.aula ?? "");
    setProfesor(form?.clase?.profesor ?? "");
  }, [form]);

  if (!form) return null;

  const enviar = () => {
    if (!hora.trim() || !materia.trim()) {
      void notificar(t("comun.camposReq"));
      return;
    }
    onGuardar({
      hora: hora.trim(),
      materia: materia.trim(),
      aula: aula.trim() || "—",
      profesor: profesor.trim(),
    });
  };

  return (
    <Modal titulo={form.clase ? t("hor.editar") : t("hor.añadir")} onCerrar={onCerrar}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t("hor.form.dia")}</label>
          <select className={estilos.inputClase} disabled={!!form.clase} value={form.dia} onChange={() => undefined}>
            <option value={form.dia}>{dias[DIAS.indexOf(form.dia) + 1]}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t("hor.form.hora")}</label>
          <input className={estilos.inputClase} value={hora} onChange={(e) => setHora(e.target.value)} placeholder={t("hor.placeholder.hora")} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t("hor.form.materia")}</label>
          <input className={estilos.inputClase} list="materias-conocidas" value={materia} onChange={(e) => setMateria(e.target.value)} placeholder={t("hor.placeholder.materia")} />
          <datalist id="materias-conocidas">
            {Array.from(new Set([...existentes, "SISTEMAS EMBEBI", "CIBERSEGURIDAD", "DESARROLLO WEB", "ESTA. Y PROB.", "MATEMÁTICA II"])).map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t("hor.form.aula")}</label>
          <input className={estilos.inputClase} value={aula} onChange={(e) => setAula(e.target.value)} placeholder={t("hor.placeholder.aula")} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-sub">{t("hor.form.profesor")}</label>
          <input className={estilos.inputClase} value={profesor} onChange={(e) => setProfesor(e.target.value)} placeholder={t("hor.placeholder.profesor")} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onCerrar} className={`${estilos.boton} ${estilos.secundario}`}>{t("comun.cancelar")}</button>
          <button onClick={enviar} className={`${estilos.boton} ${estilos.primario}`}>
            {form.clase ? t("comun.guardar") : t("comun.añadir")}
          </button>
        </div>
      </div>
    </Modal>
  );
}