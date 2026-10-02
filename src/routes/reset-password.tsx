import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AuthField, AuthShell, inputClass } from "@/components/app/AuthShell";
import { GlowButton } from "@/components/landing/GlowButton";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage, withAuthTimeout } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — Finora AI" },
      { name: "description", content: "Securely set a new password for your Finora AI account." },
      { property: "og:title", content: "Choose a new password — Finora AI" },
      {
        property: "og:description",
        content: "Securely set a new password for your Finora AI account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [validRecovery, setValidRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    setValidRecovery(hash.get("type") === "recovery" || window.location.search.includes("code="));
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValidRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setError("");
    setLoading(true);
    try {
      const { error: updateError } = await withAuthTimeout(supabase.auth.updateUser({ password }));
      if (updateError) throw updateError;
      navigate({ to: "/dashboard", replace: true });
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Use at least 8 characters for your new password."
    >
      {!validRecovery ? (
        <p className="text-sm text-destructive">
          This reset link is invalid or has expired. Request a new one from the login page.
        </p>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <AuthField label="New password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
          </AuthField>
          <AuthField label="Confirm password">
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
          </AuthField>
          {error && (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
          <GlowButton type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Set new password"
            )}
          </GlowButton>
        </form>
      )}
    </AuthShell>
  );
}
