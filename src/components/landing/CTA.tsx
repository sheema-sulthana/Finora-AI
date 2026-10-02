import { Reveal } from "./Reveal";
import { GlowButton } from "./GlowButton";
import { Link } from "@tanstack/react-router";

export function CTA() {
  return (
    <section id="cta" className="relative px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Reveal direction="zoom">
          <div
            className="relative overflow-hidden rounded-4xl glass-strong px-6 py-16 text-center sm:px-12"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <div
              className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 animate-pulse-glow rounded-full blur-[100px]"
              style={{ background: "color-mix(in oklab, var(--primary) 40%, transparent)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 animate-pulse-glow rounded-full blur-[100px]"
              style={{ background: "color-mix(in oklab, var(--secondary) 40%, transparent)" }}
            />
            <h2 className="relative text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Start Managing Your Money <span className="text-gradient">Smarter Today</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground">
              Join 50,000+ people who replaced spreadsheets with an AI that actually understands
              their spending.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <GlowButton>
                <Link to="/signup">
                  <button>Get Started</button>
                </Link>
              </GlowButton>
              <GlowButton>
                <Link to="/login">
                  <button className="...">Login</button>
                </Link>
              </GlowButton>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
