Eres un arquitecto de software senior especializado en React y Supabase.
Crea una aplicación web completa de adopción de mascotas siguiendo TODAS las
especificaciones a continuación. No omitas nada. Piensa paso a paso antes de
escribir código.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STACK TECNOLÓGICO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend:
- React 18+ con Vite (no CRA)
- React Router v6 (createBrowserRouter, rutas declarativas)
- TanStack Query v5 (caché, refetch, paginación server-side, invalidación)
- Zustand para estado global (auth session, UI state mínimo)
- React Hook Form + Zod para todos los formularios (validación client y server)
- Tailwind CSS para estilos (mobile-first, responsive)
- Shadcn/ui como librería de componentes base
- Embla Carousel para el slider de fotos en tarjetas
- React Virtual (TanStack Virtual) si la lista de tarjetas supera 50 items
- Lucide React para íconos (no instalar otra librería de íconos)
- date-fns para manejo de fechas

Backend (Supabase - plan free):
- Supabase Auth (email/password, refresh tokens, sesión persistente)
- PostgreSQL con Row Level Security (RLS) activado en TODAS las tablas
- Supabase Storage solo si se necesita (en este proyecto no, se usan URLs Drive)
- Edge Functions solo si hay lógica crítica que no debe exponerse al cliente
- Realtime solo si hay funcionalidad que lo justifique (omitir si no aplica)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ARQUITECTURA DE CARPETAS (obligatoria)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

src/
├── api/                    # Funciones que llaman a Supabase (una por dominio)
│   ├── pets.ts
│   ├── adoptions.ts
│   └── users.ts
├── components/
│   ├── ui/                 # Componentes atómicos reutilizables (Button, Badge, etc.)
│   ├── layout/             # Header, Sidebar, AdminLayout, PublicLayout
│   ├── pets/               # PetCard, PetSlider, PetFilters, PetDetail
│   ├── adoptions/          # AdoptionForm, AdoptionTable
│   └── users/              # UserTable, UserForm
├── hooks/                  # Custom hooks (usePets, useAdoptions, useAuth, etc.)
├── pages/
│   ├── public/             # Home, PetDetail, AdoptionForm
│   └── admin/              # Dashboard, PetsList, AdoptedList, InProgress, AddPet, Users
├── lib/
│   ├── supabase.ts         # Singleton del cliente Supabase
│   ├── queryClient.ts      # Configuración TanStack Query
│   └── validations/        # Schemas Zod reutilizables
├── store/                  # Zustand stores
│   └── authStore.ts
├── types/                  # Tipos TypeScript globales (Pet, User, AdoptionRequest)
├── utils/                  # Helpers puros (formatDate, buildDriveUrl, etc.)
├── constants/              # Constantes (ROLES, PET_STATUS, BREEDS, etc.)
└── router/
    └── index.tsx           # Definición centralizada de rutas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## BASE DE DATOS — ESQUEMA COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Crear las siguientes tablas en Supabase SQL Editor:

-- Tabla de perfiles (extiende auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mascotas
CREATE TABLE pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat')),
  breed TEXT,
  age_months INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  size TEXT CHECK (size IN ('small', 'medium', 'large', 'xlarge')),
  color TEXT,
  weight_kg NUMERIC(5,2),
  sterilized BOOLEAN DEFAULT false,
  vaccinated BOOLEAN DEFAULT false,
  dewormed BOOLEAN DEFAULT false,
  microchip BOOLEAN DEFAULT false,
  health_notes TEXT,
  personality TEXT,
  good_with_kids BOOLEAN,
  good_with_dogs BOOLEAN,
  good_with_cats BOOLEAN,
  special_needs TEXT,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'in_process', 'adopted')),
  photo_urls TEXT[] DEFAULT '{}',   -- máximo 3 URLs de Google Drive
  drive_folder_id TEXT,
  intake_date DATE DEFAULT CURRENT_DATE,
  adopted_date DATE,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de solicitudes de adopción
CREATE TABLE adoption_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  housing_type TEXT CHECK (housing_type IN ('house', 'apartment', 'farm', 'other')),
  has_yard BOOLEAN,
  has_other_pets BOOLEAN,
  other_pets_description TEXT,
  has_children BOOLEAN,
  children_ages TEXT,
  motivation TEXT NOT NULL,
  experience_with_pets TEXT,
  work_schedule TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de auditoría (no editable desde el cliente)
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_pets_status ON pets(status);
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_pets_created_at ON pets(created_at DESC);
CREATE INDEX idx_adoption_requests_pet_id ON adoption_requests(pet_id);
CREATE INDEX idx_adoption_requests_status ON adoption_requests(status);

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pets_updated_at BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## SEGURIDAD — ROW LEVEL SECURITY (RLS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Habilitar RLS en todas las tablas
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE adoption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper para verificar rol (evita repetición en políticas)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- PETS: lectura pública solo mascotas disponibles
CREATE POLICY "pets_public_read" ON pets
  FOR SELECT USING (status = 'available');

