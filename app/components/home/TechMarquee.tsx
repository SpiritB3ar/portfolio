"use client";
import { ProjectType } from "../types/types";
import { useLanguage } from "../../providers/LanguageProvider";
import { useMountedReducedMotion } from "@/app/lib/use-mounted-reduced-motion";

interface TechMarqueeProps {
  projects: ProjectType[];
}

// Used only when the projects payload yields too few tags to fill the strip.
const FALLBACK_TECH = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Tailwind CSS",
  "Prisma",
  "MongoDB",
  "Framer Motion",
  "GraphQL",
  "React Native",
];

export const TechMarquee = ({ projects }: TechMarqueeProps) => {
  const { t } = useLanguage();
  const reduce = useMountedReducedMotion();

  const derived = Array.from(
    new Set(
      (projects || []).flatMap((p) => [
        ...((p.tools || []).map((tool) => tool?.name) ?? []),
        ...(p.technologies || []),
      ])
    )
  ).filter(Boolean) as string[];

  const items = derived.length >= 6 ? derived : FALLBACK_TECH;

  // Render the list twice for a seamless loop, but expose only the first copy
  // to assistive tech so the technologies aren't announced twice.
  const renderGroup = (hidden: boolean) => (
    <div className="flex items-center gap-10" aria-hidden={hidden || undefined}>
      {items.map((tech, i) => (
        <div key={`${tech}-${i}`} className="flex items-center gap-10">
          <span className="font-poiret text-2xl font-bold text-foreground transition-colors hover:text-brand-medium dark:hover:text-brand-green md:text-3xl">
            {tech}
          </span>
          <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green/60" />
        </div>
      ))}
    </div>
  );

  return (
    <section className="relative z-10 border-y border-border py-10">
      <p className="mb-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {t.home.techTitle}
      </p>

      <div className="marquee-mask overflow-hidden">
        <div className={`${reduce ? "" : "animate-marquee pause-hover"} flex w-max items-center gap-10`}>
          {renderGroup(false)}
          {renderGroup(true)}
        </div>
      </div>
    </section>
  );
};
