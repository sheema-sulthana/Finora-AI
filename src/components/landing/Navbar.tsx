import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { GlowButton } from "./GlowButton";

const LINKS = [
  { label: "Features", id: "features" },
  { label: "AI Coach", id: "ai-coach" },
  { label: "About", id: "how-it-works" },
  { label: "Contact", id: "contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("features");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const go = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6">
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500 sm:px-5 ${
          scrolled ? "glass-strong shadow-[var(--shadow-card)]" : "border border-transparent"
        }`}
      >
        <button onClick={() => go("hero")} className="shrink-0" aria-label="Finora AI home">
          <Logo />
        </button>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => go(link.id)}
              className="group relative px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
              <span
                className={`absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${
                  active === link.id ? "scale-x-100" : ""
                }`}
                style={{ background: "var(--gradient-brand)" }}
              />
              {active === link.id && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 -z-10 rounded-full bg-foreground/5"
                />
              )}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/login">
            <GlowButton variant="ghost">Login</GlowButton>
          </Link>
          <Link to="/signup">
            <GlowButton>Sign Up</GlowButton>
          </Link>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-xl glass lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="mx-auto mt-2 max-w-6xl rounded-2xl glass-strong p-3 lg:hidden"
          >
            {LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => go(link.id)}
                className="block w-full rounded-xl px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {link.label}
              </button>
            ))}
            <div className="mt-2 flex gap-2 px-1 pb-1">
              <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                <GlowButton variant="outline" className="w-full">
                  Login
                </GlowButton>
              </Link>
              <Link to="/signup" className="flex-1" onClick={() => setOpen(false)}>
                <GlowButton className="w-full">Sign Up</GlowButton>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
