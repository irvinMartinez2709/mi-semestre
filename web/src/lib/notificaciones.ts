import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Tarea } from "../types";

// Notificaciones personalizadas para las tareas. En Android usan el plugin
// nativo @capacitor/local-notifications; en web usan la Notification API
// mientras la app esté abierta.
const MAX_AVISOS = 16;

function hashTarea(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h % 1999999999) + 1;
}

function idsDeTarea(id: string): number[] {
  const base = hashTarea(id);
  return Array.from({ length: MAX_AVISOS }, (_, i) => base + i);
}

function aFecha(fecha: string, hora: string): Date {
  const [hh = "0", mm = "0"] = hora.split(":").map((x) => x.trim());
  const d = new Date(`${fecha}T00:00:00`);
  d.setHours(Number(hh) || 0, Number(mm) || 0, 0, 0);
  return d;
}

export function fechasRecordatorio(t: Tarea): Date[] {
  const base = aFecha(t.fecha, t.hora);
  if (t.tipoRecordatorio === "unaVez") return [base];
  if (t.tipoRecordatorio === "repetir") {
    const cada = Math.max(5, Math.round(t.repetirCadaMinutos || 30));
    const inicio = base.getTime() - 3 * 3600_000;
    const lista: Date[] = [];
    for (let ts = inicio; ts <= base.getTime() + 60_000; ts += cada * 60_000) {
      lista.push(new Date(ts));
    }
    return lista.slice(0, MAX_AVISOS - 1).concat(base);
  }
  const horas = (t.horasRecordatorio ?? [])
    .map((h) => {
      const [hh = "0", mm = "0"] = h.split(":").map((x) => x.trim());
      const d = new Date(`${t.fecha}T00:00:00`);
      d.setHours(Number(hh) || 0, Number(mm) || 0, 0, 0);
      return d;
    })
    .filter((d) => !Number.isNaN(d.getTime()))
    .slice(0, MAX_AVISOS);
  return horas.length ? horas : [base];
}

function cuerpo(t: Tarea): string {
  return [t.materia, t.descripcion].filter(Boolean).join(" · ");
}

const timeouts = new Map<string, number[]>();

export async function tienePermiso(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      const p = await LocalNotifications.checkPermissions();
      return p.display === "granted";
    }
    return "Notification" in window && Notification.permission === "granted";
  } catch {
    return false;
  }
}

export async function solicitarPermiso(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      const p = await LocalNotifications.checkPermissions();
      if (p.display === "granted") return true;
      const r = await LocalNotifications.requestPermissions();
      return r.display === "granted";
    }
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      return perm === "granted";
    }
    return false;
  } catch {
    return false;
  }
}

export async function programarTareas(tareas: Tarea[]): Promise<void> {
  if (!(await tienePermiso())) return;
  for (const t of tareas) {
    await limpiarTarea(t.id);
    if (t.completada) continue;
    const fechas = fechasRecordatorio(t).filter(
      (d) => d.getTime() >= Date.now() - 60_000
    );
    if (fechas.length === 0) continue;
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: fechas.map((f, i) => ({
          id: hashTarea(t.id) + i,
          title: t.titulo,
          body: cuerpo(t),
          schedule: { at: f, allowWhileIdle: true },
        })),
      });
    } else {
      const ids: number[] = [];
      for (const f of fechas) {
        const delay = f.getTime() - Date.now();
        if (delay > 0) {
          ids.push(
            window.setTimeout(() => {
              new Notification(t.titulo, { body: cuerpo(t) });
            }, delay)
          );
        }
      }
      if (ids.length) timeouts.set(t.id, ids);
    }
  }
}

export async function limpiarTarea(id: string): Promise<void> {
  const pend = timeouts.get(id);
  if (pend) {
    for (const n of pend) window.clearTimeout(n);
    timeouts.delete(id);
  }
  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.cancel({
      notifications: idsDeTarea(id).map((n) => ({ id: n })),
    });
  }
}

export async function limpiarTodas(): Promise<void> {
  for (const ids of timeouts.values()) {
    for (const n of ids) window.clearTimeout(n);
  }
  timeouts.clear();
  if (Capacitor.isNativePlatform()) {
    const pend = await LocalNotifications.getPending();
    if (pend.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pend.notifications.map((n) => ({ id: n.id })),
      });
    }
  }
}