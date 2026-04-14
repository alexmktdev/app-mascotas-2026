/**
 * Tests de componente para Button.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renderiza el texto children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('aplica la variante primary por defecto', () => {
    render(<Button>Test</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-primary-600')
  })

  it('aplica variante secondary', () => {
    render(<Button variant="secondary">Test</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-surface-100')
  })

  it('aplica variante danger', () => {
    render(<Button variant="danger">Delete</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-rose-600')
  })

  it('aplica variante ghost', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('text-surface-600')
  })

  it('aplica variante outline', () => {
    render(<Button variant="outline">Outline</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('border')
  })

  it('aplica tamaño sm', () => {
    render(<Button size="sm">Small</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('px-4')
  })

  it('aplica tamaño lg', () => {
    render(<Button size="lg">Large</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('px-8')
  })

  it('está disabled cuando disabled={true}', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('está disabled cuando isLoading={true}', () => {
    render(<Button isLoading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('muestra ícono de carga cuando isLoading', () => {
    render(<Button isLoading>Saving</Button>)
    // El Loader2 de lucide-react renderiza un SVG con animate-spin
    const btn = screen.getByRole('button')
    expect(btn.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('ejecuta onClick al hacer click', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('no ejecuta onClick cuando disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick} disabled>Click</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('no ejecuta onClick cuando isLoading', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick} isLoading>Click</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('aplica className adicional', () => {
    render(<Button className="custom-class">Test</Button>)
    expect(screen.getByRole('button').className).toContain('custom-class')
  })

  it('se renderiza con type="submit" si se especifica', () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
