/**
 * Tests de componente para EmptyState.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from '@/components/ui/EmptyState'

describe('EmptyState', () => {
  it('renderiza título y descripción', () => {
    render(
      <EmptyState
        title="No hay mascotas"
        description="Agrega una mascota para comenzar"
      />
    )
    expect(screen.getByText('No hay mascotas')).toBeInTheDocument()
    expect(screen.getByText('Agrega una mascota para comenzar')).toBeInTheDocument()
  })

  it('muestra ícono por defecto (Inbox) si no se pasa icon', () => {
    const { container } = render(
      <EmptyState title="Vacío" description="Sin datos" />
    )
    // El ícono Inbox de lucide renderiza un SVG
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('muestra ícono custom cuando se pasa', () => {
    render(
      <EmptyState
        icon={<span data-testid="custom-icon">🐾</span>}
        title="Sin mascotas"
        description="Test"
      />
    )
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('no muestra botón de acción si no se pasa actionLabel ni onAction', () => {
    render(
      <EmptyState title="Vacío" description="Sin datos" />
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('muestra botón cuando se pasa actionLabel y onAction', () => {
    render(
      <EmptyState
        title="Vacío"
        description="Sin datos"
        actionLabel="Agregar"
        onAction={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument()
  })

  it('ejecuta onAction al hacer click en el botón', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(
      <EmptyState
        title="Vacío"
        description="Sin datos"
        actionLabel="Agregar"
        onAction={onAction}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Agregar' }))
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('no muestra botón si solo se pasa actionLabel sin onAction', () => {
    render(
      <EmptyState
        title="Vacío"
        description="Sin datos"
        actionLabel="Agregar"
      />
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
