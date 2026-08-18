export type NombreIcono =
  | "inicio"
  | "horario"
  | "ausencias"
  | "calificaciones"
  | "bitacoras"
  | "materias"
  | "tareas"
  | "config"
  | "sol"
  | "luna"
  | "menu"
  | "atras"
  | "flecha"
  | "edificio";

interface Props {
  nombre: NombreIcono;
  className?: string;
}

export function Icono({ nombre, className = "w-5 h-5" }: Props) {
  const comunes = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (nombre) {
    case "inicio":
      return (
        <svg {...comunes} viewBox="0 0 24 24">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
        </svg>
      );
    case "horario":
      return (
        <svg {...comunes} viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
          <path d="M8 14h2M14 14h2M8 17.5h2M14 17.5h2" />
        </svg>
      );
    case "ausencias":
      return (
        <svg {...comunes} viewBox="0 0 24 24">
          <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
          <path d="M12 8v4l2.5 2.5" />
        </svg>
      );
    case "calificaciones":
      return (
        <svg {...comunes} viewBox="0 0 24 24">
          <path d="m12 3 2.7 5.4 6 .9-4.3 4.2 1 6-5.4-2.8L6.6 19.5l1-6L3.3 9.3l6-.9Z" />
        </svg>
      );
    case "bitacoras":
      return (
        <svg {...comunes} viewBox="0 0 24 24">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
      );
    case "materias":
      return (
        <svg {...comunes} viewBox="0 0 24 24">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case "tareas":
      return (
        <svg {...comunes} viewBox="0 0 24 24">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 3.5h6M9 8.5l1 1 2-2M9 14l1 1 2-2M14 14.5h3" />
        </svg>
      );
    case "config":
      return (
        <svg {...comunes} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      );
    case "sol":
      return (
        <svg {...comunes} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      );
    case "luna":
      return (
        <svg {...comunes} viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      );
    case "menu":
      return (
        <svg {...comunes} viewBox="0 0 24 24">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      );
    case "atras":
      return (
        <svg {...comunes} viewBox="0 0 24 24">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      );
    case "flecha":
      return (
        <svg {...comunes} viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" />
        </svg>
      );
    case "edificio":
      return (
        <svg {...comunes} viewBox="0 0 24 24">
          <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
          <path d="M9 9h.01M9 12h.01M9 15h.01M9 18h.01" />
        </svg>
      );
  }
}