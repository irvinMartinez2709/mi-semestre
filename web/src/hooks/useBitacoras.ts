import { useState } from "react";
import { cargar, guardar, uid } from "../lib/storage";
import type { Adjunto, Bitacora } from "../types";

const CLAVE = "ms.bitacoras.v1";

export function useBitacoras() {
  const [bitacoras, setBitacoras] = useState<Bitacora[]>(() =>
    cargar<Bitacora[]>(CLAVE, [])
  );

  const persistir = (nuevas: Bitacora[]) => {
    setBitacoras(nuevas);
    guardar(CLAVE, nuevas);
  };

  const agregarBitacora = (
    datos: Pick<Bitacora, "fecha" | "materia" | "titulo" | "contenido"> & {
      adjuntos?: Adjunto[];
    }
  ) => {
    persistir([
      ...bitacoras,
      {
        id: uid(),
        fecha: datos.fecha,
        materia: datos.materia,
        titulo: datos.titulo,
        contenido: datos.contenido,
        adjuntos: datos.adjuntos ?? [],
        creada: new Date().toISOString(),
      },
    ]);
  };

  const editarBitacora = (
    id: string,
    datos: Pick<Bitacora, "fecha" | "materia" | "titulo" | "contenido"> & {
      adjuntos?: Adjunto[];
    }
  ) => {
    persistir(
      bitacoras.map((b) =>
        b.id === id ? { ...b, ...datos, adjuntos: datos.adjuntos ?? b.adjuntos } : b
      )
    );
  };

  const eliminarBitacora = (id: string) => {
    persistir(bitacoras.filter((b) => b.id !== id));
  };

  return {
    bitacoras,
    agregarBitacora,
    editarBitacora,
    eliminarBitacora,
  };
}