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
  /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})(AM|PM)$/i;

export function aMinutos(hora: string): number {
  const limpia = hora.replace(/\./g, "");
  const m = limpia.match(regexHora);
  if (!m) return 0;
  let h1 = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const mer = m[5].toUpperCase();
  if (mer === "PM" && h1 !== 12) h1 += 12;
  if (mer === "AM" && h1 === 12) h1 = 0;
  return h1 * 60 + min;
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
      const [i, f] = c.hora.split("-");
      return ahoraMin >= aMinutos(i) && ahoraMin < aMinutos(f);
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