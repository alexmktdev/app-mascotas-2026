/**
 * Tests unitarios para src/lib/sanitize.ts
 */

import { describe, it, expect } from 'vitest'
import { escapeHtml } from '@/lib/sanitize'

describe('escapeHtml', () => {
  it('escapa &', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapa <', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })

  it('escapa >', () => {
    expect(escapeHtml('2 > 1')).toBe('2 &gt; 1')
  })

  it('escapa comillas dobles', () => {
    expect(escapeHtml('attr="val"')).toBe('attr=&quot;val&quot;')
  })

  it('escapa comillas simples', () => {
    expect(escapeHtml("it's")).toBe("it&#39;s")
  })

  it('escapa múltiples caracteres en una cadena', () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;')
  })

  it('no modifica cadenas sin caracteres especiales', () => {
    expect(escapeHtml('hello world 123')).toBe('hello world 123')
  })

  it('maneja cadena vacía', () => {
    expect(escapeHtml('')).toBe('')
  })
})
