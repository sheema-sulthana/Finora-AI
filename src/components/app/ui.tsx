import type { ReactNode } from "react";
import { motion } from "motion/react";

export const inputClass =
  "w-full rounded-2xl border border-glass-border bg-foreground/[0.04] px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60";

export function GlassCard({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`glass rounded-3xl p-5 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          <span className="text-gradient">{title}</span>
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "primary",
  delay = 0,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  icon?: ReactNode;
  tone?: "primary" | "success" | "danger" | "accent";
  delay?: number;
}) {
  const tones: Record<string, string> = {
    primary: "text-primary bg-primary/12",
    success: "text-emerald-400 bg-emerald-400/12",
    danger: "text-rose-400 bg-rose-400/12",
    accent: "text-secondary bg-secondary/12",
  };
  return (
    <GlassCard delay={delay} className="card-hover">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <span className={`grid h-10 w-10 place-items-center rounded-2xl ${tones[tone]}`}>
            {icon}
          </span>
        )}
      </div>
    </GlassCard>
  );
}

export function ProgressBar({
  value,
  color = "hsl(var(--primary))",
  height = 8,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-foreground/10" style={{ height }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

export function ScoreRing({ score, size = 132 }: { score: number; size?: number }) {
  return (
    <div
      className="relative grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(hsl(var(--primary)) ${score * 3.6}deg, rgba(255,255,255,0.07) 0deg)`,
      }}
    >
      <div
        className="grid place-items-center rounded-full bg-background"
        style={{ width: size - 22, height: size - 22 }}
      >
        <span className="font-display text-3xl font-bold text-gradient">{score}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-glass-border px-6 py-14 text-center">
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <p className="font-medium">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-glass-border bg-background/95 p-6 shadow-2xl"
      >
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <div className="mt-4">{children}</div>
      </motion.div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function Pill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
        active
          ? "border-primary/50 bg-primary/15 text-foreground"
          : "border-glass-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
