export function LogoApp({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <img
      src="/icono-app.png"
      alt="Mi Semestre"
      className={`${className} object-contain`}
      draggable={false}
    />
  );
}