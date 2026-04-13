/**
 * Estado vacío genérico con mensaje y CTA opcional.
 */

import { Inbox } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 text-surface-400">
        {icon || <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-surface-800">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-surface-500">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
