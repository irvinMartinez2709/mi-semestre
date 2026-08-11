import type { SeccionNota } from "../types";

export type Letra = "A" | "B" | "C" | "D" | "F";

export function letraDeNota(n: number): Letra {
  if (n >= 91) return "A";
  if (n >= 81) return "B";
  if (n >= 71) return "C";
  if (n >= 61) return "D";
  return "F";
}

export function puntosDeLetra(L: Letra): number {
  if (L === "A") return 3;
  if (L === "B") return 2;
  if (L === "C") return 1;
  return 0;
}

export function colorDeLetra(L: Letra): string {
  switch (L) {
    case "A":
      return "#10B981";
    case "B":
      return "#2E7CF6";
    case "C":
      return "#F59E0B";
    case "D":
      return "#F97316";
    default:
      return "#EF4444";
  }
}

export function promSeccion(s: SeccionNota): number | null {
  if (s.calificaciones.length === 0) return null;
  return (
    s.calificaciones.reduce((a, c) => a + c.nota, 0) /
    s.calificaciones.length
  );
}

export function promedioMateria(secciones: SeccionNota[]): {
  promedio: number | null;
  pesos: number;
} {
  let pesos = 0;
  let acc = 0;
  for (const s of secciones) {
    const p = promSeccion(s);
    if (p === null) continue;
    pesos += s.porcentaje;
    acc += p * s.porcentaje;
  }
  if (pesos === 0) return { promedio: null, pesos: 0 };
  return { promedio: acc / pesos, pesos };
}

export interface Indice {
  indice: number | null;
  puntos: number;
  creditos: number;
}

export function indiceAcademico(
  porMateria: Record<string, SeccionNota[]>,
  creditos: Record<string, number>
): Indice {
  let puntos = 0;
  let creditosTotales = 0;
  for (const [materia, secciones] of Object.entries(porMateria)) {
    const prom = promedioMateria(secciones).promedio;
    if (prom === null) continue;
    const cr = Math.max(0, creditos[materia] ?? 3);
    creditosTotales += cr;
    puntos += puntosDeLetra(letraDeNota(prom)) * cr;
  }
  return {
    indice: creditosTotales === 0 ? null : puntos / creditosTotales,
    puntos,
    creditos: creditosTotales,
  };
}