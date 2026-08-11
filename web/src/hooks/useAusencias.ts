import { useState } from "react";
import { cargar, guardar, uid } from "../lib/storage";
import { claveFeriado } from "../lib/asistencia";
import type { Dia, EstadoAsistencia, Semana } from "../types";

const CLAVE = "ms.ausencias.v1";

export function useAusencias() {
  const [semanas, setSemanas] = useState<Semana[]>(() =>
    cargar<Semana[]>(CLAVE, [])
  );

  const guardarSemanas = (nuevas: Semana[]) => {
    setSemanas(nuevas);
    guardar(CLAVE, nuevas);
  };

  const agregarSemana = (inicio: string): Semana | null => {
    if (semanas.some((s) => s.inicio === inicio)) return null;
    const numero =
      Math.max(0, ...semanas.map((s) => s.numero)) + 1;
    const nueva: Semana = { id: uid(), numero, inicio, registros: {} };
    guardarSemanas([...semanas, nueva]);
    return nueva;
  };

  const eliminarSemana = (id: string) => {
    guardarSemanas(semanas.filter((s) => s.id !== id));
  };

  const setRegistro = (
    semanaId: string,
    dia: Dia,
    clave: string,
    estado: EstadoAsistencia
  ) => {
    guardarSemanas(
      semanas.map((s) => {
        if (s.id !== semanaId) return s;
        const r = { ...s.registros };
        if (estado !== null) delete r[claveFeriado(dia)];
        if (estado === null) delete r[clave];
        else r[clave] = estado;
        return { ...s, registros: r };
      })
    );
  };

  const alternarFeriado = (semanaId: string, dia: Dia, claves: string[]) => {
    guardarSemanas(
      semanas.map((s) => {
        if (s.id !== semanaId) return s;
        const r = { ...s.registros };
        const cf = claveFeriado(dia);
        if (r[cf]) delete r[cf];
        else {
          r[cf] = true;
          for (const c of claves) delete r[c];
        }
        return { ...s, registros: r };
      })
    );
  };

  return {
    semanas,
    agregarSemana,
    eliminarSemana,
    setRegistro,
    alternarFeriado,
  };
}