-- Tableau de bord d'évolution (Espace administrateur) : usage par mois
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller → Run.
create or replace function public.admin_monthly(months int default 6)
returns table(month date, tool text, uses bigint, users bigint)
language sql security definer set search_path = public as $$
  select date_trunc('month', e.at)::date, e.tool, count(*), count(distinct e.user_id)
  from public.usage_events e
  where exists (select 1 from public.app_admins a where a.user_id = auth.uid())
    and e.at >= date_trunc('month', now()) - make_interval(months => greatest(months, 1) - 1)
  group by 1, 2;
$$;
create or replace function public.admin_monthly_users(months int default 6)
returns table(month date, users bigint, actions bigint)
language sql security definer set search_path = public as $$
  select date_trunc('month', e.at)::date, count(distinct e.user_id), count(*)
  from public.usage_events e
  where exists (select 1 from public.app_admins a where a.user_id = auth.uid())
    and e.at >= date_trunc('month', now()) - make_interval(months => greatest(months, 1) - 1)
  group by 1 order by 1;
$$;
revoke all on function public.admin_monthly(int), public.admin_monthly_users(int) from public;
grant execute on function public.admin_monthly(int), public.admin_monthly_users(int) to authenticated;
