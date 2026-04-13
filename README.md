# 🐾 App Mascotas 2026

Plataforma web de adopción de mascotas construida con React + Supabase.

## Stack tecnológico

- **Frontend:** React 19, Vite 6, TypeScript, Tailwind CSS v4
- **State Management:** Zustand (auth), TanStack Query v5 (server state)
- **Formularios:** React Hook Form + Zod
- **Backend:** Supabase (Auth, PostgreSQL, RLS, Edge Functions)
- **Componentes:** Lucide icons, Embla Carousel, react-hot-toast

## Requisitos previos

- Node.js 18+
- npm 9+
- Un proyecto en [Supabase](https://supabase.com) (plan free)

## Setup

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd App-Mascotas-2026
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta todo el contenido de `migrations/001_initial.sql`
3. Copia tus credenciales de **Settings → API → API Keys**

### 3. Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
cp .env.example .env.local
```

Edita `.env.local`:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-publishable-key
```

### 4. Crear primer usuario admin

Dado que el sistema solo permite crear usuarios a admins, el primer admin debe crearse directamente:

1. Ve a tu proyecto Supabase → **Authentication → Users**
2. Click **Add User** → ingresa email y contraseña
3. Ve a **Table Editor → profiles**
4. Edita el registro del usuario recién creado: cambia `role` a `admin`

Ahora puedes loguearte y crear más usuarios desde el panel.

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:5173`

## Estructura del proyecto

```
src/
├── api/              # Funciones que llaman a Supabase
├── components/
│   ├── ui/           # Componentes atómicos (Button, Badge, DataTable...)
│   ├── layout/       # Header, Sidebar, Layouts
│   └── pets/         # PetCard, PetSlider, PetFilters, PetForm
├── hooks/            # Custom hooks con TanStack Query
├── pages/
│   ├── public/       # Home, PetDetail, AdoptionForm, Login
│   └── admin/        # Dashboard, PetsList, InProcess, Adopted, Users
├── lib/              # Supabase client, QueryClient, validaciones Zod
├── store/            # Zustand (authStore)
├── types/            # TypeScript types (derivados de Supabase)
├── utils/            # Helpers puros
├── constants/        # Constantes centralizadas
└── router/           # Rutas y ProtectedRoute
```

## Edge Function: crear usuario

La Edge Function `create-user` se encuentra en `supabase/functions/create-user/`.

Para desplegar:
```bash
npx supabase functions deploy create-user
```

## Deploy

### Vercel
```bash
npm run build
# Subir carpeta dist/ o conectar con GitHub
```

### Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Agregar variables de entorno en el dashboard

## Licencia

MIT
