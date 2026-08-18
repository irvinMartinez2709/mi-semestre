import { useEffect, useState } from "react";
import { programarTareas } from "../lib/notificaciones";
import { cargar, guardar, uid } from "../lib/storage";
import { CLAVE_TAREAS } from "../lib/version";
import type { Tarea } from "../types";

export interface TareaDatos {
  titulo: string;
  descripcion: string;
  materia: string;
  fecha: string;
  hora: string;
  tipoRecordatorio: Tarea["tipoRecordatorio"];
  repetirCadaMinutos?: number;
  horasRecordatorio?: string[];
}

export function useTareas() {
  const [tareas, setTareas] = useState<Tarea[]>(() =>
    cargar<Tarea[]>(CLAVE_TAREAS, [])
  );

  const persistir = (nuevas: Tarea[]) => {
    setTareas(nuevas);
    guardar(CLAVE_TAREAS, nuevas);
  };

  useEffect(() => {
    void programarTareas(tareas);
  }, [tareas]);

  const reprogramar = () => {
    void programarTareas(tareas);
  };

  const crearTarea = (datos: TareaDatos): Tarea => {
    const t: Tarea = {
      id: uid(),
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      materia: datos.materia,
      fecha: datos.fecha,
      hora: datos.hora,
      tipoRecordatorio: datos.tipoRecordatorio,
      repetirCadaMinutos:
        datos.tipoRecordatorio === "repetir"
          ? Math.max(5, datos.repetirCadaMinutos ?? 30)
          : undefined,
      horasRecordatorio:
        datos.tipoRecordatorio === "horas"
          ? (datos.horasRecordatorio ?? []).filter(Boolean)
          : undefined,
      completada: false,
      completadaEn: null,
      checklist: [],
      creada: new Date().toISOString(),
    };
    persistir([...tareas, t]);
    return t;
  };

  const editarTarea = (id: string, datos: TareaDatos) => {
    persistir(
      tareas.map((t) =>
        t.id === id
          ? {
              ...t,
              titulo: datos.titulo,
              descripcion: datos.descripcion,
              materia: datos.materia,
              fecha: datos.fecha,
              hora: datos.hora,
              tipoRecordatorio: datos.tipoRecordatorio,
              repetirCadaMinutos:
                datos.tipoRecordatorio === "repetir"
                  ? Math.max(5, datos.repetirCadaMinutos ?? 30)
                  : undefined,
              horasRecordatorio:
                datos.tipoRecordatorio === "horas"
                  ? (datos.horasRecordatorio ?? []).filter(Boolean)
                  : undefined,
            }
          : t
      )
    );
  };

  const eliminarTarea = (id: string) => {
    persistir(tareas.filter((t) => t.id !== id));
  };

  const marcarCompletada = (id: string, completada: boolean) => {
    persistir(
      tareas.map((t) =>
        t.id === id
          ? {
              ...t,
              completada,
              completadaEn: completada ? new Date().toISOString() : null,
            }
          : t
      )
    );
  };

  const alternarItemChecklist = (id: string, itemId: string) => {
    persistir(
      tareas.map((t) =>
        t.id === id
          ? {
              ...t,
              checklist: t.checklist.map((c) =>
                c.id === itemId ? { ...c, hecha: !c.hecha } : c
              ),
            }
          : t
      )
    );
  };

  const agregarItemChecklist = (id: string, texto: string) => {
    const limpio = texto.trim();
    if (!limpio) return;
    persistir(
      tareas.map((t) =>
        t.id === id
          ? {
              ...t,
              checklist: [
                ...t.checklist,
                { id: uid(), texto: limpio, hecha: false },
              ],
            }
          : t
      )
    );
  };

  const eliminarItemChecklist = (id: string, itemId: string) => {
    persistir(
      tareas.map((t) =>
        t.id === id
          ? { ...t, checklist: t.checklist.filter((c) => c.id !== itemId) }
          : t
      )
    );
  };

  return {
    tareas,
    crearTarea,
    editarTarea,
    eliminarTarea,
    marcarCompletada,
    alternarItemChecklist,
    agregarItemChecklist,
    eliminarItemChecklist,
    reprogramar,
  };
}