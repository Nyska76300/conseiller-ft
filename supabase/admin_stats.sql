-- Espace administrateur : statistiques détaillées, boîte à idées
-- À exécuter une fois dans Supabase (SQL Editor → New query → Run).

-- 1. Journal d'utilisation : une ligne par ouverture d'outil (aucune donnée d'allocataire)
create table if not exists public.usage_events (
  id      bigserial primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tool    text not null,
  at      timestamptz not null default now()
);
create index if not exists usage_events_at on public.usage_events (at);
alter table public.usage_events enable row level security;
drop policy if exists "journal : ajout par soi" on public.usage_events;
create policy "journal : ajout par soi" on public.usage_events for insert to authenticated with check (user_id = auth.uid());

-- 2. Statistiques par conseiller et par outil, sur une période (administrateur seulement)
create or replace function public.admin_usage(days int default 30)
returns table(email text, tool text, uses bigint, last_at timestamptz)
language sql security definer set search_path = public as $$
  select u.email::text, e.tool, count(*), max(e.at)
  from public.usage_events e join auth.users u on u.id = e.user_id
  where exists (select 1 from public.app_admins a where a.user_id = auth.uid())
    and e.at >= now() - make_interval(days => days)
  group by u.email, e.tool;
$$;

-- 3. Activité par jour
create or replace function public.admin_daily(days int default 30)
returns table(day date, uses bigint, users bigint)
language sql security definer set search_path = public as $$
  select (e.at at time zone 'Europe/Paris')::date, count(*), count(distinct e.user_id)
  from public.usage_events e
  where exists (select 1 from public.app_admins a where a.user_id = auth.uid())
    and e.at >= now() - make_interval(days => days)
  group by 1 order by 1;
$$;

-- 4. Comptes : inscription, dernière connexion, dernière synchronisation, modèles personnels
create or replace function public.admin_users()
returns table(email text, created_at timestamptz, last_sign_in timestamptz, last_sync timestamptz, own_templates int)
language sql security definer set search_path = public as $$
  select u.email::text, u.created_at, u.last_sign_in_at, d.updated_at,
         coalesce((select count(*)::int from jsonb_array_elements(coalesce((d.data->>'ft_templates')::jsonb, '[]'::jsonb)) t
                   where coalesce(t->>'isOfficial', 'false') <> 'true' and coalesce(t->>'shared', 'false') <> 'true'), 0)
  from auth.users u left join public.user_data d on d.user_id = u.id
  where exists (select 1 from public.app_admins a where a.user_id = auth.uid())
  order by u.last_sign_in_at desc nulls last;
$$;

revoke all on function public.admin_usage(int), public.admin_daily(int), public.admin_users() from public;
grant execute on function public.admin_usage(int), public.admin_daily(int), public.admin_users() to authenticated;

-- 5. Boîte à idées : suggestions et signalements des conseillers
create table if not exists public.site_feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  email      text,
  kind       text not null default 'idee',
  message    text not null,
  page       text,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.site_feedback enable row level security;
drop policy if exists "idées : envoi" on public.site_feedback;
drop policy if exists "idées : lecture" on public.site_feedback;
drop policy if exists "idées : traitement" on public.site_feedback;
drop policy if exists "idées : suppression" on public.site_feedback;
create policy "idées : envoi" on public.site_feedback for insert to authenticated with check (user_id = auth.uid());
create policy "idées : lecture" on public.site_feedback for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.app_admins a where a.user_id = auth.uid()));
create policy "idées : traitement" on public.site_feedback for update to authenticated
  using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));
create policy "idées : suppression" on public.site_feedback for delete to authenticated
  using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));
