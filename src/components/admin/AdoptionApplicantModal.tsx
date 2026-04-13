/**
 * Modal: ficha completa del adoptante (alineada al formulario público).
 */

import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { HOUSING_TYPE_LABELS, ADOPTION_STATUS_LABELS } from '@/constants'
import { formatRelativeDate } from '@/utils'
import type { AdoptionRequestAdminRow } from '@/types'
import { X } from 'lucide-react'

function boolEs(v: boolean | null | undefined): string {
  if (v === true) return 'Sí'
  if (v === false) return 'No'
  return 'No indicado'
}

function housingLabel(v: AdoptionRequestAdminRow['housing_type']): string {
  if (!v) return '—'
  return HOUSING_TYPE_LABELS[v] ?? v
}

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  const display = value.trim() === '' ? '—' : value
  return (
    <div className="grid gap-0.5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-x-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-surface-500">{label}</dt>
      <dd className={`text-sm text-surface-900 ${multiline ? 'whitespace-pre-wrap break-words' : 'break-words'}`}>
        {display}
      </dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm">
      <h4 className="mb-3 border-b border-surface-100 pb-2 text-sm font-bold text-surface-800">{title}</h4>
      <dl className="space-y-3">{children}</dl>
    </section>
  )
}

interface AdoptionApplicantModalProps {
  request: AdoptionRequestAdminRow
  onClose: () => void
}

export function AdoptionApplicantModal({ request: r, onClose }: AdoptionApplicantModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adoption-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[min(92vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-scale-in">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-surface-100 bg-primary-600 px-5 py-4 text-white">
          <div>
            <p id="adoption-modal-title" className="text-lg font-extrabold">
              Solicitud de adopción
            </p>
            <p className="mt-1 text-sm text-white/90">
              Mascota:{' '}
              <span className="font-semibold">{r.pet_name ?? 'Sin nombre'}</span>
              <span className="mx-1 text-white/60">·</span>
              <Link
                to={`/admin/pets/${r.pet_id}/edit`}
                className="underline decoration-white/40 underline-offset-2 hover:decoration-white"
                onClick={onClose}
              >
                Abrir ficha en admin
              </Link>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex rounded-full bg-white/15 px-2.5 py-0.5 font-medium text-white">
                {ADOPTION_STATUS_LABELS[r.status]}
              </span>
              <span className="text-white/80">Recibida {formatRelativeDate(r.created_at)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/90 transition-colors hover:bg-white/10"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-surface-50 p-4 sm:p-5">
          <div className="space-y-4">
            <Section title="Datos personales">
              <Row label="Nombre completo" value={r.full_name} />
              <Row label="Correo" value={r.email} />
              <Row label="Teléfono" value={r.phone} />
              <Row label="RUT / Identificación" value={r.id_number} />
            </Section>

            <Section title="Dirección">
              <Row label="Dirección" value={r.address} />
              <Row label="Ciudad" value={r.city} />
              <Row label="Tipo de vivienda" value={housingLabel(r.housing_type)} />
              <Row label="¿Tiene patio?" value={boolEs(r.has_yard)} />
            </Section>

            <Section title="Hogar y familia">
              <Row label="¿Otras mascotas?" value={boolEs(r.has_other_pets)} />
              <Row label="Descripción otras mascotas" value={r.other_pets_description ?? ''} multiline />
              <Row label="¿Niños en el hogar?" value={boolEs(r.has_children)} />
              <Row label="Edades de los niños" value={r.children_ages ?? ''} />
            </Section>

            <Section title="Motivación y disponibilidad">
              <Row label="¿Por qué quiere adoptar?" value={r.motivation} multiline />
              <Row label="Experiencia con mascotas" value={r.experience_with_pets ?? ''} multiline />
              <Row label="Horario laboral / disponibilidad" value={r.work_schedule ?? ''} />
            </Section>

            {(r.admin_notes?.trim() || r.reviewed_at) && (
              <Section title="Gestión interna">
                {r.admin_notes?.trim() ? <Row label="Notas administrador" value={r.admin_notes} multiline /> : null}
                {r.reviewed_at ? (
                  <Row label="Última revisión" value={new Date(r.reviewed_at).toLocaleString('es-CL')} />
                ) : null}
              </Section>
            )}
          </div>
        </div>

        <footer className="shrink-0 border-t border-surface-100 bg-white px-5 py-3">
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Link
              to={`/pets/${r.pet_id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-100 px-4 py-2.5 text-sm font-semibold text-surface-800 transition-colors hover:bg-surface-200"
            >
              Ver mascota (público)
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
