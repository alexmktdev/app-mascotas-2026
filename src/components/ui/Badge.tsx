/**
 * Badge reutilizable para estados.
 */

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const variantClasses: Record<string, string> = {
  default: 'bg-surface-100 text-surface-700 border-surface-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-primary-50 text-primary-700 border-primary-200',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
