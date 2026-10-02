import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { Reveal } from "./Reveal";

const STATS = [
  { value: 50, suffix: "K+", label: "Users", prefix: "" },
  { value: 100, suffix: "M+", label: "Expenses Tracked", prefix: "₹" },
  { value: 96, suffix: "%", label: "AI Accuracy", prefix: "" },
  { value: 4.9, suffix: "★", label: "User Rating", prefix: "", decimals: 1 },
];

function Counter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  run,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  run: boolean;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    const duration = 1800;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, value]);

  return (
    <span>
      {prefix}
      {n.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative px-4 py-16 sm:px-6">
      <div ref={ref} className="mx-auto max-w-6xl">
        <Reveal>
          <div className="grid gap-6 rounded-3xl glass-strong p-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-bold text-gradient sm:text-4xl">
                  <Counter
                    value={s.value}
                    prefix={s.prefix}
                    suffix={s.suffix}
                    decimals={s.decimals ?? 0}
                    run={inView}
                  />
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
