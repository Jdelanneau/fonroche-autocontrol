import { createClient } from "@/lib/supabase/server";
import { DossiersListClient } from "@/components/DossiersListClient";
import type { DossierSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DossiersPage() {
  const supabase = createClient();

  const { data: dossiers } = await supabase
    .from("dossiers")
    .select(
      "id, status, client_final, ref_karlia, date_controle, percent, non_conforme_points, fully_conforme, controleur_nom, updated_at"
    )
    .order("updated_at", { ascending: false });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return <DossiersListClient initialDossiers={(dossiers as DossierSummary[]) || []} userId={user?.id || ""} />;
}
