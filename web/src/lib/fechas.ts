const DIAS_CORTO = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export function isoHoy(): string {
  return isoDe(new Date());
}

export function isoDe(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function sumarDiasISO(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(y, m - 1, d + n);
  return isoDe(fecha);
}

export function lunesDeISO(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  const desplazamiento = (fecha.getDay() + 6) % 7;
  fecha.setDate(fecha.getDate() - desplazamiento);
  return isoDe(fecha);
}

export function diaSemanaDe(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return DIAS_CORTO[new Date(y, m - 1, d).getDay()];
}

export function formatoFechaCorta(iso: string, locale = "es-MX"): string {
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatoFechaNumero(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}