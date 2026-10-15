"use client";
import { BlogType } from "./types/types";
import { ExternalLink, Calendar, Clock } from "lucide-react";
import { useLanguage } from "../providers/LanguageProvider";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

export const BlogCard = ({ blog }: { blog: BlogType }) => {
    const { t } = useLanguage();
    const reduce = useReducedMotion();

    return (
        <motion.a
            href={blog.link}
            target="_blank"
            rel="noreferrer"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            whileTap={{ scale: 0.99 }}
            className="focus-ring group relative block h-[420px] w-full overflow-hidden rounded-2xl border border-border transition-colors duration-300 hover:border-brand-green/40"
        >
            {/* Background Image */}
            <div className="absolute inset-0">
                <Image
                    src={blog.cover || '/placeholder-blog.jpg'}
                    alt={blog.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
                {/* Cinematic teal grade */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#03100E]/95 via-[#03100E]/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-between p-6">
                {/* Top Badge */}
                <div className="flex justify-end">
                    <div className="rounded-full border border-white/20 bg-black/40 px-3 py-1.5">
                        <span className="font-mono text-[10px] uppercase tracking-wide text-white/90">{t.resources.types.article}</span>
                    </div>
                </div>

                {/* Bottom Content */}
                <div className="space-y-4">
                    <h2 className="line-clamp-2 font-poiret text-xl font-bold leading-tight text-white md:text-2xl">
                        {blog.title}
                    </h2>

                    <div className="flex items-center gap-4 font-mono text-[11px] text-white/70">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            {blog.createdAt && (
                                <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>5 {t.resources.minRead}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-brand-light">
                            {t.common.readMore}
                        </span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 transition-colors duration-300 group-hover:border-brand-green group-hover:bg-brand-green">
                            <ExternalLink className="h-5 w-5 text-white transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white dark:group-hover:text-background" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.a>
    );
};
