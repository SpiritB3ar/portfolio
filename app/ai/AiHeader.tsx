"use client";
import { Bot } from 'lucide-react';
import { useLanguage } from '../providers/LanguageProvider';
import { PageHeader } from '../components/PageHeader';

export const AiHeader = () => {
    const { t } = useLanguage();

    return (
        <div>
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/15 text-brand-medium dark:text-brand-green">
                <Bot size={24} />
            </div>
            <PageHeader
                title={t.ai.title}
                subtitle={t.ai.subtitle}
            />
        </div>
    );
};
