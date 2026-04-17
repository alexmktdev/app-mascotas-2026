/**
 * Tests del formulario de mascota (presentacional, RHF + zod).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PetForm } from '@/components/pets/PetForm'
import type { PetFormFields } from '@/lib/validations'

const defaultCreate: PetFormFields = {
  name: 'Luna',
  species: 'dog',
  breed: '',
  age_months: 12,
  gender: 'female',
  size: undefined,
  color: '',
  contact_phone: '',
  weight_kg: undefined,
  sterilized: false,
  vaccinated: false,
  dewormed: false,
  microchip: false,
  health_notes: '',
  personality: '',
  story: '',
  special_needs: '',
  status: 'available',
  drive_folder_id: '',
  intake_date: '',
}

describe('PetForm', () => {
  it('renderiza modo crear con botón Registrar mascota', () => {
    render(
      <PetForm mode="create" defaultValues={defaultCreate} onSubmit={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /registrar mascota/i })).toBeInTheDocument()
  })

  it('renderiza modo edición con selector de estado y Guardar cambios', () => {
    render(
      <PetForm mode="edit" defaultValues={defaultCreate} onSubmit={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument()
    expect(document.querySelector('select[name="status"]')).toBeTruthy()
  })

  it('llama onSubmit con datos válidos al enviar', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <PetForm mode="create" defaultValues={defaultCreate} onSubmit={onSubmit} />,
    )
    await user.clear(screen.getByPlaceholderText(/Luna/i))
    await user.type(screen.getByPlaceholderText(/Luna/i), 'Rocky')
    await user.click(screen.getByRole('button', { name: /registrar mascota/i }))
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled())
    const payload = onSubmit.mock.calls[0][0] as PetFormFields
    expect(payload.name).toBe('Rocky')
  })
})
