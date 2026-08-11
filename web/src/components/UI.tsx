import type { ReactNode } from "react";

export const estilos = {
  inputClase:
    "w-full rounded-lg border border-borde bg-fondo px-3 py-2 text-sm outline-none transition-colors focus:border-acento",
  boton: "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.99]",
  primario: "bg-acento text-white",
  secundario: "border border-borde bg-card text-tinta hover:border-acento",
};

interface ModalProps {
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}

export function Modal({ titulo, onCerrar, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
      onClick={onCerrar}
    >
      <div
        className="max-h-[86vh] w-full max-w-md overflow-y-auto rounded-xl border border-borde bg-card p-4 scroll-slim pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-bold">{titulo}</h3>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="grid h-8 w-8 place-items-center rounded-lg border border-borde text-sub hover:text-tinta"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface ChipsProps<T extends string> {
  opciones: { id: T; etiqueta: string }[];
  seleccion: T;
  onChange: (v: T) => void;
  color?: (v: T) => string;
}

export function Chips<T extends string>({
  opciones,
  seleccion,
  onChange,
  color,
}: ChipsProps<T>) {
  if (opciones.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {opciones.map((o) => {
        const activo = o.id === seleccion;
        const c = color?.(o.id);
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              activo
                ? "border-transparent text-white"
                : "border-borde bg-card text-sub hover:text-tinta"
            }`}
            style={activo ? { backgroundColor: c } : undefined}
          >
            {o.etiqueta}
          </button>
        );
      })}
    </div>
  );
}

export function IconoBoton({
  nombre,
  onClick,
  aria,
  peligro,
}: {
  nombre: "borrar" | "editar" | "agregar";
  onClick: () => void;
  aria: string;
  peligro?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      className={`grid h-8 w-8 place-items-center rounded-lg border transition-colors ${
        peligro
          ? "border-red-300 text-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
          : "border-borde text-sub hover:border-acento hover:text-acento"
      }`}
    >
      {nombre === "borrar" && (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
        </svg>
      )}
      {nombre === "editar" && (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      )}
      {nombre === "agregar" && (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      )}
    </button>
  );
}