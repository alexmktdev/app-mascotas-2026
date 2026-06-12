import 'server-only'

export function sanitizeText(s: string | null | undefined): string | null {
  if (s == null) return null
  const t = s.replace(/\0/g, '').trim()
  return t === '' ? null : t
}

export function normalizeWeightKg(v: number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  if (Number.isNaN(n) || n < 0 || n > 200) return null
  return n
}
