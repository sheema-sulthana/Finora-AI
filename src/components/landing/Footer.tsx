import { Github, Linkedin, Mail } from "lucide-react";
import { Logo } from "./Logo";

const COLUMNS = [
  { title: "Product", links: ["Features", "AI Coach", "About", "Upload"] },
  { title: "Company", links: ["About", "Contact", "Careers", "Blog"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
];

export function Footer() {
  return (
    <footer id="contact" className="relative border-t border-border px-4 py-14 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            AI-powered personal finance for students, professionals, and families. Understand your
            money in minutes.
          </p>
          <div className="mt-5 flex gap-2">
            {[
              { icon: Github, label: "GitHub", href: "#" },
              { icon: Linkedin, label: "LinkedIn", href: "#" },
              { icon: Mail, label: "Email", href: "mailto:hello@finora.ai" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="grid h-10 w-10 place-items-center rounded-xl glass transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60"
              >
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-semibold">{c.title}</p>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Finora AI. All rights reserved.</p>
        <p>Built for people who want their money to make sense.</p>
      </div>
    </footer>
  );
}
