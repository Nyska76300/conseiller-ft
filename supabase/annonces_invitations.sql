-- Annonces, invitations et purge des statistiques
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller → Run.

-- 1. Visiteurs sans compte : lecture des validations de la veille et de l'annonce en cours uniquement
drop policy if exists "lecture publique des validations" on public.shared_templates;
create policy "lecture publique des validations" on public.shared_templates
  for select to anon using (id in ('__ft_regs', '__ft_annonce'));

-- 2. Invitations
create table if not exists public.invites (
  code text primary key,
  note text,
  max_uses int not null default 1,
  uses int not null default 0,
  expires_at timestamptz,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.invites enable row level security;
drop policy if exists "admin invitations" on public.invites;
create policy "admin invitations" on public.invites for all to authenticated
  using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));

create table if not exists public.app_settings (key text primary key, value jsonb);
alter table public.app_settings enable row level security;
drop policy if exists "admin réglages" on public.app_settings;
create policy "admin réglages" on public.app_settings for all to authenticated
  using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));
insert into public.app_settings (key, value) values ('invite_only', 'true') on conflict (key) do nothing;

-- Contrôle à la création d'un compte depuis le site (les comptes créés depuis le tableau de bord Supabase ne sont pas concernés)
create or replace function public.ft_check_invite() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c text := nullif(trim(coalesce(new.raw_user_meta_data->>'invite', '')), '');
  only_inv boolean;
  ok boolean;
  role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::json->>'role', '');
begin
  if role <> 'anon' then return new; end if;
  select coalesce((value #>> '{}')::boolean, true) into only_inv from public.app_settings where key = 'invite_only';
  if only_inv is false then return new; end if;
  if c is null then raise exception 'INVITATION_REQUISE'; end if;
  update public.invites set uses = uses + 1
    where code = c and (expires_at is null or expires_at > now()) and uses < max_uses
    returning true into ok;
  if not coalesce(ok, false) then raise exception 'INVITATION_INVALIDE'; end if;
  return new;
end $$;
drop trigger if exists ft_invite_check on auth.users;
create trigger ft_invite_check before insert on auth.users for each row execute function public.ft_check_invite();

-- 3. Purge des statistiques de plus d'un an (appelée automatiquement quand l'administrateur ouvre son espace)
create or replace function public.admin_purge(days int default 365) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not exists (select 1 from public.app_admins a where a.user_id = auth.uid()) then return 0; end if;
  delete from public.usage_events where at < now() - make_interval(days => greatest(days, 90));
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.admin_purge(int) from public;
grant execute on function public.admin_purge(int) to authenticated;
