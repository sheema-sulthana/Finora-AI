import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { CreditCard, PieChart, TrendingUp, Wallet, BarChart3, Coins } from "lucide-react";

const CURRENCIES = ["$", "₹", "€", "£", "¥", "₿"];

type Particle = { x: number; y: number; d: number; delay: number; size: number };

function useParallax() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setPos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return pos;
}

export function AnimatedBackground() {
  const parallax = useParallax();
  const particles = useRef<Particle[]>(
    Array.from({ length: 34 }, (_, i) => ({
      x: (i * 37) % 100,
      y: (i * 61) % 100,
      d: 16 + ((i * 7) % 22),
      delay: (i % 12) * 0.9,
      size: 1 + (i % 3),
    })),
  ).current;

  const icons = [CreditCard, PieChart, TrendingUp, Wallet, BarChart3, Coins];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base wash */}
      <div className="absolute inset-0 bg-background" />

      {/* animated grid */}
      <div
        className="absolute inset-0 animate-grid opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--primary) 26%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--primary) 26%, transparent) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black, transparent 75%)",
        }}
      />

      {/* glowing orbs with mouse parallax */}
      <motion.div
        className="absolute -left-40 top-[-10%] h-[42rem] w-[42rem] animate-drift rounded-full blur-[120px]"
        style={{ background: "color-mix(in oklab, var(--primary) 32%, transparent)" }}
        animate={{ x: parallax.x * -40, y: parallax.y * -30 }}
        transition={{ type: "spring", stiffness: 18, damping: 22 }}
      />
      <motion.div
        className="absolute right-[-15%] top-[6%] h-[38rem] w-[38rem] animate-drift rounded-full blur-[130px]"
        style={{
          background: "color-mix(in oklab, var(--secondary) 34%, transparent)",
          animationDelay: "-8s",
        }}
        animate={{ x: parallax.x * 50, y: parallax.y * 34 }}
        transition={{ type: "spring", stiffness: 16, damping: 22 }}
      />
      <motion.div
        className="absolute bottom-[-20%] left-[30%] h-[34rem] w-[34rem] animate-drift rounded-full blur-[140px]"
        style={{
          background: "color-mix(in oklab, var(--accent) 20%, transparent)",
          animationDelay: "-16s",
        }}
        animate={{ x: parallax.x * 26, y: parallax.y * -18 }}
        transition={{ type: "spring", stiffness: 14, damping: 24 }}
      />

      {/* flowing graph lines */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.35]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGrad2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--secondary)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M-100 320 Q 200 180 460 300 T 1000 220 T 1600 330"
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="1.6"
          strokeDasharray="14 12"
          className="animate-dash"
        />
        <path
          d="M-100 620 Q 260 720 520 600 T 1100 660 T 1700 540"
          fill="none"
          stroke="url(#lineGrad2)"
          strokeWidth="1.4"
          strokeDasharray="10 16"
          className="animate-dash"
          style={{ animationDuration: "9s" }}
        />
        <path
          d="M-100 900 Q 300 830 620 940 T 1200 860 T 1800 960"
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="1.2"
          strokeDasharray="6 18"
          className="animate-dash"
          style={{ animationDuration: "12s" }}
        />
      </svg>

      {/* particles */}
      {particles.map((p, i) => (
        <motion.span
          key={`p-${i}`}
          className="absolute rounded-full bg-primary/70"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{ y: [0, -p.d, 0], opacity: [0.15, 0.75, 0.15] }}
          transition={{
            duration: 12 + (i % 9),
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* floating currency symbols */}
      {CURRENCIES.map((c, i) => (
        <motion.span
          key={c}
          className="absolute font-display text-3xl text-primary/25 sm:text-4xl"
          style={{ left: `${8 + i * 15}%`, top: `${18 + ((i * 23) % 62)}%` }}
          animate={{ y: [0, -34, 0], opacity: [0, 0.7, 0], rotate: [-6, 6, -6] }}
          transition={{ duration: 14 + i * 2, repeat: Infinity, delay: i * 2.2, ease: "easeInOut" }}
        >
          {c}
        </motion.span>
      ))}

      {/* floating finance icons / cards */}
      {icons.map((Icon, i) => (
        <motion.div
          key={`icon-${i}`}
          className="absolute grid h-14 w-14 place-items-center rounded-2xl glass"
          style={{ left: `${(i * 17 + 6) % 88}%`, top: `${(i * 29 + 12) % 78}%` }}
          animate={{ y: [0, -26, 0], rotate: [-4, 5, -4], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 18 + i * 3, repeat: Infinity, delay: i * 1.8, ease: "easeInOut" }}
        >
          <Icon className="h-6 w-6 text-primary/60" />
        </motion.div>
      ))}

      {/* floating credit card */}
      <motion.div
        className="absolute right-[8%] top-[62%] hidden h-28 w-44 rounded-2xl glass-strong lg:block"
        animate={{ y: [0, -20, 0], rotate: [-8, -3, -8] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="p-4">
          <div className="h-6 w-9 rounded-md bg-accent/60" />
          <div className="mt-6 h-2 w-24 rounded-full bg-foreground/20" />
          <div className="mt-2 h-2 w-16 rounded-full bg-foreground/10" />
        </div>
      </motion.div>

      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, transparent 40%, color-mix(in oklab, var(--background) 88%, transparent) 100%)",
        }}
      />
    </div>
  );
}
