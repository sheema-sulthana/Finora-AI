import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Banknote, CreditCard, LineChart, PiggyBank, Receipt, Wallet } from "lucide-react";
import { Logo } from "@/components/landing/Logo";
import { AnimatedBackground } from "@/components/landing/AnimatedBackground";

const FLOATERS = [
  { Icon: Wallet, top: "12%", left: "8%", delay: 0 },
  { Icon: PiggyBank, top: "70%", left: "12%", delay: 0.6 },
  { Icon: LineChart, top: "22%", left: "84%", delay: 0.3 },
  { Icon: CreditCard, top: "62%", left: "88%", delay: 0.9 },
  { Icon: Receipt, top: "86%", left: "46%", delay: 1.2 },
  { Icon: Banknote, top: "8%", left: "52%", delay: 1.5 },
];

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      <div className="pointer-events-none absolute inset-0 hidden md:block">
        {FLOATERS.map(({ Icon, top, left, delay }, i) => (
          <motion.div
            key={i}
            className="absolute grid h-12 w-12 place-items-center rounded-2xl glass text-muted-foreground"
            style={{ top, left }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.7, scale: 1, y: [0, -16, 0] }}
            transition={{
              opacity: { duration: 0.8, delay },
              scale: { duration: 0.8, delay },
              y: { duration: 8 + i, repeat: Infinity, ease: "easeInOut", delay },
            }}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <Link to="/" className="mb-7">
          <Logo />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md rounded-3xl glass-strong p-7 shadow-[var(--shadow-card)] sm:p-9"
        >
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </motion.div>

        <p className="mt-6 text-xs text-muted-foreground">
          Demo experience — no real bank data is collected.
        </p>
      </div>
    </div>
  );
}

export function SocialButtons({ label, onPick }: { label: string; onPick: () => void }) {
  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={onPick}
        className="inline-flex w-full items-center justify-center gap-3 rounded-2xl glass px-4 py-3 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5a4.7 4.7 0 0 1-2 3.1l3.2 2.5c1.9-1.7 3-4.3 3-7.4 0-.7-.1-1.4-.2-2z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2.1 1-3.5 1a6 6 0 0 1-5.7-4.1L3 16.6A10 10 0 0 0 12 22"
          />
          <path fill="#FBBC05" d="M6.3 14a6 6 0 0 1 0-3.9L3 7.4a10 10 0 0 0 0 9.2z" />
          <path
            fill="#4285F4"
            d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3 7.4L6.3 10A6 6 0 0 1 12 6.1"
          />
        </svg>
        {label} with Google
      </button>
    </div>
  );
}

export function AuthField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-glass-border bg-foreground/5 px-4 py-3 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground/70 focus:border-primary/70 focus:bg-foreground/8 focus:shadow-[var(--shadow-glow)]";
