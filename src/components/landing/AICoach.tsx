import { motion } from "motion/react";
import { ArrowDownRight, Bot, Lightbulb, Send, User } from "lucide-react";
import { Reveal, SectionHeading } from "./Reveal";

const SUGGESTIONS = [
  { text: "Reduce food delivery by 20%.", saving: "₹2,400 / mo" },
  { text: "Increase savings by ₹3,000.", saving: "Auto-transfer" },
  { text: "Your electricity bill increased by 18%.", saving: "Review plan" },
];

export function AICoach() {
  return (
    <section id="ai-coach" className="relative px-4 py-24 sm:px-6">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <Reveal direction="right">
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> AI Coach
          </span>
          <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            A coach that actually <span className="text-gradient">reads your statements</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Finora AI compares months, spots silent leaks in your budget, and turns them into
            actions you can take today — in plain language, not finance jargon.
          </p>
          <ul className="mt-7 space-y-3">
            {SUGGESTIONS.map((s, i) => (
              <motion.li
                key={s.text}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="flex items-center justify-between gap-4 rounded-2xl glass px-4 py-3 card-hover"
              >
                <span className="flex items-center gap-3 text-sm">
                  <Lightbulb className="h-4 w-4 shrink-0 text-accent" />
                  {s.text}
                </span>
                <span className="shrink-0 text-xs font-medium text-accent">{s.saving}</span>
              </motion.li>
            ))}
          </ul>
        </Reveal>

        <Reveal direction="left">
          <div className="rounded-3xl glass-strong p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span
                className="grid h-10 w-10 place-items-center rounded-2xl"
                style={{ background: "var(--gradient-brand)" }}
              >
                <Bot className="h-5 w-5 text-primary-foreground" />
              </span>
              <div>
                <p className="text-sm font-semibold">Finora Coach</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Online ·
                  analyzing March
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex justify-end"
              >
                <p className="max-w-[78%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  Where did my money go this month?
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 }}
                className="max-w-[86%] space-y-3 text-sm"
              >
                <p className="text-foreground">
                  You spent <span className="font-semibold text-destructive">₹6,200 more</span> on
                  dining this month compared to last month.
                </p>
                <div className="rounded-2xl glass p-3">
                  <p className="text-xs text-muted-foreground">Dining · March vs February</p>
                  <div className="mt-2 space-y-2">
                    {[
                      { m: "Feb", w: "46%", tone: "bg-foreground/25" },
                      { m: "Mar", w: "82%", tone: "" },
                    ].map((b) => (
                      <div key={b.m} className="flex items-center gap-2 text-[11px]">
                        <span className="w-7 text-muted-foreground">{b.m}</span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/10">
                          <motion.span
                            className={`block h-full rounded-full ${b.tone}`}
                            style={b.tone ? {} : { background: "var(--gradient-brand)" }}
                            initial={{ width: 0 }}
                            whileInView={{ width: b.w }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.3 }}
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowDownRight className="h-3.5 w-3.5 text-accent" />
                  Following my plan saves you ₹5,400 next month.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full glass">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
                <span className="flex gap-1 rounded-full glass px-3 py-2">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2 }}
                    />
                  ))}
                </span>
              </motion.div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-full glass px-4 py-2.5">
              <span className="flex-1 text-sm text-muted-foreground">Ask Finora anything…</span>
              <span
                className="grid h-8 w-8 place-items-center rounded-full"
                style={{ background: "var(--gradient-brand)" }}
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
