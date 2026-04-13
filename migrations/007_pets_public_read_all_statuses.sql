-- Catálogo público: permitir ver mascotas en cualquier estado válido
-- (disponible, en proceso, adoptada) para mostrar el estado en tarjetas.
-- Las solicitudes de adopción siguen exigiendo mascota disponible (002).

DROP POLICY IF EXISTS "pets_public_read" ON pets;

CREATE POLICY "pets_public_read" ON pets
  FOR SELECT USING (status IN ('available', 'in_process', 'adopted'));
