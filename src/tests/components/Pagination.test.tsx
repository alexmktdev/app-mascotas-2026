/**
 * Tests de componente para Pagination.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from '@/components/ui/Pagination'

describe('Pagination', () => {
  it('no renderiza nada si pageCount <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} pageCount={1} total={5} onPageChange={vi.fn()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renderiza el total de resultados', () => {
    render(
      <Pagination currentPage={1} pageCount={3} total={25} onPageChange={vi.fn()} />
    )
    expect(screen.getByText('25 resultados')).toBeInTheDocument()
  })

  it('muestra "resultado" singular cuando total es 1', () => {
    render(
      <Pagination currentPage={1} pageCount={2} total={1} onPageChange={vi.fn()} />
    )
    expect(screen.getByText('1 resultado')).toBeInTheDocument()
  })

  it('botón anterior disabled en primera página', () => {
    render(
      <Pagination currentPage={1} pageCount={5} total={50} onPageChange={vi.fn()} />
    )
    const prevBtn = screen.getByLabelText('Página anterior')
    expect(prevBtn).toBeDisabled()
  })

  it('botón siguiente disabled en última página', () => {
    render(
      <Pagination currentPage={5} pageCount={5} total={50} onPageChange={vi.fn()} />
    )
    const nextBtn = screen.getByLabelText('Página siguiente')
    expect(nextBtn).toBeDisabled()
  })

  it('botón anterior habilitado en página intermedia', () => {
    render(
      <Pagination currentPage={3} pageCount={5} total={50} onPageChange={vi.fn()} />
    )
    const prevBtn = screen.getByLabelText('Página anterior')
    expect(prevBtn).not.toBeDisabled()
  })

  it('llama onPageChange con la página anterior al hacer click', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(
      <Pagination currentPage={3} pageCount={5} total={50} onPageChange={onPageChange} />
    )

    await user.click(screen.getByLabelText('Página anterior'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('llama onPageChange con la página siguiente al hacer click', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(
      <Pagination currentPage={3} pageCount={5} total={50} onPageChange={onPageChange} />
    )

    await user.click(screen.getByLabelText('Página siguiente'))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('llama onPageChange al hacer click en un número de página', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(
      <Pagination currentPage={1} pageCount={5} total={50} onPageChange={onPageChange} />
    )

    await user.click(screen.getByRole('button', { name: '3' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('muestra ellipsis para rangos grandes', () => {
    render(
      <Pagination currentPage={5} pageCount={20} total={200} onPageChange={vi.fn()} />
    )
    // Debe haber al menos un "…"
    expect(screen.getAllByText('…').length).toBeGreaterThan(0)
  })

  it('no muestra ellipsis si pageCount <= 7', () => {
    render(
      <Pagination currentPage={3} pageCount={6} total={60} onPageChange={vi.fn()} />
    )
    expect(screen.queryByText('…')).not.toBeInTheDocument()
  })
})
