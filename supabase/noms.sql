-- Noms et prénoms des conseillers dans l'Espace administrateur
-- À exécuter une fois dans Supabase (SQL Editor → New query → Run), après admin_stats.sql.
-- Le nom est celui saisi par le conseiller à la création du compte ou dans « Mon compte ».

drop function if exists public.admin_usage(int);
create function public.admin_usage(days int default 30)
returns table(email text, name text, tool text, uses bigint, last_at timestamptz)
language sql security definer set search_path = public as $$
  select u.email::text,
         nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', concat_ws(' ', u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'last_name'))), ''),
         e.tool, count(*), max(e.at)
  from public.usage_events e join auth.users u on u.id = e.user_id
  where exists (select 1 from public.app_admins a where a.user_id = auth.uid())
    and e.at >= now() - make_interval(days => days)
  group by 1, 2, 3;
$$;

drop function if exists public.admin_users();
create function public.admin_users()
returns table(email text, name text, created_at timestamptz, last_sign_in timestamptz, last_sync timestamptz, own_templates int)
language sql security definer set search_path = public as $$
  select u.email::text,
         nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', concat_ws(' ', u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'last_name'))), ''),
         u.created_at, u.last_sign_in_at, d.updated_at,
         coalesce((select count(*)::int from jsonb_array_elements(coalesce((d.data->>'ft_templates')::jsonb, '[]'::jsonb)) t
                   where coalesce(t->>'isOfficial', 'false') <> 'true' and coalesce(t->>'shared', 'false') <> 'true'), 0)
  from auth.users u left join public.user_data d on d.user_id = u.id
  where exists (select 1 from public.app_admins a where a.user_id = auth.uid())
  order by u.last_sign_in_at desc nulls last;
$$;

revoke all on function public.admin_usage(int), public.admin_users() from public;
grant execute on function public.admin_usage(int), public.admin_users() to authenticated;
