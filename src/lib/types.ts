export type TriState = boolean | null;

export interface ChecklistValue {
  conforme: boolean;
  nonConforme: boolean;
  remarque: string;
  /** Optional companion time value, used by items flagged hasTime (e.g. état de charge). */
  heure?: string;
}

export type Checklist = Record<string, ChecklistValue>;

export interface CustomItem {
  id: string;
  label: string;
  conforme: boolean;
  nonConforme: boolean;
  remarque: string;
}

export interface Gammes {
  nowatt: boolean;
  skylight: boolean;
  smartlight: boolean;
}

export interface Produit {
  id: string;
  gamme: "Nowatt" | "Skylight" | "Smartlight";
  modele: string;
  quantite: string;
}

export interface Contact {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  portable: string;
  niveau: string;
}

export interface Photo {
  id: string;
  dossier_id: string;
  path: string;
  url: string;
  caption: string;
  position: number;
  created_at: string;
}

export type DossierStatus = "brouillon" | "termine";

/** Shape mirroring the `dossiers` table (snake_case, matches Supabase columns). */
export interface Dossier {
  id: string;
  status: DossierStatus;

  ref_karlia: string;
  client_final: string;
  vendu_avec_pose: TriState;
  installateur: string;
  installateur_forme: TriState;
  date_formation: string | null;
  date_fin_pose: string | null;
  date_controle: string | null;
  date_conformite_finale: string | null;
  adresse: string;
  gps_lat: string;
  gps_lng: string;

  gammes: Gammes;
  produits: Produit[];

  contacts: Contact[];

  checklist: Checklist;
  custom_items: CustomItem[];

  controleur_nom: string;
  controleur_entreprise: string;
  signature_url: string | null;
  signature_date: string | null;

  total_points: number;
  conforme_points: number;
  non_conforme_points: number;
  percent: number;
  fully_conforme: boolean;

  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Convenience type for the columns used in the list/dashboard view. */
export type DossierSummary = Pick<
  Dossier,
  | "id"
  | "status"
  | "client_final"
  | "ref_karlia"
  | "date_controle"
  | "percent"
  | "non_conforme_points"
  | "fully_conforme"
  | "controleur_nom"
  | "updated_at"
>;

export interface Profile {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
}
