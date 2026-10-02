import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthShell, AuthField, SocialButtons, inputClass } from "@/components/app/AuthShell";
import { GlowButton } from "@/components/landing/GlowButton";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage, ensureProfileAndGetDestination, withAuthTimeout } from "@/lib/auth";

const title = "Create your account — Finora AI";
const description =
  "Sign up for Finora AI and let an AI coach categorise your spending, plan budgets and grow your savings.";

export const Route = createFileRoute("/signup")({
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
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const strength = Math.min(
    4,
    Math.floor(password.length / 3) + (/[^a-zA-Z]/.test(password) ? 1 : 0),
  );

  const finishEmail = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const { data, error: signUpError } = await withAuthTimeout(
        supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: { full_name: name.trim() },
          },
        }),
      );
      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Account creation did not return a user.");
      if (!data.session) {
        setNotice("Check your email to verify your account, then log in to continue.");
        return;
      }
      await ensureProfileAndGetDestination(data.user);
      navigate({ to: "/onboarding", replace: true });
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  const finishGoogle = async () => {
    setError("");
    setNotice("");
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
    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }
    if (!/[A-Z]/.test(password)) {
      return setError("Password must contain at least one uppercase letter.");
    }
    if (!/[a-z]/.test(password)) {
      return setError("Password must contain at least one lowercase letter.");
    }
    if (!/[0-9]/.test(password)) {
      return setError("Password must contain at least one number.");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return setError("Password must contain at least one special character.");
    }
    if (password !== confirm) return setError("Passwords do not match.");
    if (!agree) return setError("Please accept the terms to continue.");
    void finishEmail();
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your smarter money journey in under a minute."
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <AuthField label="Full name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aarav Sharma"
            className={inputClass}
            autoComplete="name"
          />
        </AuthField>

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
              autoComplete="new-password"
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
          <div className="mt-2 flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-1 flex-1 rounded-full bg-foreground/10 transition-all duration-500"
                style={i < strength ? { background: "var(--gradient-brand)" } : undefined}
              />
            ))}
          </div>
        </AuthField>

        <AuthField label="Confirm password">
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
            autoComplete="new-password"
          />
        </AuthField>

        <label className="inline-flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-glass-border accent-[var(--primary)]"
          />
          <span>
            I agree to the <span className="text-foreground">Terms of Service</span> and{" "}
            <span className="text-foreground">Privacy Policy</span>.
          </span>
        </label>

        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {error}
          </motion.p>
        ) : null}
        {notice ? (
          <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent">
            {notice}
          </p>
        ) : null}

        <GlowButton type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating your account…
            </>
          ) : (
            "Create account"
          )}
        </GlowButton>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
        <span className="h-px flex-1 bg-glass-border" />
        or
        <span className="h-px flex-1 bg-glass-border" />
      </div>

      <SocialButtons label="Sign up" onPick={() => void finishGoogle()} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary transition-opacity hover:opacity-80">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
