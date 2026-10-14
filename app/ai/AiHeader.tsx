"use client";
import { useLanguage } from '../providers/LanguageProvider';
import { PageHeader } from '../components/PageHeader';

export const AiHeader = () => {
    const { t } = useLanguage();

    return (
        <PageHeader
            title={t.ai.title}
            subtitle={t.ai.subtitle}
        />
    );
};
