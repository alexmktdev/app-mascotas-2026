-- ============================================================
-- Storage: nuevas subidas solo JPEG/PNG (alineado con el cliente).
-- Las fotos ya guardadas (.webp, .gif, etc.) siguen sirviendo por URL.
-- Ejecutar en Supabase SQL Editor cuando quieras reforzar el bucket.
-- ============================================================

UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY['image/jpeg', 'image/png']::text[]
WHERE id = 'pet-photos';
