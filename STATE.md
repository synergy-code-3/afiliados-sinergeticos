# afiliados-sinergeticos

**Tipo:** Portal propio (Sinergéticos) — sistema de afiliados
**Stack:** Next.js (App Router) + TypeScript + Tailwind + Supabase
**Repo:** https://github.com/synergy-code-3/afiliados-sinergeticos
**Deploy:** Vercel team **synergy-code** (`afiliados-sinergeticos`) — usar `--scope synergy-code`
**URL pública:** https://afiliados.sinergeticos.com (desde 3-ago-2026)
**DB:** Supabase de Sinergéticos — schema propio `afiliados` (tablas `af_afiliados`, `af_inscripciones`, recursos), separado de las tablas de Axis. Auth compartida con Axis.

## Qué es

Portal donde un afiliado crea cuenta, inscribe invitados a los eventos presenciales
gratuitos y el boleto le llega al invitado por WhatsApp al instante.

**Flujo:** `/crear-cuenta` → `/entrar` → `/panel` (inscribir + conteo + recursos)
· `/admin?k=AFILIADOS_ADMIN_KEY` (alta/baja de afiliados y recursos)

**Piezas clave:**
- [app/api/eventos/route.ts](app/api/eventos/route.ts) — sincroniza eventos desde
  la boletera (`synergyticket.net/api/events`), filtra por `isActive` +
  `freeTicketEnabled` + fecha futura; excluye upgrades/pruebas/Unlimited.
- [app/api/inscribir/route.ts](app/api/inscribir/route.ts) — candado
  anti-duplicados (RPC `persona_en_base`: quien ya está en la base NO se puede
  inscribir), tope de 50 inscripciones/afiliado/día, atribución primero y luego
  boleto gratis vía la API interna de la boletera (esa ruta dispara WhatsApp +
  secuencia + Sheet + Axis).
- Lista blanca de teléfonos de prueba que se saltan el candado: `+525513893229`.
- [middleware.ts](middleware.ts) — refresca sesión Supabase y protege `/panel`.

**Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SYNERGYTICKET_INTERNAL_API_KEY`, `AFILIADOS_ADMIN_KEY`.

---

## Sesión 13 — 4-ago-2026 — Admin por CUENTA (no por llave) + notas y contacto

**Antes:** el admin se abría con una llave compartida. Quien la tuviera entraba, no se
sabía quién hizo qué y no se le podía quitar el acceso a una sola persona.
**Ahora:** se es admin **por cuenta**, y los admins pueden dar de alta a otros.

**Migración `0081`** — tabla `afiliados.af_admins`. La clave es el **CORREO, no el
user_id**, a propósito: permite **pre-autorizar** a alguien que aún no tiene cuenta.
`jmdeleon@zigma3.com` no existía en Auth; queda admin en cuanto se registre con ese correo.
Sembrados: `davidiriza@gmail.com` y `jmdeleon@zigma3.com`.

**Sección "Administradores"** en el panel: lista quién es admin y quién lo agregó, alta
por correo y baja. Dos candados: **nadie puede quitarse a sí mismo** y **nunca puede
quedar la lista vacía**.

⚠️ **La llave compartida SIGUE FUNCIONANDO como respaldo** (`esAdmin()` acepta cuenta o
llave). Se dejó a propósito para no quedarnos fuera si algo falla con las cuentas —
pero es el agujero que este cambio venía a cerrar. **Quitarla cuando David confirme que
entra bien con su cuenta.**

**Migración `0080`** — `af_afiliados.notas` (observaciones libres del equipo) y el CSV
ahora puede llevar correo y fecha de alta, para que salga igual que el Excel "Referidos"
que pedía el Plan de Acción.

**Verificado:** con sesión de un afiliado normal (la cuenta demo), `POST /api/admin/admins`
responde **401** y la lista de admins no cambió. Igual en producción.

---

## Sesión 12 — 4-ago-2026 — Panel de admin con métricas y comisiones

Antes el admin solo contaba inscritos y boletos: **no veía dinero**. Ahora sí.

**Comisión: 20% de cada venta** — Plan de Acción de Referidos (PDF de Dani). Mismo % en
México y USA; lo que cambia es el precio del evento. Vive en un solo lugar:
[lib/comisiones.ts](lib/comisiones.ts), para que el día que cambie (o se definan las de
webinar y venta directa) haya un archivo que tocar.

**Migración `0079`** — `afiliados.admin_metricas()`, solo `service_role` (el panel ya
valida su propia cookie). Responde en ~0.5 s. Excluye la cuenta demo de todo.

**8 tarjetas:** afiliados/activos · invitados/con boleto · compraron + **tasa de cierre** ·
por pagar MXN · ventas MXN · ventas USD · por pagar USD · comisión del mes.

**3 vistas con su propio CSV:**
- **Afiliados** — inscritos, boletos, compraron, ventas y comisión por persona
- **Ciudades** — lo que el Plan de Acción pedía como "hoja por ciudad" en Excel
- **Eventos** — inscritos, boletos, compraron y % de cierre por evento

La gestión de activar/desactivar se movió a un `<details>` plegado: ya no es lo principal.

⚠️ **Ventana de atribución sin decidir:** cuenta cualquier compra posterior a la
inscripción, sin límite. El Plan de Acción dice "si compra **durante el evento**". Si se
acota, el cambio va en el join de `compras` de `admin_metricas()` y `mis_metricas()`.

Verificado en producción entrando al admin: las 3 pestañas cargan (4 afiliados,
4 ciudades, 5 eventos). Todo en ceros porque nadie ha comprado aún.

---

## Sesión 11 — 4-ago-2026 — Cuenta demo (backlog junta, A6)

Para enseñar el portal en juntas con vendedores sin exponer datos de nadie.

**Acceso:** `demo@afiliados.sinergeticos.com` — contraseña en
`~/.config/sinergeticos/` (ver con David). Marcada con `af_afiliados.demo = true`.

**Decisión clave — las ventas de la demo se CALCULAN, no se insertan.** Migración `0078`:
`mis_metricas()` detecta al afiliado demo y devuelve un escenario fijo (12 cerrados,
$48,600 MXN histórico / $16,200 del mes). **Jamás se escriben compras falsas en
`public.purchases`** — esa tabla alimenta los reportes reales del negocio (32k compras) y
ensuciarla para una demo sería peor que el problema que resuelve.

Las inscripciones sí son filas reales, pero viven en el schema `afiliados` (nuestro):
14 invitados con correos `@ejemplo.com` y teléfonos `+52 55 0000 00xx` para que nadie los
confunda con personas reales. 12 con boleto y 2 en "Emitiendo…" para que se vea también
el botón de reintentar.

**El admin excluye la demo** de sus conteos y la marca con una etiqueta gris. Verificado:
4 afiliados reales / 7 inscritos reales, y **0 compras falsas en Axis**.

Verificado entrando a la cuenta en producción: se ve el primer premio LOGRADO, avance
12/20 hacia el segundo, ventas y los 14 invitados en la tabla.

---

## Sesión 10 — 4-ago-2026 — Moneda por evento + perfil editable (backlog A5)

**Moneda: SOLO pesos o dólares, y la define el EVENTO** (regla de David, textual: "no
quiero que marque otra moneda que no sea pesos o dólares, se basa en el evento no en el
país de nadie"). Migración `0077` quitó el desglose `otras_monedas` de `0076`: todo lo
que compre un referido se cuenta en la moneda de su evento, sin importar cómo se cobró.

**El país sale del `timezone` que da la boletera** ([lib/pais.ts](lib/pais.ts)), se guarda
en `af_inscripciones.pais` al inscribir.

⚠️ **Bug que llegó a producción y se corrigió:** Cd. Juárez salía como `US`. Tiene su
propia zona IANA **`America/Ciudad_Juarez`** (existe desde 2022 porque Juárez sigue el
horario de EE. UU., no el de Chihuahua) y faltaba en la lista. Se detectó mirando la
salida real de `/api/eventos`, no compilando — el código era válido, el dato estaba mal.
Además se añadió red de seguridad: **si el nombre del evento menciona una ciudad
mexicana, gana sobre el timezone**. Probado con 13 casos, 13 correctos.

**A5 — perfil editable:** botón "Mi perfil" en el panel + `PATCH /api/perfil`. Nombre,
ciudad y WhatsApp. En la junta quedó **sin foto** ("es muy tedioso"). El id del afiliado
sale de la sesión, nunca del body. Verificado: 401 sin sesión, en local y en producción.

---

## Sesión 9 — 3-ago-2026 — Métricas del afiliado (backlog junta, A2)

Pedido en la junta: "ver cuántas personas tengo referidas, cuántas cerradas, cuánto ha
generado histórico y cuánto se me debe por mes".

- Migración `0076`→ en realidad `0075` (repo de Axis): `afiliados.mis_metricas()` devuelve
  jsonb con `referidos`, `con_boleto`, `cerrados` e `ingresos`. Usa `auth.uid()`.
- Panel: cuarta tarjeta **"Ya compraron"** + sección **"Lo que has generado"** con
  histórico y mes en curso.

**⚠️ Los ingresos van DESGLOSADOS POR MONEDA, jamás sumados.** En `purchases` conviven
**15 monedas** (mxn, usd, cop, pen, gtq, crc, cad, hnl…). Sumar cents de cop con cents de
mxn da un número sin significado. Verificado con datos reales: agrupa bien y separa el mes.

**🔴 La comisión NO se calcula** — los porcentajes no se definieron en la junta y además
cambian entre México y USA y por tipo de invitación. El panel muestra las **ventas
generadas** y lo dice explícito: "Son las ventas generadas, no tu comisión".

Escalera de premios actualizada (David sumó el nivel de 10):
**10** Renovación del Club Sinergético · **20** Pase Black · **50** Viaje a Nueva York ·
**100** Mastermind + 3 VIP.

---

## Sesión 8 — 3-ago-2026 — Premios y progreso en el panel (backlog junta, A1)

Backlog completo de la junta en [docs/BACKLOG-JUNTA.md](docs/BACKLOG-JUNTA.md).

**Escalera confirmada por David** (se gana por referidos que YA PAGARON, no por invitados):

| Referidos pagados | Premio |
|---|---|
| 20 | Pase Black a Synergy Unlimited |
| 50 | Viaje todo pagado con Jorge Serratos a Nueva York |
| 100 | Programa Mastermind + 3 boletos VIP |

- Migración `0074` (repo de Axis) — `afiliados.mis_referidos_pagados()`. **Sin parámetro
  a propósito: usa `auth.uid()`**; si recibiera el id del afiliado, cualquiera podría
  consultar el conteo de otro. Cruza invitado↔contacto por teléfono/correo y exige
  `purchased_at >= created_at` — si ya había comprado antes, no es mérito del afiliado.
- Panel: sección "Tus premios" con las 3 tarjetas, barra de avance y "te faltan N".

**Verificado:** con contactos de UNA sola compra, inscrito-antes cuenta 5/5 e
inscrito-después cuenta 0. ⚠️ El primer intento de prueba dio un falso positivo por usar
`count(*)` y contactos con varias compras — al medir esto hay que usar
`count(distinct inscripcion)`.

Hoy todos los afiliados marcan 0 pagados: los inscritos son de prueba y ninguno compró.

---

## Sesión 7 — 3-ago-2026 — El candado dejó de vetar a media base

**Antes:** estar en `contacts` (los 247k) bastaba para no poder inscribir a alguien.
**Ahora** (decisión David) solo detienen dos cosas: que ya esté registrado **a ese
evento**, o que **ya nos haya comprado**.

- RPC nueva `afiliados.persona_bloqueada(email, telefono, event_tk_id)` — migración
  `0073` en el repo de Axis. La vieja `persona_en_base` se dejó viva por si algo más la usa.
- "Registrado a ese evento" se resuelve por **pipeline** (`ticketera_events.pipeline_id`),
  no casando nombres de texto: los formatos no coinciden entre la boletera y el payload.
- El segundo candado (`af_inscripciones`) también se acotó al evento — antes vetaba
  globalmente y contradecía la regla nueva.

**Impacto medido antes de aplicarlo,** sobre 300 contactos reales: bloqueaba 300/300
(100%) → ahora 9 (3%). Verificado que quien compró queda bloqueado, y quien está
registrado a un evento queda bloqueado **solo en ese evento**, libre para otro.

Desplegado y verificado en producción.

---

## Sesión 6 — 3-ago-2026 — Correo propio (Resend) y recuperación funcionando

El correo de Auth ya NO sale de `supabase.io`. Detalle completo y reusable en
[docs/CORREO-RESEND.md](docs/CORREO-RESEND.md) y en la memoria
`reference_correo_transaccional_resend`.

**Cómo se descubrió el problema:** se disparó un reset real y se leyó el correo en el
buzón. Traía `redirect_to=http://localhost:3000` — la recuperación mandaba al afiliado a
su propia computadora. Causa: `uri_allow_list` vacío, así que Supabase ignoraba el
`redirect_to` y caía al `site_url`, que está en localhost.

