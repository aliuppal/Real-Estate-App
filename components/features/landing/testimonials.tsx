import { Stagger, StaggerItem } from "./reveal";

const STORIES = [
  {
    quote: "We saw nine houses in one weekend, and our agent had already flagged the two with drainage problems.",
    name: "Faisal & Amna",
    detail: "Bought a 10 Marla home in DHA Phase 6",
  },
  {
    quote: "Listed on a Monday, three serious viewings by Thursday. The suggested price was spot on.",
    name: "Rabia Anwar",
    detail: "Sold in Model Town",
  },
  {
    quote: "I typed ‘furnished flat near MM Alam Road’ and the first result is where I live now.",
    name: "Junaid Akhtar",
    detail: "Renting in Gulberg III",
  },
];

/** Quiet, rule-separated quotes rather than card carousels. Demo stories for the seeded data. */
export function Testimonials() {
  return (
    <Stagger className="grid gap-12 md:grid-cols-3 md:gap-8">
      {STORIES.map((s) => (
        <StaggerItem key={s.name}>
          <figure className="flex h-full flex-col border-t border-hairline pt-6">
            <blockquote className="text-xl leading-snug tracking-[-0.01em]">“{s.quote}”</blockquote>
            <figcaption className="mt-auto pt-8 text-sm">
              <span className="block">{s.name}</span>
              <span className="text-muted-foreground">{s.detail}</span>
            </figcaption>
          </figure>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
