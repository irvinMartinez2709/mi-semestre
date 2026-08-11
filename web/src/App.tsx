import { useState } from "react";
import type { Vista } from "./types";
import { Header } from "./components/Header";
import { Home } from "./components/HomePage";
import { HorarioPage } from "./components/HorarioPage";
import { AusenciasPage } from "./components/AusenciasPage";
import { CalificacionesPage } from "./components/CalificacionesPage";
import { BitacorasPage } from "./components/BitacorasPage";
import { ConfigPage } from "./components/ConfigPage";

export default function App() {
  const [vista, setVista] = useState<Vista>("inicio");

  const ir = (v: Vista) => {
    setVista(v);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen">
      <Header actual={vista} alNavegar={ir} />
      <main className="w-full px-4 pb-10 pt-4 md:px-6 lg:px-8">
        {vista === "inicio" && <Home alNavegar={ir} />}
        {vista === "horario" && <HorarioPage alNavegar={ir} />}
        {vista === "ausencias" && <AusenciasPage alNavegar={ir} />}
        {vista === "calificaciones" && <CalificacionesPage alNavegar={ir} />}
        {vista === "bitacoras" && <BitacorasPage alNavegar={ir} />}
        {vista === "config" && <ConfigPage alNavegar={ir} />}
      </main>
    </div>
  );
}