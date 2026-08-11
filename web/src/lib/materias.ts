import type { Horario, Materia } from "../types";
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
  creditos?: number;
  profesor?: string;
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

// Materias efectivas de la app: unión del catálogo (ms.materias.v1) con las
// materias presentes en el horario. Así las materias nuevas (aún sin clases)
// se vinculan con las demás secciones igual que las que ya existen.
export function materiasActivas(
  horario: Horario,
  catalogo: Materia[]
): MateriaInfo[] {
  const mapa = new Map<
    string,
    { horas: number; mat?: Materia }
  >();
  for (const dia of DIAS) {
    for (const c of horario[dia]) {
      const nom = nombreMateria(c.materia);
      const e = mapa.get(nom);
      if (e) e.horas += 1;
      else mapa.set(nom, { horas: 1 });
    }
  }
  for (const m of catalogo) {
    const nom = (m.nombre || "").trim();
    if (!nom) continue;
    const e = mapa.get(nom);
    if (e) e.mat = m;
    else mapa.set(nom, { horas: 0, mat: m });
  }
  return Array.from(mapa.entries())
    .map(([nombre, e]) => ({
      nombre,
      color: e.mat?.color || colorDeMateria(nombre),
      horas: e.horas,
      creditos: e.mat?.creditos ?? 3,
      profesor: e.mat?.profesor ?? "",
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

// Catálogo inicial (migración): materias que ya están en el horario.
export function materiasDesdeHorario(horario: Horario): Materia[] {
  const set = new Set<string>();
  for (const dia of DIAS) {
    for (const c of horario[dia]) set.add(nombreMateria(c.materia));
  }
  return Array.from(set)
    .sort()
    .map((nombre) => ({ nombre }));
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
