/**
 * Tests de componente para Badge.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renderiza el texto children', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('aplica variante default por defecto', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge.className).toContain('bg-surface-100')
  })

  it('aplica variante success', () => {
    render(<Badge variant="success">OK</Badge>)
    const badge = screen.getByText('OK')
    expect(badge.className).toContain('bg-emerald-50')
  })

  it('aplica variante warning', () => {
    render(<Badge variant="warning">Pendiente</Badge>)
    const badge = screen.getByText('Pendiente')
    expect(badge.className).toContain('bg-amber-50')
  })

  it('aplica variante danger', () => {
    render(<Badge variant="danger">Error</Badge>)
    const badge = screen.getByText('Error')
    expect(badge.className).toContain('bg-rose-50')
  })

  it('aplica variante info', () => {
    render(<Badge variant="info">Info</Badge>)
    const badge = screen.getByText('Info')
    expect(badge.className).toContain('bg-primary-50')
  })

  it('aplica className adicional', () => {
    render(<Badge className="extra-class">Test</Badge>)
    const badge = screen.getByText('Test')
    expect(badge.className).toContain('extra-class')
  })

  it('es un <span> con estilos de badge', () => {
    render(<Badge>Pill</Badge>)
    const badge = screen.getByText('Pill')
    expect(badge.tagName).toBe('SPAN')
    expect(badge.className).toContain('rounded-full')
    expect(badge.className).toContain('text-xs')
  })
})
