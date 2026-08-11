import { useEffect, useState } from "react";
import { LogoApp } from "./LogoApp";
import { useAjustes } from "../contexto/Ajustes";

export function Splash({ oculto }: { oculto: boolean }) {
  const [mostrar, setMostrar] = useState(!oculto);
  const { t, titulo, subtitulo, colores } = useAjustes();

  useEffect(() => {
    if (oculto) {
      const id = setTimeout(() => setMostrar(false), 500);
      return () => clearTimeout(id);
    }
    setMostrar(true);
  }, [oculto]);

  if (!mostrar) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center transition-opacity duration-500 ${
        oculto ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "var(--c-fondo, 244 246 248)" }}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid h-28 w-28 place-items-center overflow-hidden rounded-3xl shadow-lg">
          <LogoApp className="h-28 w-28" />
        </span>
        <div className="splash-letra">
          <p className="text-xl font-bold">{titulo}</p>
          <p className="mt-0.5 text-sm text-sub">{subtitulo}</p>
        </div>
        <div className="splash-carga">
          <span className="splash-barra" style={{ backgroundColor: colores.acento }} />
        </div>
        <p className="text-xs text-sub">{t("app.titulo")}</p>
      </div>
    </div>
  );
}
