"use client";
import React from 'react';
import { AboutType, SkillCategoryType } from './types/types';
import Skillbar from './Skillbar';
import { Mail, MapPin, Briefcase, Calendar, Code2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../providers/LanguageProvider';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { PageHeader } from './PageHeader';

interface ContentType {
    paragraphs: AboutType[]
    skillCategories: SkillCategoryType[]
}

const AboutBody = ({ paragraphs, skillCategories }: ContentType) => {
    const { t } = useLanguage();
    const reduce = useReducedMotion();

    const fade: Variants = {
        hidden: { opacity: 0, y: reduce ? 0 : 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.21, 0.6, 0.35, 1] } }
    };

    const stagger: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
    };

    const quickFacts = [
        { icon: MapPin, label: t.about.factLocationLabel, value: t.about.factLocationValue },
        { icon: Briefcase, label: t.about.factExperienceLabel, value: t.about.factExperienceValue },
        { icon: Code2, label: t.about.factProjectsLabel, value: t.about.factProjectsValue },
        { icon: Calendar, label: t.about.factAvailabilityLabel, value: t.about.factAvailabilityValue },
    ];

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-16 sm:space-y-20"
        >
            {/* Header */}
            <PageHeader
                title={t.about.title}
                subtitle={t.about.subtitle}
            />

            {/* Quick Facts */}
            <motion.div variants={fade}>
                <div className="grid grid-cols-2 gap-y-8 md:grid-cols-4 md:divide-x md:divide-border">
                    {quickFacts.map((fact, index) => (
                        <motion.div
                            key={index}
                            variants={fade}
                            className="px-2 text-center md:px-6"
                        >
                            <fact.icon className="mx-auto mb-2 h-5 w-5 text-brand-green" />
                            <p className="text-lg font-bold text-foreground sm:text-xl">
                                {fact.value}
                            </p>
                            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                {fact.label}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">

                {/* Left Column: Bio */}
                <motion.div variants={fade} className="space-y-6 lg:col-span-3">
                    {/* Bio prose */}
                    <div>
                        {paragraphs.map((item, index) => (
                            <motion.div
                                key={index}
                                variants={fade}
                                className={index > 0 ? "mt-6 border-t border-border pt-6" : ""}
                            >
                                <p className={index === 0
                                    ? "text-xl font-medium leading-relaxed text-foreground sm:text-2xl"
                                    : "text-[15px] leading-relaxed text-muted-foreground sm:text-base"
                                }>
                                    {item.paragraph}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA */}
                    <motion.div
                        variants={fade}
                        className="rounded-2xl border border-border bg-muted p-6 sm:p-8"
                    >
                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
                            <div className="flex-1">
                                <h2 className="font-poiret mb-1 text-xl font-bold text-foreground">
                                    {t.about.ctaTitle}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {t.about.ctaSubtitle}
                                </p>
                            </div>
                            <a
                                href="mailto:cardenascode7@outlook.com"
                                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-green px-6 py-3 font-semibold text-white transition-colors duration-300 hover:bg-brand-medium dark:text-background"
                            >
                                <Mail className="h-4 w-4" />
                                <span>{t.about.sendEmail}</span>
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </a>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Right Column: Skills */}
                <motion.div
                    variants={fade}
                    className="lg:col-span-2"
                >
                    <div className="sticky top-24 overflow-hidden rounded-2xl border border-border bg-card">
                        <Skillbar skillCategories={skillCategories} />
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}

export default AboutBody;
