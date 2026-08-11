import { useState } from "react";
import { HORARIO_INICIAL } from "../data/horario";
import { cargar, guardar } from "../lib/storage";
import type { Clase, Dia, Horario } from "../types";

const CLAVE = "ms.horario.v1";

export function useHorario() {
  const [horario, setHorario] = useState<Horario>(() =>
    cargar<Horario>(CLAVE, HORARIO_INICIAL)
  );

  const actualizar = (nuevo: Horario) => {
    setHorario(nuevo);
    guardar(CLAVE, nuevo);
  };

  const agregarClase = (dia: Dia, clase: Clase) => {
    actualizar({ ...horario, [dia]: [...horario[dia], clase] });
  };

  const editarClase = (dia: Dia, indice: number, clase: Clase) => {
    actualizar({
      ...horario,
      [dia]: horario[dia].map((c, i) => (i === indice ? clase : c)),
    });
  };

  const eliminarClase = (dia: Dia, indice: number) => {
    actualizar({
      ...horario,
      [dia]: horario[dia].filter((_, i) => i !== indice),
    });
  };

  return {
    horario,
    setHorario,
    agregarClase,
    editarClase,
    eliminarClase,
  };
}