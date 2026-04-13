-- ============================================================
-- Lectura de pet-photos: política sin "TO rol" (todos los roles,
-- incl. anon). Si 005 no bastó, ejecuta esto en SQL Editor.
-- ============================================================

DROP POLICY IF EXISTS "pet_photos_public_read" ON storage.objects;

CREATE POLICY "pet_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos');

-- Sin cláusula TO: en Postgres la política aplica a todos los roles
-- sujetos a RLS (anon, authenticated, etc.).
