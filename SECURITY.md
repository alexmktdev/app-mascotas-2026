# Seguridad — comprobaciones y referencias

Este documento resume lo implementado en código/SQL y cómo verificarlo. No sustituye un pentest profesional.

## Ya aplicado en el proyecto

- **RLS** (Postgres): políticas en `migrations/001_initial.sql` + endurecimiento en `migrations/002_security_hardening.sql` (adopciones solo con mascota `available`, límite de envíos por email+mascota).
- **Edge Functions**: validación de admin con JWT (`getClaims`), respuestas **401/403/404** según caso, cuerpo JSON acotado y `Content-Type` comprobado (`supabase/functions/_shared/http.ts`).
- **Frontend**: ruta protegida sin bypass si falta perfil (`src/router/ProtectedRoute.tsx`).
- **Cabeceras HTTP**: `public/_headers` (Netlify) y `vercel.json` (Vercel), más plugin en `vite.config.ts` para desarrollo.
- **XSS**: utilidad `escapeHtml` en `src/lib/sanitize.ts` para uso futuro con HTML manual.

## Cómo probar RLS (Supabase)

1. En **SQL Editor**, ejecuta como comprobación conceptual (ajusta tablas):

   - Con políticas actuales, un cliente **anon** no debería poder leer `profiles` ajenos ni modificar datos de staff/admin sin política que lo permita.

2. Usa el **Table Editor** con rol simulado o la API REST con **solo la anon key** y prueba `SELECT/INSERT/UPDATE/DELETE` sobre `profiles`, `pets`, `adoption_requests` y contrasta con `migrations/*.sql`.

3. Tras aplicar `002_security_hardening.sql`, un `INSERT` en `adoption_requests` con `pet_id` inexistente o mascota no `available` debe **fallar**.

## Script automático de sondeo (`security:probe`)

Desde la raíz del repo (lee `.env.local` si existe):

```bash
npm run security:probe
```

Comprueba Edge sin JWT, JWT inválido, lectura `profiles` como anon, e `INSERT` de adopción con `pet_id` inexistente. Opcional:

- `SECURITY_PROBE_STAFF_JWT` — token de un usuario **staff**; debe obtener **403** al llamar `create-user`.
- `SECURITY_PROBE_ADMIN_JWT` — solo smoke (no crea usuario válido; comprueba que no sea 401/403 con body vacío).

**No es un ataque completo** ni un pentest; úsalo solo contra tu proyecto.

### Sondeo avanzado (`security:probe:advanced`)

Pruebas extra: cuerpo enorme, `Content-Type` incorrecto, GET en Edge, JSON roto, JWT `alg: none`, mutaciones REST como anon con `Prefer: return=representation`, ráfaga de Edge sin token.

```bash
npm run security:probe:advanced
```

## Cómo probar Edge Functions

Sustituye `PROJECT_REF` y la URL de funciones:

```bash
# Sin token → 401
curl -sS -X POST "https://PROJECT_REF.supabase.co/functions/v1/delete-user" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"00000000-0000-0000-0000-000000000000"}'

# Con JWT de usuario no admin → 403
curl -sS -X POST "https://PROJECT_REF.supabase.co/functions/v1/create-user" \
  -H "Authorization: Bearer <access_token_staff>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Rate limiting y abuso

- El límite de adopciones está en **base de datos** (trigger en `002`).
- Para abuso masivo a Edge Functions o al API, configura límites en **Supabase Dashboard**, **CDN/WAF** o proveedor de hosting.

## Revisión formal

Para estándar de industria, revisa **OWASP ASVS** (nivel 1–2 para empezar) y valora un **pentest** sobre la URL de producción.

## Secretos

- Nunca commits `service_role` ni `.env.local`.
- La clave **anon** es pública en el front; la seguridad depende de **RLS** y de no exponer la `service_role`.
