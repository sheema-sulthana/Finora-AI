import { motion } from "motion/react";
import { BarChart3, Sparkles, TrendingUp, UploadCloud } from "lucide-react";
import { Reveal, SectionHeading } from "./Reveal";

const STEPS = [
  { icon: UploadCloud, title: "Upload Statements", desc: "PDF, CSV, receipts or screenshots." },
  { icon: Sparkles, title: "AI Analyzes Data", desc: "Parsing, categorizing, detecting patterns." },
  { icon: BarChart3, title: "View Dashboard", desc: "Live balance, budgets and forecasts." },
  { icon: TrendingUp, title: "Improve Savings", desc: "Act on coaching, watch savings grow." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From messy statements to <span className="text-gradient">clear decisions</span>
            </>
          }
          subtitle="Four steps. Around ninety seconds."
        />

        <div className="relative mt-16">
          <svg
            className="absolute left-0 right-0 top-8 hidden h-2 w-full lg:block"
            viewBox="0 0 1000 8"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M60 4 H940"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeDasharray="8 10"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.6 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
          </svg>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.14} className="relative text-center">
                <motion.div
                  className="mx-auto grid h-16 w-16 place-items-center rounded-2xl glass-strong"
                  style={{ boxShadow: "var(--shadow-glow)" }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 5 + i,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.4,
                  }}
                >
                  <s.icon className="h-6 w-6 text-primary" />
                </motion.div>
                <span className="mt-4 inline-block rounded-full glass px-3 py-1 text-[11px] tracking-[0.16em] text-muted-foreground">
                  STEP {i + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
