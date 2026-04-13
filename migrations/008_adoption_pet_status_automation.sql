-- Automatiza estado de mascotas según solicitudes de adopción.
-- Reglas:
-- 1) Al llegar solicitud pendiente/revisión => mascota en "in_process".
-- 2) Si solicitud se aprueba => mascota "adopted".
-- 3) Si se rechaza y no quedan solicitudes activas (<7 días) => "available".
-- 4) Solicitudes activas vencen a los 7 días para efecto de estado.

-- Catálogo público: solo mascotas disponibles.
DROP POLICY IF EXISTS "pets_public_read" ON pets;
CREATE POLICY "pets_public_read" ON pets
  FOR SELECT USING (status = 'available');

CREATE OR REPLACE FUNCTION recompute_pet_status_from_requests(p_pet_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_approved BOOLEAN;
  has_active_recent BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM adoption_requests ar
    WHERE ar.pet_id = p_pet_id
      AND ar.status = 'approved'
  ) INTO has_approved;

  SELECT EXISTS (
    SELECT 1
    FROM adoption_requests ar
    WHERE ar.pet_id = p_pet_id
      AND ar.status IN ('pending', 'reviewing')
      AND ar.created_at >= NOW() - INTERVAL '7 days'
  ) INTO has_active_recent;

  IF has_approved THEN
    UPDATE pets
    SET status = 'adopted',
        adopted_date = COALESCE(adopted_date, CURRENT_DATE)
    WHERE id = p_pet_id
      AND (status <> 'adopted' OR adopted_date IS NULL);
  ELSIF has_active_recent THEN
    UPDATE pets
    SET status = 'in_process',
        adopted_date = NULL
    WHERE id = p_pet_id
      AND (status <> 'in_process' OR adopted_date IS NOT NULL);
  ELSE
    UPDATE pets
    SET status = 'available',
        adopted_date = NULL
    WHERE id = p_pet_id
      AND (status <> 'available' OR adopted_date IS NOT NULL);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION sync_pet_statuses_by_requests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pet_id UUID;
  updated_count INTEGER := 0;
BEGIN
  FOR v_pet_id IN
    SELECT DISTINCT ar.pet_id
    FROM adoption_requests ar
  LOOP
    PERFORM recompute_pet_status_from_requests(v_pet_id);
    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION trg_recompute_pet_status_from_adoption()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM recompute_pet_status_from_requests(NEW.pet_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM recompute_pet_status_from_requests(NEW.pet_id);
    IF NEW.pet_id IS DISTINCT FROM OLD.pet_id THEN
      PERFORM recompute_pet_status_from_requests(OLD.pet_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recompute_pet_status_from_requests(OLD.pet_id);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS adoption_requests_recompute_pet_status ON adoption_requests;
CREATE TRIGGER adoption_requests_recompute_pet_status
  AFTER INSERT OR UPDATE OR DELETE ON adoption_requests
  FOR EACH ROW
  EXECUTE FUNCTION trg_recompute_pet_status_from_adoption();

-- Ejecutar sync inicial al aplicar migración.
SELECT sync_pet_statuses_by_requests();

-- Permitir ejecutar sync desde backend cliente autenticado (dashboard/admin).
GRANT EXECUTE ON FUNCTION sync_pet_statuses_by_requests() TO authenticated;
