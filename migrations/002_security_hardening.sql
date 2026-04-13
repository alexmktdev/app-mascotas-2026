-- ============================================================
-- Seguridad: RLS más estricta + anti-spam adopciones
-- Ejecutar en Supabase SQL Editor después de 001_initial.sql
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. Adopciones públicas: solo si la mascota existe y está disponible
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "adoption_public_insert" ON adoption_requests;

CREATE POLICY "adoption_public_insert_valid_pet" ON adoption_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM pets p
      WHERE p.id = pet_id
        AND p.status = 'available'
    )
  );

-- ──────────────────────────────────────────────
-- 2. Límite de envíos repetidos (mismo correo + misma mascota en 1 hora)
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION adoption_requests_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO recent_count
  FROM adoption_requests
  WHERE email = NEW.email
    AND pet_id = NEW.pet_id
    AND created_at > NOW() - INTERVAL '1 hour';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Demasiadas solicitudes para esta mascota. Intenta de nuevo más tarde.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS adoption_requests_rate_limit_trigger ON adoption_requests;

CREATE TRIGGER adoption_requests_rate_limit_trigger
  BEFORE INSERT ON adoption_requests
  FOR EACH ROW
  EXECUTE FUNCTION adoption_requests_rate_limit();

-- Índice para el conteo por ventana de tiempo
CREATE INDEX IF NOT EXISTS idx_adoption_requests_email_pet_created
  ON adoption_requests (email, pet_id, created_at DESC);
