import { useState } from "react";
import { cargar, guardar, uid } from "../lib/storage";
import type {
  CalificacionesPorMateria,
  Calificacion,
  SeccionNota,
} from "../types";

const CLAVE = "ms.calificaciones.v1";
const CLAVE_CREDITOS = "ms.creditos.v1";

export function useCalificaciones() {
  const [porMateria, setPorMateria] = useState<CalificacionesPorMateria>(
    () => cargar<CalificacionesPorMateria>(CLAVE, {})
  );
  const [creditos, setCreditosState] = useState<Record<string, number>>(
    () => cargar<Record<string, number>>(CLAVE_CREDITOS, {})
  );

  const actualizar = (nuevo: CalificacionesPorMateria) => {
    setPorMateria(nuevo);
    guardar(CLAVE, nuevo);
  };

  const seccionesDe = (materia: string): SeccionNota[] =>
    porMateria[materia] ?? [];

  const guardarSecciones = (materia: string, secciones: SeccionNota[]) => {
    actualizar({ ...porMateria, [materia]: secciones });
  };

  const agregarSeccion = (materia: string, nombre: string, porcentaje: number) => {
    guardarSecciones(materia, [
      ...seccionesDe(materia),
      { id: uid(), nombre, porcentaje, calificaciones: [] },
    ]);
  };

  const editarSeccion = (
    materia: string,
    id: string,
    nombre: string,
    porcentaje: number
  ) => {
    guardarSecciones(
      materia,
      seccionesDe(materia).map((s) =>
        s.id === id ? { ...s, nombre, porcentaje } : s
      )
    );
  };

  const eliminarSeccion = (materia: string, id: string) => {
    guardarSecciones(
      materia,
      seccionesDe(materia).filter((s) => s.id !== id)
    );
  };

  const guardarNotas = (
    materia: string,
    seccionId: string,
    notas: Calificacion[]
  ) => {
    guardarSecciones(
      materia,
      seccionesDe(materia).map((s) =>
        s.id === seccionId ? { ...s, calificaciones: notas } : s
      )
    );
  };

  const agregarCalificacion = (
    materia: string,
    seccionId: string,
    nombre: string,
    nota: number,
    extra?: boolean
  ) => {
    const sec = seccionesDe(materia).find((s) => s.id === seccionId);
    if (!sec) return;
    guardarNotas(materia, seccionId, [
      ...sec.calificaciones,
      { id: uid(), nombre, nota, extra },
    ]);
  };

  const editarCalificacion = (
    materia: string,
    seccionId: string,
    id: string,
    nombre: string,
    nota: number,
    extra?: boolean
  ) => {
    const sec = seccionesDe(materia).find((s) => s.id === seccionId);
    if (!sec) return;
    guardarNotas(
      materia,
      seccionId,
      sec.calificaciones.map((c) =>
        c.id === id ? { ...c, nombre, nota, extra } : c
      )
    );
  };

  const eliminarCalificacion = (
    materia: string,
    seccionId: string,
    id: string
  ) => {
    const sec = seccionesDe(materia).find((s) => s.id === seccionId);
    if (!sec) return;
    guardarNotas(
      materia,
      seccionId,
      sec.calificaciones.filter((c) => c.id !== id)
    );
  };

  const fijarCreditos = (materia: string, n: number) => {
    const nuevo = { ...creditos, [materia]: n };
    setCreditosState(nuevo);
    guardar(CLAVE_CREDITOS, nuevo);
  };

  return {
    porMateria,
    creditos,
    seccionesDe,
    agregarSeccion,
    editarSeccion,
    eliminarSeccion,
    agregarCalificacion,
    editarCalificacion,
    eliminarCalificacion,
    fijarCreditos,
  };
}