import type {
  Clase,
  Dia,
  EstadoAsistencia,
  Horario,
  Semana,
} from "../types";
import { DIAS, aMinutosRango, nombreMateria } from "./hora";

export type EstadoDia = "sin" | "presente" | "parcial" | "falta" | "feriado";

export const MARCA_FERIADO = "__feriado__";

export const SEMANAS_SEMESTRE = 16;
export const LIMITE_BAJA_PORCIENTO = 15;
export const LIMITE_PERDIDA_PORCIENTO = 100 / 3;

export type EstadoLimiteAsistencia = "ok" | "baja" | "perdida";

export interface LimiteAsistencia {
  materia: string;
  creditos: number;
  horasSemanales: number;
  horasSemestre: number;
  horasFalta: number;
  porcentaje: number;
  estado: EstadoLimiteAsistencia;
  horasParaBaja: number;
  horasParaPerdida: number;
  semanasRegistradas: number;
}

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
    .filter(
      (v): v is boolean | "cancelled" =>
        v === true || v === false || v === "cancelled"
    );
  if (marcados.length === 0) return "sin";
  const presentes = marcados.filter(
    (v) => v === true || v === "cancelled"
  ).length;
  if (presentes === marcados.length) return "presente";
  if (presentes === 0) return "falta";
  return "parcial";
}

export function horasDeClase(clase: Clase): number {
  const r = aMinutosRango(clase.hora);
  if (!r) return 0;
  return (r.fin - r.ini) / 60;
}

// Límites de faltas injustificadas según el Estatuto UTP. La medida es en
// horas: el total de la asignatura se estima a partir de las horas semanales
// reales del horario multiplicadas por SEMANAS_SEMESTRE. Cada clase marcada
// como falta (registro === false) suma la duración de esa sesión.
export function limitesAsistencia(
  horario: Horario,
  semanas: Semana[],
  creditos: Record<string, number>
): LimiteAsistencia[] {
  const porMateria = new Map<string, { sesiones: { clave: string; horas: number }[] }>();
  for (const dia of DIAS) {
    for (const c of horario[dia] ?? []) {
      const nom = nombreMateria(c.materia);
      const horas = horasDeClase(c);
      if (horas <= 0) continue;
      const e = porMateria.get(nom) ?? { sesiones: [] };
      e.sesiones.push({ clave: `${dia}|${c.hora}`, horas });
      porMateria.set(nom, e);
    }
  }

  const resultados: LimiteAsistencia[] = [];
  for (const [nom, e] of porMateria) {
    const horasSemanales = e.sesiones.reduce((a, s) => a + s.horas, 0);
    const horasSemestre = horasSemanales * SEMANAS_SEMESTRE;
    if (horasSemestre <= 0) continue;

    let horasFalta = 0;
    for (const s of semanas) {
      for (const sesion of e.sesiones) {
        if (s.registros[sesion.clave] === false) horasFalta += sesion.horas;
      }
    }

    const porcentaje = (horasFalta / horasSemestre) * 100;
    const estado: EstadoLimiteAsistencia =
      porcentaje >= LIMITE_PERDIDA_PORCIENTO
        ? "perdida"
        : porcentaje > LIMITE_BAJA_PORCIENTO
          ? "baja"
          : "ok";

    resultados.push({
      materia: nom,
      creditos: Math.max(0, creditos[nom] ?? 3),
      horasSemanales,
      horasSemestre,
      horasFalta,
      porcentaje,
      estado,
      horasParaBaja: horasSemestre * (LIMITE_BAJA_PORCIENTO / 100),
      horasParaPerdida: horasSemestre / 3,
      semanasRegistradas: semanas.length,
    });
  }

  return resultados.sort((a, b) => b.porcentaje - a.porcentaje);
}