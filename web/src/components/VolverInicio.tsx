import { useAjustes } from "../contexto/Ajustes";
import { Icono } from "./Icono";
import type { Vista } from "../types";

interface Props {
  alNavegar: (v: Vista) => void;
  texto?: string;
}

export function VolverInicio({ alNavegar, texto }: Props) {
  const { t } = useAjustes();
  return (
    <button
      onClick={() => alNavegar("inicio")}
      className="inline-flex items-center gap-2 rounded-lg border border-borde bg-card px-3.5 py-2 text-sm font-semibold transition-colors hover:border-acento hover:text-acento"
    >
      <Icono nombre="atras" className="h-4 w-4" />
      {texto ?? t("volver.inicio")}
    </button>
  );
}