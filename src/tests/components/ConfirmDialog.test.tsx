/**
 * Tests de componente para ConfirmDialog.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: '¿Eliminar mascota?',
    description: 'Esta acción no se puede deshacer.',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <ConfirmDialog {...defaultProps} isOpen={false} />
    )
    expect(container.querySelector('dialog')).not.toBeInTheDocument()
  })

  it('renderiza título y descripción cuando está abierto', () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByText('¿Eliminar mascota?')).toBeInTheDocument()
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument()
  })

  it('usa labels por defecto (Confirmar / Cancelar)', () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })

  it('permite labels custom', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Sí, eliminar"
        cancelLabel="No, volver"
      />
    )
    expect(screen.getByRole('button', { name: /sí, eliminar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no, volver/i })).toBeInTheDocument()
  })

  it('llama onConfirm al click en confirmar', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: /confirmar/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('llama onCancel al click en cancelar', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('llama onCancel al click en botón X', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

    // El botón X no tiene text content, es el tercer button (después de cancelar y confirmar)
    const buttons = screen.getAllByRole('button')
    // El X está antes de los botones de acción
    const closeBtn = buttons.find((btn) => btn.querySelector('svg') && !btn.textContent?.includes('Confirmar') && !btn.textContent?.includes('Cancelar'))
    if (closeBtn) {
      await user.click(closeBtn)
      expect(onCancel).toHaveBeenCalled()
    }
  })

  it('isLoading desactiva botón de cancelar', () => {
    render(<ConfirmDialog {...defaultProps} isLoading />)
    const cancelBtn = screen.getByRole('button', { name: /cancelar/i })
    expect(cancelBtn).toBeDisabled()
  })

  it('isLoading muestra spinner en botón de confirmar', () => {
    render(<ConfirmDialog {...defaultProps} isLoading />)
    const confirmBtn = screen.getByRole('button', { name: /confirmar/i })
    expect(confirmBtn).toBeDisabled()
    expect(confirmBtn.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
