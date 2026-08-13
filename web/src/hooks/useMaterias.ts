import { useState } from "react";
import { cargar, guardar } from "../lib/storage";
import { nombreMateria } from "../lib/hora";
import type { Horario, Materia } from "../types";
import {
  CLAVE_BITACORAS,
  CLAVE_CALIFICACIONES,
  CLAVE_CREDITOS,
  CLAVE_HORARIO,
  CLAVE_MATERIAS,
} from "../lib/version";

const CLAVE = CLAVE_MATERIAS;

function tieneSufijoLab(nombre: string): boolean {
  return /\(L\)\s*$/i.test(nombre);
}

export function useMaterias() {
  const [materias, setMaterias] = useState<Materia[]>(() =>
    cargar<Materia[]>(CLAVE, [])
  );

  const persistir = (nuevas: Materia[]) => {
    setMaterias(nuevas);
    guardar(CLAVE, nuevas);
  };

  const agregarMateria = (datos: Materia): boolean => {
    const nombre = (datos.nombre || "").trim();
    if (!nombre) return false;
    if (
      materias.some(
        (m) => (m.nombre || "").trim().toUpperCase() === nombre.toUpperCase()
      )
    )
      return false;
    persistir([...materias, { ...datos, nombre }]);
    return true;
  };

  // Actualiza solo los créditos de una materia del catálogo. Es la fuente
  // de verdad para el índice académico y los límites de faltas.
  const fijarCreditos = (nombre: string, n: number) => {
    const cr = Math.max(0, Math.min(30, Math.round(n)));
    persistir(
      materias.map((m) =>
        (m.nombre || "").trim() === (nombre || "").trim()
          ? { ...m, creditos: cr }
          : m
      )
    );
  };

  // Renombra la materia en el catálogo y en todas las secciones vinculadas
  // (horario, calificaciones, créditos y bitácoras).
  const editarMateria = (antes: string, datos: Materia) => {
    const nombre = (datos.nombre || "").trim();
    if (!nombre) return;
    const norm = nombreMateria(antes);

    // catálogo
    persistir(
      materias.map((m) =>
        (m.nombre || "").trim() === (antes || "").trim()
          ? { ...m, ...datos, nombre }
          : m
      )
    );

    // horario
    const horario = cargar<Horario>(CLAVE_HORARIO, {
      lunes: [],
      martes: [],
      miércoles: [],
      jueves: [],
      viernes: [],
    });
    let cambioHorario = false;
    const nuevoHorario: Horario = {} as Horario;
    for (const dia of Object.keys(horario) as (keyof Horario)[]) {
      nuevoHorario[dia] = horario[dia].map((c) => {
        if (nombreMateria(c.materia) !== norm) return c;
        cambioHorario = true;
        return {
          ...c,
          materia: nombre + (tieneSufijoLab(c.materia) ? " (L)" : ""),
        };
      });
    }
    if (cambioHorario) guardar(CLAVE_HORARIO, nuevoHorario);

    // calificaciones
    const porMateria = cargar<Record<string, unknown>>(CLAVE_CALIFICACIONES, {});
    if (norm in porMateria) {
      const resto: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(porMateria)) {
        resto[nombreMateria(k) === norm ? nombre : k] = v;
      }
      guardar(CLAVE_CALIFICACIONES, resto);
    }

    // créditos
    const creditos = cargar<Record<string, number>>(CLAVE_CREDITOS, {});
    if (norm in creditos) {
      const resto: Record<string, number> = {};
      for (const [k, v] of Object.entries(creditos)) {
        resto[nombreMateria(k) === norm ? nombre : k] = v;
      }
      guardar(CLAVE_CREDITOS, resto);
    }

    // bitácoras
    const bitacoras = cargar<Array<{ materia: string }>>(CLAVE_BITACORAS, []);
    if (bitacoras.some((b) => nombreMateria(b.materia) === norm)) {
      guardar(
        CLAVE_BITACORAS,
        bitacoras.map((b) =>
          nombreMateria(b.materia) === norm
            ? { ...b, materia: nombre }
            : b
        )
      );
    }
  };

  // Elimina la materia del catálogo y de todo lo vinculado: clases del
  // horario, calificaciones, créditos y bitácoras.
  const eliminarMateria = (nombre: string) => {
    const norm = nombreMateria(nombre);

    persistir(materias.filter((m) => (m.nombre || "").trim() !== nombre.trim()));

    const horario = cargar<Horario>(CLAVE_HORARIO, {
      lunes: [],
      martes: [],
      miércoles: [],
      jueves: [],
      viernes: [],
    });
    const nuevoHorario: Horario = {} as Horario;
    for (const dia of Object.keys(horario) as (keyof Horario)[]) {
      nuevoHorario[dia] = horario[dia].filter(
        (c) => nombreMateria(c.materia) !== norm
      );
    }
    guardar(CLAVE_HORARIO, nuevoHorario);

    const porMateria = cargar<Record<string, unknown>>(CLAVE_CALIFICACIONES, {});
    if (norm in porMateria) {
      const resto: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(porMateria))
        if (nombreMateria(k) !== norm) resto[k] = v;
      guardar(CLAVE_CALIFICACIONES, resto);
    }

    const creditos = cargar<Record<string, number>>(CLAVE_CREDITOS, {});
    if (norm in creditos) {
      const resto: Record<string, number> = {};
      for (const [k, v] of Object.entries(creditos))
        if (nombreMateria(k) !== norm) resto[k] = v;
      guardar(CLAVE_CREDITOS, resto);
    }

    const bitacoras = cargar<Array<{ materia: string }>>(CLAVE_BITACORAS, []);
    const restantes = bitacoras.filter((b) => nombreMateria(b.materia) !== norm);
    guardar(CLAVE_BITACORAS, restantes);
    // Los registros de ausencias se guardan por día|hora, no por materia;
    // al quitar las clases del horario dejan de mostrarse automáticamente.
  };

  return {
    materias,
    agregarMateria,
    fijarCreditos,
    editarMateria,
    eliminarMateria,
  };
}
