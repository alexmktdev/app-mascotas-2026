-- Endurece permisos por rol y restringe ejecución manual del sync.
-- Mantiene funcionalidades actuales para admin/staff sin exponer operaciones críticas.

-- ──────────────────────────────────────────────
-- 1) Políticas de PETS: solo staff/admin escriben
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "pets_authenticated_insert" ON pets;
DROP POLICY IF EXISTS "pets_authenticated_update" ON pets;

CREATE POLICY "pets_staff_insert" ON pets
  FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'staff'));

CREATE POLICY "pets_staff_update" ON pets
  FOR UPDATE
  USING (get_user_role() IN ('admin', 'staff'))
  WITH CHECK (get_user_role() IN ('admin', 'staff'));

-- ──────────────────────────────────────────────
-- 2) Políticas de ADOPTION_REQUESTS: solo staff/admin leen/actualizan
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "adoption_staff_read" ON adoption_requests;
DROP POLICY IF EXISTS "adoption_staff_update" ON adoption_requests;

CREATE POLICY "adoption_staff_read" ON adoption_requests
  FOR SELECT
  USING (get_user_role() IN ('admin', 'staff'));

CREATE POLICY "adoption_staff_update" ON adoption_requests
  FOR UPDATE
  USING (get_user_role() IN ('admin', 'staff'))
  WITH CHECK (get_user_role() IN ('admin', 'staff'));

-- ──────────────────────────────────────────────
-- 3) Restringir sync manual de estados por rol
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_pet_statuses_by_requests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pet_id UUID;
  updated_count INTEGER := 0;
BEGIN
  -- Permitir solo staff/admin cuando se invoca vía RPC.
  IF auth.uid() IS NOT NULL AND get_user_role() NOT IN ('admin', 'staff') THEN
    RAISE EXCEPTION 'No autorizado para sincronizar estados de mascotas';
  END IF;

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

REVOKE EXECUTE ON FUNCTION sync_pet_statuses_by_requests() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION sync_pet_statuses_by_requests() FROM anon;
REVOKE EXECUTE ON FUNCTION sync_pet_statuses_by_requests() FROM authenticated;
GRANT EXECUTE ON FUNCTION sync_pet_statuses_by_requests() TO authenticated;