**Aplicado en el proyecto `synergy-axis` (tdvgfpjkmelvviwhvfih), que comparte Axis:**
- SMTP de Resend (`smtp.resend.com:465`, user literal `resend`, sender
  `cuentas@envios.sinergeticos.com`). ⚠️ La Management API exige `smtp_port` como
  **string**; con número devuelve `expected string, received number`.
- `uri_allow_list` = `https://afiliados.sinergeticos.com/**`
- Plantillas y asuntos en español, conservando `{{ .ConfirmationURL }}`.

**Verificado con el correo real que llegó:** remitente `Sinergéticos
<cuentas@envios.sinergeticos.com>`, asunto "Recupera tu contraseña", `dkim=pass` con
dominio propio, `spf=pass`, **INBOX** (no spam), y la liga ya apunta a
`https://afiliados.sinergeticos.com/nueva-contrasena`.

**RESUELTO el mismo día:** se le puso dominio real a Axis (`https://axis.sinergeticos.com`,
CNAME `axis` → `0b37321b4ac6b1f5.vercel-dns-016.com`; verificó **solo con el CNAME**, el
TXT no hizo falta) y con eso:
- `site_url` = `https://axis.sinergeticos.com` — Axis es el dueño del proyecto.
- `uri_allow_list` = `https://afiliados.sinergeticos.com/**,https://axis.sinergeticos.com/**`

