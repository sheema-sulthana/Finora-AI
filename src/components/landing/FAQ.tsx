import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { Reveal, SectionHeading } from "./Reveal";

const FAQS = [
  {
    q: "Is Finora AI free to use ?",
    a: "Yes. Finora AI is designed as a free AI financial assistant that helps you track expenses, manage budgets, set goals, and make smarter saving decisions.",
  },
  {
    q: "Is my banking data secure?",
    a: "Files are encrypted in transit and at rest with AES-256. Finora never stores your banking credentials and you can delete any uploaded document permanently at any time.",
  },
  {
    q: "Do i need to connect my bank account?",
    a: "No. You can manually add transactions or upload your statements. Finora AI does not require direct access to your bank account.",
  },
  {
    q: "Which banks and formats are supported?",
    a: "Any bank that exports a PDF or CSV statement. We also read receipt photos and app screenshots using OCR, so even cash spends can be logged in seconds.",
  },
  {
    q: "How accurate is the AI categorization?",
    a: "96% out of the box across our benchmark of 2 million transactions. Every correction you make trains your personal model, so accuracy climbs with use.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={i * 0.06}>
                <div
                  className={`overflow-hidden rounded-2xl glass transition-colors duration-300 ${
                    isOpen ? "border-primary/50" : ""
                  }`}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-medium sm:text-base">{f.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full glass"
                    >
                      <Plus className="h-4 w-4 text-primary" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
