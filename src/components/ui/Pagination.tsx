/**
 * Componente de paginación reutilizable.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

interface PaginationProps {
  currentPage: number
  pageCount: number
  total: number
  onPageChange: (page: number) => void
  variant?: 'default' | 'public'
}

export function Pagination({
  currentPage,
  pageCount,
  total,
  onPageChange,
  variant = 'default',
}: PaginationProps) {
  if (pageCount <= 1) return null

  const pages = getVisiblePages(currentPage, pageCount)
  const isPublic = variant === 'public'

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-surface-500">
        {total} resultado{total !== 1 ? 's' : ''}
      </p>

      <div className="flex items-center gap-1">
        {isPublic ? (
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Página anterior"
            className="border-primary-200 bg-white text-primary-700 hover:bg-primary-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {pages.map((page, idx) =>
          page === '...' ? (
            <span key={`dots-${idx}`} className="px-2 text-sm text-surface-400">
              …
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'primary' : isPublic ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => onPageChange(page as number)}
              className={`min-w-[36px] ${isPublic && page !== currentPage ? 'border-primary-200 bg-white text-primary-700 hover:bg-primary-50' : ''}`}
            >
              {page}
            </Button>
          )
        )}

        {isPublic ? (
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Página siguiente"
            className="border-primary-200 bg-white text-primary-700 hover:bg-primary-50"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

/** Calcula las páginas visibles con ellipsis */
function getVisiblePages(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (current <= 3) return [1, 2, 3, 4, '...', total]
  if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}
