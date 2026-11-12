-- Espace Conseiller France Travail : tables et règles de sécurité
-- À coller dans Supabase : SQL Editor > New query > Run

-- 1. Données personnelles de chaque conseiller (modèles CVM, favoris, catégories…)
create table if not exists public.user_data (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_data enable row level security;

drop policy if exists "lecture de ses données" on public.user_data;
drop policy if exists "création de ses données" on public.user_data;
drop policy if exists "modification de ses données" on public.user_data;
create policy "lecture de ses données"      on public.user_data for select using (auth.uid() = user_id);
create policy "création de ses données"     on public.user_data for insert with check (auth.uid() = user_id);
create policy "modification de ses données" on public.user_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Administrateurs (peuvent publier des modèles communs)
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.app_admins enable row level security;
drop policy if exists "chacun voit s'il est admin" on public.app_admins;
create policy "chacun voit s'il est admin" on public.app_admins for select using (auth.uid() = user_id);

-- 3. Modèles communs, visibles par tous les conseillers connectés
create table if not exists public.shared_templates (
  id         text primary key,
  template   jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.shared_templates enable row level security;

drop policy if exists "lecture par les conseillers" on public.shared_templates;
drop policy if exists "écriture par les admins" on public.shared_templates;
create policy "lecture par les conseillers" on public.shared_templates for select to authenticated using (true);
create policy "écriture par les admins" on public.shared_templates for all to authenticated
  using (exists (select 1 from public.app_admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.app_admins a where a.user_id = auth.uid()));

-- 4. Me déclarer administrateur des modèles communs (remplacer l'e-mail) :
-- insert into public.app_admins (user_id) select id from auth.users where email = 'mon.email@exemple.fr';
