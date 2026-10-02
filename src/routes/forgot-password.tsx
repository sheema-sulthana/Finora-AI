import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AuthField, AuthShell, inputClass } from "@/components/app/AuthShell";
import { GlowButton } from "@/components/landing/GlowButton";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage, withAuthTimeout } from "@/lib/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Finora AI" },
      { name: "description", content: "Request a secure Finora AI password reset link." },
      { property: "og:title", content: "Reset password — Finora AI" },
      { property: "og:description", content: "Request a secure Finora AI password reset link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { error: resetError } = await withAuthTimeout(
        supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      );
      if (resetError) throw resetError;
      setMessage("Check your email for a secure password reset link.");
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll send a secure reset link to your email.">
      <form onSubmit={submit} className="grid gap-4">
        <AuthField label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="email"
          />
        </AuthField>
        {error && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent">
            {message}
          </p>
        )}
        <GlowButton type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending link…
            </>
          ) : (
            "Send reset link"
          )}
        </GlowButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-primary">
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
