import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationLinksProps {
  currentPage: number
  pageCount: number
  total: number
  /** Construye la URL para una página dada, preservando el resto de filtros. */
  hrefForPage: (page: number) => string
}

export function PaginationLinks({ currentPage, pageCount, total, hrefForPage }: PaginationLinksProps) {
  if (pageCount <= 1) return null

  const pages = getVisiblePages(currentPage, pageCount)

  const linkClass = (active: boolean, disabled: boolean) =>
    `inline-flex min-w-[36px] items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
      disabled
        ? 'cursor-not-allowed border-surface-100 bg-surface-50 text-surface-300'
        : active
          ? 'border-primary-600 bg-primary-600 text-white'
          : 'border-primary-200 bg-white text-primary-700 hover:bg-primary-50'
    }`

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-surface-500">
        {total} resultado{total !== 1 ? 's' : ''}
      </p>

      <div className="flex items-center gap-1">
        {currentPage <= 1 ? (
          <span className={linkClass(false, true)} aria-disabled="true">
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </span>
        ) : (
          <Link href={hrefForPage(currentPage - 1)} className={linkClass(false, false)} aria-label="Página anterior" scroll={false}>
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Link>
        )}

        {pages.map((page, idx) =>
          page === '...' ? (
            <span key={`dots-${idx}`} className="px-2 text-sm text-surface-400">…</span>
          ) : (
            <Link
              key={page}
              href={hrefForPage(page)}
              className={linkClass(page === currentPage, false)}
              scroll={false}
            >
              {page}
            </Link>
          ),
        )}

        {currentPage >= pageCount ? (
          <span className={linkClass(false, true)} aria-disabled="true">
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </span>
        ) : (
          <Link href={hrefForPage(currentPage + 1)} className={linkClass(false, false)} aria-label="Página siguiente" scroll={false}>
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  )
}

function getVisiblePages(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (current <= 3) return [1, 2, 3, 4, '...', total]
  if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}
