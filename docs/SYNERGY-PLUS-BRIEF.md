# Synergy +1 — Brief maestro de construcción (4-ago-2026)

Rebranding y expansión mayor del portal de afiliados. TODO agente que construya
aquí lee este documento COMPLETO antes de tocar código, más `STATE.md` (historia
y trampas) y `AGENTS.md` (Next.js 16: leer docs en `node_modules/next/dist/docs/`
antes de escribir código).

## La marca: Synergy +1

- **Nombre:** Synergy +1 · un programa del Club Sinergético.
- **Filosofía:** en Sinergéticos creemos que **1+1=3**. Tú puedes ser el **+1**
  de alguien más: juntos logran algo más grande — y tú ganas con ello.
- **Qué hace un afiliado:** invita a sus referidos (sus "+1") al **Seminario de
  Emprendedor a Empresario Digital** con **Jorge Serratos y Manuel de León**.
  Su invitado recibe un **pase VIP de cortesía** que le llega por WhatsApp al
  instante (eso ya lo hace el portal — es el boleto de la boletera).
- **Tono:** español humano, cálido, directo. Público 35–60 NO técnico. Cero
  clichés de IA ("desbloquea", "sumérgete", "en el mundo de"). Textos grandes,
  targets ≥44px, errores visibles y amigables.

## Sistema visual: neumorfismo oscuro Sinergéticos

Evolución del look actual (verde SEED sobre negro) hacia **neumorfismo oscuro**:
superficies extruidas del MISMO material que el fondo, con doble sombra
(luz arriba-izquierda, sombra abajo-derecha) e inset al presionar.

Tokens (los define el agente de design-system en `globals.css`; el resto los USA):

```css
--bg:          #0e1412;   /* verde-negro, base de todo */
--surface:     #121917;   /* tarjeta extruida (mismo material, apenas más claro) */
--neu-luz:     rgba(46, 66, 56, 0.55);   /* sombra clara (arriba-izq) */
--neu-sombra:  rgba(2, 6, 4, 0.85);      /* sombra oscura (abajo-der) */
--accent:      #19e16d;   /* verde marca — NO cambia */
--oro:         #d9b45b;   /* dorado Club Sinergético, para premios/momentos */
--radius:      18px;
```

Reglas:
- Tarjeta: `box-shadow: -6px -6px 14px var(--neu-luz), 8px 8px 18px var(--neu-sombra)`.
- Campos de formulario: **inset** (hundidos). Botón presionado: inset.
- Las clases existentes (`.glass`, `.field`, `.btn-cta`, `.btn-ghost`, `.label`,
  `.sec-tag`, `.ruta-*`) se RE-SKINEAN a neumorfismo conservando su nombre — así
  todo el markup existente se actualiza solo.
- El neumorfismo mata el contraste si se abusa: el TEXTO conserva contraste alto
  (blanco/verde sobre oscuro), `:focus-visible` visible siempre, respetar
  `prefers-reduced-motion`.
- Sombras SIEMPRE por clase, nunca inline (inline le gana a `:active` y el
  hundido no se ve — lección BGI).

## Comisiones (fuente única: `lib/comisiones.ts` — YA escrito, solo importar)

| Paquete | Evento MX | Evento US |
|---|---|---|
| Club 3 meses | $2,500 MXN | $299 USD |
| Club 6 meses | $2,700 MXN | $359 USD |
| Club 12 meses | $3,000 MXN | $399 USD |

- **Override:** quien registró a un afiliado gana **20% extra** de cada comisión
  que ese afiliado genere (no se descuenta al afiliado; es adicional).
- **Validación:** después del evento hay **72 horas** para validar comisiones.
- **Pago:** se hace corte del evento y el depósito llega en **10 días hábiles**.
- La geografía la define el **EVENTO** (`af_inscripciones.pais`), jamás el
  país del comprador. Solo MXN o USD.

## Premios por referidos que YA COMPRARON (escalera existente, no cambiar metas)

10 → Renovación del Club Sinergético · 20 → Pase Black a Synergy Unlimited ·
50 → Viaje a Nueva York con Jorge Serratos · 100 → Mastermind + 3 boletos VIP.
Imágenes: `/premios/premio-10.webp`, `premio-20.webp`, `premio-50.webp`, `premio-100.webp`.

## Gira — reuniones informativas (agosto 2026, del screenshot de Manuel)

| Ciudad | Fecha | Hora CDMX | Hora local |
|---|---|---|---|
| Austin | Martes 4 | 6:00 pm | 7:00 pm |
| Tijuana | Martes 4 | 9:00 pm | 7:00 pm |
| Ciudad Juárez | Miércoles 5 | 5:00 pm | 6:00 pm |
| San Antonio | Miércoles 5 | 6:00 pm | 7:00 pm |
| Houston | Jueves 6 | 6:00 pm | 7:00 pm |
| Dallas | Jueves 6 | 8:00 pm | 9:00 pm |