**Regla de convivencia** (Auth es UNA sola instancia por proyecto): cada sistema manda
SIEMPRE su `redirect_to` explícito y suma su dominio a `uri_allow_list`; el `site_url` es
solo el fallback. Por eso el copy de los correos es neutral ("Sinergéticos"), sin nombrar
sistemas — las plantillas también son únicas para todo el proyecto.

**Verificado tras el cambio:** se disparó otro reset desde el portal y la liga siguió
apuntando a `https://afiliados.sinergeticos.com/nueva-contrasena`, NO a Axis.

**Por qué NO se separó la base:** la separación que importa ya existe — datos en schema
`afiliados`, y Axis autoriza contra la tabla `dashboard_roles` (quien no esté ahí no
entra, así que un afiliado nunca alcanza Axis). Lo único compartido es la identidad
(`auth.users`). Separarlo costaría el candado `persona_en_base`, que hoy es una consulta
local a la base de Sinergéticos y pasaría a ser una API entre sistemas.

🟡 La API key de Resend viajó por el chat — David dijo que no le preocupa.

---

## Sesión 5 — 3-ago-2026 — Tapando huecos antes de abrirlo al equipo

Base de partida: 6 inscripciones y 4 afiliados, **todos de prueba** — el sistema aún no
arrancaba en real, así que se metió todo esto antes de que hubiera datos que respetar.

**Recuperación de contraseña** — `/recuperar` (pide liga) y `/nueva-contrasena` (la
canjea). Sin esto, cada afiliado que olvidara su contraseña era soporte manual.
⚠️ **Requiere que `https://afiliados.sinergeticos.com/**` esté en los Redirect URLs de
Supabase Auth.** Sin eso la liga del correo no regresa al portal.

**Editar invitado** (`PATCH /api/inscripciones/[id]`) — corrige nombre/correo/WhatsApp.
Si el boleto ya se emitió, la boletera **conserva los datos viejos**: la UI lo dice
explícitamente y empuja a mandarlo con "Copiar liga" (el boleto es válido igual).

**Reintentar boleto** (`POST /api/inscripciones/[id]`) — para inscripciones que quedaron
en `error:`/`enviando`. Nunca emite dos boletos: si ya hay `ticket_id`, responde 409.

