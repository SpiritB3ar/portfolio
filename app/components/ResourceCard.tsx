"use client";
import { ResourceType } from "./types/types";
import { ExternalLink, Calendar, Clock } from "lucide-react";
import { useLanguage } from "../providers/LanguageProvider";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

export const ResourceCard = ({ resource }: { resource: ResourceType }) => {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      className="group relative h-full w-full overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-300 hover:border-brand-green/40 dark:hover:border-brand-green/40"
    >
      {/* Cover */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={resource.coverImage || "/placeholder-resource.jpg"}
          alt={resource.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#03100E]/80 to-transparent" />

        {/* Type Badge */}
        <div className="absolute right-4 top-4">
          <div className="rounded-full bg-brand-green px-3 py-1.5 shadow-sm">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-white dark:text-background">
              {resource.type}
            </span>
          </div>
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-4 left-4">
          <div className="rounded-full border border-white/30 bg-black/50 px-3 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wide text-white">
              {resource.category.name}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex h-[calc(100%-12rem)] flex-col p-6">
        <h3 className="mb-3 line-clamp-2 font-poiret text-xl font-bold text-foreground transition-colors group-hover:text-brand-green">
          {resource.title}
        </h3>

        <p className="mb-4 line-clamp-2 flex-grow text-sm text-muted-foreground">
          {resource.description}
        </p>

        <div className="mb-4 space-y-2 font-mono text-[11px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(resource.publishedAt).toLocaleDateString()}</span>
            {resource.readTimeMinutes && (
              <>
                <span>•</span>
                <Clock className="h-3.5 w-3.5" />
                <span>{resource.readTimeMinutes} {t.resources?.minRead}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>{t.resources.by} {resource.author}</span>
          </div>
        </div>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {resource.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                +{resource.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action Button */}
        <a
          href={resource.link || "#"}
          target="_blank"
          rel="noreferrer"
          className="focus-ring group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-medium dark:text-background pressable active:scale-[0.98]"
        >
          <span>{t.resources?.viewResource}</span>
          <ExternalLink className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </a>
      </div>
    </motion.div>
  );
};
