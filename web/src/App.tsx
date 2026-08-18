import { useEffect, useRef, useState } from "react";
import type { Vista } from "./types";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Header } from "./components/Header";
import { Splash } from "./components/Splash";
import { Home } from "./components/HomePage";
import { HorarioPage } from "./components/HorarioPage";
import { AusenciasPage } from "./components/AusenciasPage";
import { CalificacionesPage } from "./components/CalificacionesPage";
import { BitacorasPage } from "./components/BitacorasPage";
import { MateriasPage } from "./components/MateriasPage";
import { TareasPage } from "./components/TareasPage";
import { ConfigPage } from "./components/ConfigPage";
import { useAjustes, useConfirmar } from "./contexto/Ajustes";

export default function App() {
  const [vista, setVista] = useState<Vista>("inicio");
  const [splash, setSplash] = useState(true);
  const { t } = useAjustes();
  const { notificar } = useConfirmar();
  const ultimaSalida = useRef(0);
  const vistaRef = useRef(vista);
  vistaRef.current = vista;

  useEffect(() => {
    const id = setTimeout(() => setSplash(false), 2400);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = CapApp.addListener("backButton", () => {
      const v = vistaRef.current;
      if (v !== "inicio") {
        ir("inicio");
        return;
      }
      const ahora = Date.now();
      if (ahora - ultimaSalida.current < 2000) {
        void CapApp.exitApp();
      } else {
        ultimaSalida.current = ahora;
        void notificar(t("app.salir"));
      }
    });
    return () => {
      void listener.then((l) => l.remove());
    };
  }, [t, notificar]);

  const ir = (v: Vista) => {
    setVista(v);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen">
      <Splash oculto={!splash} />
      <div className={splash ? "pointer-events-none invisible" : undefined}>
        <Header actual={vista} alNavegar={ir} />
        <main className="w-full px-4 pb-10 pt-4 md:px-6 lg:px-8">
          {vista === "inicio" && <Home alNavegar={ir} />}
          {vista === "horario" && <HorarioPage alNavegar={ir} />}
          {vista === "ausencias" && <AusenciasPage alNavegar={ir} />}
          {vista === "calificaciones" && <CalificacionesPage alNavegar={ir} />}
          {vista === "bitacoras" && <BitacorasPage alNavegar={ir} />}
          {vista === "materias" && <MateriasPage alNavegar={ir} />}
          {vista === "tareas" && <TareasPage alNavegar={ir} />}
          {vista === "config" && <ConfigPage alNavegar={ir} />}
        </main>
      </div>
    </div>
  );
}