-- PETS: staff y admin ven todo
CREATE POLICY "pets_staff_read_all" ON pets
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- PETS: solo autenticados pueden insertar/actualizar/eliminar
CREATE POLICY "pets_authenticated_insert" ON pets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "pets_authenticated_update" ON pets
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "pets_admin_delete" ON pets
  FOR DELETE USING (get_user_role() = 'admin');

-- ADOPTION_REQUESTS: cualquiera puede insertar (formulario público)
CREATE POLICY "adoption_public_insert" ON adoption_requests
  FOR INSERT WITH CHECK (true);

-- ADOPTION_REQUESTS: solo autenticados leen y modifican
CREATE POLICY "adoption_staff_read" ON adoption_requests
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "adoption_staff_update" ON adoption_requests
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- PROFILES: cada usuario ve su propio perfil
CREATE POLICY "profiles_own" ON profiles
  FOR SELECT USING (id = auth.uid());

-- PROFILES: admin ve y edita todos
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (get_user_role() = 'admin');

-- AUDIT_LOG: solo lectura para admin, nadie escribe desde cliente
CREATE POLICY "audit_admin_read" ON audit_log
  FOR SELECT USING (get_user_role() = 'admin');

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## CLIENTE SUPABASE (src/lib/supabase.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'  // generado con supabase gen types

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

REGLAS del cliente:
- NUNCA usar la service_role key en el frontend. Solo anon key.
- Todas las variables de entorno deben tener prefijo VITE_ y estar en .env.local
- El archivo .env.local debe estar en .gitignore
- Generar tipos TypeScript con: npx supabase gen types typescript --project-id <id> > src/types/database.types.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## AUTENTICACIÓN Y AUTORIZACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Store de auth (Zustand - src/store/authStore.ts):
- Guardar: session, user, profile (con rol)
- Al iniciar la app: supabase.auth.getSession() para restaurar sesión
- Suscribirse a supabase.auth.onAuthStateChange para reaccionar a cambios
- Limpiar store completo en logout

Guard de rutas (src/router/ProtectedRoute.tsx):
- Si no hay sesión: redirect a /login
- Si hay sesión pero el rol no coincide: redirect a /unauthorized
- Mostrar loading skeleton mientras se restaura la sesión (no flash de login)

Rutas de la aplicación:
/ → Página pública (cards de mascotas disponibles)
/pets/:id → Detalle de mascota
/adopt/:petId → Formulario de adopción
/login → Login de administradores
/admin → Dashboard (protegida: staff + admin)
/admin/pets → Lista mascotas disponibles (protegida)
/admin/pets/new → Agregar mascota (protegida)
/admin/pets/:id/edit → Editar mascota (protegida)
/admin/in-process → Mascotas en proceso (protegida)
/admin/adopted → Mascotas adoptadas (protegida)
/admin/users → Lista de usuarios (protegida: solo admin)
/admin/users/new → Crear usuario (protegida: solo admin)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## CAPA API (src/api/)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REGLAS obligatorias para todas las funciones API:
1. Usar siempre .throwOnError() para que TanStack Query maneje errores
2. Nunca retornar datos sensibles que RLS no debería exponer
3. Paginación siempre server-side con .range(from, to)
4. Tipado completo con los tipos generados de Supabase
5. Las funciones deben ser puras (no tienen efectos secundarios propios)

Ejemplo (src/api/pets.ts):
export const PET_PAGE_SIZE = 12

export async function fetchPublicPets({
  page = 1,
  species,
  size,
  gender,
  ageMin,
  ageMax,
  search,
}: PetFilters) {
  const from = (page - 1) * PET_PAGE_SIZE
  const to = from + PET_PAGE_SIZE - 1

  let query = supabase
    .from('pets')
    .select('id, name, species, breed, age_months, gender, size, sterilized, vaccinated, photo_urls, status', { count: 'exact' })
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (species) query = query.eq('species', species)
  if (size) query = query.eq('size', size)
  if (gender) query = query.eq('gender', gender)
  if (ageMin) query = query.gte('age_months', ageMin)
  if (ageMax) query = query.lte('age_months', ageMax)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error, count } = await query
  if (error) throw error
  return { data: data ?? [], total: count ?? 0, pageCount: Math.ceil((count ?? 0) / PET_PAGE_SIZE) }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## HOOKS PERSONALIZADOS (src/hooks/)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Crear los siguientes hooks con TanStack Query:

