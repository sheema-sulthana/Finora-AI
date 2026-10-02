import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { Field, GlassCard, PageHeader, inputClass } from "@/components/app/ui";
import { GlowButton } from "@/components/landing/GlowButton";
import { CURRENCIES } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useUpdateProfile } from "@/lib/finora-data";
import { mkHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/settings")({
  head: mkHead(
    "Settings — Finora AI",
    "Manage your profile, currency, language, notifications, privacy and onboarding details.",
  ),
  component: () => (
    <AppLayout>
      <SettingsPage />
    </AppLayout>
  ),
});

function SettingsPage() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [language, setLanguage] = useState("en");
  const [income, setIncome] = useState("0");
  const [saved, setSaved] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState({ rating: 5, category: "review", message: "" });
  const [feedbackDone, setFeedbackDone] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name);
    setCurrency(profile.currency);
    setLanguage(profile.language);
    setIncome(String(profile.monthly_income));
  }, [profile]);

  const saveProfile = async () => {
    await update.mutateAsync({
      full_name: name,
      currency,
      language,
      monthly_income: Number(income) || 0,
    });
    setSaved("Profile updated.");
    setTimeout(() => setSaved(""), 2500);
  };

  const changePassword = async () => {
    if (password.length < 6) return;
    const { error } = await supabase.auth.updateUser({ password });
    setSaved(error ? error.message : "Password updated.");
    setPassword("");
    setTimeout(() => setSaved(""), 2500);
  };

  const sendFeedback = async () => {
    if (!feedback.message.trim()) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await (
      supabase as never as {
        from: (t: string) => { insert: (v: Record<string, unknown>) => Promise<unknown> };
      }
    )
      .from("feedback")
      .insert({
        user_id: auth.user.id,
        rating: feedback.rating,
        category: feedback.category,
        message: feedback.message,
      });
    setFeedback({ rating: 5, category: "review", message: "" });
    setFeedbackDone(true);
    setTimeout(() => setFeedbackDone(false), 3000);
  };

  const exportBackup = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(profile ?? {}, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "finora-profile-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Your profile, preferences and feedback." />

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <p className="text-sm font-medium">Profile</p>
          <div className="mt-4 grid gap-3">
            <Field label="Full name">
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Email">
              <input className={inputClass} value={profile?.email ?? ""} disabled />
            </Field>
            <Field label="Monthly income">
              <input
                type="number"
                className={inputClass}
                value={income}
                onChange={(e) => setIncome(e.target.value)}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Currency">
                <select
                  className={inputClass}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-background">
                      {c.symbol} {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Language">
                <select
                  className={inputClass}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en" className="bg-background">
                    English
                  </option>
                  <option value="hi" className="bg-background">
                    Hindi
                  </option>
                </select>
              </Field>
            </div>
            <div className="flex items-center gap-3">
              <GlowButton onClick={saveProfile}>Save changes</GlowButton>
              {saved && <span className="text-xs text-emerald-400">{saved}</span>}
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-4">
          <GlassCard delay={0.05}>
            <p className="text-sm font-medium">Security</p>
            <div className="mt-4 grid gap-3">
              <Field label="New password">
                <input
                  type="password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </Field>
              <div>
                <GlowButton variant="outline" onClick={changePassword}>
                  Update password
                </GlowButton>
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.1}>
            <p className="text-sm font-medium">Onboarding & data</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Update the answers you gave when you first joined, or download a copy of your profile.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/onboarding" search={{ edit: "1" }}>
                <GlowButton variant="outline">Manage onboarding details</GlowButton>
              </Link>
              <GlowButton variant="outline" onClick={exportBackup}>
                Download backup
              </GlowButton>
            </div>
          </GlassCard>
        </div>
      </div>

      <GlassCard className="mt-4" delay={0.15}>
        <p className="text-sm font-medium">Feedback</p>
        <div className="mt-4 grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  aria-label={`Rate ${n}`}
                  onClick={() => setFeedback({ ...feedback, rating: n })}
                  className={`text-xl ${n <= feedback.rating ? "opacity-100" : "opacity-30"}`}
                >
                  ⭐
                </button>
              ))}
            </div>
            <select
              className={`${inputClass} max-w-[220px]`}
              value={feedback.category}
              onChange={(e) => setFeedback({ ...feedback, category: e.target.value })}
            >
              <option value="review" className="bg-background">
                Review
              </option>
              <option value="feature" className="bg-background">
                Feature suggestion
              </option>
              <option value="bug" className="bg-background">
                Bug report
              </option>
              <option value="support" className="bg-background">
                Contact support
              </option>
            </select>
          </div>
          <textarea
            className={`${inputClass} min-h-[110px]`}
            placeholder="Tell us what you think, what to build next, or what broke…"
            value={feedback.message}
            onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
          />
          <div className="flex items-center gap-3">
            <GlowButton onClick={sendFeedback}>Send feedback</GlowButton>
            {feedbackDone && <span className="text-xs text-emerald-400">Thanks — we got it!</span>}
          </div>
        </div>
      </GlassCard>
    </>
  );
}
