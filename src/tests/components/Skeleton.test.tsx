/**
 * Tests de componente para Skeleton.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton, PetCardSkeleton, TableRowSkeleton, StatCardSkeleton } from '@/components/ui/Skeleton'

describe('Skeleton', () => {
  it('renderiza un div con clase skeleton', () => {
    const { container } = render(<Skeleton />)
    const div = container.firstChild as HTMLElement
    expect(div.tagName).toBe('DIV')
    expect(div.className).toContain('skeleton')
  })

  it('aplica className adicional', () => {
    const { container } = render(<Skeleton className="h-8 w-3/4" />)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('h-8')
    expect(div.className).toContain('w-3/4')
  })
})

describe('PetCardSkeleton', () => {
  it('renderiza sin errores', () => {
    const { container } = render(<PetCardSkeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('contiene múltiples skeletons', () => {
    const { container } = render(<PetCardSkeleton />)
    const skeletons = container.querySelectorAll('.skeleton')
    expect(skeletons.length).toBeGreaterThan(2)
  })
})

describe('TableRowSkeleton', () => {
  it('renderiza 5 columnas por defecto', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton />
        </tbody>
      </table>
    )
    const cells = container.querySelectorAll('td')
    expect(cells.length).toBe(5)
  })

  it('renderiza N columnas cuando se especifica', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton columns={3} />
        </tbody>
      </table>
    )
    const cells = container.querySelectorAll('td')
    expect(cells.length).toBe(3)
  })

  it('cada celda tiene un skeleton', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton columns={4} />
        </tbody>
      </table>
    )
    const skeletons = container.querySelectorAll('.skeleton')
    expect(skeletons.length).toBe(4)
  })
})

describe('StatCardSkeleton', () => {
  it('renderiza sin errores', () => {
    const { container } = render(<StatCardSkeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('contiene 2 skeletons', () => {
    const { container } = render(<StatCardSkeleton />)
    const skeletons = container.querySelectorAll('.skeleton')
    expect(skeletons.length).toBe(2)
  })
})
