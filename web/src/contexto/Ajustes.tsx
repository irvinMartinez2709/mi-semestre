import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cargar, guardar } from "../lib/storage";
import {
  COLUMNAS_IDIOMA,
  DIAS_CORTO_IDIOMA,
  DIAS_LARGO_IDIOMA,
  traducir,
  type Idioma,
} from "../lib/i18n";

export const COLORES_POR_DEFECTO = {
  acento: "#2E7CF6",
  hoy: "#16A34A",
  futura: "#7DD3FC",
  horario: "#0FA3A3",
  ausencias: "#F59E0B",
  calificaciones: "#8B5CF6",
  bitacoras: "#EC4899",
  materias: "#0D9488",
  config: "#64748B",
  asistPresente: "#10B981",
  asistParcial: "#F59E0B",
  asistAusencia: "#EF4444",
  asistFeriado: "#38BDF8",
} as const;

export type KColor = keyof typeof COLORES_POR_DEFECTO;
export type Colores = Record<KColor, string>;

const ETIQUETAS_COLOR: KColor[] = [
  "acento",
  "hoy",
  "futura",
  "horario",
  "ausencias",
  "calificaciones",
  "bitacoras",
  "materias",
  "config",
  "asistPresente",
  "asistParcial",
  "asistAusencia",
  "asistFeriado",
];

function hexARgb(h: string): string {
  let m = (h || "").replace("#", "");
  if (m.length === 3)
    m = m
      .split("")
      .map((c) => c + c)
      .join("");
  if (m.length !== 6) return "46 124 246";
  return `${parseInt(m.slice(0, 2), 16)} ${parseInt(m.slice(2, 4), 16)} ${parseInt(m.slice(4, 6), 16)}`;
}

function normalizarHex(h: string): string {
  const m = (h || "").trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  return m ? `#${m[1].toLowerCase()}` : h;
}

interface Persistido {
  idioma?: Idioma;
  colores?: Partial<Colores>;
  encabezado?: { titulo?: string; subtitulo?: string };
}

const CLAVE = "ms.ajustes.v1";

const ENCABEZADO_DEFECTO = { titulo: "Mi Semestre", subtitulo: "Semestre 2 · Año 2" };

function leerPersistido(): {
  idioma: Idioma;
  colores: Colores;
  encabezado: { titulo: string; subtitulo: string };
} {
  const p = cargar<Persistido>(CLAVE, {});
  return {
    idioma: p.idioma === "en" ? "en" : "es",
    colores: { ...COLORES_POR_DEFECTO, ...(p.colores ?? {}) },
    encabezado: {
      titulo: p.encabezado?.titulo || ENCABEZADO_DEFECTO.titulo,
      subtitulo: p.encabezado?.subtitulo || ENCABEZADO_DEFECTO.subtitulo,
    },
  };
}

type Tema = "claro" | "oscuro";
const CLAVE_TEMA = "ms.tema.v1";

function temaInicial(): Tema {
  const g = localStorage.getItem(CLAVE_TEMA);
  if (g === "claro" || g === "oscuro") return g;
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches)
    return "oscuro";
  return "claro";
}

export interface AjustesValor {
  idioma: Idioma;
  locale: string;
  t: (clave: string, ...args: (string | number)[]) => string;
  dias: string[];
  diasCorto: string[];
  fijarIdioma: (i: Idioma) => void;
  tema: Tema;
  alternarTema: () => void;
  colores: Colores;
  esPorDefecto: boolean;
  fijarColor: (k: KColor, v: string) => void;
  restablecerColores: () => void;
  titulo: string;
  subtitulo: string;
  fijarEncabezado: (titulo: string, subtitulo: string) => void;
}

const AjustesContext = createContext<AjustesValor | null>(null);

export interface ConfirmarOpciones {
  titulo?: string;
  mensaje: string;
  confirmarTexto?: string;
  cancelarTexto?: string;
  peligro?: boolean;
}

