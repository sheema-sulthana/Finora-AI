import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  Check,
  GraduationCap,
  Home,
  Laptop,
  PartyPopper,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
  Loader2,
} from "lucide-react";
import { AnimatedBackground } from "@/components/landing/AnimatedBackground";
import { Logo } from "@/components/landing/Logo";
import { GlowButton } from "@/components/landing/GlowButton";
import { GlassCard } from "@/components/app/ui";
import { CURRENCIES, currencySymbol, formatMoney } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useUpdateProfile } from "@/lib/finora-data";
import { mkHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: (search: Record<string, unknown>): { edit?: "1" } =>
    search["edit"] === "1" ? { edit: "1" } : {},
  head: mkHead(
    "Set up your profile — Finora AI",
    "Tell Finora AI about your income, goals and budget so your AI coach can personalise every insight.",
  ),
  component: OnboardingPage,
});

const PERSONAS = [
  { id: "student", label: "Student", icon: GraduationCap },
  { id: "employee", label: "Employee", icon: Briefcase },
  { id: "freelancer", label: "Freelancer", icon: Laptop },
  { id: "business", label: "Business Owner", icon: Building2 },
  { id: "retired", label: "Retired", icon: UserRound },
  { id: "homemaker", label: "Homemaker", icon: Home },
  { id: "other", label: "Other", icon: Sparkles },
];

const SOURCES = ["Salary", "Business", "Freelancing", "Allowance", "Pension", "Other"];
const FREQUENCIES = ["Monthly", "Weekly", "Yearly"] as const;

const GOALS = [
  "Emergency Fund",
  "Laptop",
  "Car",
  "Bike",
  "Vacation",
  "Education",
  "Home",
  "Wedding",
  "Investment",
  "Retirement",
  "Custom Goal",
];

const BUDGET_KEYS = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Rent",
  "Bills",
  "Savings",
  "Healthcare",
  "Education",
  "Others",
];

const BILL_PRESETS = [
  "Electricity",
  "Water",
  "Internet",
  "Gas",
  "Netflix",
  "Spotify",
  "Prime Video",
  "YouTube Premium",
  "EMI",
  "Loan",
  "Insurance",
];

const NOTIFS = [
  { id: "budget", label: "Budget Alerts", hint: "When a category is close to its limit" },
  { id: "bills", label: "Bill Reminders", hint: "Three days before each due date" },
  { id: "goals", label: "Goal Reminders", hint: "Nudges to keep goals on track" },
  { id: "report", label: "Monthly Report", hint: "A full breakdown every month" },
  { id: "ai", label: "AI Suggestions", hint: "Personalised ways to save more" },
  { id: "weekly", label: "Weekly Summary", hint: "A short Monday recap" },
];

const STEP_TITLES = [
  "Tell us about yourself",
  "Let's understand your income",
  "What are you working towards?",
  "Plan your monthly budget",
  "Bills & subscriptions",
  "Notification preferences",
  "You're all set",
];

type BillDraft = {
  id: string;
  name: string;
  amount: number;
  kind: "bill" | "subscription";
};

