import type { Horario } from "../types";
import { DIAS, nombreMateria } from "./hora";

export const PALETA_MATERIAS = [
  "#2E7CF6",
  "#0FA3A3",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#6366F1",
  "#EF4444",
  "#14B8A6",
  "#D97706",
];

export interface MateriaInfo {
  nombre: string;
  color: string;
  horas: number;
}

export function materiasDe(horario: Horario): MateriaInfo[] {
  const mapa = new Map<string, number>();
  for (const dia of DIAS) {
    for (const c of horario[dia]) {
      const nom = nombreMateria(c.materia);
      mapa.set(nom, (mapa.get(nom) ?? 0) + 1);
    }
  }
  return Array.from(mapa.entries())
    .map(([n, horas]) => ({
      nombre: n,
      color: colorDeMateria(n),
      horas,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export function colorDeMateria(nombre: string): string {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = (hash * 31 + nombre.charCodeAt(i)) >>> 0;
  }
  return PALETA_MATERIAS[hash % PALETA_MATERIAS.length];
}

export const NOMBRES_POR_DEFECTO = [
  "SISTEMAS EMBEBI",
  "CIBERSEGURIDAD",
  "DESARROLLO WEB",
  "ESTA. Y PROB.",
  "MATEMÁTICA II",
];