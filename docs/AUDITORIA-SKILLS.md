# Auditoría de conocimiento aplicado — Synergy +1

**Fecha:** 4 de agosto de 2026 · **Proyecto:** afiliados.sinergeticos.com (rebranding Synergy +1)
**Qué es este documento:** un inventario honesto de cuánto del conocimiento acumulado del sistema
(skills instaladas + reglas globales + lecciones de proyectos anteriores) se está usando de verdad
en esta construcción, y qué falta por aprovechar.

---

## Resumen ejecutivo

El sistema tiene **~170 skills instaladas** y **14 reglas globales de ingeniería**; de todo eso,
**unas 20 skills aplican directo a Synergy +1** y están trabajando aquí. El activo más valioso es
**desarrollo-plataformas**: un protocolo de 9 fases con **229 lecciones registradas de más de 10
proyectos reales tuyos** (BGI, admin Sinergéticos, portal closers, lunesinergetico, VSL, clases).
El brief de Synergy +1 **ya trae horneadas ~15 de esas lecciones** — errores que costaron horas en
BGI o en el ERP aquí se evitan desde la primera línea. Los huecos reales: pruebas automatizadas del
portal, accesibilidad auditada con datos y monitoreo de errores en producción.

---

## Skills que aplican a este proyecto

| Skill | Qué aporta | Dónde se aplicó en Synergy +1 |
|---|---|---|
| **desarrollo-plataformas** | El protocolo maestro: fases, reglas duras, consejo de expertos, ciclo de aprendizaje | Todo el brief está escrito con sus reglas (verificar con tsc, fronteras por agente, degradación elegante, público 35-60) |
| **ui-ux-pro-max** | 50+ estilos de diseño con guía concreta de **neumorfismo**, contraste y accesibilidad | El sistema visual completo: superficies extruidas, doble sombra, campos hundidos (inset), sin matar el contraste del texto |
| **frontend-design** | Dirección visual intencional, que no se vea "de plantilla" | La evolución del verde SEED plano al neumorfismo oscuro con identidad propia |
| **design-system** | Tokens en 3 capas (primitivo → semántico → componente) | Los tokens de `globals.css` (`--bg`, `--surface`, `--neu-luz`, `--neu-sombra`, `--oro`) que todos los agentes USAN sin redefinir |
| **frontend-slides** / **slides** | Presentaciones HTML con animaciones, pensadas para proyector | La presentación del programa para las reuniones de la gira (fondos cine en `/slides/bg-*.webp`) |
| **lunes-sinergetico-class-builder** | Las 8 reglas de dirección de arte que dictaste pantalla por pantalla (portada aparte, cero voz de IA, números gigantes de marca de agua, escala de sala) | El deck del proyector hereda ese estándar en vez de redescubrirlo |
| **dataviz** | Cómo hacer gráficas y mapas que se lean como un sistema, no como adornos | El mapa de la gira (6 ciudades MX/US) y las métricas del panel admin |
| **vercel-react-best-practices** / **vercel-composition-patterns** | Convenciones reales de Next 16 + React 19 (que difieren del entrenamiento) | Complementa la regla del repo: leer `node_modules/next/dist/docs/` antes de escribir |
| **frontend-patterns** / **backend-patterns** | Patrones de App Router: server components, API routes, manejo de estado | Las rutas `/api/inscribir`, `/api/eventos`, panel y admin siguen esos patrones |
| **coding-standards** + reglas TypeScript | Inmutabilidad, archivos chicos, sin console.log, validación en fronteras | Reglas duras 3 del brief; los agentes las reciben como ley |
| **security-review** / **security-scan** | Checklist OWASP: nada de secretos en código, validación de entrada, mensajes que no filtran detalle | El patrón de acceso a datos: `supabaseService()` solo en servidor, filtrando por sesión, jamás por ids del body |
| **desarrollo-plataformas › seguridad-supabase** (referencia) | RLS filas≠columnas, storage, rate-limit, cómo auditarlo | El candado anti-duplicados, el tope de 50 inscripciones/día y el diseño del bucket `af-fotos` |
| **postgres-patterns** / **database-migrations** | Migraciones idempotentes, índices, cómo llevar cambios a producción sin romper | La migración `0082` y la regla de que la app funcione AUNQUE la migración no esté aplicada |
| **api-design** | Respuestas consistentes, errores con mensaje humano, códigos correctos | Los textos de error dictados por ti ("Oops — esta persona ya está registrada… 🙈") viajan en respuestas bien formadas |
| **e2e-testing** / **browser-use** | Playwright: recorrer flujos críticos con aserciones de negocio, QA visual con capturas | Las verificaciones en producción de las sesiones 13-17 (admin por cuenta, 401 correctos, demo funcionando) |
| **accesslint-audit** | Auditoría WCAG 2.2 con reporte priorizado | Respaldo de las reglas de contraste y `:focus-visible` del brief (aún sin corrida formal — ver huecos) |
| **dispatching-parallel-agents** | Cómo repartir trabajo entre agentes sin que choquen: fronteras de archivos, contratos escritos antes | La arquitectura de este build: cada agente entrega componentes con props tipadas; `panel-client.tsx` y `admin/page.tsx` son solo del integrador |
| **writing-plans** / **blueprint** | Planes donde un agente nuevo puede ejecutar en frío con contexto autocontenido | El propio `SYNERGY-PLUS-BRIEF.md`: cualquier agente lo lee completo y sabe qué construir y qué no tocar |
| **sinergeticos-operativo-base** | El contexto del negocio: modelo, embudo, equipo, eventos | Las comisiones por paquete MX/US, la regla "la geografía la define el EVENTO", la escalera de premios sin cambiar metas |
| **brand** / **article-writing** | Voz humana, cero clichés de IA | El tono de toda la copy: "Tú puedes ser el +1 de alguien más", lenguaje de posibilidad (nunca garantía) en las cifras de ganancias |
| **verification-before-completion** / **verification-loop** | No dar nada por terminado sin verificarlo con evidencia | La regla de cierre de cada agente: `tsc --noEmit` limpio + reporte estructurado antes de entregar |

