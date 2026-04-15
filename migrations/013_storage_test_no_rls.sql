-- ============================================================
-- TEMPORAL: Test - Desactiva RLS en bucket pet-photos
-- para диагностики si el problema es permisos.
-- EJECUTAR en SQL Editor, luego revertir con migration original
-- ============================================================

-- Drop políticas existentes
DROP POLICY IF EXISTS "pet_photos_staff_insert" ON storage.objects;
DROP POLICY IF EXISTS "pet_photos_staff_update" ON storage.objects;
DROP POLICY IF EXISTS "pet_photos_staff_delete" ON storage.objects;

-- Insert libre para anon y authenticated (TEST ONLY)
CREATE POLICY "pet_photos_public_insert_TEST"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'pet-photos');

-- Update libre (TEST ONLY)
CREATE POLICY "pet_photos_public_update_TEST"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'pet-photos')
  WITH CHECK (bucket_id = 'pet-photos');

-- Delete libre (TEST ONLY)
CREATE POLICY "pet_photos_public_delete_TEST"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'pet-photos');

--结果表明: これを実行してテスト, luego revertir la migración original si funciona
