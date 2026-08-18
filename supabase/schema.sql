-- =========================================================
-- Fonroche Lighting — Contrôle Chantier
-- Schéma Supabase (tables + RLS + storage)
-- À exécuter une fois dans l'éditeur SQL de ton projet Supabase
-- (Dashboard Supabase > SQL Editor > New query > coller > Run)
--
-- MIGRATION (si ta base a déjà été créée avant l'ajout de la colonne
-- date_formation) : exécute juste cette ligne, le reste du script est
-- sans effet sur une base déjà à jour (create table if not exists) :
--   alter table public.dossiers add column if not exists date_formation date;
-- =========================================================

-- ---------------------------------------------------------
-- 1. Profils techniciens (un profil par compte Supabase Auth)
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'Technicien', -- Administrateur / Superviseur / Technicien / Lecture seule
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: lecture par tout utilisateur connecté"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "profiles: modification de son propre profil"
  on public.profiles for update
  using (auth.uid() = id);

-- Crée automatiquement un profil à la création d'un compte
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------
-- 2. Dossiers de contrôle chantier
-- ---------------------------------------------------------
create table if not exists public.dossiers (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'brouillon', -- 'brouillon' | 'termine'

  -- Informations chantier
  ref_karlia text default '',
  client_final text default '',
  vendu_avec_pose boolean,
  installateur text default '',
  installateur_forme boolean,
  date_formation date,
  date_fin_pose date,
  date_controle date default current_date,
  date_conformite_finale date,
  adresse text default '',
  gps_lat text default '',
  gps_lng text default '',

  -- Produits installés
  gammes jsonb not null default '{"nowatt":false,"skylight":false,"smartlight":false}'::jsonb,
  produits jsonb not null default '[]'::jsonb,       -- [{id, gamme, modele, quantite}]

  -- Fonroche Connect (interlocuteurs propres à ce chantier)
  contacts jsonb not null default '[]'::jsonb,       -- [{id, nom, prenom, email, portable, niveau}]

  -- Contrôle qualité
  checklist jsonb not null default '{}'::jsonb,      -- {itemId: {conforme, nonConforme, remarque}}
  custom_items jsonb not null default '[]'::jsonb,   -- [{id, label, conforme, nonConforme, remarque}]

  -- Contrôleur / signature
  controleur_nom text default '',
  controleur_entreprise text default '',
  signature_url text,
  signature_date date,

  -- Champs calculés (mis à jour par l'appli à chaque sauvegarde, utilisés pour la liste/dashboard)
  total_points int not null default 0,
  conforme_points int not null default 0,
  non_conforme_points int not null default 0,
  percent int not null default 0,
  fully_conforme boolean not null default false,

  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dossiers_updated_at_idx on public.dossiers (updated_at desc);
create index if not exists dossiers_status_idx on public.dossiers (status);

alter table public.dossiers enable row level security;

-- Accès partagé : tout technicien connecté voit et modifie tous les dossiers
-- (aligné sur le fonctionnement actuel de l'app : un outil d'équipe, pas cloisonné par utilisateur)
create policy "dossiers: accès complet aux utilisateurs connectés"
  on public.dossiers for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists dossiers_touch_updated_at on public.dossiers;
create trigger dossiers_touch_updated_at
  before update on public.dossiers
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------
-- 3. Photos de chantier (métadonnées ; fichiers dans Storage)
-- ---------------------------------------------------------
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  path text not null,
  url text not null,
  caption text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists photos_dossier_id_idx on public.photos (dossier_id);

alter table public.photos enable row level security;

create policy "photos: accès complet aux utilisateurs connectés"
  on public.photos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------
-- 4. Storage : buckets pour les photos et les signatures
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', true)
on conflict (id) do nothing;

create policy "storage photos: lecture publique"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "storage photos: écriture par utilisateurs connectés"
  on storage.objects for insert
  with check (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "storage photos: mise à jour par utilisateurs connectés"
  on storage.objects for update
  using (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "storage photos: suppression par utilisateurs connectés"
  on storage.objects for delete
  using (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "storage signatures: lecture publique"
  on storage.objects for select
  using (bucket_id = 'signatures');

create policy "storage signatures: écriture par utilisateurs connectés"
  on storage.objects for insert
  with check (bucket_id = 'signatures' and auth.role() = 'authenticated');

create policy "storage signatures: mise à jour par utilisateurs connectés"
  on storage.objects for update
  using (bucket_id = 'signatures' and auth.role() = 'authenticated');

-- =========================================================
-- Notes :
-- - Les buckets "photos" et "signatures" sont en lecture PUBLIQUE (n'importe qui
--   avec le lien direct peut voir une photo), mais l'écriture est réservée aux
--   comptes connectés. C'est le choix le plus simple pour démarrer. Si tu veux
--   restreindre la lecture aux seuls techniciens connectés plus tard, remplace
--   "public: true" par "public: false" dans les deux inserts ci-dessus et
--   utilise des URLs signées côté appli (createSignedUrl) à la place de
--   getPublicUrl.
-- - Le modèle d'accès aux dossiers est volontairement "tout le monde voit tout"
--   (comme un vrai outil d'équipe). Si tu veux un jour restreindre certaines
--   actions (ex: seuls les Administrateurs peuvent supprimer un dossier), on
--   pourra affiner les policies "dossiers" en fonction de profiles.role.
-- =========================================================