**Estados legibles** — la base guarda `error: <detalle crudo>`; `estadoLegible()` en
[lib/boleto-ui.ts](lib/boleto-ui.ts) lo traduce a "No se pudo emitir". El detalle crudo
JAMÁS se le muestra al afiliado.

**Admin blindado** — la llave ya NO viaja en la URL ni en el body. Se canjea una vez por
cookie httpOnly firmada con HMAC-SHA256 ([lib/admin-auth.ts](lib/admin-auth.ts), 12 h).
`AFILIADOS_ADMIN_KEY` ya solo se lee ahí. **El link viejo `/admin?k=...` ya no sirve** —
hay que teclear la llave una vez. Además: ranking por boletos colocados y export CSV.

**Emisión unificada** — `emitirBoleto()` en [lib/boletera.ts](lib/boletera.ts) (solo
server, toca la API key) la comparten alta y reintento. Los helpers de UI viven aparte en
`lib/boleto-ui.ts` para no arrastrar nada de eso al bundle del navegador.

**Verificado (no solo que compilara):** cookie de admin resistió 6 intentos de
falsificación (firma alterada, exp del 2099, exp caducada, sin firma, basura, vacía) y el
token legítimo sí entra · `/admin` sin cookie no filtra ni un nombre · toggle y
recursos dan 401 sin cookie · PATCH/POST de inscripciones dan 401 sin sesión y el dato
NO cambió en la base · 15 rutas en el build · todo revalidado en producción.

**Lo que NO se hizo y por qué:**
- **Asistencia** — bloqueada por la boletera. Ver
  [docs/PETICION-BOLETERA-ASISTENCIA.md](docs/PETICION-BOLETERA-ASISTENCIA.md).
  No se metió código muerto esperándola.
- **Incentivos/premios** — falta que David defina meta y recompensa. Se dejó lo neutral:
  tarjetas de Invitados / Con boleto / Pendientes en el panel.
- **Recordatorios pre-evento** — no salen de este repo: necesitan plantilla de WhatsApp
  aprobada (regla de 24 h) y un cron. Falta decidir dónde viven.

---

## Sesión 4 — 3-ago-2026 — Boletos descargables en el panel

El afiliado ya puede llegar al boleto de cada invitado y bajar su lista.

**En la tabla "Mis inscritos":** columna **Boleto** con `Ver` (abre
`https://synergyticket.net/ticket/<ticket_id>`) y `Copiar liga`. La página de la
boletera **ya trae su propio botón "Descargar PDF"** — por eso NO se replicó el
diseño del boleto en este portal (se desincronizaría cada vez que cambien el suyo).

**Botón "Descargar CSV"** junto al título: nombre, correo, WhatsApp, evento, estado,
fecha y liga del boleto. Con BOM UTF-8 (acentos en Excel) y todo entrecomillado
(los nombres de evento traen comas y los teléfonos empiezan con `+`).

**La boletera no tiene endpoint de PDF** — lo arma en el navegador con `jsPDF` +
`html2canvas`. No hay archivo que linkear directo; la única vía es su página.

**Trampa al explorar la boletera:** es una SPA que responde **200 con el mismo shell de
2787 bytes en cualquier ruta inventada**. Para saber si algo existe hay que mirar
`/api/...` (JSON real) o abrirla en navegador — nunca el status code.
Rutas reales sacadas del bundle: `/ticket/:ticketId`, `/render-ticket/:ticketId`.
`GET /api/tickets/<id>` devuelve el ticket completo (qrCode, buyer, evento) sin auth.

---

## Sesión 3 — 3-ago-2026 — Dominio propio conectado

`afiliados.sinergeticos.com` → proyecto Vercel. **Verificado y con SSL.**

`sinergeticos.com` NO está en Vercel: vive en **GoDaddy** (`ns69/ns70.domaincontrol.com`),
y David tiene el acceso. Por eso el subdominio se asignó vía API de project-domains
(`vercel domains add` a nivel team falla con `domain_not_owned` al no controlar el apex).

Registros creados en GoDaddy (zona `sinergeticos.com`):
| Tipo | Nombre | Valor |
|---|---|---|
| TXT | `_vercel` | `vc-domain-verify=afiliados.sinergeticos.com,9c522d8f21d17811c268` |
| CNAME | `afiliados` | `0727d64541b771be.vercel-dns-016.com` |

