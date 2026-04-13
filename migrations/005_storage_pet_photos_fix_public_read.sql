-- Obsoleto frente a 006 / 004 actualizado: misma política (SELECT sin TO).
-- Si ya ejecutaste esto, ejecuta 006 para asegurar el mismo resultado.
-- Ver: 006_storage_pet_photos_select_unrestricted_role.sql

DROP POLICY IF EXISTS "pet_photos_public_read" ON storage.objects;

CREATE POLICY "pet_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos');
