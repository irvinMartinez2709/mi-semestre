import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AjustesProvider } from "./contexto/Ajustes";
import { migrar } from "./lib/migracion";
import "./index.css";

migrar();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AjustesProvider>
      <App />
    </AjustesProvider>
  </React.StrictMode>
);