export interface Clase {
  hora: string;
  materia: string;
  aula: string;
  profesor?: string;
}

export interface Materia {
  nombre: string;
  color?: string;
  creditos?: number;
  profesor?: string;
}

export type Dia =
  | "lunes"
  | "martes"
  | "miércoles"
  | "jueves"
  | "viernes";

export type Horario = Record<Dia, Clase[]>;

export type Vista =
  | "inicio"
  | "horario"
  | "ausencias"
  | "calificaciones"
  | "bitacoras"
  | "materias"
  | "tareas"
  | "config";

export interface Seccion {
  id: Vista;
  nombre: string;
  descripcion: string;
  color: string;
}

export type EstadoAsistencia = boolean | "cancelled" | null;

export interface Semana {
  id: string;
  numero: number;
  inicio: string;
  registros: Record<string, EstadoAsistencia>;
}

export interface Calificacion {
  id: string;
  nombre: string;
  nota: number;
  extra?: boolean;
}

export interface SeccionNota {
  id: string;
  nombre: string;
  porcentaje: number;
  calificaciones: Calificacion[];
}

export type CalificacionesPorMateria = Record<string, SeccionNota[]>;

export type Adjunto =
  | { id: string; tipo: "imagen"; nombre?: string; valor: string }
  | { id: string; tipo: "enlace"; nombre: string; valor: string };

export interface Bitacora {
  id: string;
  fecha: string;
  materia: string;
  titulo: string;
  contenido: string;
  adjuntos?: Adjunto[];
  creada: string;
}

export type TipoRecordatorio = "unaVez" | "repetir" | "horas";

export interface TareaChecklist {
  id: string;
  texto: string;
  hecha: boolean;
}

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  materia: string;
  fecha: string;
  hora: string;
  tipoRecordatorio: TipoRecordatorio;
  repetirCadaMinutos?: number;
  horasRecordatorio?: string[];
  completada: boolean;
  completadaEn: string | null;
  checklist: TareaChecklist[];
  creada: string;
}