import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Play, Sparkles, Star } from "lucide-react";
import { GlowButton } from "./GlowButton";
import { DashboardMockup } from "./DashboardMockup";
import woman from "@/assets/user-woman.png";
import businessman from "@/assets/user-businessman.png";
import family from "@/assets/user-family.png";
import students from "@/assets/user-students.png";

const FULL = "Manage Your Money Smarter with AI";

function useTyping(text: string) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN((v) => v + 1), 45);
    return () => clearTimeout(t);
  }, [n, text.length]);
  return text.slice(0, n);
}

const PEOPLE = [
  {
    src: woman,
    alt: "A young woman happily checking her savings",
    cls: "left-[-26%] top-[-6%] w-28 xl:w-36",
  },
  {
    src: businessman,
    alt: "A businessman smiling after reducing expenses",
    cls: "right-[-24%] top-[-12%] w-28 xl:w-36",
  },
  {
    src: family,
    alt: "A family planning their monthly budget",
    cls: "left-[-28%] bottom-[-6%] w-32 xl:w-44",
  },
  {
    src: students,
    alt: "Students managing expenses with Finora AI",
    cls: "right-[-26%] bottom-[-8%] w-28 xl:w-36",
  },
];

export function Hero() {
  const typed = useTyping(FULL);

  return (
    <section id="hero" className="relative px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            Your AI-powered personal finance copilot
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
            <span className="text-gradient">{typed}</span>
            <span className="animate-caret text-primary">|</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            Upload bank statements, receipts, CSV files, or screenshots. Finora AI automatically
            analyzes your expenses, categorizes transactions, tracks your spending habits, predicts
            future expenses, and gives personalized AI-powered financial advice to help you save
            more every month.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup">
              <GlowButton size="lg">Get Started</GlowButton>
            </Link>
            <Link to="/demo">
              <GlowButton size="lg" variant="outline">
                <Play className="h-4 w-4" /> Watch Demo
              </GlowButton>
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                >
                  <Star className="h-4 w-4 fill-accent text-accent" />
                </motion.span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Trusted by students, professionals, and families.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {PEOPLE.map((p, i) => (
            <motion.img
              key={p.alt}
              src={p.src}
              alt={p.alt}
              width={640}
              height={640}
              loading="lazy"
              className={`pointer-events-none absolute z-0 hidden drop-shadow-[0_18px_40px_rgba(0,0,0,0.55)] xl:block ${p.cls}`}
              animate={{ y: [0, -18, 0], opacity: [0.35, 0.95, 0.35], x: [0, i % 2 ? 10 : -10, 0] }}
              transition={{
                duration: 12 + i * 2.5,
                repeat: Infinity,
                delay: i * 1.6,
                ease: "easeInOut",
              }}
            />
          ))}
          <div className="relative z-10">
            <DashboardMockup />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
