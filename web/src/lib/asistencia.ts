import type { Dia, EstadoAsistencia } from "../types";

export type EstadoDia = "sin" | "presente" | "parcial" | "falta" | "feriado";

export const MARCA_FERIADO = "__feriado__";

export function claveFeriado(dia: Dia): string {
  return `${dia}|${MARCA_FERIADO}`;
}

export function estadoDeDia(
  registros: Record<string, EstadoAsistencia>,
  dia: Dia,
  claves: string[]
): EstadoDia {
  if (registros[claveFeriado(dia)] === true) return "feriado";
  const marcados = claves
    .map((c) => registros[c])
    .filter((v): v is boolean => v === true || v === false);
  if (marcados.length === 0) return "sin";
  const presentes = marcados.filter(Boolean).length;
  if (presentes === marcados.length) return "presente";
  if (presentes === 0) return "falta";
  return "parcial";
}