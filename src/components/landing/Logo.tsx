export function Logo({
  className = "h-9 w-9",
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`relative grid place-items-center rounded-xl ${className}`}
        style={{
          background: "var(--gradient-brand)",
          boxShadow: "var(--shadow-glow)",
        }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <path
            d="M5 17.5c3.2 0 4.4-4 6.2-7.2C12.7 7.6 14.2 6 16 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-primary-foreground"
          />

          <circle cx="18.2" cy="6.4" r="2.2" className="fill-primary-foreground" />

          <circle cx="5.4" cy="17.6" r="1.6" className="fill-primary-foreground/80" />

          <path
            d="M9.6 12.8h5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="text-primary-foreground/80"
          />
        </svg>
      </span>

      {showText && (
        <span className="font-display text-lg font-bold tracking-tight">
          Finora <span className="text-gradient">AI</span>
        </span>
      )}
    </span>
  );
}