---

## Lecciones del sistema de plataformas aplicadas

Del registro vivo `LECCIONES.md` (229 lecciones de 10+ proyectos), estas son las que Synergy +1
respeta desde el diseño — es decir, errores ya pagados una vez que aquí no se repiten:

| # | Lección (proyecto donde se aprendió) | Cómo se respeta aquí |
|---|---|---|
| 1 | **Prohibido `next build`/`next dev` con agentes en paralelo** — el candado de Next los bloquea entre sí y se pierden ~50 min (BGI) | Regla dura #1 del brief: todos verifican solo con `npx tsc --noEmit --incremental false` |
| 2 | **Sombras SIEMPRE por clase, nunca inline** — el estilo inline le gana a `:active` y el botón hundido no se ve jamás (BGI) | Regla explícita del sistema visual; el inset al presionar depende de esto |
| 3 | **La cascada hace invisible el sistema de diseño** — clases sin capa correcta "no pintan" y parece que tu cambio no funcionó (BGI) | Las clases existentes (`.glass`, `.field`, `.btn-cta`) se RE-SKINEAN conservando el nombre: todo el markup se actualiza solo, sin pelear con la cascada |
| 4 | **Degradación elegante: la app no puede depender del orden de deploy de una migración** (admin Sinergéticos) | `synergyPlusListo()` detecta si la migración 0082 ya existe; si no, el afiliado no ve la feature (sin error) y el admin ve "Pendiente de activar en base de datos" |
| 5 | **Los formularios no pierden lo escrito** — React reinicia el formulario tras una acción de servidor y un error de validación borra los 15 campos (BGI) | La acción devuelve valores + error por campo; correo opcional y WhatsApp obligatorio bien señalados para no provocar errores evitables |
| 6 | **El chrome flotante sobre slides claros necesita fondo sólido propio** — el "Salir" y el contador desaparecían en descansos claros (clase Google) | Regla heredada para la presentación del proyector de la gira |
| 7 | **RLS protege filas, no columnas — y el service role jamás confía en ids del cliente** (BGI ⭐) | Patrón obligatorio: `supabaseService()` solo en servidor, filtrando SIEMPRE por el `user.id` de la sesión |
| 8 | **Público 35-60: targets de 44px REALES, errores visibles en pantalla, nunca solo en tooltip** (admin Sinergéticos) | Regla de tono del brief: textos grandes, targets ≥44px, errores humanos y visibles |
| 9 | **Fuente única de verdad para cifras que mueven dinero** — cuando el precio cambió a media construcción, fue 1 archivo (portal closers) | `lib/comisiones.ts` ya escrito; nadie escribe una comisión a mano, todos importan |
| 10 | **Reglas de negocio ≠ bugs** — la "retención 10%" que parecía error era política deliberada (admin Sinergéticos) | La geografía la define el EVENTO (no el comprador), las metas de premios NO se cambian: decisiones tuyas documentadas para que ningún agente las "corrija" |
| 11 | **Neumorfismo bien logrado = el texto conserva contraste alto y el foco siempre visible** — contraste AA es el hoyo #1 del neumorfismo (lunesinergetico) | Regla explícita: blanco/verde sobre oscuro, `:focus-visible` siempre, el efecto va en superficies, no en texto |
| 12 | **Animaciones con `@keyframes` propios + `prefers-reduced-motion` respetado** — una plataforma sin ellas queda "muda"; sin el respeto, marea (BGI + regla global) | Regla dura #5 del brief para todos los agentes |
| 13 | **Fronteras de archivos por agente + contratos escritos ANTES** — así corte-ia tuvo 1 solo error de tipos en ~150 archivos (corte-ia) | Cada agente declara su frontera; los archivos del integrador están nombrados y vetados; props tipadas como contrato |
| 14 | **Lo que no está en la frontera de nadie, no se hace** — en BGI el shell y el login quedaron sin migrar por eso (BGI) | El brief asigna explícitamente al integrador el montaje (`panel-client.tsx`, `panel/page.tsx`, `admin/page.tsx`) y a design-system los tokens |
| 15 | **Un botón crítico no depende de un recurso que puede no llegar por red** (catálogo IA 24/7) | Si un asset no existe al construir, el componente se ve bien igual (fondo degradado de respaldo); el CTA de WhatsApp es una liga directa, sin dependencias |
| 16 | **Archivos fantasma de iCloud (`algo 2.tsx`) rompen el build sin causa aparente** — 548 en una sola sesión de BGI | Regla dura #6: si un agente ve uno, lo borra. Verificado hoy: cero fantasmas en el repo |
| 17 | **Rate-limit y candados del lado del servidor, no de la UI** (lunesinergetico, admin) | Candado anti-duplicados vía RPC en base + tope de 50 inscripciones/afiliado/día en la API |

