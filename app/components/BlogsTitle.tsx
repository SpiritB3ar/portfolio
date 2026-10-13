"use client";
import { useLanguage } from '../providers/LanguageProvider';
import { PageHeader } from './PageHeader';

export const BlogsTitle = () => {
    const { t } = useLanguage();

    return <PageHeader title={t.blogs.title} />;
};
