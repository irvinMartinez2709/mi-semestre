let contador = 0;

export function uid(): string {
  contador += 1;
  return `${Date.now().toString(36)}-${contador.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function cargar<T>(clave: string, porDefecto: T): T {
  try {
    const raw = localStorage.getItem(clave);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // usa el valor por defecto
  }
  guardar(clave, porDefecto);
  return porDefecto;
}

export function guardar<T>(clave: string, valor: T): void {
  localStorage.setItem(clave, JSON.stringify(valor));
}

export function redondear(n: number, cifras = 1): number {
  const f = Math.pow(10, cifras);
  return Math.round(n * f) / f;
}