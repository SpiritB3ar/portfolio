"use client"
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useLanguage } from '../providers/LanguageProvider';
import { Locale } from '../lib/dictionary';
import { EducationType } from './types/types';

interface EducationTimelineProps {
    educations: EducationType[];
}

const formatDate = (date: Date, lang: Locale) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const locale = lang === 'es' ? es : enUS;
    const formatted = format(d, 'MMM yyyy', { locale });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const EducationTimeline = ({ educations }: EducationTimelineProps) => {
    const reduce = useReducedMotion();
    const { lang, t } = useLanguage();

    if (!educations || educations.length === 0) return null;

    return (
        <div className="divide-y divide-border border-y border-border">
            {educations.map((item, index) => {
                const start = formatDate(item.startDate, lang);
                const end = item.endDate ? formatDate(item.endDate, lang) : t.common.present;
                return (
                    <motion.div
                        key={item.id}
                        initial={reduce ? false : { opacity: 0, y: 12 }}
                        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.4, delay: index * 0.06, ease: [0.21, 0.6, 0.35, 1] }}
                        className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-6"
                    >
                        <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold text-foreground">{item.institution}</h3>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {item.degree}
                                {item.field && <> {t.experience.inField} {item.field}</>}
                            </p>
                        </div>
                        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.15em] text-brand-medium dark:text-brand-green">
                            {start} · {end}
                        </span>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default EducationTimeline;
