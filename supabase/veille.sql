-- Veille réglementaire : permet aux visiteurs sans compte de lire uniquement
-- la liste des mises à jour validées par l'administrateur (ligne __ft_regs).
drop policy if exists "lecture publique des validations" on public.shared_templates;
create policy "lecture publique des validations" on public.shared_templates
  for select to anon using (id = '__ft_regs');
