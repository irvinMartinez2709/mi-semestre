import { useEffect, useRef, useState } from "react";
import type { Vista } from "../types";
import { useAjustes } from "../contexto/Ajustes";
import { Icono } from "./Icono";

interface Props {
  actual: Vista;
  alNavegar: (v: Vista) => void;
}

export function Header({ actual, alNavegar }: Props) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t, colores } = useAjustes();

  const items = [
    { id: "horario" as Vista, nombre: t("sec.horario"), color: colores.horario, icono: "horario" as const },
    { id: "ausencias" as Vista, nombre: t("sec.ausencias"), color: colores.ausencias, icono: "ausencias" as const },
    { id: "calificaciones" as Vista, nombre: t("sec.calificaciones"), color: colores.calificaciones, icono: "calificaciones" as const },
    { id: "bitacoras" as Vista, nombre: t("sec.bitacoras"), color: colores.bitacoras, icono: "bitacoras" as const },
    { id: "config" as Vista, nombre: t("sec.config"), color: colores.config, icono: "config" as const },
  ];

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, []);

  const ir = (v: Vista) => {
    setAbierto(false);
    alNavegar(v);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-borde bg-card">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-2 px-4">
        <button onClick={() => ir("inicio")} className="flex items-center gap-2">
          <span
            className="grid h-8 w-8 place-items-center rounded-lg text-white"
            style={{ backgroundColor: colores.acento }}
          >
            <Icono nombre="horario" className="h-5 w-5" />
          </span>
          <div className="text-left leading-tight">
            <p className="text-sm font-bold">{t("app.titulo")}</p>
            <p className="text-[11px] text-sub">{t("app.subtitulo")}</p>
          </div>
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setAbierto((o) => !o)}
            aria-label="Menú"
            className={`grid h-9 w-9 place-items-center rounded-lg border transition-colors ${
              abierto
                ? "border-acento text-acento"
                : "border-borde text-tinta hover:border-acento hover:text-acento"
            }`}
            style={abierto ? { borderColor: colores.acento, color: colores.acento } : undefined}
          >
            <Icono nombre="menu" />
          </button>

          {abierto && (
            <nav className="absolute right-0 top-11 z-40 w-64 overflow-hidden rounded-xl border border-borde bg-card py-1.5 pop">
              <p className="px-4 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-sub">
                {t("nav.secciones")}
              </p>
              <button
                onClick={() => ir("inicio")}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  actual === "inicio"
                    ? "bg-card2 font-semibold text-acento"
                    : "hover:bg-card2"
                }`}
                style={actual === "inicio" ? { color: colores.acento } : undefined}
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg text-white"
                  style={{ backgroundColor: colores.acento, opacity: 0.85 }}
                >
                  <Icono nombre="inicio" className="h-5 w-5" />
                </span>
                {t("nav.inicio")}
              </button>
              {items.map((s) => {
                const activa = actual === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => ir(s.id)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      activa ? "font-semibold" : "hover:bg-card2"
                    }`}
                    style={activa ? { color: s.color } : undefined}
                  >
                    <span
                      className="grid h-7 w-7 place-items-center rounded-lg text-white"
                      style={{ backgroundColor: s.color }}
                    >
                      <Icono nombre={s.icono} className="h-5 w-5" />
                    </span>
                    {s.nombre}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}