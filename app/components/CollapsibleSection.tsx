"use client";
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    subtitle?: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

export const CollapsibleSection = ({ title, subtitle, defaultOpen = false, children }: CollapsibleSectionProps) => {
    const [open, setOpen] = useState(defaultOpen);
    const reduce = useReducedMotion();

    return (
        <section className="border-t border-border">
            <h2>
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    className="focus-ring group flex w-full items-center justify-between gap-4 py-5 text-left sm:py-6"
                >
                    <span className="min-w-0">
                        <span className="block text-lg font-bold text-foreground sm:text-xl">{title}</span>
                        {subtitle && <span className="mt-0.5 block text-sm font-normal text-muted-foreground">{subtitle}</span>}
                    </span>
                    <motion.span
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: reduce ? 0 : 0.3, ease: [0.21, 0.6, 0.35, 1] }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-brand-green/40 group-hover:text-brand-green"
                    >
                        <ChevronDown className="h-4 w-4" />
                    </motion.span>
                </button>
            </h2>

            <div
                className={`grid transition-[grid-template-rows] ${reduce ? '' : 'duration-300 ease-out'} ${
                    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
            >
                <div className="overflow-hidden">
                    <motion.div
                        initial={false}
                        animate={{ opacity: open ? 1 : 0 }}
                        transition={{ duration: reduce ? 0 : 0.25 }}
                        aria-hidden={!open}
                        className="pb-10 pt-2 sm:pb-12"
                    >
                        {children}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
