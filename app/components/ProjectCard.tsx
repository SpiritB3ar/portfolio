"use client"
import { useState } from "react";
import { ExternalLink, Code2, X, Github, Calendar, Folder } from "lucide-react";
import { ProjectType } from "./types/types";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useLanguage } from "../providers/LanguageProvider";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

const ProjectCard = ({ project, index = 0, isNew = false, featured = false }: { project: ProjectType; index?: number; isNew?: boolean; featured?: boolean }) => {
    const [showTool, setShowTool] = useState(false);
    const { lang, t } = useLanguage();
    const reduce = useReducedMotion();

    const cover = project.cover || project.coverImage || "";
    const description = project.about || project.description || "";
    const href = project.link || project.liveUrl || "#";
    const isExternal = /^https?:\/\//.test(href);
    const allTechs = [
        ...((project.tools || []).map((tool) => tool?.name) ?? []),
        ...(project.technologies || []),
    ].filter(Boolean);

    const publishDate = project.publishedAt
        ? format(new Date(project.publishedAt), 'MMM yyyy', { locale: lang === 'es' ? es : enUS })
        : null;

    return (
        <motion.article
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: [0.21, 0.6, 0.35, 1] }}
            className={`group relative overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-500 hover:border-brand-green/40 dark:hover:border-brand-green/40 ${
                featured ? "md:grid md:grid-cols-2" : ""
            }`}
        >
            {/* Cover Image */}
            <div className={`relative overflow-hidden bg-muted ${featured ? "aspect-[16/10] md:aspect-auto md:min-h-[320px]" : "aspect-[16/10]"}`}>
                {cover && (
                    <Image
                        src={cover}
                        alt={project.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                {/* Top badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                    {isNew && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-green px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white dark:text-background">
                            {t.projects.newBadge}
                        </span>
                    )}
                    {project.category && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                            <Folder className="h-3 w-3" />
                            {project.category}
                        </span>
                    )}
                    {publishDate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-[10px] font-medium text-white/80">
                            <Calendar className="h-3 w-3" />
                            {publishDate}
                        </span>
                    )}
                </div>

                {/* Tech toggle button */}
                {allTechs.length > 0 && (
                    <button
                        onClick={(e) => { e.preventDefault(); setShowTool(!showTool); }}
                        aria-label={t.projects.technologies}
                        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white transition-all duration-300 hover:border-brand-green hover:bg-brand-green hover:text-white dark:hover:text-background"
                    >
                        <Code2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className={featured ? "flex flex-col justify-center p-6 sm:p-8 md:p-10" : "p-5 sm:p-6"}>
                {/* Title + links */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className={`font-bold text-foreground font-poiret leading-tight group-hover:text-brand-green transition-colors duration-300 ${
                        featured ? "text-2xl sm:text-3xl" : "text-xl"
                    }`}>
                        {project.title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {project.githubUrl && (
                            <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-brand-green hover:text-brand-green hover:bg-brand-green/10"
                                aria-label="GitHub"
                            >
                                <Github className="h-4 w-4" />
                            </a>
                        )}
                        {href !== "#" && (
                            <a
                                href={href}
                                target={isExternal ? "_blank" : undefined}
                                rel={isExternal ? "noreferrer" : undefined}
                                onClick={(e) => e.stopPropagation()}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-brand-green hover:text-brand-green hover:bg-brand-green/10"
                                aria-label={t.common.viewProject}
                            >
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Description */}
                {description && (
                    <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3 mb-4">
                        {description}
                    </p>
                )}

                {/* Tech tags */}
                {allTechs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {allTechs.slice(0, 5).map((tech, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                                {tech}
                            </span>
                        ))}
                        {allTechs.length > 5 && (
                            <span className="inline-flex items-center rounded-full bg-brand-green/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-green">
                                +{allTechs.length - 5}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Tech overlay */}
            <AnimatePresence>
                {showTool && (
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-brand-green to-brand-medium p-8"
                    >
                        <button
                            onClick={() => setShowTool(false)}
                            aria-label={t.assistant.close}
                            className="absolute right-4 top-4 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h4 className="mb-6 font-poiret text-2xl font-bold text-white">
                            {t.projects.technologies}
                        </h4>

                        <div className="flex max-w-md flex-wrap justify-center gap-2.5">
                            {allTechs.map((tech, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: reduce ? 0 : i * 0.04 }}
                                    className="rounded-full border border-white/30 bg-white/15 px-4 py-2 font-mono text-xs uppercase tracking-wide text-white"
                                >
                                    {tech}
                                </motion.span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.article>
    );
};

export default ProjectCard;
