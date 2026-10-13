"use client";
import { useLanguage } from '../providers/LanguageProvider';
import { PageHeader } from './PageHeader';

export const ExperienceTitle = () => {
    const { t } = useLanguage();

    return <PageHeader title={t.experience.title} subtitle={t.experience.pageSubtitle} />;
};
