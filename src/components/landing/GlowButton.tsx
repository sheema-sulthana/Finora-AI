import { forwardRef, useState, type ButtonHTMLAttributes, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline";

type Ripple = { id: number; x: number; y: number };

export interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "lg";
}

const base =
  "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "text-primary-foreground hover:-translate-y-0.5",
  outline: "glass text-foreground hover:-translate-y-0.5 hover:border-primary/60",
  ghost: "text-muted-foreground hover:text-foreground",
};

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(function GlowButton(
  { className, variant = "primary", size = "md", children, onClick, style, ...props },
  ref,
) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((r) => r.filter((item) => item.id !== id)), 650);
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      onClick={handleClick}
      className={cn(
        base,
        variants[variant],
        size === "lg" ? "px-7 py-3.5 text-base" : "px-5 py-2.5 text-sm",
        className,
      )}
      style={{
        ...(variant === "primary"
          ? {
              background: "var(--gradient-brand)",
              backgroundSize: "200% 200%",
              boxShadow: "var(--shadow-glow)",
            }
          : {}),
        ...style,
      }}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute h-2 w-2 animate-ping rounded-full bg-foreground/40"
          style={{ left: r.x, top: r.y, transform: "translate(-50%,-50%) scale(14)" }}
        />
      ))}
    </button>
  );
});
