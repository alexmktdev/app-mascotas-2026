/**
 * Tests de componente para ErrorBoundary.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// Componente que lanza error a propósito
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error thrown!')
  }
  return <div>Child OK</div>
}

describe('ErrorBoundary', () => {
  // Suprimir console.error de React durante tests de error boundaries
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })

  afterEach(() => {
    console.error = originalError
  })

  it('renderiza children normalmente si no hay error', () => {
    render(
      <ErrorBoundary>
        <div>Todo bien</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Todo bien')).toBeInTheDocument()
  })

  it('muestra fallback por defecto cuando un hijo lanza error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
    expect(
      screen.getByText(/ha ocurrido un error inesperado/i)
    ).toBeInTheDocument()
  })

  it('muestra botón de recarga en el fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByRole('button', { name: /recargar página/i })).toBeInTheDocument()
  })

  it('muestra fallback custom cuando se proviede', () => {
    render(
      <ErrorBoundary fallback={<div>Error personalizado</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Error personalizado')).toBeInTheDocument()
    expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument()
  })

  it('no muestra fallback si el hijo no lanza error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Child OK')).toBeInTheDocument()
    expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument()
  })
})
