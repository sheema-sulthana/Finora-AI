import {
  Bot,
  Brain,
  FileSpreadsheet,
  PiggyBank,
  ScanLine,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { Reveal, SectionHeading } from "./Reveal";

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Brain,
    title: "AI Expense Tracking",
    desc: "Every transaction is auto-categorized with context — merchant, intent, and recurring pattern detection.",
  },
  {
    icon: PiggyBank,
    title: "Smart Budget Planner",
    desc: "Budgets that adapt to your real spending rhythm and warn you before you overshoot.",
  },
  {
    icon: FileSpreadsheet,
    title: "Upload Bank Statements",
    desc: "Drop a PDF or CSV from any bank. Finora parses thousands of rows in seconds.",
  },
  {
    icon: ScanLine,
    title: "Receipt Scanner",
    desc: "Snap a bill or screenshot. OCR + AI extract amount, merchant, tax, and category.",
  },
  {
    icon: BarChart3,
    title: "Monthly Reports",
    desc: "Beautiful month-over-month reports with trends, anomalies, and forecasted expenses.",
  },
  {
    icon: Bot,
    title: "AI Financial Coach",
    desc: "A conversational coach that answers money questions and builds a savings plan for you.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Features"
          title={
            <>
              Everything you need to <span className="text-gradient">master your money</span>
            </>
          }
          subtitle="Built for people who want clarity, not spreadsheets."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <article className="group relative h-full overflow-hidden rounded-3xl glass p-6 card-hover">
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: "var(--gradient-soft)" }}
                />
                <div
                  className="relative grid h-12 w-12 place-items-center rounded-2xl"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  <f.icon className="h-5.5 w-5.5 text-primary-foreground" />
                </div>
                <h3 className="relative mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
