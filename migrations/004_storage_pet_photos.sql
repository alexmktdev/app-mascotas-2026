-- ============================================================
-- Storage: fotos de mascotas (Supabase Storage)
-- Ejecutar en SQL Editor después de 001 (y 002/003 si aplica).
-- Límite ~1,2 MB por objeto y solo imágenes (refuerza el cliente).
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-photos',
  'pet-photos',
  true,
  1258291,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura pública: sin TO (aplica a anon, authenticated, etc.).
DROP POLICY IF EXISTS "pet_photos_public_read" ON storage.objects;
CREATE POLICY "pet_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos');

-- Subida: staff/admin activo, carpeta = auth.uid() (ruta "USER_UUID/archivo.ext")
DROP POLICY IF EXISTS "pet_photos_staff_insert" ON storage.objects;
CREATE POLICY "pet_photos_staff_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.is_active = true
        AND p.role IN ('admin', 'staff')
    )
  );

-- Actualizar / borrar: dueño del prefijo o admin
DROP POLICY IF EXISTS "pet_photos_staff_update" ON storage.objects;
CREATE POLICY "pet_photos_staff_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND (
      split_part(name, '/', 1) = auth.uid()::text
      OR public.get_user_role() = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND (
      split_part(name, '/', 1) = auth.uid()::text
      OR public.get_user_role() = 'admin'
    )
  );

DROP POLICY IF EXISTS "pet_photos_staff_delete" ON storage.objects;
CREATE POLICY "pet_photos_staff_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND (
      split_part(name, '/', 1) = auth.uid()::text
      OR public.get_user_role() = 'admin'
    )
  );
