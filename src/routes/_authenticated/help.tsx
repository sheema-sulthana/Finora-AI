import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import { GlassCard, PageHeader, inputClass } from "@/components/app/ui";
import { GlowButton } from "@/components/landing/GlowButton";
import { supabase } from "@/integrations/supabase/client";
import { mkHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/help")({
  head: mkHead(
    "Help & Support — Finora AI",
    "FAQs, privacy policy, terms, bug reports and support for your Finora AI account.",
  ),
  component: () => (
    <AppLayout>
      <HelpPage />
    </AppLayout>
  ),
});

const FAQS = [
  {
    q: "How does Finora read my statements?",
    a: "Upload a PDF, CSV, receipt or screenshot and our AI extracts each merchant, amount, date and category. Nothing is saved until you confirm the review screen.",
  },
  {
    q: "Is my financial data private?",
    a: "Every record is tied to your account and protected by row-level security, so only you can read or change your data.",
  },
  {
    q: "How is my financial health score calculated?",
    a: "It blends your savings rate, budget adherence, spending trend and goal progress from your own transactions.",
  },
  {
    q: "Can I edit imported transactions?",
    a: "Yes — edit or delete anything on the Transactions page and your dashboard, budgets and reports recalculate instantly.",
  },
  {
    q: "Does the demo affect my account?",
    a: "No. Demo Mode uses sample data only and never writes to your real account.",
  },
];

function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("support");
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!message.trim()) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await (
      supabase as never as {
        from: (t: string) => { insert: (v: Record<string, unknown>) => Promise<unknown> };
      }
    )
      .from("feedback")
      .insert({ user_id: auth.user.id, category, message });
    setMessage("");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <>
      <PageHeader title="Help & Support" subtitle="Answers, policies and a direct line to us." />

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <p className="text-sm font-medium">Frequently asked questions</p>
          <div className="mt-4 grid gap-2">
            {FAQS.map((f, i) => (
              <div key={f.q} className="rounded-2xl bg-foreground/[0.04] px-4">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-sm"
                >
                  {f.q}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pb-4 text-sm text-muted-foreground"
                    >
                      {f.a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="grid gap-4">
          <GlassCard delay={0.05}>
            <p className="text-sm font-medium">Contact support / report a bug</p>
            <div className="mt-4 grid gap-3">
              <select
                className={inputClass}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="support" className="bg-background">
                  Contact support
                </option>
                <option value="bug" className="bg-background">
                  Report a bug
                </option>
                <option value="feature" className="bg-background">
                  Suggest a feature
                </option>
              </select>
              <textarea
                className={`${inputClass} min-h-[120px]`}
                placeholder="Describe what you need help with…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex items-center gap-3">
                <GlowButton onClick={send}>Send</GlowButton>
                {sent && (
                  <span className="text-xs text-emerald-400">
                    Message received — we'll reply by email.
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.1}>
            <p className="text-sm font-medium">Privacy & terms</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We store only the financial data you add or import. It is never sold or shared, is
              protected by row-level security, and you can delete any record at any time. By using
              Finora AI you agree to use it for personal finance management only; insights are
              guidance, not regulated financial advice.
            </p>
            <div className="mt-4">
              <Link to="/settings" className="text-xs text-primary">
                Manage your data in Settings
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