usePets(filters, page) → useQuery con queryKey ['pets', filters, page]
usePetDetail(id) → useQuery con queryKey ['pet', id]
useAdminPets(status, page) → useQuery para panel admin
useAdoptionRequests(petId?) → useQuery
useUsers() → useQuery
useCreatePet() → useMutation con invalidación de ['pets']
useUpdatePet() → useMutation
useDeletePet() → useMutation con confirmación optimista
useCreateAdoptionRequest() → useMutation (sin auth)
useUpdateAdoptionStatus() → useMutation
useCreateUser() → useMutation (llama a supabase.auth.admin solo desde Edge Function)
useAuth() → wrapper sobre el store de Zustand

Configuración TanStack Query (src/lib/queryClient.ts):
- staleTime: 1000 * 60 * 5 (5 minutos para datos públicos)
- gcTime: 1000 * 60 * 10
- retry: 2 con backoff exponencial
- refetchOnWindowFocus: false (evitar refetches innecesarios)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## COMPONENTES CLAVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PetCard (src/components/pets/PetCard.tsx):
- Props: pet: Pet (solo los campos necesarios, no el objeto completo)
- Slider de fotos con Embla Carousel (máximo 3 fotos)
- Las URLs de Drive deben transformarse a URLs directas de previsualización:
  función buildDriveImageUrl(fileId: string): string =>
  `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`
  Para extraer el fileId de una URL de Drive: regex sobre /d/(FILEID)/
- Mostrar: foto, nombre, especie, raza, edad formateada, género, badges (esterilizado, vacunado)
- Botón "Ver más detalles" → navega a /pets/:id
- Skeleton loader mientras carga (mismo tamaño que la card real, evita layout shift)
- Usar React.memo ya que hay muchas cards en pantalla
- Lazy loading de imágenes con loading="lazy" en <img>

PetFilters (src/components/pets/PetFilters.tsx):
- Filtros: especie (perro/gato), tamaño, género, rango de edad (meses), nombre (search)
- Usar URL search params para persistir filtros (useSearchParams)
- Debounce de 300ms en el campo de búsqueda por nombre
- Botón "Limpiar filtros" visible solo cuando hay filtros activos
- Diseño responsive: horizontal en desktop, colapsable en móvil

PetDetail (src/pages/public/PetDetail.tsx):
- Cargar datos con usePetDetail(id)
- Mostrar TODOS los campos de la mascota
- Slider de fotos más grande (no el de card)
- Botón "Adoptar a [nombre]" → navega a /adopt/:petId
- Breadcrumb de navegación
- Si la mascota no existe o no está disponible: página de error amigable

AdoptionForm (src/pages/public/AdoptionForm.tsx):
- Cargar datos de la mascota para mostrar a quién se está adoptando
- Formulario con React Hook Form + Zod
- Campos: nombre completo, correo, teléfono, número de identificación, dirección,
  ciudad, tipo de vivienda, ¿tiene patio?, ¿tiene otras mascotas?,
  descripción de otras mascotas, ¿tiene niños?, edades de los niños,
  motivación para adoptar, experiencia con mascotas, horario laboral
- Validación en tiempo real con mensajes claros
- Manejo de estado: idle → submitting → success / error
- En éxito: página de confirmación con datos del caso, NO redirigir al home
- Protección anti-spam: honeypot field oculto + timestamp del formulario

Admin Sidebar (src/components/layout/AdminSidebar.tsx):
- Logo / nombre del sistema arriba
- Navegación principal:
  - Dashboard (icono gráfico)
  - Mascotas disponibles (icono paw)
  - En proceso de adopción (icono hourglass)
  - Ya adoptadas (icono heart)
  - Agregar mascota (icono plus)
- Separador visual
- Sección inferior:
  - Avatar + nombre + rol del usuario conectado
  - Ver todos los usuarios (solo visible para admin)
  - Crear usuario (solo visible para admin)
  - Botón cerrar sesión

