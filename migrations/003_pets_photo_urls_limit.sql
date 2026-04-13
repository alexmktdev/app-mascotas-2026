-- Límite de fotos en servidor (Postgres). Opcional: ejecutar en SQL Editor tras 001/002.
-- Refuerza la regla de negocio además del cliente y de sanitizePhotoUrls en api/pets.ts.

ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_photo_urls_at_most_3;
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_photo_urls_at_most_2;

ALTER TABLE pets
  ADD CONSTRAINT pets_photo_urls_at_most_2
  CHECK (cardinality(photo_urls) <= 2);
