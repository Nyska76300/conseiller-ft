-- Espace Conseiller : historique des modèles communs, sauvegarde hebdomadaire, « Mon activité »
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller tout le fichier → Run.
-- (après agences_formation.sql)

-- =====================================================================
-- 1. Historique : chaque modification ou suppression d'un élément commun
--    (modèles communs, FAQ, noms, icônes, annonce…) garde l'ancienne version
-- =====================================================================
create table if not exists public.shared_history (
  id bigint generated always as identity primary key,
  tpl_id text not null,
  action text not null check (action in ('update', 'delete')),
  template jsonb,
  changed_at timestamptz not null default now(),
  changed_by uuid
);
create index if not exists shared_history_tpl on public.shared_history (tpl_id, changed_at desc);
alter table public.shared_history enable row level security;
drop policy if exists "historique : lecture admin" on public.shared_history;
create policy "historique : lecture admin" on public.shared_history for select to authenticated using (public.ft_is_admin());

create or replace function public.ft_shared_history() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.template is not distinct from old.template then return new; end if;
  insert into public.shared_history (tpl_id, action, template, changed_by)
  values (old.id, lower(tg_op), old.template, auth.uid());
  -- au plus 30 versions par élément, et rien au-delà d'un an
  delete from public.shared_history h where h.tpl_id = old.id and h.id not in
    (select id from public.shared_history where tpl_id = old.id order by changed_at desc limit 30);
  delete from public.shared_history where changed_at < now() - interval '1 year';
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
drop trigger if exists ft_shared_history on public.shared_templates;
create trigger ft_shared_history before update or delete on public.shared_templates
  for each row execute function public.ft_shared_history();

-- Liste pour l'administrateur, avec le nom de l'auteur de la modification
create or replace function public.admin_history(days int default 90)
returns table(id bigint, tpl_id text, action text, changed_at timestamptz, who text, title text)
language sql security definer set search_path = public as $$
  select h.id, h.tpl_id, h.action, h.changed_at,
         coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), u.email::text, 'inconnu'),
         coalesce(h.template->>'title', h.template->>'name', h.tpl_id)
  from public.shared_history h left join auth.users u on u.id = h.changed_by
  where public.ft_is_admin() and h.changed_at >= now() - make_interval(days => days)
  order by h.changed_at desc limit 300;
$$;
grant execute on function public.admin_history(int) to authenticated;

-- =====================================================================
-- 2. Sauvegarde complète chaque dimanche à 3 h (12 dernières semaines gardées)
-- =====================================================================
create table if not exists public.shared_backups (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  items int not null default 0,
  data jsonb not null
);
alter table public.shared_backups enable row level security;
drop policy if exists "sauvegardes : lecture admin" on public.shared_backups;
create policy "sauvegardes : lecture admin" on public.shared_backups for select to authenticated using (public.ft_is_admin());

create or replace function public.ft_backup_now() returns bigint
language plpgsql security definer set search_path = public as $$
declare n bigint;
begin
  if auth.uid() is not null and not public.ft_is_admin() then raise exception 'Réservé à l''administrateur'; end if;
  insert into public.shared_backups (items, data)
  select count(*), coalesce(jsonb_agg(jsonb_build_object('id', id, 'template', template) order by id), '[]'::jsonb) from public.shared_templates
  returning id into n;
  delete from public.shared_backups where id not in (select id from public.shared_backups order by at desc limit 12);
  return n;
end $$;
revoke all on function public.ft_backup_now() from public, anon;
grant execute on function public.ft_backup_now() to authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'ft-sauvegarde';
select cron.schedule('ft-sauvegarde', '7 2 * * 0', $job$ select public.ft_backup_now(); $job$);
select public.ft_backup_now();

-- =====================================================================
-- 3. « Mon activité » : chaque conseiller peut relire son propre journal
-- =====================================================================
drop policy if exists "journal : lecture par soi" on public.usage_events;
create policy "journal : lecture par soi" on public.usage_events for select to authenticated using (user_id = auth.uid());
