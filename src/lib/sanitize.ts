/**
 * Escape de texto para inserción en HTML (cuando en el futuro se renderice HTML dinámico).
 * React ya escapa children en JSX; usa esto solo si construyes HTML con plantillas.
 */

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPE[ch] ?? ch)
}