export interface ConfirmarValor {
  confirmar: (o: ConfirmarOpciones) => Promise<boolean>;
  notificar: (mensaje: string) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmarValor | null>(null);

export function AjustesProvider({ children }: { children: ReactNode }) {
  const inicial = useRef(leerPersistido());

  const [idioma, setIdioma] = useState<Idioma>(inicial.current.idioma);
  const [colores, setColores] = useState<Colores>(inicial.current.colores);
  const [encabezado, setEncabezado] = useState(inicial.current.encabezado);
  const [tema, setTema] = useState<Tema>(temaInicial);

  const [confirmacion, setConfirmacion] = useState<{
    opcion: ConfirmarOpciones;
    resolver: (ok: boolean) => void;
    tipo: "confirmar" | "notificar";
  } | null>(null);

  useEffect(() => {
    guardar(CLAVE, { idioma, colores, encabezado });
  }, [idioma, colores, encabezado]);

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle("dark", tema === "oscuro");
    localStorage.setItem(CLAVE_TEMA, tema);
    const meta = document.getElementById("meta-tema");
    if (meta)
      meta.setAttribute("content", tema === "oscuro" ? "#0F1419" : "#F4F6F8");
  }, [tema]);

  useEffect(() => {
    const raiz = document.documentElement;
    for (const k of ETIQUETAS_COLOR) {
      raiz.style.setProperty(`--c-${k}`, hexARgb(colores[k]));
    }
  }, [colores]);

  const t = (clave: string, ...args: (string | number)[]) =>
    traducir(idioma, clave, ...args);

  const fijarColor = (k: KColor, v: string) => {
    setColores((c) => ({ ...c, [k]: normalizarHex(v) }));
  };

  const restablecerColores = () => setColores({ ...COLORES_POR_DEFECTO });

  const confirmar = (opcion: ConfirmarOpciones) =>
    new Promise<boolean>((resolver) => {
      setConfirmacion({ opcion, resolver, tipo: "confirmar" });
    });

  const notificar = (mensaje: string) =>
    new Promise<void>((resolver) => {
      setConfirmacion({
        opcion: { mensaje },
        resolver: () => resolver(),
        tipo: "notificar",
      });
    });

  const cerrarConfirmacion = (ok: boolean) => {
    if (!confirmacion) return;
    confirmacion.resolver(ok);
    setConfirmacion(null);
  };

  return (
    <AjustesContext.Provider
      value={{
        idioma,
        locale: COLUMNAS_IDIOMA[idioma],
        t,
        dias: DIAS_LARGO_IDIOMA[idioma],
        diasCorto: DIAS_CORTO_IDIOMA[idioma],
        fijarIdioma: (i) => setIdioma(i),
        tema,
        alternarTema: () => setTema((x) => (x === "claro" ? "oscuro" : "claro")),
        colores,
        esPorDefecto: Object.keys(colores).every(
          (k) =>
            colores[k as KColor] === COLORES_POR_DEFECTO[k as KColor]
        ),
        fijarColor,
        restablecerColores,
        titulo: encabezado.titulo,
        subtitulo: encabezado.subtitulo,
        fijarEncabezado: (titulo, subtitulo) =>
          setEncabezado({
            titulo: titulo.trim() || ENCABEZADO_DEFECTO.titulo,
            subtitulo:
              subtitulo.trim() || ENCABEZADO_DEFECTO.subtitulo,
          }),
      }}
    >
      <ConfirmContext.Provider value={{ confirmar, notificar }}>
        {children}
        {confirmacion && (
          <CuadroConfirmacion
            opcion={confirmacion.opcion}
            tipo={confirmacion.tipo}
            onAceptar={() => cerrarConfirmacion(true)}
            onCancelar={() => cerrarConfirmacion(false)}
            t={(clave) => traducir(idioma, clave)}
          />
        )}
      </ConfirmContext.Provider>
    </AjustesContext.Provider>
  );
}

function CuadroConfirmacion({
  opcion,
  tipo,
  onAceptar,
  onCancelar,
  t,
}: {
  opcion: ConfirmarOpciones;
  tipo: "confirmar" | "notificar";
  onAceptar: () => void;
  onCancelar: () => void;
  t: (clave: string) => string;
}) {
  const esNotificar = tipo === "notificar";
  const color = opcion.peligro ? "#EF4444" : "var(--c-acento, #2E7CF6)";
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4"
      onClick={esNotificar ? onAceptar : onCancelar}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-borde bg-card p-4 pop"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-base font-bold">{opcion.titulo ?? ""}</p>
        <p className="mt-1.5 text-sm text-tinta/90">{opcion.mensaje}</p>
        <div className="mt-4 flex justify-end gap-2">
          {!esNotificar && (
            <button
              onClick={onCancelar}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-borde bg-card px-4 py-2 text-sm font-semibold transition-colors hover:border-acento text-tinta"
            >
              {opcion.cancelarTexto ?? t("comun.cancelar")}
            </button>
          )}
          <button
            onClick={onAceptar}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            {esNotificar
              ? t("comun.cerrar")
              : opcion.confirmarTexto ?? t("comun.eliminar")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useAjustes(): AjustesValor {
  const ctx = useContext(AjustesContext);
  if (!ctx) throw new Error("useAjustes debe usarse dentro de AjustesProvider");
  return ctx;
}

export function useConfirmar(): ConfirmarValor {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirmar debe usarse dentro de AjustesProvider");
  return ctx;
}