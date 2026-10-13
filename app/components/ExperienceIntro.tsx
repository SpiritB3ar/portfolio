"use client";
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../providers/LanguageProvider';
import { SkillCategoryType } from './types/types';

interface ExperienceIntroProps {
    aiCategory?: SkillCategoryType | null;
}

export const ExperienceIntro = ({ aiCategory }: ExperienceIntroProps) => {
    const { t } = useLanguage();
    const reduce = useReducedMotion();
    const skills = (aiCategory?.skills ?? []).slice().sort((a, b) => a.order - b.order);

    return (
        <motion.section
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: [0.21, 0.6, 0.35, 1] }}
            className="mb-12 sm:mb-14"
        >
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-brand-medium dark:text-brand-green">
                {t.experience.aiLabel}
            </p>
            <p className="max-w-2xl text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                {t.experience.aiStatement}
            </p>
            {skills.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                        <span
                            key={skill.id}
                            className="inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground/80"
                        >
                            {skill.name}
                        </span>
                    ))}
                </div>
            )}
        </motion.section>
    );
};