PetForm (src/components/pets/PetForm.tsx — usado en agregar y editar):
- Reutilizar el mismo componente con un prop mode: 'create' | 'edit'
- Todos los campos de la tabla pets
- Campo especial: photo_urls es un array de hasta 3 URLs de Google Drive
  - Input para cada URL con validación de formato de URL Drive
  - Botón para agregar/quitar URLs (mínimo 0, máximo 3)
  - Preview de la imagen al ingresar una URL válida usando buildDriveImageUrl
- Validación con Zod
- En submit: optimistic update si es edición, loading state en botón

DataTable genérica (src/components/ui/DataTable.tsx):
- Reutilizable para todas las tablas del admin
- Props: columns, data, isLoading, pagination
- Columna de acciones: editar (lápiz), eliminar (papelera) con diálogo de confirmación
- Paginación integrada
- Skeleton rows mientras carga
- Estado vacío con mensaje descriptivo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PÁGINAS DEL PANEL ADMIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dashboard (/admin):
- 3 tarjetas de estadísticas: total disponibles, en proceso, adoptadas
- Usar supabase COUNT con .select('*', { count: 'exact', head: true })
  filtrado por status para no traer datos innecesarios
- Las 5 solicitudes de adopción más recientes (tabla compacta)
- Los datos del dashboard se refrescan cada 60 segundos (refetchInterval)

Lista de mascotas disponibles (/admin/pets):
- DataTable con: foto miniatura, nombre, especie, raza, edad, estado, fecha ingreso
- Filtro rápido por especie en la tabla
- Acciones: editar → /admin/pets/:id/edit | eliminar con confirmación | cambiar estado
- Paginación server-side

Mascotas en proceso (/admin/in-process):
- DataTable con: nombre mascota, solicitante, correo, teléfono, fecha solicitud, estado solicitud
- Acciones por solicitud: aprobar, rechazar, ver detalles, agregar notas admin
- Al aprobar: actualizar estado de la mascota a 'in_process'

Mascotas adoptadas (/admin/adopted):
- DataTable con: nombre mascota, adoptante, fecha adopción, seguimiento
- Solo lectura, con posibilidad de agregar notas de seguimiento post-adopción

Gestión de usuarios (/admin/users) — solo admin:
- DataTable: nombre, apellido, correo, rol, estado, fecha registro
- Crear usuario: IMPORTANTE — la creación de usuarios con rol admin DEBE hacerse
  desde una Supabase Edge Function con service_role, nunca desde el cliente.
  Crear Edge Function: supabase/functions/create-user/index.ts
  Esta función recibe { email, password, first_name, last_name, role } en el body,
  verifica que quien llama sea admin (JWT claim), y usa supabase.auth.admin.createUser()
- Acciones: activar/desactivar cuenta, cambiar rol (solo admin puede cambiar a admin)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## OPTIMIZACIONES DE RENDIMIENTO (obligatorias)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Code splitting: todas las páginas deben cargarse con React.lazy + Suspense
   const Home = React.lazy(() => import('./pages/public/Home'))
   Cada ruta tiene su propio chunk → Vite hace tree-shaking automático

2. React.memo en:
   - PetCard (se renderiza N veces en lista)
   - Filas de DataTable
   - Sidebar (no cambia frecuentemente)

3. useMemo para:
   - Cálculos costosos en filtros (lista de razas disponibles)
   - Transformación de datos para gráficas del dashboard

4. useCallback para:
   - Handlers de eventos pasados como props a componentes hijos
   - Solo cuando el componente hijo está envuelto en React.memo

5. NO abusar de useMemo/useCallback en valores primitivos o funciones
   internas que no se pasan como props. El overhead supera el beneficio.

6. Paginación server-side: NUNCA traer todos los registros y paginar en cliente.
   Siempre usar .range(from, to) en Supabase.

7. Selección de columnas: NUNCA usar SELECT *. Seleccionar solo las columnas
   necesarias para cada vista. Ejemplo: la lista de cards no necesita health_notes.

8. Imágenes:
   - Siempre loading="lazy" en imágenes fuera del viewport inicial
   - Las 3 primeras cards: loading="eager" para LCP
   - Tamaño apropiado en la URL de Drive thumbnail (?sz=w400 para cards, ?sz=w800 para detalle)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## SEGURIDAD EN EL FRONTEND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Nunca almacenar tokens en localStorage. Supabase usa cookies HttpOnly
   cuando se configura correctamente, o su propio mecanismo seguro.

2. Sanitizar todos los inputs de búsqueda antes de enviar a Supabase.
   Usar .ilike() o .textSearch() en lugar de concatenar strings en queries.

3. Las rutas admin verifican el rol tanto en el router (client) como en las
   políticas RLS (server). Nunca confiar solo en el guard del cliente.

