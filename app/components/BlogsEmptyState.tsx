"use client";
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../providers/LanguageProvider';
import { dispatchOpenChat } from './assistant/chat-events';

export const BlogsEmptyState = () => {
    const { t } = useLanguage();
    const reduce = useReducedMotion();

    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.21, 0.6, 0.35, 1] }}
            className="py-16 text-center sm:py-24"
        >
            <p className="mx-auto max-w-md text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                {t.blogs.empty}
            </p>
            <button
                type="button"
                onClick={() => dispatchOpenChat()}
                className="focus-ring group mt-6 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-brand-green/40 hover:text-brand-medium dark:hover:text-brand-green"
            >
                <Sparkles className="h-4 w-4 text-brand-medium dark:text-brand-green" />
                <span>{t.blogs.emptyCta}</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
        </motion.div>
    );
};
