/**
 * Helpers puros — sin efectos secundarios.
 */

import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'

// ──────────────────────────────────────────────
// Formato de fechas
// ──────────────────────────────────────────────

/** Formato relativo: "hace 3 días" */
export function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '-'
  return formatDistanceToNow(date, { addSuffix: true, locale: es })
}

/** Formato legible: "12 abr 2026" */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '-'
  return format(date, 'dd MMM yyyy', { locale: es })
}

/** Formato completo: "12 de abril de 2026, 14:30" */
export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
}

// ──────────────────────────────────────────────
// Edad de mascotas
// ──────────────────────────────────────────────

/** Convierte meses a texto legible: "2 años y 3 meses" */
export function formatAge(months: number): string {
  if (months < 1) return 'Menos de 1 mes'
  if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  const yearStr = `${years} ${years === 1 ? 'año' : 'años'}`
  if (remainingMonths === 0) return yearStr
  return `${yearStr} y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`
}

// ──────────────────────────────────────────────
// Sanitización
// ──────────────────────────────────────────────

/** Sanitiza input de búsqueda: remueve caracteres peligrosos */
export function sanitizeSearchInput(input: string): string {
  return input.replace(/[%_\\]/g, '').trim().slice(0, 100)
}

// ──────────────────────────────────────────────
// Debounce
// ──────────────────────────────────────────────

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), ms)
  }
}
