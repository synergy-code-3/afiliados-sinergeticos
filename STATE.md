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

## Sesión 19 — 5-ago-2026 — El invitado ya recibe el Pase de Afiliado

Los invitados de un afiliado ya NO reciben el mismo boleto que las landings.

**El tipo es `general`.** En el panel de la boletera se llama **"Boleto de Afiliados"**
(el naranja) pero por dentro es `general` — reutilizaron ese tipo y le cambiaron nombre y
diseño el 4-ago. Buscar "afiliado"/"affiliate" en su base NO devuelve nada; el mapeo está
en su bundle: `{ paid:"Boleto de Pago", general:"Boleto de Afiliados", free:"Boleto Gratuito" }`.

**Estuvo bloqueado unas horas:** su `/api/internal/tickets` validaba el tipo contra un
enum que solo aceptaba `free | club-general | club-vip`. David lo habilitó en Replit.

⚠️ **Lección:** el primer intento se desplegó SIN probar que la API aceptara el tipo, y
durante unos minutos ninguna inscripción habría emitido boleto. Al cambiar el
`ticket_type`, probar la emisión ANTES de desplegar.

**Verificado end-to-end** (no solo que compilara): inscripción real desde el portal con la
sesión de Manuel → `POST /api/inscribir` 200 → boleto `aa940c84…` en la boletera con
`ticket_type = general`, `status = paid`, sin cobro.

Si algún día vuelve el 400 "Invalid enum value", se revirtió el cambio del lado de la
boletera — no es un bug del portal.

---

## Sesión 18b — 4-ago-2026 — Correcciones de Manuel (misma noche, desplegadas)

Cuatro ajustes dictados por Manuel viendo el portal vivo, más un rebase sobre el hotfix
de David (`8b0dc72`, el Pase de Afiliado sigue emitiéndose como `free`):

- **"Utilidad proyectada" ≠ calculadora**: se eliminó el proyector de sliders. Lo pedido:
  en **Mis inscritos**, columna *Comisión* por invitado — importe real con etiqueta
  **"Comisión confirmada"** si el equipo ya capturó su compra, o **"hasta $X"** con
  etiqueta **"Proyectado"** (paquete 12m según el `pais` del evento del inscrito) —
  más tarjeta resumen con ambos totales por moneda y CSV con las dos columnas nuevas.
- **La geografía no la elige nadie**: en la captura de ventas del admin queda FIJA
  cuando la venta viene de una inscripción ("la define el evento del referido");
  los chips solo viven en captura libre. El servidor ya la imponía desde antes.
- **Mapa vivo**: los pines salen de TODOS los eventos registrados (`/api/eventos`),
  agrupados por ciudad (gazetteer de 39 ciudades MX/US con proyección real);
  tooltips con evento/fecha/venue/comisión; eventos fuera del recorte del mapa o sin
  ciudad reconocida aparecen como fichas bajo el mapa. Se actualiza solo.
- **"Hazlo más llamativo" (Tu equipo +1)**: rediseño estructural — 20% EXTRA gigante
  en dorado como héroe, escena SVG de tu red, CTA con brillo y código de referido
  tipo cupón. **Tutoriales con "capturas"**: mini-pantallas recreadas en HTML/CSS
  (form de inscribir, WhatsApp del pase VIP, tabla de comisiones viva, línea de
  tiempo del pago, liga personal).

Deploy verificado vía GitHub Deployments: sha `00c809b` → Production **success**.
Lección aplicada tras el push rechazado: **rebase → build → push**, jamás a ciegas.

---

## Sesión 18 — 4-ago-2026 — SYNERGY +1: rebrand completo, neumorfismo, red +1, ventas y presentación

La expansión más grande del portal desde su nacimiento, dictada por Manuel. Construida
multi-agente (8 constructores en paralelo con fronteras de archivos + brief maestro en
[docs/SYNERGY-PLUS-BRIEF.md](docs/SYNERGY-PLUS-BRIEF.md) + revisión adversarial posterior).

