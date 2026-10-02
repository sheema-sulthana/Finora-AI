import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const dirs = {
  up: { y: 40, x: 0 },
  left: { y: 0, x: 60 },
  right: { y: 0, x: -60 },
  zoom: { y: 0, x: 0 },
};

export function Reveal({
  children,
  delay = 0,
  direction = "up",
  className,
}: {
  children: ReactNode;
  delay?: number;
  direction?: keyof typeof dirs;
  className?: string;
}) {
  const offset = dirs[direction];
  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...offset,
      scale: direction === "zoom" ? 0.92 : 1,
      filter: "blur(6px)",
    },
    show: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">{title}</h2>
      {subtitle ? <p className="mt-4 text-base text-muted-foreground">{subtitle}</p> : null}
    </Reveal>
  );
}
