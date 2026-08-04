# Backlog — junta de afiliados (3-ago-2026)

Extraído de la transcripción `junta afiliados`. El audio venía ruidoso; donde la
transcripción es ambigua está marcado **[confirmar]**.

Orden sugerido: primero lo que no depende de decisiones de negocio (A), luego lo que
sí (B), y al final lo que no es de esta app (C).

---

## A. Listo para ejecutar (no depende de nadie más)

### A1. Contador de progreso del afiliado
"Sepan por cuántos van y cuántos les faltan". Mostrar en el panel cuántos lleva y
cuánto le falta para el siguiente premio.
**Depende de:** los niveles de premios (B2).

### A2. Panel de métricas del afiliado
Cuántos referidos, cuántos cerrados, cuánto ha generado histórico y **cuánto se le
debe este mes**. Hoy el panel solo cuenta inscritos y boletos.
**Ojo:** "cerrado" y "generado" requieren saber quién compró — hoy el portal no ve
las compras. Se resuelve con la misma vía que el candado nuevo (`purchases`).

### A3. Sección de materiales descargables
Ya existe la sección Recursos; falta cargarle los brochures de **Legendaria**,
**Club Sinergético** y **Seminario**. El del Seminario **no existe todavía** —
hay que crearlo ("por qué tienes que ir al evento presencial", con gráficos).

### A4. Espacios para los dos videos
Reservar el lugar con imagen de portada mientras se graban:
1. "Tutorial de cómo invitar a alguien" — lo graba Manuel
2. "Mejores prácticas para maximizar tus comisiones"

### A5. Panel de perfil del afiliado
Que pueda editar sus datos. **Decisión tomada en la junta: solo el nombre**, sin foto
("es muy tedioso").

### A6. Cuenta demo con datos falsos
Una cuenta de ejemplo con datos cargados para enseñarle el portal a los vendedores sin
usar datos reales.

### A7. Admin: cuántos afiliados hay
Ya está hecho (ranking + total + export CSV de la sesión anterior). **Verificar con
ellos si les sirve así.**

---

## B. Necesita decisión antes de construir

### B1. ⚠️ Leyenda de probabilidades — OJO CON ESTO
Quieren mostrar: *"de cada 100 que invites, 30% de probabilidad de que compren si van
al evento; sube a 50% si les explicas el Club antes"*.

**En la junta dijeron textualmente "ahorita no tenemos métricas".** Esos números son
estimaciones, no datos medidos. Publicarlos como si fueran estadística real es
arriesgado: los afiliados van a calcular sus ingresos con ellos y van a reclamar si no
se cumplen.

**Recomendación:** o se calculan de la base real (ya tenemos `purchases` y asistencia),
o se redactan como expectativa y no como dato ("nuestra experiencia sugiere"), sin
porcentajes con decimales falsos.

### B2. Escalera de premios por referidos que **hayan pagado** [confirmar]
Lo que alcancé a reconstruir, pero la discusión iba y venía:

| Referidos | Premio |
|---|---|
| 20 | Pase Black (cortesía) |
| 50 | Viaje todo pagado a Nueva York (encuentro internacional con Jorge Serratos) |
| 100 | Programa Mastermind |
| 200 | Se discutió y quedó en "déjalo así" / personalizado |

Se mencionaron 500 y 1000 pero se descartaron ("ya lo van a tener por el Black, por el
viaje..."). **Hay que confirmar la tabla final antes de programarla**, porque en cuanto
se publique es una promesa.

### B3. ✅ RESUELTO — Comisiones (Plan de Acción, PDF de Dani)

**20% del valor de cada venta**, mismo porcentaje en los dos países; lo que cambia es el
precio del evento:

| México | Comisión | | Estados Unidos | Comisión |
|---|---|---|---|---|
| $12,500 MXN | $2,500 | | $1,500 USD | $300 |
| $13,000 MXN | $2,600 | | $2,250 USD | $450 |
| $15,000 MXN | $3,000 | | $3,000 USD | $600 |

**Meta por afiliado:** 20 a 30 referidos.
**Modelo objetivo:** 50% pauta / 50% referidos.

⚠️ **Ojo con la ventana de atribución.** El PDF dice: *"Si el invitado compra **durante el
evento**, el sistema asignará la venta y la comisión al afiliado"*. Hoy el portal cuenta
**cualquier compra posterior a la inscripción, sin límite de tiempo**. Hay que decidir si
se acota (p. ej. hasta X días después del evento) o se deja abierto.

### B4. Tres tipos de invitación con comisión distinta
Un selector para invitar a:
1. **Evento presencial** — ya funciona
2. **Webinar** — comisión más alta
3. **Compra directa** — comisión superior a las dos

**Los montos no se definieron** ("vamos viendo, se acaba de definir"). Además Jorge
advirtió que la venta directa cambia la naturaleza del programa: pasa de "invita al
evento" a modelo de referido tradicional.

### B5. Invitar a otros afiliados — SIN multinivel
Que un afiliado pueda invitar a otros. **Decisión explícita: solo invitar "por buena
fe", sin que gane comisión por lo que produzcan.** En cuanto gane por los referidos de
sus referidos se vuelve multinivel y eso exige un plan de compensación revisado antes
de prometer nada. Construir solo la invitación, no la comisión en cascada.

### B6. Imagen personalizada del afiliado
"Luis te invita al Seminario", generada con la foto de WhatsApp/Instagram del afiliado
(como se hizo en Método CEO). Falta definir si la foto la sube él o se toma de algún lado.

---

## C. Fuera de esta app

### C1. Nuevo tipo de boleto, en naranja
El PDF lo nombra: **"Pase VIP de Cortesía (sin libro)"**, y aclara que después del
registro el equipo hace **reconfirmación telefónica**. Distinto al cortesía del Club.
**Es de la boletera (synergyticket), no del portal.**

### C2. Curso de referidos
Contenido/formación, no software.

### C3. Presentación del plan de compensación
La arman Dani y Diana con branding; Clau la diseña.

### C4. Logística de la junta
Bases de datos de Austin y Tijuana, grupos de WhatsApp, Zooms, quién contacta a quién.
Nada de esto es de la app.
