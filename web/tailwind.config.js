/**
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        fondo: "rgb(var(--c-fondo) / <alpha-value>)",
        card: "rgb(var(--c-card) / <alpha-value>)",
        card2: "rgb(var(--c-card2) / <alpha-value>)",
        borde: "rgb(var(--c-borde) / <alpha-value>)",
        tinta: "rgb(var(--c-tinta) / <alpha-value>)",
        sub: "rgb(var(--c-sub) / <alpha-value>)",
        acento: "rgb(var(--c-acento) / <alpha-value>)",
        hoy: "rgb(var(--c-hoy) / <alpha-value>)",
        futura: "rgb(var(--c-futura) / <alpha-value>)",
        horario: "rgb(var(--c-horario) / <alpha-value>)",
        ausencias: "rgb(var(--c-ausencias) / <alpha-value>)",
        calificaciones: "rgb(var(--c-calificaciones) / <alpha-value>)",
        bitacoras: "rgb(var(--c-bitacoras) / <alpha-value>)",
        config: "rgb(var(--c-config) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      animation: {
        "fade-in": "fadeIn 0.35s ease-in-out",
        "pop": "pop 0.25s cubic-bezier(.175,.885,.32,1.275)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};