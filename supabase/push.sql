-- Notifications push : abonnements des appareils
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller → Run.
create table if not exists public.push_subs (
  endpoint text primary key,
  user_id uuid not null default auth.uid(),
  p256dh text not null,
  auth text not null,
  ua text,
  created_at timestamptz not null default now()
);
alter table public.push_subs enable row level security;
drop policy if exists "mes abonnements" on public.push_subs;
create policy "mes abonnements" on public.push_subs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
