import type { Seccion } from "../types";

export const SECCIONES: Seccion[] = [
  {
    id: "horario",
    nombre: "Horario de clases",
    descripcion: "Tus clases de la semana",
    color: "#0FA3A3",
  },
  {
    id: "ausencias",
    nombre: "Ausencias / Asistencias",
    descripcion: "Control de asistencia por materia",
    color: "#F59E0B",
  },
  {
    id: "calificaciones",
    nombre: "Calificaciones",
    descripcion: "Notas y promedios por materia",
    color: "#8B5CF6",
  },
  {
    id: "bitacoras",
    nombre: "Bitácoras",
    descripcion: "Notas y registros del día a día",
    color: "#EC4899",
  },
  {
    id: "materias",
    nombre: "Materias",
    descripcion: "Catálogo y vínculos",
    color: "#0D9488",
  },
  {
    id: "config",
    nombre: "Configuración",
    descripcion: "Apariencia y preferencias",
    color: "#64748B",
  },
];
