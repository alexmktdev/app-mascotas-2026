# 🐾 App Mascotas 2026

Plataforma web de adopción de mascotas construida con Next.js (App Router) + Firebase + Cloudflare R2.

## Stack tecnológico

- **Frontend/Backend:** Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript, Tailwind CSS v4
- **Formularios:** React Hook Form + Zod (validación duplicada también server-side como guardián real)
- **Autenticación:** Firebase Auth, sesión vía cookie httpOnly (Firebase session cookies) verificada con Firebase Admin SDK
- **Base de datos:** Firestore, accedido exclusivamente desde el servidor (Admin SDK)
- **Almacenamiento de fotos:** Cloudflare R2 (S3-compatible)
- **Componentes:** Lucide icons, Embla Carousel, react-hot-toast

## Requisitos previos

- Node.js 20+
- npm 10+
- Un proyecto de [Firebase](https://console.firebase.google.com) (Auth + Firestore)
- Un bucket de [Cloudflare R2](https://developers.cloudflare.com/r2/)

## Setup

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd App-Mascotas-2026
npm install
```

### 2. Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilita **Authentication** (Email/Password) y **Firestore**
3. En **Project Settings → General**, copia la config web (apiKey, authDomain, projectId, appId)
4. En **Project Settings → Service Accounts**, genera una nueva clave privada (Admin SDK)

### 3. Configurar Cloudflare R2

1. Crea un bucket R2 en el dashboard de Cloudflare
2. Genera un API Token con permisos de lectura/escritura sobre el bucket (Account ID, Access Key ID, Secret Access Key)
3. Habilita acceso público (dominio `r2.dev` o un dominio custom) para servir las fotos

### 4. Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Firebase (cliente y Admin SDK) y de R2. `FIREBASE_PRIVATE_KEY` debe incluir los `\n` literales (entre comillas) o el salto de línea real.

### 5. Crear primer usuario admin

Dado que el sistema solo permite crear usuarios a admins, el primer admin debe crearse directamente:

1. Ve a tu proyecto Firebase → **Authentication → Users** → **Add user** (email y contraseña)
2. Ve a **Firestore Database → profiles** y crea un documento con id = UID del usuario, con campos `first_name`, `last_name`, `email`, `role: "admin"`, `is_active: true`, `created_at`

Ahora puedes loguearte y crear más usuarios desde el panel.

### 6. Ejecutar en desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:3000`

## Estructura del proyecto

```
src/
├── app/
│   ├── (public)/     # Home y rutas públicas
│   ├── admin/         # Panel de administración (protegido por middleware)
│   ├── adopt/[petId]/ # Formulario de solicitud de adopción
│   ├── pets/[id]/     # Ficha pública de mascota
│   ├── login/, reset-password/, unauthorized/
│   └── api/           # Route Handlers (sesión, fotos)
├── server/            # Lógica server-only: auth-context, sesión, datos (pets, adoptions, users), storage R2, auditoría, sanitización
├── components/
│   ├── ui/            # Componentes atómicos (Button, Badge, DataTable...)
│   └── next/          # Componentes de la app Next (forms, tablas admin, etc.)
├── lib/               # Firebase Admin SDK, Firebase client (solo Auth), R2 client, validaciones Zod
├── types/             # TypeScript types (Firestore)
├── utils/             # Helpers puros
└── constants/         # Constantes centralizadas
```

Toda validación, autorización y lógica de negocio vive en `src/server/*` y se invoca desde Server Actions o Route Handlers — el cliente nunca decide nada de seguridad.

## Seguridad

- `firestore.rules`: deny-all total (el Admin SDK bypassa las reglas; el cliente web no usa `firebase/firestore`)
- `middleware.ts`: protege `/admin/*` verificando la cookie de sesión y el rol del usuario
- `npm run test:security`: ejecuta las pruebas de reglas de Firestore contra el emulador + chequeos estáticos
- `npm run test:security:extended`: auditoría estática adicional (headers, helpers de autorización, etc.)

## Tests

```bash
npm run test        # Vitest (unit + componentes)
npm run test:e2e     # Playwright
npm run build        # build de producción (también valida tipos)
```

## Deploy

### Vercel

```bash
npm run build
```

Conecta el repositorio con Vercel (detecta Next.js automáticamente) y configura las variables de entorno de `.env.example` en el dashboard del proyecto.

## Licencia

MIT
