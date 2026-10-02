import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthShell, AuthField, SocialButtons, inputClass } from "@/components/app/AuthShell";
import { GlowButton } from "@/components/landing/GlowButton";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage, ensureProfileAndGetDestination, withAuthTimeout } from "@/lib/auth";

const title = "Log in — Finora AI";
const description =
  "Log in to Finora AI to track spending, plan budgets and get personalised AI money coaching.";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let handlingUser = false;

    const handleAuthenticatedUser = async (user: User) => {
      if (!active || handlingUser) return;

      handlingUser = true;

      try {
        const destination = await ensureProfileAndGetDestination(user);

        if (active) {
          navigate({ to: destination, replace: true });
        }
      } catch (caught) {
        if (active) {
          setError(authErrorMessage(caught));
        }
      } finally {
        handlingUser = false;
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && session?.user) {
        void handleAuthenticatedUser(session.user);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        void handleAuthenticatedUser(data.session.user);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate]);
  const finishEmail = async () => {
    setError("");
    setLoading(true);
    try {
      const { data, error: signInError } = await withAuthTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
      );
      if (signInError) throw signInError;
      if (!data.user) throw new Error("Authentication completed without a user session.");
      const destination = await ensureProfileAndGetDestination(data.user);
      navigate({ to: destination, replace: true });
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  const finishGoogle = async () => {
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;
    } catch (caught) {
      setError(authErrorMessage(caught));
      setLoading(false);
    }
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password of at least 6 characters.");
      return;
    }
    void finishEmail();
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue with your AI financial coach.">
      <form onSubmit={onSubmit} className="grid gap-4">
        <AuthField label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
            autoComplete="email"
          />
        </AuthField>

        <AuthField label="Password">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </AuthField>

        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex cursor-pointer items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-glass-border accent-[var(--primary)]"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-primary transition-opacity hover:opacity-80">
            Forgot password?
          </Link>
        </div>

        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {error}
          </motion.p>
        ) : null}

        <GlowButton type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
            </>
          ) : (
            "Log in"
          )}
        </GlowButton>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
        <span className="h-px flex-1 bg-glass-border" />
        or
        <span className="h-px flex-1 bg-glass-border" />
      </div>

      <SocialButtons label="Continue" onPick={() => void finishGoogle()} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Finora AI?{" "}
        <Link to="/signup" className="text-primary transition-opacity hover:opacity-80">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
