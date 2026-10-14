"use client";
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../providers/LanguageProvider';
import { SkillCategoryType } from '../components/types/types';

interface AiStackProps {
    aiCategory?: SkillCategoryType | null;
}

export const AiStack = ({ aiCategory }: AiStackProps) => {
    const { t } = useLanguage();
    const reduce = useReducedMotion();
    const skills = (aiCategory?.skills ?? []).slice().sort((a, b) => a.order - b.order);

    return (
        <motion.section
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: [0.21, 0.6, 0.35, 1] }}
            className="space-y-8"
        >
            <div>
                <p className="mb-3 text-sm font-semibold text-foreground">{t.ai.stackLabel}</p>
                <div className="flex flex-wrap gap-2">
                    {t.ai.stack.map((tech) => (
                        <span
                            key={tech}
                            className="inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 font-mono text-xs text-foreground/80"
                        >
                            {tech}
                        </span>
                    ))}
                </div>
            </div>

            {skills.length > 0 && (
                <div>
                    <p className="mb-3 text-sm font-semibold text-foreground">{t.ai.skillsLabel}</p>
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                            <span
                                key={skill.id}
                                className="inline-flex items-center rounded-full border border-brand-green/25 bg-brand-green/10 px-3.5 py-1.5 text-xs font-medium text-brand-medium dark:text-brand-green"
                            >
                                {skill.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </motion.section>
    );
};
