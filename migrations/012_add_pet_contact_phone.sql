-- ============================================================
-- Pets: agregar fono de contacto opcional.
-- Valor por defecto en el formulario: +56 (cliente).
-- ============================================================

ALTER TABLE public.pets
ADD COLUMN IF NOT EXISTS contact_phone text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pets_contact_phone_format_check'
  ) THEN
    ALTER TABLE public.pets
    ADD CONSTRAINT pets_contact_phone_format_check
    CHECK (
      contact_phone IS NULL
      OR contact_phone ~ '^\+56[0-9\s()-]*$'
    );
  END IF;
END
$$;
