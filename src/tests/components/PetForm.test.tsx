/**
 * Tests del formulario de mascota: input de fotos (fuera de RHF) y flujo de subida al enviar.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PetForm } from '@/components/pets/PetForm'
import toast from 'react-hot-toast'

vi.mock('@/api/petPhotosStorage', () => ({
  uploadPetPhoto: vi.fn().mockResolvedValue(
    'https://xyz.supabase.co/storage/v1/object/public/pet-photos/user-abc/photo.webp',
  ),
}))

import { uploadPetPhoto } from '@/api/petPhotosStorage'
import toast from 'react-hot-toast'

describe('PetForm', () => {
  beforeEach(() => {
    vi.mocked(uploadPetPhoto).mockClear()
    vi.mocked(toast.error).mockClear()
  })

  it('incluye input type=file con accept de imágenes y aria-label (no va por react-hook-form)', () => {
    render(<PetForm mode="create" userId="u1" onSubmit={vi.fn()} />)
    const input = screen.getByLabelText(/Seleccionar imagen para la ficha de la mascota/i)
    expect(input).toHaveAttribute('type', 'file')
    expect(input.getAttribute('accept')).toContain('image/jpeg')
    expect(input.getAttribute('accept')).toContain('image/png')
    expect(input.className).toMatch(/hidden/)
  })

  it('rechaza tipo no imagen al elegir archivo (toast)', () => {
    render(<PetForm mode="create" userId="u1" onSubmit={vi.fn()} />)
    const input = screen.getByLabelText(/Seleccionar imagen para la ficha de la mascota/i)
    const bad = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' })
    // Simula un change directo (p. ej. drag&drop o bug del SO); userEvent.upload omite archivos fuera de `accept`.
    fireEvent.change(input, { target: { files: [bad] } })
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/formato no permitido/i),
    )
    expect(screen.queryByText(/Nueva foto/i)).not.toBeInTheDocument()
  })

  it('si hay foto nueva y no hay userId, no llama a upload ni onSubmit y muestra toast', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PetForm mode="create" userId={null} onSubmit={onSubmit} />)
    await user.type(screen.getByPlaceholderText(/Luna/i), 'Mora')
    const input = screen.getByLabelText(/Seleccionar imagen para la ficha de la mascota/i)
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'x.jpg', { type: 'image/jpeg' })
    await user.upload(input, file)
    expect(await screen.findByText(/Nueva foto/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /registrar mascota/i }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Debes iniciar sesión para subir fotos')
    })
    expect(uploadPetPhoto).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('con userId: sube foto mockeada y onSubmit recibe photo_urls', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<PetForm mode="create" userId="user-abc" onSubmit={onSubmit} />)
    await user.type(screen.getByPlaceholderText(/Luna/i), 'Rocky')
    const input = screen.getByLabelText(/Seleccionar imagen para la ficha de la mascota/i)
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'rocky.jpg', { type: 'image/jpeg' })
    await user.upload(input, file)
    expect(await screen.findByText(/Nueva foto/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /registrar mascota/i }))
    await waitFor(() => expect(uploadPetPhoto).toHaveBeenCalledTimes(1))
    const [uid, uploaded] = vi.mocked(uploadPetPhoto).mock.calls[0]
    expect(uid).toBe('user-abc')
    expect(uploaded).toBeInstanceOf(File)
    expect((uploaded as File).type).toBe('image/jpeg')
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const payload = onSubmit.mock.calls[0][0] as { name: string; photo_urls: string[] }
    expect(payload.name).toBe('Rocky')
    expect(payload.photo_urls).toEqual([
      'https://xyz.supabase.co/storage/v1/object/public/pet-photos/user-abc/photo.webp',
    ])
  })

  it('permite volver a elegir archivo: el input resetea value tras onChange', async () => {
    const user = userEvent.setup()
    render(<PetForm mode="create" userId="u1" onSubmit={vi.fn()} />)
    const input = screen.getByLabelText(/Seleccionar imagen para la ficha de la mascota/i) as HTMLInputElement
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'a.jpg', { type: 'image/jpeg' })
    await user.upload(input, file)
    expect(input.value).toBe('')
  })
})
