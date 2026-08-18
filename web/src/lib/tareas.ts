import type { Tarea } from "../types";

export type EstadoTarea = "pendiente" | "aTiempo" | "tarde" | "vencida";

export function fechaLimite(t: Tarea): Date {
  const d = new Date(`${t.fecha}T00:00:00`);
  const [hPart = "", mPart = ""] = (t.hora || "").split(":").map((x) => x.trim());
  const hh = hPart === "" ? 23 : Math.max(0, Math.min(23, Number(hPart)));
  const mm = mPart === "" ? 59 : Math.max(0, Math.min(59, Number(mPart)));
  d.setHours(Number.isFinite(hh) ? hh : 23, Number.isFinite(mm) ? mm : 59, 0, 0);
  return d;
}

export function estadoTarea(t: Tarea): EstadoTarea {
  const limite = fechaLimite(t).getTime();
  if (t.completada) {
    const hecha = t.completadaEn ? new Date(t.completadaEn).getTime() : limite;
    return hecha <= limite ? "aTiempo" : "tarde";
  }
  return limite < Date.now() ? "vencida" : "pendiente";
}

export function colorEstadoTarea(e: EstadoTarea): string {
  if (e === "aTiempo") return "#10B981";
  if (e === "tarde") return "#F59E0B";
  if (e === "vencida") return "#EF4444";
  return "#94A3B8";
}