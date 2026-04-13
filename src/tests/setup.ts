/**
 * Setup global para Vitest + Testing Library.
 */

import '@testing-library/jest-dom/vitest'

// ──────────────────────────────────────────────
// Mock de import.meta.env
// ──────────────────────────────────────────────

if (!(import.meta as Record<string, unknown>).env) {
  ;(import.meta as Record<string, unknown>).env = {}
}
Object.assign(import.meta.env, {
  DEV: true,
  PROD: false,
  VITE_SUPABASE_URL: 'https://test-project.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key-1234567890',
})

// ──────────────────────────────────────────────
// Mock de react-hot-toast
// ──────────────────────────────────────────────

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}))

// ──────────────────────────────────────────────
// Mock de Supabase client (global)
// ──────────────────────────────────────────────

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.supabase.co/storage/test.jpg' } }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://test.supabase.co/signed' }, error: null }),
      }),
    },
    rpc: vi.fn().mockResolvedValue({ error: null }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}))

// ──────────────────────────────────────────────
// Polyfill para dialog element (jsdom no soporta showModal)
// ──────────────────────────────────────────────

HTMLDialogElement.prototype.showModal = HTMLDialogElement.prototype.showModal || function () {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = HTMLDialogElement.prototype.close || function () {
  this.removeAttribute('open')
}
