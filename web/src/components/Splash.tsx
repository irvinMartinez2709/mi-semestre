import { useEffect, useState } from "react";
import { LogoApp } from "./LogoApp";

export function Splash({ oculto }: { oculto: boolean }) {
  const [mostrar, setMostrar] = useState(!oculto);

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
      style={{ backgroundColor: "#000" }}
    >
      <span className="splash-logo">
        <LogoApp className="h-28 w-28" />
      </span>
    </div>
  );
}
