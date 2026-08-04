-- 0082 · Synergy +1 — onboarding, red de referidos (+1) y ventas con comisión fija por geografía
-- Portal: afiliados.sinergeticos.com (repo synergy-code-3/afiliados-sinergeticos)
-- Este archivo también se propone al repo de Axis (synergy-code-3/synergy-axis),
-- que es donde viven las migraciones del schema `afiliados` (0073–0081).
-- Idempotente: se puede reaplicar sin romper.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Perfil extendido del afiliado: apodo, foto, onboarding y quién lo trajo
-- ─────────────────────────────────────────────────────────────────────────────
alter table afiliados.af_afiliados
  add column if not exists apodo text,
  add column if not exists foto_url text,
  add column if not exists onboarding_at timestamptz,
  add column if not exists referido_por uuid references afiliados.af_afiliados(id),
  add column if not exists referido_en timestamptz,
  add column if not exists codigo_ref text;

-- nadie puede ser su propio referidor
do $$ begin
  alter table afiliados.af_afiliados
    add constraint af_afiliados_no_autoref check (referido_por is null or referido_por <> id);
exception when duplicate_object then null; end $$;

create unique index if not exists af_afiliados_codigo_ref_uq
  on afiliados.af_afiliados (codigo_ref) where codigo_ref is not null;

-- Código corto legible (sin 0/O/1/I/L) — fácil de dictar por teléfono.
create or replace function afiliados.af_codigo_ref_nuevo() returns text
language plpgsql as $$
declare c text; i int := 0;
begin
  loop
    c := upper(array_to_string(array(
      select substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', (floor(random()*31))::int + 1, 1)
      from generate_series(1, 6)
    ), ''));
    exit when not exists (select 1 from afiliados.af_afiliados where codigo_ref = c);
    i := i + 1;
    exit when i > 20; -- red de seguridad: jamás ciclar infinito
  end loop;
  return c;
end $$;

update afiliados.af_afiliados
   set codigo_ref = afiliados.af_codigo_ref_nuevo()
 where codigo_ref is null;

create or replace function afiliados.af_asignar_codigo_ref() returns trigger
language plpgsql as $$
begin
  if new.codigo_ref is null then
    new.codigo_ref := afiliados.af_codigo_ref_nuevo();
  end if;
  return new;
end $$;

drop trigger if exists af_codigo_ref_trg on afiliados.af_afiliados;
create trigger af_codigo_ref_trg
  before insert on afiliados.af_afiliados
  for each row execute function afiliados.af_asignar_codigo_ref();

-- ── Quién cobra el override NO lo decide el navegador ───────────────────────
-- af_afiliados tiene RLS con insert/update de la propia fila desde el cliente
-- (así nace el perfil en /crear-cuenta). Sin este guard, cualquier sesión
-- podría escribirse un referido_por a conveniencia (auto-referirse con una
-- segunda cuenta y cobrarse el 20%). El guard limpia el campo en sesiones de
-- usuario; la ÚNICA puerta legítima es la RPC af_vincular_referido (abajo),
-- que avisa con un set_config local a la transacción. service_role
-- (auth.uid() null) no se toca — lección BGI: los guards condicionan a
-- auth.uid() para no bloquear la administración legítima.
create or replace function afiliados.af_guard_referido() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null
     and coalesce(current_setting('afiliados.permitir_ref', true), '') <> '1' then
    if tg_op = 'INSERT' then
      -- el navegador tampoco elige su código (se regenera SIEMPRE: este
      -- trigger corre después de af_codigo_ref_trg por orden alfabético),
      -- ni su foto (esa pasa por /api/foto con validación de bytes), ni
      -- se marca el onboarding solo.
      new.referido_por := null;
      new.referido_en := null;
      new.codigo_ref := afiliados.af_codigo_ref_nuevo();
      new.foto_url := null;
      new.onboarding_at := null;
    else
      new.referido_por := old.referido_por;
      new.referido_en := old.referido_en;
      new.codigo_ref := old.codigo_ref;
      new.foto_url := old.foto_url;
      new.onboarding_at := old.onboarding_at;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists af_guard_referido_trg on afiliados.af_afiliados;
create trigger af_guard_referido_trg
  before insert or update on afiliados.af_afiliados
  for each row execute function afiliados.af_guard_referido();

-- Vincula al afiliado de la sesión con quien lo invitó, por CÓDIGO (jamás por
-- id). Solo una vez (referido_por is null) y nunca a sí mismo.
create or replace function afiliados.af_vincular_referido(p_codigo text)
returns boolean
language plpgsql security definer
set search_path = afiliados, public
as $$
declare v_ref uuid;
begin
  if auth.uid() is null then return false; end if;
  select id into v_ref
    from afiliados.af_afiliados
   where codigo_ref = upper(trim(p_codigo))
     and activo
     and id <> auth.uid();
  if v_ref is null then return false; end if;
  perform set_config('afiliados.permitir_ref', '1', true);
  update afiliados.af_afiliados
     set referido_por = v_ref,
         referido_en = now()
   where id = auth.uid()
     and referido_por is null;
  return found;
end $$;

revoke all on function afiliados.af_vincular_referido(text) from public;
grant execute on function afiliados.af_vincular_referido(text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Ventas capturadas por el equipo — comisión fija por geografía + override 20%
--    Los montos NO se clavan aquí: los calcula el portal desde lib/comisiones.ts
--    (fuente única, patrón de la sesión 12) y se guardan ya resueltos en cents.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists afiliados.af_ventas (
  id uuid primary key default gen_random_uuid(),
  afiliado_id uuid not null references afiliados.af_afiliados(id),
  inscripcion_id uuid references afiliados.af_inscripciones(id),
  comprador_nombre text,
  comprador_email text,
  comprador_telefono text,
  event_tk_id text,
  event_name text,
  paquete text not null check (paquete in ('3m', '6m', '12m')),
  moneda text not null check (moneda in ('MXN', 'USD')),
  comision_cents bigint not null check (comision_cents >= 0),
  override_cents bigint not null default 0 check (override_cents >= 0),
  override_para uuid references afiliados.af_afiliados(id),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'validada', 'pagada', 'rechazada')),
  capturada_por text not null,
  -- quién movió el dinero de estado, siempre con nombre y apellido (correo)
  validada_por text,
  pagada_por text,
  notas text,
  created_at timestamptz not null default now(),
  validada_at timestamptz,
  pagada_at timestamptz
);

-- una inscripción = máximo una venta (cierra la carrera de dos admins
-- capturando lo mismo en el mismo segundo; el 409 de la API es la primera capa)
create unique index if not exists af_ventas_inscripcion_uq
  on afiliados.af_ventas (inscripcion_id) where inscripcion_id is not null;

create index if not exists af_ventas_afiliado_idx on afiliados.af_ventas (afiliado_id, estado);
create index if not exists af_ventas_override_idx on afiliados.af_ventas (override_para)
  where override_para is not null;
create index if not exists af_ventas_email_idx on afiliados.af_ventas (comprador_email);
create index if not exists af_ventas_tel_idx on afiliados.af_ventas (comprador_telefono);

alter table afiliados.af_ventas enable row level security;
-- Sin políticas a propósito: TODO acceso pasa por las rutas del portal con
-- service_role, que validan su propia sesión (afiliado) o af_admins (equipo).
-- Mismo patrón que af_admins (0081).

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) Storage para fotos de perfil (subida vía API del portal con service_role;
--    lectura pública porque son avatares)
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('af-fotos', 'af-fotos', true)
  on conflict (id) do nothing;
