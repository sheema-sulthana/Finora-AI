import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowUpRight, Sparkles, TrendingDown, TrendingUp, Wallet } from "lucide-react";

const bars = [38, 62, 45, 78, 56, 88, 70];
const donut = [
  { label: "Food", value: 34, color: "var(--primary)" },
  { label: "Rent", value: 26, color: "var(--secondary)" },
  { label: "Travel", value: 22, color: "var(--accent)" },
  { label: "Other", value: 18, color: "var(--chart-4)" },
];

function Donut() {
  const radius = 34;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg viewBox="0 0 90 90" className="h-24 w-24 -rotate-90">
      {donut.map((d) => {
        const len = (d.value / 100) * circ;
        const el = (
          <motion.circle
            key={d.label}
            cx="45"
            cy="45"
            r={radius}
            fill="none"
            stroke={d.color}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${len} ${circ - len}`}
            strokeDashoffset={-offset}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

export function DashboardMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 90, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 90, damping: 18 });

  const handleMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className="relative [perspective:1400px]"
    >
      <motion.div
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="rounded-3xl glass-strong p-5 shadow-[var(--shadow-card)]"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total Balance</p>
            <p className="font-display text-3xl font-bold">₹8,42,560</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
            <TrendingUp className="h-3.5 w-3.5" /> +12.4%
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5" style={{ transform: "translateZ(30px)" }}>
          {[
            { label: "Income", value: "₹1,24,000", icon: TrendingUp, tone: "text-accent" },
            { label: "Expenses", value: "₹78,420", icon: TrendingDown, tone: "text-destructive" },
            { label: "Savings", value: "₹45,580", icon: Wallet, tone: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl glass p-3">
              <s.icon className={`h-4 w-4 ${s.tone}`} />
              <p className="mt-2 text-[11px] text-muted-foreground">{s.label}</p>
              <p className="text-sm font-semibold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2" style={{ transform: "translateZ(45px)" }}>
          <div className="rounded-2xl glass p-4">
            <p className="text-xs text-muted-foreground">Spending Breakdown</p>
            <div className="mt-2 flex items-center gap-3">
              <Donut />
              <ul className="space-y-1.5 text-[11px]">
                {donut.map((d) => (
                  <li key={d.label} className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.label} <span className="text-foreground">{d.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl glass p-4">
            <p className="text-xs text-muted-foreground">Cash Flow</p>
            <svg viewBox="0 0 160 70" className="mt-2 h-20 w-full">
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path
                d="M0 55 L26 40 L52 46 L78 24 L104 34 L130 14 L160 22"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: "easeInOut" }}
              />
              <path
                d="M0 55 L26 40 L52 46 L78 24 L104 34 L130 14 L160 22 L160 70 L0 70 Z"
                fill="url(#areaFill)"
              />
            </svg>
            <div className="mt-1 flex items-end gap-1.5">
              {bars.map((b, i) => (
                <motion.span
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{ background: "var(--gradient-brand)" }}
                  initial={{ height: 4 }}
                  whileInView={{ height: b / 4 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.07 }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl glass p-4" style={{ transform: "translateZ(55px)" }}>
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-secondary" /> AI Health Score
            </span>
            <span className="font-semibold text-accent">86 / 100</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-foreground/10">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--gradient-brand)" }}
              initial={{ width: 0 }}
              whileInView={{ width: "86%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Monthly Budget Used</span>
            <span className="font-semibold">63%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-foreground/10">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: 0 }}
              whileInView={{ width: "63%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* floating side cards */}
      <motion.div
        className="absolute -left-16 top-24 hidden rounded-2xl glass-strong p-3 shadow-[var(--shadow-glow)] lg:block"
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <p className="text-[10px] text-muted-foreground">Saved this month</p>
        <p className="font-display text-lg font-bold text-accent">+₹12,400</p>
      </motion.div>
      <motion.div
        className="absolute -right-16 bottom-28 hidden items-center gap-2 rounded-2xl glass-strong p-3 shadow-[var(--shadow-glow-accent)] lg:flex"
        animate={{ y: [0, 16, 0] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowUpRight className="h-4 w-4 text-primary" />
        <div>
          <p className="text-[10px] text-muted-foreground">Goal: Emergency fund</p>
          <p className="text-sm font-semibold">78% complete</p>
        </div>
      </motion.div>
    </div>
  );
}
