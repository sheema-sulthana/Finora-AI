import { Star } from "lucide-react";
import { SectionHeading } from "./Reveal";

const TESTIMONIALS = [
  {
    name: "Ananya Sharma",
    role: "Product Designer, Bengaluru",
    text: "Finora caught three subscriptions I forgot about. I saved ₹4,800 in the first month without changing my lifestyle.",
    initials: "AS",
  },
  {
    name: "Rahul Mehta",
    role: "Founder, D2C brand",
    text: "I upload my bank PDF on the 1st and the whole month is categorized before my coffee is done. It's ridiculous.",
    initials: "RM",
  },
  {
    name: "Priya Nair",
    role: "Doctor, Kochi",
    text: "The AI coach explains my spending like a friend would. No jargon, just what to fix this week.",
    initials: "PN",
  },
  {
    name: "Daniel Cruz",
    role: "Data Analyst, Lisbon",
    text: "The forecast panel is scarily accurate. It predicted my December overspend within 4%.",
    initials: "DC",
  },
  {
    name: "Meera & Arjun",
    role: "Family budget, Pune",
    text: "We finally plan our month together in ten minutes instead of arguing over a spreadsheet.",
    initials: "MA",
  },
  {
    name: "Sana Iqbal",
    role: "Final year student",
    text: "As a student I never tracked anything. Now I know exactly where my pocket money goes.",
    initials: "SI",
  },
];

function Card({ t }: { t: (typeof TESTIMONIALS)[number] }) {
  return (
    <article className="w-[320px] shrink-0 rounded-3xl glass p-6 card-hover sm:w-[380px]">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">“{t.text}”</p>
      <div className="mt-5 flex items-center gap-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-full text-xs font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-brand)" }}
        >
          {t.initials}
        </span>
        <div>
          <p className="text-sm font-semibold">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.role}</p>
        </div>
      </div>
    </article>
  );
}

export function Testimonials() {
  const row = [...TESTIMONIALS, ...TESTIMONIALS];
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Testimonials"
          title={
            <>
              Loved by people who <span className="text-gradient">hate budgeting</span>
            </>
          }
        />
      </div>

      <div className="relative mt-14">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
        <div className="group flex w-max gap-5 animate-marquee hover:[animation-play-state:paused]">
          {row.map((t, i) => (
            <Card key={`${t.name}-${i}`} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
