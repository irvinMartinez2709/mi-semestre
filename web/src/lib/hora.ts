import type { Clase, Dia, Horario } from "../types";

export const DIAS: Dia[] = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
];

export function diaDeHoy(): Dia | null {
  const d = new Date().getDay();
  if (d >= 1 && d <= 5) return DIAS[d - 1];
  return null;
}

const regexHora =
  /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

export function aMinutosRango(
  hora: string
): { ini: number; fin: number } | null {
  const limpia = hora.replace(/\./g, "").trim();
  const m = limpia.match(regexHora);
  if (!m) return null;
  const mer = m[5].toUpperCase();
  const resolver = (h: number, mi: number) => {
    if (mer === "PM" && h !== 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    return h * 60 + mi;
  };
  return {
    ini: resolver(parseInt(m[1], 10), parseInt(m[2], 10)),
    fin: resolver(parseInt(m[3], 10), parseInt(m[4], 10)),
  };
}

export function aMinutos(hora: string): number {
  return aMinutosRango(hora)?.ini ?? 0;
}

export interface ClaseActiva {
  actual: Clase | null;
  proxima: Clase | null;
}

export function claseActiva(lista: Clase[], ahoraMin: number): ClaseActiva {
  const restantes = lista
    .filter((c) => aMinutos(c.hora) > ahoraMin)
    .sort((a, b) => aMinutos(a.hora) - aMinutos(b.hora));
  const actual =
    lista.find((c) => {
      const r = aMinutosRango(c.hora);
      return r !== null && ahoraMin >= r.ini && ahoraMin < r.fin;
    }) ?? null;
  return { actual, proxima: restantes[0] ?? null };
}

export function hoyMinutos(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function nombreMateria(materia: string): string {
  return materia.replace(/\s*\(L\)/gi, "").trim();
}

export function totalClases(horario: Horario): number {
  return DIAS.reduce((acc, d) => acc + horario[d].length, 0);
}