---

## Huecos detectados

Honesto y accionable — lo que el sistema sabe hacer y aquí todavía no se aplica:

1. **Sin pruebas automatizadas de los flujos que mueven dinero.** Las verificaciones de las
   sesiones 13-17 fueron manuales (bien hechas, pero de una sola vez). La skill `e2e-testing` y la
   lección de portal-closers ("recorrer caminos críticos con aserciones de negocio") piden una
   suite Playwright mínima: inscribir → duplicado rechazado → boleto llega, y admin 401 para no-admins.
   Hoy, cualquier cambio puede romper eso en silencio.
2. **La lógica de comisiones no tiene tests.** `lib/comisiones.ts` calcula dinero (incluido el
   override del 20%) y la regla global de testing (80% de cobertura) no se está aplicando ni
   siquiera a ese archivo. Es 1 hora de trabajo y protege cada pago.
3. **Accesibilidad afirmada, no auditada.** El brief dicta contraste y foco visible, pero nadie ha
   corrido `accesslint-audit` sobre el neumorfismo terminado. La experiencia de lunesinergetico dice
   que el contraste AA es justo donde el neumorfismo falla; conviene medirlo con datos, no a ojo.
4. **Sin monitoreo de errores en producción.** Si `/api/inscribir` empieza a fallar un martes de
   gira, nos enteramos cuando un afiliado se queje por WhatsApp. Un aviso automático de errores
   (Sentry o similar) es la diferencia entre enterarse en 2 minutos o en 2 horas.
5. **Falta el consejo de expertos (Fase 5 del protocolo) sobre Synergy +1.** El protocolo lo exige
   antes de una "versión final" y esta es la expansión más grande del portal. En BGI el consejo
   encontró escaladas de permisos invisibles en pruebas manuales; aquí aún no se ha corrido.
6. ~~**Assets incompletos sin verificación automática.**~~ **Resuelto el mismo día:** el
   integrador colocó los 14 assets (logo, hero, 4 premios, 8 fondos) y corrió el check de
   cierre rutas-referidas vs `public/` — 14/14 OK. Queda la recomendación de hacer ese check
   parte del pipeline permanente.
7. **Sin Lighthouse antes/después contra producción.** Es la regla dura #5 del protocolo (en el
   ERP dio Perf 69→92). Con el rediseño neumórfico completo, medirlo evita entregar un portal más
   bonito pero más lento en los teléfonos de los afiliados (el 80% entra por móvil).
8. **Cerrar con Fase 8: registrar las lecciones de Synergy +1.** El ciclo de autoentrenamiento es
   lo que hace que cada plataforma entrene a la siguiente; esta construcción (neumorfismo sobre
   clases existentes, degradación por migración pendiente, multi-agente con brief maestro) va a
   dejar lecciones nuevas que deben entrar a `LECCIONES.md` al terminar.

---

*Generado a partir de: `~/.claude/skills/` (170 skills), `~/.claude/rules/` (common + typescript),
`desarrollo-plataformas/SKILL.md` + `references/` + `LECCIONES.md` (229 lecciones),
`docs/SYNERGY-PLUS-BRIEF.md` y `STATE.md` (sesiones 12-17).*
