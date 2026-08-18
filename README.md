# Fonroche Lighting — Contrôle Chantier (appli d'équipe)

Appli web pour que tes techniciens fassent le contrôle qualité des installations
de candélabres solaires, avec compte individuel, dossiers partagés entre tous
les techniciens, photos, signature, et export PDF.

Stack : **Next.js 14 (TypeScript) + Supabase (base de données, authentification,
stockage des photos) + Vercel** — exactement le même schéma que Cockpit Commercial.

---

## 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) > **New project**.
2. Choisis un nom (ex. `fonroche-chantier`), une région proche (Europe), et un
   mot de passe de base de données (garde-le de côté, tu n'en auras pas besoin
   au quotidien mais mieux vaut le noter).
3. Une fois le projet créé, va dans **SQL Editor** (menu de gauche) > **New query**.
4. Ouvre le fichier `supabase/schema.sql` fourni dans ce zip, colle tout son
   contenu dans l'éditeur, et clique **Run**. Ça crée :
   - les tables `dossiers`, `photos`, `profiles`
   - les règles de sécurité (RLS) : tout technicien connecté peut voir/modifier
     tous les dossiers (c'est un outil d'équipe, pas cloisonné par utilisateur)
   - les buckets de stockage `photos` et `signatures`
5. Va dans **Project Settings > API**. Note les deux valeurs suivantes, tu en
   auras besoin à l'étape 3 :
   - **Project URL**
   - **anon public key**
6. Va dans **Authentication > Providers**, vérifie que **Email** est activé
   (c'est le cas par défaut).
7. Va dans **Authentication > Settings**, et désactive **"Enable email
   confirmations"** si tu veux pouvoir créer des comptes techniciens
   directement utilisables sans qu'ils aient à cliquer un lien de
   confirmation reçu par mail (recommandé pour démarrer vite ; tu pourras
   réactiver plus tard).

### Créer les comptes techniciens

Pas de page d'inscription dans l'appli (volontaire, pour un outil interne) :
tu crées les comptes toi-même.

1. **Authentication > Users > Add user > Create new user**.
2. Renseigne l'email et un mot de passe provisoire pour chaque technicien.
3. Un profil (`profiles`) est créé automatiquement pour chaque nouveau
   compte. Le nom affiché par défaut est l'email — si tu veux un nom plus
   propre (ex. "Julien Delanneau"), va dans **Table Editor > profiles** et
   modifie la colonne `full_name` de la ligne correspondante. C'est ce nom
   qui apparaît dans les initiales sur les fiches (contrôleur) et sur les
   fiches de contrôle.

---

## 2. Installer le projet en local

Décompresse le zip, puis dans PowerShell :

```powershell
cd chemin\vers\fonroche-chantier-app
npm install
```

Copie le fichier d'exemple d'environnement et remplis-le avec les valeurs
notées à l'étape 1.5 :

```powershell
copy .env.local.example .env.local
notepad .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Lance le serveur de développement :

```powershell
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) — tu devrais atterrir
sur la page de connexion. Connecte-toi avec un des comptes créés à l'étape 1.

---

## 3. Déployer sur Vercel

Comme pour Cockpit Commercial :

1. Pousse ce projet sur un nouveau repo GitHub (ex. `fonroche-controle-chantier`).
2. Sur [vercel.com](https://vercel.com) > **Add New > Project** > importe le repo.
3. Dans **Environment Variables**, ajoute les deux mêmes variables que dans
   `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Clique **Deploy**.

Une fois déployé, tu as une URL du style `fonroche-controle-chantier.vercel.app`
que tu peux partager à tes techniciens (à ajouter à l'écran d'accueil de leur
téléphone pour un accès façon appli — Safari/Chrome proposent "Ajouter à
l'écran d'accueil").

---

## 4. Ce qui est inclus

- **Connexion individuelle** par email/mot de passe (Supabase Auth).
- **Dossiers partagés** : tous les techniciens connectés voient et modifient
  tous les contrôles (comme un vrai outil d'équipe).
- **Tableau de bord** (Terminés / Non conformes / Brouillons) + recherche +
  filtres, y compris un filtre "Non conformes".
- **Informations chantier**, **Produits installés** (gammes Nowatt / Skylight
  / Smartlight, modèles, quantités), **Fonroche Connect** (interlocuteurs
  propres à chaque chantier), **Contrôle qualité** (checklist dynamique selon
  les gammes sélectionnées — voir ci-dessous), **Photos** (avec légendes),
  **Contrôleur & signature** (tactile).
- **Export PDF** du rapport avec photos + légendes sur une page dédiée après
  la signature, et partage natif (Mail/WhatsApp) via l'API de partage du
  téléphone, avec repli (téléchargement + liens) si le partage natif n'est
  pas disponible.

### Logique de checklist par gamme (rappel)

- **Smartlight** : checklist standard (5 groupes).
- **Skylight / Helia** : dès qu'une ligne produit **Helia** est ajoutée, un
  groupe **Balisage** apparaît en plus, comme sous-menu séparé.
- **Nowatt seul** (aucune autre gamme sélectionnée) : le formulaire standard
  disparaît (il ne s'applique pas à Nowatt) ; seuls les points de contrôle
  personnalisés restent disponibles, en attendant un formulaire dédié.

---

## 5. Photos et signatures : stockage

Les deux buckets Storage (`photos`, `signatures`) sont configurés en
**lecture publique** (n'importe qui avec le lien direct peut voir une image)
mais en **écriture réservée aux comptes connectés**. C'est le choix le plus
simple pour démarrer, et suffisant pour un outil interne. Si tu veux
restreindre la lecture aux seuls techniciens connectés plus tard, il faudra
basculer les buckets en privé et utiliser des URLs signées (`createSignedUrl`)
à la place de `getPublicUrl` — je peux faire ce changement avec toi le jour où
tu en as besoin.

---

## 6. Limites connues de cette V1 (pistes pour la suite)

- Pas de mode hors-ligne : il faut du réseau pour ouvrir/enregistrer un
  dossier (contrairement à Vasco qui est pensé pour fonctionner offline).
- Pas de suppression automatique des photos orphelines si un upload échoue
  à mi-chemin.
- Le rôle "niveau d'accès" dans Fonroche Connect est pour l'instant informatif
  (il ne restreint pas encore les actions dans l'appli — tout technicien
  connecté peut tout faire). On pourra affiner les policies Supabase par rôle
  si besoin (ex. seuls les Administrateurs peuvent supprimer un dossier).
- Pas de page d'auto-inscription : les comptes se créent depuis le dashboard
  Supabase (volontaire, pour un outil interne).

Si tu veux qu'on avance sur l'un de ces points, on reprend une session dédiée.
