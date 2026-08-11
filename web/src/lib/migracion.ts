import { HORARIO_INICIAL } from "../data/horario";
import { cargar } from "./storage";
import { materiasDesdeHorario } from "./materias";
import type { Horario, Materia } from "../types";
import {
  CLAVE_HORARIO,
  CLAVE_MATERIAS,
  CLAVE_VERSION,
  VERSION,
} from "./version";

// Migraciones incrementales de datos. Se ejecuta una vez por versión al
// arrancar la app. Nunca borra datos existentes: solo enriquece/adapta.
export function migrar(): void {
  try {
    const actual = localStorage.getItem(CLAVE_VERSION) ?? "";
    if (actual === VERSION) return;

    if (!actual || actual < "1.0.1") {
      // 1.0.0 -> 1.0.1: crear el catálogo de materias a partir del horario.
      // Así las materias ya registradas se convierten en "materias" editables
      // y se vinculan a las demás secciones sin perder nada.
      const horario = cargar<Horario>(CLAVE_HORARIO, HORARIO_INICIAL);
      const catalogo = cargar<Materia[]>(CLAVE_MATERIAS, []);
      const porNombre = new Map(
        catalogo.map((m) => [(m.nombre || "").trim(), m])
      );
      for (const m of materiasDesdeHorario(horario)) {
        if (!porNombre.has(m.nombre)) porNombre.set(m.nombre, m);
      }
      localStorage.setItem(
        CLAVE_MATERIAS,
        JSON.stringify(Array.from(porNombre.values()))
      );
    }

    localStorage.setItem(CLAVE_VERSION, VERSION);
  } catch {
    // no debe romper el arranque de la app
  }
}