4. Content Security Policy en el index.html:
   <meta http-equiv="Content-Security-Policy"
     content="default-src 'self'; img-src 'self' https://drive.google.com https://lh3.googleusercontent.com; connect-src 'self' https://*.supabase.co;">

5. Variables de entorno: NUNCA hardcodear URLs o keys en el código.
   Solo VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (la anon key es pública por diseño,
   la seguridad real está en RLS).

6. Rate limiting en el formulario de adopción:
   - Deshabilitar el botón submit por 3 segundos después de enviar
   - Honeypot: campo oculto con display:none que si se llena indica un bot,
     en ese caso rechazar silenciosamente sin mostrar error

7. Validación de URLs de Drive en el formulario admin:
   Regex: /^https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/
   Extraer el fileId y almacenar solo el fileId, no la URL completa.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## MANEJO DE ERRORES Y UX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Error Boundary global que captura errores de render inesperados
2. Toasts para feedback de operaciones CRUD (éxito y error) con react-hot-toast
3. Skeleton loaders para TODOS los estados de carga (no spinners centrados solos)
4. Estados vacíos con ilustración simple y mensaje descriptivo + CTA
5. Página 404 personalizada con botón para volver
6. En errores de red: mensaje amigable + botón de reintento
7. Formularios: mostrar errores inline bajo cada campo, no alert() ni toast para
   errores de validación

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## TIPOS TYPESCRIPT (src/types/index.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Todos los tipos deben derivar de los tipos generados por Supabase.
Usar tipos de utilidad de TypeScript para crear tipos parciales para formularios:

type Pet = Database['public']['Tables']['pets']['Row']
type PetInsert = Database['public']['Tables']['pets']['Insert']
type PetUpdate = Database['public']['Tables']['pets']['Update']
type PetFilters = { species?: string; size?: string; gender?: string;
                    ageMin?: number; ageMax?: number; search?: string; page?: number }

No crear tipos paralelos manuales que dupliquen la definición de la base de datos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## EDGE FUNCTION: crear usuario (obligatoria)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Crear en supabase/functions/create-user/index.ts:
- Verificar que el JWT del llamante tenga rol 'admin' consultando profiles
- Usar el cliente admin de Supabase (service_role, disponible en Edge Functions)
- Crear el usuario con supabase.auth.admin.createUser({ email, password, ... })
- Insertar el perfil con el rol especificado
- Retornar solo id y email del nuevo usuario (nunca el password)
- Manejar errores: email duplicado, dominio inválido, etc.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## CONFIGURACIÓN VITE (vite.config.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Alias @ → src/
- Build: manual chunks separando vendor (react, react-dom), supabase, y tanstack
  en chunks separados para mejor cache de browser:
  manualChunks: { vendor: ['react', 'react-dom'], supabase: ['@supabase/supabase-js'],
                  query: ['@tanstack/react-query'] }
- sourcemap: false en producción
- Minificación con esbuild (por defecto en Vite)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## RESTRICCIONES IMPORTANTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- NO usar Redux. Zustand es suficiente para este caso de uso.
- NO usar useEffect para fetching de datos. Todo fetching va en TanStack Query.
- NO usar any en TypeScript. Si no sabes el tipo, usar unknown y narrowing.
- NO usar console.log en producción. Usar una utilidad logger que solo loggea
  en development (import.meta.env.DEV).
- NO paginar en el cliente. Siempre .range() en Supabase.
- NO almacenar datos sensibles del usuario en el estado de React o localStorage.
- NO hardcodear strings de UI. Usar constantes en src/constants/.
- NO usar SELECT * en ninguna query de Supabase.
- El formulario de adopción es PÚBLICO, no requiere auth. RLS debe permitir INSERT
  en adoption_requests sin auth.uid(). La seguridad viene de validación + rate limit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ENTREGABLES ESPERADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Todo el SQL de la base de datos en un solo archivo migrations/001_initial.sql
2. La aplicación React completa con la estructura de carpetas indicada
3. La Edge Function create-user
4. Archivo .env.example con las variables necesarias (sin valores reales)
5. README.md con: instrucciones de setup, cómo crear el primer usuario admin
   (directamente en Supabase Dashboard la primera vez), estructura del proyecto,
   y cómo deployar en Vercel/Netlify

Empieza por el SQL y los tipos, luego el cliente Supabase y el router,
luego los hooks, luego los componentes, y finalmente las páginas.
Muéstrame el código de cada archivo completo, sin omitir partes.