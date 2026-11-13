-- Espace Conseiller : statistiques par agence, annonces ciblées, suivi de la formation, résumé mensuel
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller tout le fichier → Run.
-- (après securite_rappels_bugs.sql)

-- =====================================================================
-- 1. L'agence de rattachement dans les statistiques de l'administrateur
-- =====================================================================
drop function if exists public.admin_users();
create function public.admin_users()
returns table(email text, name text, created_at timestamptz, last_sign_in timestamptz, last_sync timestamptz, own_templates int, agence text)
language sql security definer set search_path = public as $$
  select u.email::text,
         nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', concat_ws(' ', u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'last_name'))), ''),
         u.created_at, u.last_sign_in_at, d.updated_at,
         coalesce((select count(*)::int from jsonb_array_elements(coalesce((d.data->>'ft_templates')::jsonb, '[]'::jsonb)) t
                   where coalesce(t->>'isOfficial', 'false') <> 'true' and coalesce(t->>'shared', 'false') <> 'true'), 0),
         nullif(trim(u.raw_user_meta_data->>'agence'), '')
  from auth.users u left join public.user_data d on d.user_id = u.id
  where public.ft_is_admin()
  order by u.last_sign_in_at desc nulls last;
$$;

drop function if exists public.admin_usage(int);
create function public.admin_usage(days int default 30)
returns table(email text, name text, tool text, uses bigint, last_at timestamptz, agence text)
language sql security definer set search_path = public as $$
  select u.email::text,
         nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', concat_ws(' ', u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'last_name'))), ''),
         e.tool, count(*), max(e.at),
         nullif(trim(u.raw_user_meta_data->>'agence'), '')
  from public.usage_events e join auth.users u on u.id = e.user_id
  where public.ft_is_admin()
    and e.at >= now() - make_interval(days => days)
  group by 1, 2, 3, 6;
$$;
grant execute on function public.admin_users(), public.admin_usage(int) to authenticated;

-- Destinataires d'une notification ciblée sur une agence (utilisée seulement par la fonction « send-push »)
create or replace function public.ft_agence_users(a text)
returns setof uuid
language sql stable security definer set search_path = public as $$
  select u.id from auth.users u
  where lower(trim(coalesce(u.raw_user_meta_data->>'agence', ''))) = lower(trim(coalesce(a, '')))
    and trim(coalesce(a, '')) <> '';
$$;
revoke all on function public.ft_agence_users(text) from public, anon, authenticated;
grant execute on function public.ft_agence_users(text) to service_role;

-- =====================================================================
-- 2. Suivi de la formation : résultats des quiz (sans nom dans les statistiques)
-- =====================================================================
create table if not exists public.quiz_results (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  at timestamptz not null default now(),
  theme text not null default 'all' check (char_length(theme) <= 20),
  score int not null check (score between 0 and 50),
  total int not null check (total between 1 and 50),
  details jsonb not null default '{}'::jsonb
);
create index if not exists quiz_results_at on public.quiz_results (at desc);
alter table public.quiz_results enable row level security;
drop policy if exists "quiz : mes résultats" on public.quiz_results;
create policy "quiz : mes résultats" on public.quiz_results for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Taux de réussite par agence et par thème (aucun nom, aucune adresse)
create or replace function public.admin_quiz(days int default 90)
returns table(agence text, theme text, quizzes bigint, users bigint, ok bigint, total bigint)
language sql security definer set search_path = public as $$
  select coalesce(nullif(trim(u.raw_user_meta_data->>'agence'), ''), 'Non renseignée') as agence,
         d.key as theme,
         count(distinct q.id), count(distinct q.user_id),
         sum((d.value->>0)::int), sum((d.value->>1)::int)
  from public.quiz_results q
  join auth.users u on u.id = q.user_id
  cross join lateral jsonb_each(q.details) d
  where public.ft_is_admin()
    and q.at >= now() - make_interval(days => days)
    and jsonb_typeof(d.value) = 'array'
  group by 1, 2;
$$;
grant execute on function public.admin_quiz(int) to authenticated;

-- =====================================================================
-- 3. Résumé mensuel : le 1er de chaque mois vers 9 h, notification à tous les abonnés
-- =====================================================================
select cron.unschedule(jobid) from cron.job where jobname = 'ft-mensuel';
select cron.schedule('ft-mensuel', '5 8 1 * *', $job$
  select net.http_post(
    url := 'https://rzjfiikdpjwzrfmlugpq.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-ft-cron', (select token from public.ft_cron where id = 1)),
    body := '{"action":"monthly"}'::jsonb
  );
$job$);
