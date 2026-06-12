'use client'

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-surface-50 p-6">
          <div className="max-w-md text-center animate-fade-in">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-500">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-surface-900">Algo salió mal</h1>
            <p className="mb-6 text-surface-600">
              Ha ocurrido un error inesperado. Por favor, recarga la página e intenta nuevamente.
            </p>
            <button
              onClick={reset}
              className="rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Recargar página
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
