-- Migración 010: Añadir campo de historia/relato a las mascotas
-- Este campo permite añadir un texto narrativo sobre el trasfondo de la mascota.

ALTER TABLE public.pets
ADD COLUMN IF NOT EXISTS story TEXT;

COMMENT ON COLUMN public.pets.story IS 'Relato o historia sobre el trasfondo de la mascota para la vista pública.';
