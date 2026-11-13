-- Espace Conseiller : rappels personnels, remontée des bugs, double vérification de l'administrateur
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller tout le fichier → Run.
-- (après les scripts précédents : schema, admin_stats, veille, noms, annonces_invitations, evolution, push)

-- =====================================================================
-- 1. Double vérification (code à 6 chiffres) pour les administrateurs
--    Tant qu'un administrateur n'a pas activé la double vérification, rien ne change.
--    Dès qu'il l'a activée, ses droits d'administrateur exigent une session validée par le code.
-- =====================================================================
create or replace function public.ft_mfa_ok() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified');
$$;
create or replace function public.ft_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_admins a where a.user_id = auth.uid()) and public.ft_mfa_ok();
$$;
revoke all on function public.ft_mfa_ok(), public.ft_is_admin() from public;
grant execute on function public.ft_mfa_ok(), public.ft_is_admin() to authenticated;

-- Les règles d'écriture (modèles communs, invitations, réglages…) passent par la table app_admins :
-- cette règle supplémentaire la rend invisible tant que le code n'a pas été saisi.
drop policy if exists "admin : double vérification" on public.app_admins;
create policy "admin : double vérification" on public.app_admins as restrictive for select to authenticated
  using (public.ft_mfa_ok());

-- =====================================================================
-- 2. Remontée automatique des bugs (erreurs JavaScript, sans donnée d'allocataire)
-- =====================================================================
create table if not exists public.client_errors (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid(),
  at timestamptz not null default now(),
  msg text not null check (char_length(msg) <= 300),
  src text check (char_length(src) <= 200),
  tool text check (char_length(tool) <= 40),
  ver text check (char_length(ver) <= 30),
  ua text check (char_length(ua) <= 160),
  stack text check (char_length(stack) <= 1200)
);
create index if not exists client_errors_at on public.client_errors (at desc);
alter table public.client_errors enable row level security;
drop policy if exists "bugs : envoi" on public.client_errors;
drop policy if exists "bugs : lecture admin" on public.client_errors;
drop policy if exists "bugs : suppression admin" on public.client_errors;
create policy "bugs : envoi" on public.client_errors for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
create policy "bugs : lecture admin" on public.client_errors for select to authenticated using (public.ft_is_admin());
create policy "bugs : suppression admin" on public.client_errors for delete to authenticated using (public.ft_is_admin());

-- =====================================================================
-- 3. Rappels personnels (notification à la date choisie)
-- =====================================================================
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  due_at timestamptz not null,
  body text not null check (char_length(body) between 1 and 200),
  go text not null default '' check (char_length(go) <= 40),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists reminders_due on public.reminders (due_at) where sent_at is null;
alter table public.reminders enable row level security;
drop policy if exists "mes rappels" on public.reminders;
create policy "mes rappels" on public.reminders for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Jeton interne entre la base et la fonction « send-push » (invisible pour les conseillers, rien à copier)
create table if not exists public.ft_cron (
  id int primary key default 1 check (id = 1),
  token text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
);
alter table public.ft_cron enable row level security;
revoke all on public.ft_cron from anon, authenticated;
insert into public.ft_cron (id) values (1) on conflict (id) do nothing;

-- Toutes les 5 minutes : s'il y a des rappels arrivés à échéance, la fonction « send-push » les envoie
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule(jobid) from cron.job where jobname = 'ft-rappels';
select cron.schedule('ft-rappels', '*/5 * * * *', $job$
  select net.http_post(
    url := 'https://rzjfiikdpjwzrfmlugpq.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-ft-cron', (select token from public.ft_cron where id = 1)),
    body := '{"action":"reminders"}'::jsonb
  )
  where exists (select 1 from public.reminders where sent_at is null and due_at <= now());
$job$);

-- =====================================================================
-- 4. Statistiques de l'administrateur : mêmes fonctions, avec la double vérification
-- =====================================================================
-- team_usage (repris de schema.sql)
create or replace function public.team_usage()
returns table(tool text, uses bigint, users bigint)
language sql security definer set search_path = public as $$
  select e.key as tool, sum((e.value)::bigint) as uses, count(distinct u.user_id) as users
  from public.user_data u
  cross join lateral jsonb_each_text(coalesce((u.data->>'ft_tool_use')::jsonb, '{}'::jsonb)) as e(key, value)
  where public.ft_is_admin()
    and e.value ~ '^[0-9]+$'
  group by e.key
  order by uses desc;
$$;

-- admin_usage (repris de noms.sql)
create or replace function public.admin_usage(days int default 30)
returns table(email text, name text, tool text, uses bigint, last_at timestamptz)
language sql security definer set search_path = public as $$
  select u.email::text,
         nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', concat_ws(' ', u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'last_name'))), ''),
         e.tool, count(*), max(e.at)
  from public.usage_events e join auth.users u on u.id = e.user_id
  where public.ft_is_admin()
    and e.at >= now() - make_interval(days => days)
  group by 1, 2, 3;
$$;

-- admin_daily (repris de admin_stats.sql)
create or replace function public.admin_daily(days int default 30)
returns table(day date, uses bigint, users bigint)
language sql security definer set search_path = public as $$
  select (e.at at time zone 'Europe/Paris')::date, count(*), count(distinct e.user_id)
  from public.usage_events e
  where public.ft_is_admin()
    and e.at >= now() - make_interval(days => days)
  group by 1 order by 1;
$$;

-- admin_users (repris de noms.sql)
create or replace function public.admin_users()
returns table(email text, name text, created_at timestamptz, last_sign_in timestamptz, last_sync timestamptz, own_templates int)
language sql security definer set search_path = public as $$
  select u.email::text,
         nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', concat_ws(' ', u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'last_name'))), ''),
         u.created_at, u.last_sign_in_at, d.updated_at,
         coalesce((select count(*)::int from jsonb_array_elements(coalesce((d.data->>'ft_templates')::jsonb, '[]'::jsonb)) t
                   where coalesce(t->>'isOfficial', 'false') <> 'true' and coalesce(t->>'shared', 'false') <> 'true'), 0)
  from auth.users u left join public.user_data d on d.user_id = u.id
  where public.ft_is_admin()
  order by u.last_sign_in_at desc nulls last;
$$;

-- admin_purge (repris de annonces_invitations.sql)
create or replace function public.admin_purge(days int default 365) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.ft_is_admin() then return 0; end if;
  delete from public.usage_events where at < now() - make_interval(days => greatest(days, 90));
  get diagnostics n = row_count;
  delete from public.client_errors where at < now() - interval '90 days';
  return n;
end $$;

-- admin_monthly (repris de evolution.sql)
create or replace function public.admin_monthly(months int default 6)
returns table(month date, tool text, uses bigint, users bigint)
language sql security definer set search_path = public as $$
  select date_trunc('month', e.at)::date, e.tool, count(*), count(distinct e.user_id)
  from public.usage_events e
  where public.ft_is_admin()
    and e.at >= date_trunc('month', now()) - make_interval(months => greatest(months, 1) - 1)
  group by 1, 2;
$$;

-- admin_monthly_users (repris de evolution.sql)
create or replace function public.admin_monthly_users(months int default 6)
returns table(month date, users bigint, actions bigint)
language sql security definer set search_path = public as $$
  select date_trunc('month', e.at)::date, count(distinct e.user_id), count(*)
  from public.usage_events e
  where public.ft_is_admin()
    and e.at >= date_trunc('month', now()) - make_interval(months => greatest(months, 1) - 1)
  group by 1 order by 1;
$$;
