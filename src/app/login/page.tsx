"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Identifiants incorrects. Vérifie ton email et ton mot de passe.");
      return;
    }
    router.push("/dossiers");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-1 text-center">
          <span className="font-display text-lg font-bold tracking-wide">
            FONROCHE <span className="text-sun1">LIGHTING</span>
          </span>
          <span className="text-[11px] uppercase tracking-widest text-text-faint">Contrôle chantier</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-line-soft bg-panel p-6 shadow-lg"
        >
          <h1 className="font-display mb-5 text-xl font-bold">Connexion</h1>

          <label className="mb-1 block text-xs text-text-dim">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="prenom.nom@fonroche-lighting.com"
            className="mb-4 w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-sm text-text outline-none focus:border-text-faint"
          />

          <label className="mb-1 block text-xs text-text-dim">Mot de passe</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-5 w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-sm text-text outline-none focus:border-text-faint"
          />

          {error && <p className="mb-4 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-sun py-3 text-sm font-semibold text-[#1a1207] disabled:opacity-50"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>

          <p className="mt-4 text-center text-xs text-text-faint">
            Pas encore de compte ? Demande à un administrateur de t&rsquo;en créer un depuis le
            dashboard Supabase.
          </p>
        </form>
      </div>
    </div>
  );
}