**La marca:** el programa ahora se llama **Synergy +1** (1+1=3 — sé el +1 de alguien más y
gana con ello). Los afiliados invitan a sus +1 al **Seminario de Emprendedor a Empresario
Digital** (Jorge Serratos + Manuel de León); el invitado recibe **pase VIP de cortesía** por
WhatsApp (es el mismo boleto de la boletera de siempre, renombrado en el copy).

**Lo nuevo:**
- **Neumorfismo oscuro**: las clases existentes (.glass/.field/.btn-cta/.ruta-*) se
  re-skinearon conservando el nombre — todo el markup se actualizó solo. Logo nuevo
  (`app/components/logo-synergy.tsx` + `/brand/logo-synergy-plus.svg`).
- **Globito de WhatsApp** en toda la app → +1 224 587 0935 (Daniel) con mensaje precargado.
- **Onboarding `/bienvenida`** (primera vez): apodo → selfie/foto (bucket `af-fotos`) →
  celebración. Redirect desde /panel solo si `onboarding_at` es null Y la 0082 está aplicada.
- **Panel**: comisiones propias (pendiente/validada/pagada), proyector de utilidad,
  **mapa interactivo** de la gira (6 ciudades, ago-2026) con comisiones por geografía,
  premios CON imagen (Higgsfield), **equipo +1** (liga `/crear-cuenta?ref=CODIGO`, override
  20%), tutoriales (5) y mejores prácticas. Correo del invitado ahora **opcional**
  (sin correo se usa buzón técnico `invitado+<tel>@sinergeticos.com` — la boletera lo exige),
  WhatsApp obligatorio, errores del candado en tono amable ("Oops… 🙈").
- **Admin**: captura de ventas por correo/teléfono (comisión fija MX $2,500/$2,700/$3,000 ·
  US $299/$359/$399 por 3/6/12 meses — `lib/comisiones.ts` es LA fuente), override 20%
  automático al líder, estados pendiente→validada→pagada con leyenda de 72 h + depósito en
  10 días hábiles, CSV, proyección por afiliado, y la **Red +1**.
- **Presentación** pública `/presentacion` (selector MX/US) → deck de 18 slides con fondos
  cine (Higgsfield soul_location), QR del grupo de WhatsApp, gira, comisiones, premios,
  mejores prácticas y el pago claro. Teclado/swipe/fullscreen.
- **Cron** `/api/cron/reintentar-boletos` (vercel.json, cada 15 min): cura boletos atorados
  solo — patrón adoptado del embudo-bgi (análisis pedido por Manuel).

