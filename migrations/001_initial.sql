-- ============================================================
-- App Mascotas 2026 — Migración Inicial
-- Ejecutar en Supabase SQL Editor (completo, en orden)
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. TABLAS
-- ──────────────────────────────────────────────

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
  photo_urls TEXT[] DEFAULT '{}',   -- máximo 2 URLs (Storage o Drive legado)
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

-- ──────────────────────────────────────────────
-- 2. ÍNDICES PARA PERFORMANCE
-- ──────────────────────────────────────────────

CREATE INDEX idx_pets_status ON pets(status);
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_pets_created_at ON pets(created_at DESC);
CREATE INDEX idx_adoption_requests_pet_id ON adoption_requests(pet_id);
CREATE INDEX idx_adoption_requests_status ON adoption_requests(status);

-- ──────────────────────────────────────────────
-- 3. FUNCIONES Y TRIGGERS
-- ──────────────────────────────────────────────

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ──────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────────

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

-- ──────────────────────────────────────────────
-- 4a. POLÍTICAS — PETS
-- ──────────────────────────────────────────────

-- Lectura pública: solo mascotas disponibles
CREATE POLICY "pets_public_read" ON pets
  FOR SELECT USING (status = 'available');

-- Staff y admin ven todas las mascotas
CREATE POLICY "pets_staff_read_all" ON pets
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Solo autenticados pueden insertar
CREATE POLICY "pets_authenticated_insert" ON pets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Solo autenticados pueden actualizar
CREATE POLICY "pets_authenticated_update" ON pets
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Solo admin puede eliminar
CREATE POLICY "pets_admin_delete" ON pets
  FOR DELETE USING (get_user_role() = 'admin');

-- ──────────────────────────────────────────────
-- 4b. POLÍTICAS — ADOPTION_REQUESTS
-- ──────────────────────────────────────────────

-- Cualquiera puede insertar (formulario público sin auth)
CREATE POLICY "adoption_public_insert" ON adoption_requests
  FOR INSERT WITH CHECK (true);

-- Solo autenticados leen solicitudes
CREATE POLICY "adoption_staff_read" ON adoption_requests
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Solo autenticados actualizan solicitudes
CREATE POLICY "adoption_staff_update" ON adoption_requests
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ──────────────────────────────────────────────
-- 4c. POLÍTICAS — PROFILES
-- ──────────────────────────────────────────────

-- Cada usuario ve su propio perfil
CREATE POLICY "profiles_own" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Admin ve y edita todos los perfiles
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (get_user_role() = 'admin');

-- ──────────────────────────────────────────────
-- 4d. POLÍTICAS — AUDIT_LOG
-- ──────────────────────────────────────────────

-- Solo lectura para admin, nadie escribe desde cliente
CREATE POLICY "audit_admin_read" ON audit_log
  FOR SELECT USING (get_user_role() = 'admin');
