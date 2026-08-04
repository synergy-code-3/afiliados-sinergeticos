# Correo transaccional de Sinergéticos — Resend

Guía para dejar el correo transaccional (recuperación de contraseña, confirmaciones,
registros de embudos) saliendo del dominio propio y no de `supabase.io`.

**Decisión:** verificar el subdominio **`envios.sinergeticos.com`**, NO el dominio raíz.

**Por qué:** el SPF de `sinergeticos.com` está gestionado por un servicio de flattening
(`include:dc-aa8e722993._spfm.sinergeticos.com` → `_spf.google.com`) y los MX apuntan a
Google Workspace. Tocar el SPF del raíz puede tumbar el correo del equipo. Con subdominio
no se toca nada de lo que ya funciona, y la reputación de envío queda aislada.

---

## Paso 1 — Crear la cuenta

https://resend.com/signup

Usar un correo de la empresa, no personal — así la cuenta no depende de una sola persona.

## Paso 2 — Agregar el dominio

https://resend.com/domains → **Add Domain**

- Dominio: `envios.sinergeticos.com`
- Región: la más cercana a México (`us-east-1`)

## Paso 3 — Copiar los registros que genera Resend

Resend muestra 3 registros: un **MX** (rebotes), un **TXT de SPF** y un **TXT de DKIM**.
Los valores de DKIM son únicos por dominio — no se pueden inventar ni copiar de otro lado.

## Paso 4 — Ponerlos en GoDaddy

https://dcc.godaddy.com/control/dnsmanagement?domainName=sinergeticos.com

> ⚠️ **La trampa:** GoDaddy administra la zona de `sinergeticos.com`, pero los registros
> son para `envios.sinergeticos.com`. Hay que **agregarle el sufijo `.envios`** a cada
> nombre que dé Resend:
>
> | Resend dice | En GoDaddy va |
> |---|---|
> | `send` | `send.envios` |
> | `resend._domainkey` | `resend._domainkey.envios` |
> | `@` | `envios` |
>
> Si se ponen tal cual, la verificación nunca pasa.

**No tocar** el SPF ni los MX existentes del dominio raíz.

## Paso 5 — Crear las API keys

https://resend.com/api-keys — permiso **Sending access**.

Una por sistema, para poder revocar una sin tumbar las demás:

- `axis-auth` — SMTP de Supabase (Auth de Axis + portal de afiliados)
- `embudos-seed` — registros del sistema de embudos
- `afiliados` — si algún día el portal manda correo propio

## Paso 6 — SMTP en Supabase

https://supabase.com/dashboard/project/tdvgfpjkmelvviwhvfih/settings/auth
(Project Settings → Authentication → SMTP Settings)

| Campo | Valor |
|---|---|
| Host | `smtp.resend.com` |
| Puerto | `465` (SSL/TLS implícito) |
| Usuario | `resend` (literal, no un correo) |
| Contraseña | la API key `axis-auth` |
| Sender email | `cuentas@envios.sinergeticos.com` |
| Sender name | `Sinergéticos` |

> ⚠️ Esto afecta a **todo el Auth del proyecto, Axis incluido**. Avisar al equipo antes.

## Paso 7 — URLs de redirección

https://supabase.com/dashboard/project/tdvgfpjkmelvviwhvfih/auth/url-configuration

Agregar a **Redirect URLs**: `https://afiliados.sinergeticos.com/**`

Hoy el **Site URL está en `http://localhost:3000`**, por lo que las ligas de recuperación
mandan al usuario a su propia computadora (verificado el 3-ago-2026 leyendo el correo real).
Revisar qué depende de él en Axis antes de cambiarlo.

## Paso 8 — Plantillas en español

https://supabase.com/dashboard/project/tdvgfpjkmelvviwhvfih/auth/templates

Vienen en inglés ("Reset your password"). Traducir al menos *Reset Password* y *Confirm signup*.

## Paso 9 — DMARC (después de verificar)

El dominio **no tiene DMARC**. Una vez que Resend verifique y los envíos autentiquen,
agregar en GoDaddy:

| Tipo | Nombre | Valor |
|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@sinergeticos.com` |

`p=none` solo monitorea, no bloquea. Se endurece a `p=quarantine` cuando los reportes
salgan limpios.

---

## Para que Claude configure Supabase

Hace falta un access token de Supabase de una cuenta con acceso a la org **Synergy Code**:
https://supabase.com/dashboard/account/tokens

El token guardado en memoria solo alcanza las orgs *Sinergeticos DI* y *Zentraly* — el
proyecto `tdvgfpjkmelvviwhvfih` no es visible desde ahí. La *service role key* sirve para
datos y usuarios, pero NO para configurar SMTP, plantillas ni URLs.