**Verificado EN PRODUCCIÓN (4-ago 17:53):** push a `main` disparó el deploy solo — el
proyecto Vercel está enlazado a GitHub, así que **push = deploy** (no hace falta el CLI ni
el scope synergy-code). Smoke: 7 rutas públicas 200 · /panel y /bienvenida 307→/entrar ·
5 assets 200 · /api/inscribir y /api/admin/* 401 sin sesión · cron responde
`{ok:true, revisadas:0}` · noindex presente. Revisión adversarial previa al push:
18 agentes (3 lentes + verificadores), 12 hallazgos confirmados, TODOS corregidos
(detalle en el commit 94cce38).

**⚠️ Migración 0082 pendiente de aplicar** (equipo de David / proyecto Axis):
[synergy-code-3/synergy-axis#1](https://github.com/synergy-code-3/synergy-axis/pull/1).
El portal la detecta solo (`lib/schema.ts`): sin ella, las features de base se ocultan con
gracia y el admin ve "Pendiente de activar". Al aplicarla, TODO se enciende sin redeploy.
Desde esta máquina no hay credenciales del proyecto de Axis (org Synergy Code) — misma
limitación documentada en CORREO-RESEND.md.

**Ojo comisiones viejas vs nuevas:** `admin_metricas()` y su CSV siguen mostrando el 20%
sobre ventas (modelo anterior). Conviven a propósito hasta que David confirme retirar el
cálculo viejo; la captura nueva usa SOLO las tarifas fijas.

---

## Sesión 17 — 4-ago-2026 — Los premios, rediseñados como una ruta

David: "que se vea gamificado y aspiracional". Feedback **de gusto**, así que NO se
respondió con cosmética (tonos, sombras, radios) — se cambió la **estructura**, que es lo
que producía la sensación de plano: eran 4 tarjetas iguales una junto a otra, sin
recorrido ni jerarquía, y 4 barras cortadas nunca cuentan un avance.

Se presentaron 2 opciones estructurales lado a lado
([artifact](https://claude.ai/code/artifact/572c9c6e-ec65-4daa-82d7-48b6dcee5882)) y
David eligió **A · la ruta**: un solo camino con los 4 premios encima y el avance como
línea continua. Nodo logrado en verde con palomita, el actual con anillo que late, los
lejanos atenuados.

**La barra camina DE NODO A NODO, no de cero.** Los nodos caen en el centro de su columna
(12.5% · 37.5% · 62.5% · 87.5%); si midiera `cerrados/meta-final`, con 12 de 100 se vería
casi vacía aunque ya se ganó el primer premio. Verificado: 10→12.5%, 20→37.5%, 50→62.5%,
100→100%, aterrizando exacto en cada nodo.

En móvil el carril desaparece y la escalera se lee como lista vertical.
Acabados aplicados: sombra tintada al ambiente, bisel de luz en el nodo logrado, barrido
diagonal sobre el vidrio. Respeta `prefers-reduced-motion`.

---

## Sesión 16 — 4-ago-2026 — Navegación entre panel y administración

Antes había que escribir `/admin` a mano. Ahora:
- **En `/panel`**: botón **"Administración"**, visible SOLO si la cuenta está en
  `af_admins`. Un afiliado normal no lo ve.
- **En `/admin`**: botón **"← Mi panel"** para volver.

Verificado en producción con la cuenta de Manuel: ida y vuelta funcionando.

---

## Sesión 15 — 4-ago-2026 — Se eliminó la llave compartida del admin

El acceso al panel es **solo por cuenta**. `AFILIADOS_ADMIN_KEY` ya no se usa en ningún
lado del código; `/api/admin/login` y la pantalla de la llave se borraron.

**Antes de quitarla se comprobó en el navegador** que el acceso por cuenta funciona:
Manuel (`jmdeleon@zigma3.com`) inició sesión en `/entrar`, entró a `/admin` sin llave,
aparece marcado "TÚ" en la lista y no puede quitarse a sí mismo.

⚠️ Ese primer intento pareció un bug del acceso por cuenta y NO lo era: la contraseña
estaba mal (se dictó de memoria en vez de leerla). Antes de culpar al mecanismo, revisar
que la credencial sea la correcta.

Nueva pantalla `SinAcceso` distingue dos casos, porque no se arreglan igual:
- **sin sesión** → "Inicia sesión" con liga a `/entrar`
- **con sesión pero sin permiso** → "Tu cuenta no tiene acceso", mostrando con qué correo
  entró, para que pida que lo agreguen

Verificado en producción: `POST /api/admin/login` → **404** (la ruta ya no existe) y
`/admin` sin sesión muestra "Inicia sesión", no el campo de llave.

La env var `AFILIADOS_ADMIN_KEY` **sigue en Vercel pero ya no la lee nadie** — se puede
borrar cuando se quiera.

---

## Sesión 14 — 4-ago-2026 — La cuenta de ejemplo pasa a ser la de Manuel

`jmdeleon@zigma3.com` es ahora **la cuenta con datos de prueba** — es quien va a enseñar
el portal. Se le creó la cuenta (no existía en Auth) y se le transfirieron los 14
invitados de ejemplo. **También es admin**, así que ve el panel completo; sus datos demo
siguen excluidos de las métricas reales.

La cuenta `demo@afiliados.sinergeticos.com` quedó **desactivada y sin datos**, aún marcada
`demo=true` para que no ensucie ningún conteo.

**Arreglado de paso:** los botones "Ver" de la demo apuntaban a `demo-ticket-N`, que **no
existe** — y como la boletera es una SPA que responde 200 con cualquier id, se veía una
pantalla rota justo al enseñarla. Ahora apuntan a un boleto REAL
(`da624c22-…`, "Manuel de Leónidas · Cd. Juárez"), así que la demo se ve completa.

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