## WhatsApp

- **Globito de ayuda (toda la app):** liga a
  `https://wa.me/12245870935?text=` + URL-encode de
  `Hola, Daniel. Soy parte del programa Afiliado Sinergético, necesito tu apoyo.`
- **Grupo de afiliados:** `https://chat.whatsapp.com/Eg9V1E5JIEmDlTH9NKdlTU`
  — QR ya generado en `/public/qr-grupo-wa.png`.

## Ganancias a comunicar (presentación/proyector)

"Hemos visto gente generando entre **$30,000 y $65,000 MXN al mes**" — en la
versión US: "**$1,600 a $3,500 USD al mes**". Siempre con lenguaje de
posibilidad, nunca de garantía.

## Base de datos — DEGRADACIÓN ELEGANTE (crítico)

La migración `supabase/migrations/0082_afiliados_synergy_plus.sql` añade:
`af_afiliados.{apodo, foto_url, onboarding_at, referido_por, codigo_ref}`,
tabla `af_ventas` y bucket `af-fotos`. **Puede NO estar aplicada aún en
producción** (la aplica el equipo de David en el proyecto de Axis).

Regla para TODA feature nueva que dependa de eso:
- El server component o la API **detecta** si la columna/tabla existe
  (helper `synergyPlusListo()` en `lib/schema.ts`, lo escribe el integrador —
  los agentes ASUMEN que reciben un booleano `dbListo` por props o lo importan).
- Si `dbListo === false`: la UI del afiliado OCULTA la feature con gracia
  (sin errores en pantalla); el admin muestra una tarjeta "Pendiente de
  activar en base de datos" con el nombre de la migración.
- Las secciones ESTÁTICAS (tutoriales, mejores prácticas, mapa, premios,
  proyector, presentación, globito WA) NO dependen de la base: siempre visibles.

## Arquitectura de acceso a datos (patrones existentes — NO inventar otros)

- Sesión del afiliado: `supabaseSession()` (`lib/supabase-server.ts`).
- Datos sin RLS: `supabaseService()` SOLO en rutas/server components, filtrando
  SIEMPRE por `user.id` de la sesión — jamás por ids del body.
- Admin: `esAdmin()` de `lib/admin-auth.ts` (cuenta en `af_admins`).
- Errores al usuario: mensajes humanos; el detalle crudo JAMÁS se muestra.

## Textos de error amigables (dictado por Manuel)

Duplicado al inscribir: "Oops — esta persona ya está registrada en nuestra
base, a este evento u otro 🙈. Puedes invitar a alguien más." (variantes según
el candado: ya-en-este-evento / ya-es-cliente).

Formulario de invitado: **el correo es OPCIONAL** (etiquetarlo "· opcional"),
el **WhatsApp es OBLIGATORIO**. Si la boletera exige correo, revisar
`lib/boletera.ts` y decidir el fallback más limpio (documentarlo).

## Assets (ya en `/public` cuando integres — usa estas rutas EXACTAS)

- `/brand/logo-synergy-plus.svg` — logo (lo crea el agente de design-system,
  también como componente React `<LogoSynergyPlus/>`).
- `/brand/hero-comunidad.webp` — hero landing 16:9.
- `/premios/premio-{10,20,50,100}.webp` — 16:9.
- `/slides/bg-{portada,filosofia,gira,ganancias,seminario,practicas,premios,cierre}.webp` — 16:9 cine.
- `/qr-grupo-wa.png` — QR del grupo.

Si un asset no existe al momento de construir, el componente debe verse bien
igual (fondo degradado de respaldo) — el integrador los coloca al final.

## Reglas duras de ejecución (para TODOS los agentes)

1. **PROHIBIDO** correr `next build`, `next dev` o `npm run build` (candado
   compartido — lección BGI). Verificar SOLO con
   `npx tsc --noEmit --incremental false`.
2. No tocar archivos fuera de tu frontera declarada. `panel-client.tsx`,
   `panel/page.tsx` y `admin/page.tsx` son del INTEGRADOR: tú entregas
   componentes con props tipadas y un bloque "CÓMO MONTAR" en tu reporte.
3. Español en TODO texto visible. Sin `console.log`. Inmutabilidad. Funciones
   <50 líneas cuando sea razonable. Sin hardcodear secretos.
4. Móvil primero: el 80% de los afiliados entra por teléfono.
5. Animaciones con `@keyframes` propios + `prefers-reduced-motion` respetado.
6. iCloud genera archivos ` 2.tsx` fantasma — si ves uno, bórralo, no lo edites.