Cert Let's Encrypt emitido 3-ago 15:55 UTC (vence 1-nov-2026, renovación automática).
Verificado: 12/12 requests 200, `misconfigured: false`, sin conflictos.
El apex `sinergeticos.com` apunta a otro servicio (`15.197.148.33`) y no se tocó.

**Ojo:** ahora que hay dominio custom, si alguien reactivara `ssoProtection` en modo
`all_except_custom_domains`, el dominio propio seguiría abierto pero las URLs
`.vercel.app` no — distinto al escenario que rompió el sitio en la sesión 2.

---

## ⚠️ Trampa de deploy (leer antes de subir a Vercel)

Los deploys de este proyecto se hacen **por CLI** (`vercel deploy --prod --scope synergy-code`).
Si `.next/` local viaja en el upload, Vercel **pierde la raíz del proyecto**: se inventa
un script `vercel-build`, no encuentra `app/` y compila vacío — el build queda `● Ready`
pero solo produce `Route (pages) ─ ○ /404`, y producción responde 404 en todo.

**Señal en los logs:** `Downloading 8XX deployment files` + `Running "npm run vercel-build"`.
**Correcto:** `Downloading ~37 deployment files` + `Running "npm run build"` + tabla `Route (app)` con 11 rutas.

Por eso existe `.vercelignore` (ignora `.next`, `node_modules`, `capturas`, `branding`).
**No lo borres.** El `.gitignore` NO basta para esto.

---

## Sesión 2 — 2-ago-2026 — Producción caída, reparada

**El síntoma:** el portal "caído" en Vercel.

**Las dos causas (una tapaba a la otra):**
1. `ssoProtection: all_except_custom_domains` — todo request daba 302 al login de Vercel.
   Como el proyecto no tiene dominio custom, protegía absolutamente todo. **Apagado.**
2. Debajo estaba el problema real: el deployment de producción (29-jul) había compilado
   vacío por la trampa de `.next` de arriba. Todo daba 404.

**Lo hecho:**
- Apagada la protección SSO (`ssoProtection: null`) vía API de Vercel.
- Redeploy a producción desde el repo limpio → 11 rutas compiladas, producción viva.
- Creado `.vercelignore` para que no se repita (verificado: 849 → 37 archivos de upload).

**Verificado en producción:** `/` 200 · `/entrar` 200 · `/crear-cuenta` 200 ·
`/panel` 307 → `/entrar` (middleware ok) · `/api/eventos` 200 devolviendo eventos
reales de la boletera (Mexicali SEED, Tijuana, Cd. Juárez).

**Pendientes:**
🔴 P0: commitear y pushear `.vercelignore` — sin eso, el próximo deploy de otra persona
   vuelve a romper producción igual.
🟡 P1: los previews quedaron públicos al apagar el SSO. Lo estándar es dejarlo en
   `ssoProtection: {deploymentType: "preview"}` (producción pública, previews con candado).
🟡 P1: `/admin` está protegido solo por `?k=AFILIADOS_ADMIN_KEY` en la URL, no con
   contraseña verificada server-side como los otros dashboards internos.
🟢 P2: el teléfono de prueba `+525513893229` sigue hardcodeado en la lista blanca de
   [app/api/inscribir/route.ts](app/api/inscribir/route.ts).

**Ojo con el equipo:** `deptoprogramacionbunker` también deploya por CLI a este proyecto
(fue quien subió el build roto, sin saberlo). El proyecto YA está enlazado a GitHub
(`synergy-code-3/afiliados-sinergeticos`, rama `main`) — conviene que los deploys salgan
del repo y no de uploads locales.

**Próximo paso para retomar:** commitear `.vercelignore` + `STATE.md` y pushear.

---

## Sesión 1 — 28-jul-2026 (reconstruida desde git el 2-ago-2026)

**Lo hecho:**
- Portal completo: auth Supabase, panel del afiliado, admin con llave por query string.
- Datos en schema propio `afiliados`, separado de Axis.
- Candado anti-duplicados + sync de eventos por `isActive`/`freeTicketEnabled`.
- Rediseño con estética SEED, sección de recursos descargables, logo y favicon propios.

**Pendientes:** por definir con David.

**Próximo paso para retomar:** confirmar si está en producción y qué falta para abrirlo al equipo.