function OnboardingPage() {
  const navigate = useNavigate();
  const { edit } = useSearch({ from: "/_authenticated/onboarding" });
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const [persona, setPersona] = useState("");
  const [income, setIncome] = useState("");
  const [frequency, setFrequency] = useState<(typeof FREQUENCIES)[number]>("Monthly");
  const [currency, setCurrency] = useState("INR");
  const [source, setSource] = useState("Salary");
  const [goals, setGoals] = useState<string[]>([]);
  const [budget, setBudget] = useState<Record<string, number>>(() =>
    Object.fromEntries(BUDGET_KEYS.map((key) => [key, 0])),
  );
  const [bills, setBills] = useState<BillDraft[]>([]);
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFS.map((item) => [item.id, true])),
  );

  useEffect(() => {
    const isEditMode = edit === "1";

    if (!profile) return;
    if (profile.onboarding_completed && !isEditMode) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    if (hydrated) return;

    setPersona(profile.user_type ?? "");
    setIncome(profile.monthly_income ? String(profile.monthly_income) : "");
    setFrequency(
      FREQUENCIES.includes(profile.income_frequency as (typeof FREQUENCIES)[number])
        ? (profile.income_frequency as (typeof FREQUENCIES)[number])
        : "Monthly",
    );
    setCurrency(profile.currency || "INR");
    setSource(profile.income_source || "Salary");
    setGoals(profile.financial_goals ?? []);

    const savedBudget =
      profile.budget_preferences && typeof profile.budget_preferences === "object"
        ? profile.budget_preferences
        : {};
    setBudget(Object.fromEntries(BUDGET_KEYS.map((key) => [key, Number(savedBudget[key] ?? 0)])));

    if (profile.notification_preferences && typeof profile.notification_preferences === "object") {
      setNotifs((current) => ({ ...current, ...profile.notification_preferences }));
    }

    setHydrated(true);
  }, [edit, hydrated, navigate, profile]);

  const monthlyIncome = useMemo(() => {
    const value = Number(income) || 0;
    if (frequency === "Weekly") return value * 4.33;
    if (frequency === "Yearly") return value / 12;
    return value;
  }, [income, frequency]);

  const allocated = useMemo(
    () => Object.values(budget).reduce((total, value) => total + Number(value || 0), 0),
    [budget],
  );

  const progress = ((step + 1) / STEP_TITLES.length) * 100;
  const canContinue =
    step === 0
      ? Boolean(persona)
      : step === 1
        ? Number(income) > 0
        : step === 2
          ? goals.length > 0
          : true;

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(Math.max(0, Math.min(STEP_TITLES.length - 1, next)));
  };

  const toggleGoal = (goal: string) => {
    setGoals((current) =>
      current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal],
    );
  };

  const addBill = (name: string, amount: number) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    const kind = /netflix|spotify|prime|youtube/i.test(cleanName) ? "subscription" : "bill";

    setBills((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: cleanName,
        amount: Math.max(0, amount),
        kind,
      },
    ]);
    setBillName("");
    setBillAmount("");
  };

  const finish = async () => {
    if (saving) return;

    setSaveError("");
    setSaving(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");

      await updateProfile.mutateAsync({
        user_type: persona || "Other",
        monthly_income: Math.round(monthlyIncome),
        income_frequency: frequency,
        currency,
        income_source: source || null,
        financial_goals: goals,
        budget_preferences: budget,
        notification_preferences: notifs,
        onboarding_completed: true,
      });

      const month = new Date();
      month.setDate(1);
      const monthStr = month.toISOString().slice(0, 10);

      const selectedBudgets = Object.entries(budget)
        .filter(([, amount]) => Number(amount) > 0)
        .map(([category, amount]) => ({
          user_id: uid,
          month: monthStr,
          category,
          amount: Number(amount),
        }));

      if (selectedBudgets.length) {
        const { error } = await supabase
          .from("budgets")
          .upsert(selectedBudgets as never, { onConflict: "user_id,month,category" });
        if (error) throw error;
      }

      if (bills.length) {
        const { error } = await supabase.from("bills").insert(
          bills.map((bill) => ({
            user_id: uid,
            name: bill.name,
            kind: bill.kind,
            amount: bill.amount,
            category: bill.kind === "subscription" ? "Subscriptions" : "Bills",
            due_day: 5,
          })) as never,
        );
        if (error) throw error;
      }

      const { error: timelineError } = await supabase.from("timeline_events").insert({
        user_id: uid,
        icon: "🎉",
        title: "Profile created",
        description: "Onboarding completed — Finora AI is ready.",
      } as never);
      if (timelineError) throw timelineError;

      navigate({ to: "/dashboard", replace: true });
    } catch (caught) {
      setSaveError(
        caught instanceof Error
          ? caught.message
          : "We couldn't save your profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step === STEP_TITLES.length - 1) {
      void finish();
      return;
    }
    go(step + 1);
  };

  if (profileLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="grid place-items-center gap-3 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            {edit === "1" && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Editing profile
              </span>
            )}
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Step {step + 1} of {STEP_TITLES.length}
            </span>
          </div>
        </div>

        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-foreground/8">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--gradient-brand)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <div className="relative mt-8 flex-1">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 60, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: dir * -60, filter: "blur(8px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <GlassCard className="rounded-3xl p-6 shadow-[var(--shadow-card)] sm:p-8">
                <h1 className="text-2xl font-bold sm:text-3xl">{STEP_TITLES[step]}</h1>

                {step === 0 && (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      What best describes you? This shapes your coaching style.
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {PERSONAS.map(({ id, label, icon: Icon }) => {
                        const active = persona === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setPersona(id)}
                            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 ${
                              active
                                ? "border-primary/70 bg-primary/10"
                                : "border-glass-border bg-foreground/5 hover:border-primary/40"
                            }`}
                            style={active ? { boxShadow: "var(--shadow-glow)" } : {}}
                          >
                            <Icon
                              className={`h-6 w-6 transition-colors ${
                                active ? "text-primary" : "text-muted-foreground"
                              }`}
                            />
                            <span className="mt-3 block text-sm font-medium">{label}</span>
                            {active && (
                              <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      We use this to size your budgets and savings targets.
                    </p>
                    <div className="mt-6 grid gap-5">
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Income amount
                        </span>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {currencySymbol(currency)}
                          </span>
                          <input
                            inputMode="numeric"
                            value={income}
                            onChange={(e) => setIncome(e.target.value.replace(/[^\d]/g, ""))}
                            placeholder="45000"
                            className="w-full rounded-2xl border border-glass-border bg-foreground/5 py-3 pl-9 pr-4 text-sm outline-none transition-all duration-300 focus:border-primary/70 focus:shadow-[var(--shadow-glow)]"
                          />
                        </div>
                      </label>

                      <Chips
                        label="Frequency"
                        options={[...FREQUENCIES]}
                        value={frequency}
                        onChange={(value) => setFrequency(value as (typeof FREQUENCIES)[number])}
                      />

                      <div>
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Currency
                        </span>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {CURRENCIES.map((item) => (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => setCurrency(item.code)}
                              className={`rounded-2xl border px-3 py-2.5 text-sm transition-all duration-300 hover:-translate-y-0.5 ${
                                currency === item.code
                                  ? "border-primary/70 bg-primary/10 text-foreground"
                                  : "border-glass-border bg-foreground/5 text-muted-foreground"
                              }`}
                            >
                              <span className="mr-1.5 text-base">{item.symbol}</span>
                              {item.code}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Chips
                        label="Income source"
                        options={SOURCES}
                        value={source}
                        onChange={setSource}
                      />

                      {monthlyIncome > 0 && (
                        <p className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
                          That's about <strong>{formatMoney(monthlyIncome, currency)}</strong> per
                          month.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Pick everything that matters — you can change these anytime.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2.5">
                      {GOALS.map((goal, index) => {
                        const active = goals.includes(goal);
                        return (
                          <motion.button
                            key={goal}
                            type="button"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => toggleGoal(goal)}
                            className={`rounded-2xl border px-4 py-3 text-sm transition-all duration-300 hover:-translate-y-1 ${
                              active
                                ? "border-primary/70 bg-primary/10"
                                : "border-glass-border bg-foreground/5 text-muted-foreground hover:border-primary/40"
                            }`}
                            style={active ? { boxShadow: "var(--shadow-glow)" } : {}}
                          >
                            <span className="inline-flex items-center gap-2">
                              {active && <Check className="h-3.5 w-3.5 text-primary" />}
                              {goal}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Estimate your monthly spend — Finora refines this from your statements later.
                    </p>
                    <div className="mt-6 grid gap-4">
                      {BUDGET_KEYS.map((key) => (
                        <div key={key}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{key}</span>
                            <span className="font-medium">
                              {formatMoney(budget[key] ?? 0, currency)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={Math.max(20000, Math.round(monthlyIncome) || 50000)}
                            step={250}
                            value={budget[key] ?? 0}
                            onChange={(e) =>
                              setBudget((current) => ({
                                ...current,
                                [key]: Number(e.target.value),
                              }))
                            }
                            className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-foreground/10 accent-[var(--primary)]"
                          />
                        </div>
                      ))}
                      <div className="rounded-2xl border border-glass-border bg-foreground/5 px-4 py-3 text-sm">
                        Allocated <strong>{formatMoney(allocated, currency)}</strong>
                        {monthlyIncome > 0 && (
                          <span className="text-muted-foreground">
                            {" "}
                            of {formatMoney(monthlyIncome, currency)} —{" "}
                            {allocated > monthlyIncome ? (
                              <span className="text-destructive">over budget</span>
                            ) : (
                              <span className="text-accent">
                                {formatMoney(monthlyIncome - allocated, currency)} left
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Add recurring expenses so we can remind you before they hit. You can skip
                      this.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {BILL_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => addBill(preset, 0)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-foreground/5 px-3.5 py-2 text-xs text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:text-foreground"
                        >
                          <Plus className="h-3 w-3" /> {preset}
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                      <input
                        value={billName}
                        onChange={(e) => setBillName(e.target.value)}
                        placeholder="Custom bill name"
                        className="flex-1 rounded-2xl border border-glass-border bg-foreground/5 px-4 py-3 text-sm outline-none focus:border-primary/70"
                      />
                      <input
                        inputMode="numeric"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value.replace(/[^\d]/g, ""))}
                        placeholder="Amount"
                        className="w-full rounded-2xl border border-glass-border bg-foreground/5 px-4 py-3 text-sm outline-none focus:border-primary/70 sm:w-32"
                      />
                      <GlowButton
                        type="button"
                        onClick={() => addBill(billName, Number(billAmount) || 0)}
                      >
                        Add
                      </GlowButton>
                    </div>

                    <div className="mt-5 grid gap-2">
                      <AnimatePresence initial={false}>
                        {bills.map((bill) => (
                          <motion.div
                            key={bill.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-between rounded-2xl border border-glass-border bg-foreground/5 px-4 py-3 text-sm"
                          >
                            <span>{bill.name}</span>
                            <span className="flex items-center gap-3">
                              <span className="text-muted-foreground">
                                {formatMoney(bill.amount, currency)}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setBills((current) =>
                                    current.filter((item) => item.id !== bill.id),
                                  )
                                }
                                className="text-muted-foreground transition-colors hover:text-destructive"
                                aria-label={`Remove ${bill.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </>
                )}

                {step === 5 && (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Choose how your AI coach keeps in touch.
                    </p>
                    <div className="mt-6 grid gap-3">
                      {NOTIFS.map(({ id, label, hint }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() =>
                            setNotifs((current) => ({ ...current, [id]: !current[id] }))
                          }
                          className="flex items-center justify-between rounded-2xl border border-glass-border bg-foreground/5 px-4 py-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
                        >
                          <span className="flex items-center gap-3">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            <span>
                              <span className="block text-sm font-medium">{label}</span>
                              <span className="block text-xs text-muted-foreground">{hint}</span>
                            </span>
                          </span>
                          <span
                            className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
                              notifs[id] ? "" : "bg-foreground/15"
                            }`}
                            style={notifs[id] ? { background: "var(--gradient-brand)" } : undefined}
                          >
                            <motion.span
                              className="absolute top-1 h-4 w-4 rounded-full bg-background"
                              animate={{ left: notifs[id] ? 26 : 4 }}
                              transition={{ type: "spring", stiffness: 500, damping: 32 }}
                            />
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {step === 6 && (
                  <div className="py-6 text-center">
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 220, damping: 16 }}
                      className="mx-auto grid h-20 w-20 place-items-center rounded-3xl"
                      style={{
                        background: "var(--gradient-brand)",
                        boxShadow: "var(--shadow-glow)",
                      }}
                    >
                      <PartyPopper className="h-9 w-9 text-primary-foreground" />
                    </motion.div>

                    <h2 className="mt-6 text-2xl font-bold sm:text-3xl">
                      🎉 Welcome to <span className="text-gradient">Finora AI</span>
                    </h2>
                    <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                      Your AI Financial Coach is now ready. Let's start managing your finances
                      smarter.
                    </p>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </div>

        {saveError && (
          <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {saveError}
          </p>
        )}

        {step < STEP_TITLES.length - 1 && (
          <div className="mt-6 flex items-center justify-between gap-3 pb-4">
            <button
              type="button"
              onClick={() => go(step - 1)}
              disabled={step === 0 || saving}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex items-center gap-3">
              {step === 4 && (
                <button
                  type="button"
                  onClick={() => go(step + 1)}
                  disabled={saving}
                  className="rounded-full px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Skip
                </button>
              )}
              <GlowButton size="lg" onClick={next} disabled={!canContinue || saving}>
                Continue <ArrowRight className="h-4 w-4" />
              </GlowButton>
            </div>
          </div>
        )}

        {step === STEP_TITLES.length - 1 && (
          <div className="mt-6 flex items-center justify-between gap-3 pb-4">
            <button
              type="button"
              onClick={() => go(step - 1)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <GlowButton size="lg" onClick={next} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </>
              )}
            </GlowButton>
          </div>
        )}
      </div>
    </div>
  );
}

function Chips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border px-4 py-2 text-sm transition-all duration-300 hover:-translate-y-0.5 ${
              value === option
                ? "border-primary/70 bg-primary/10 text-foreground"
                : "border-glass-border bg-foreground/5 text-muted-foreground hover:border-primary/40"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
