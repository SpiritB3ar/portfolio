"use client";
import React, { useState, useMemo } from 'react';
import { ResourceCard } from '../components/ResourceCard';
import { ResourceType, ResourceCategoryType } from '../components/types/types';
import { useLanguage } from '../providers/LanguageProvider';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

interface ResourcesContentProps {
    initialResources: ResourceType[];
    categories: ResourceCategoryType[];
}

const FilterPill = ({
    active,
    onClick,
    label,
    count,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    count?: number;
}) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`focus-ring inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium pressable active:scale-95 ${
            active
                ? 'border-brand-green bg-brand-green text-white dark:text-background'
                : 'border-border bg-transparent text-muted-foreground hover:border-brand-green/40 hover:text-foreground'
        }`}
    >
        <span>{label}</span>
        {typeof count === 'number' && (
            <span className={`font-mono text-[10px] tabular-nums ${active ? 'opacity-80' : 'opacity-60'}`}>
                {count}
            </span>
        )}
    </button>
);

const ResourcesContent: React.FC<ResourcesContentProps> = ({ initialResources, categories }) => {
    const { t } = useLanguage();
    const reduce = useReducedMotion();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');

    const resourceTypes = ['Article', 'Video', 'Ebook', 'Tutorial', 'Tool', 'Case Study'];

    const filteredResources = useMemo(() => {
        return initialResources.filter(resource => {
            const matchesCategory = selectedCategory === 'all' || resource.category.id === selectedCategory;
            const matchesType = selectedType === 'all' || resource.type === selectedType;
            return matchesCategory && matchesType;
        });
    }, [initialResources, selectedCategory, selectedType]);

    const counts = useMemo(() => {
        const byCategory: Record<string, number> = {};
        const byType: Record<string, number> = {};
        for (const r of initialResources) {
            byCategory[r.category.id] = (byCategory[r.category.id] ?? 0) + 1;
            byType[r.type] = (byType[r.type] ?? 0) + 1;
        }
        return { byCategory, byType };
    }, [initialResources]);

    const typeLabel = (type: string) =>
        t.resources.types[type.toLowerCase().replace(' ', '') as keyof typeof t.resources.types] || type;

    return (
        <div className="flex flex-col w-full py-8">
            {/* Header Section */}
            <PageHeader
                title={t.resources.title}
                subtitle={t.resources.description}
            />

            {/* Filter Toolbar */}
            <motion.div
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="mb-8 space-y-3"
            >
                <div className="flex flex-wrap gap-2" role="group" aria-label={t.resources.filterByCategory}>
                    <FilterPill
                        active={selectedCategory === 'all'}
                        onClick={() => setSelectedCategory('all')}
                        label={t.resources.allCategories}
                        count={initialResources.length}
                    />
                    {categories.map((category) => (
                        <FilterPill
                            key={category.id}
                            active={selectedCategory === category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            label={category.name}
                            count={counts.byCategory[category.id] ?? 0}
                        />
                    ))}
                </div>

                <div className="flex flex-wrap gap-2" role="group" aria-label={t.resources.filterByType}>
                    <FilterPill
                        active={selectedType === 'all'}
                        onClick={() => setSelectedType('all')}
                        label={t.resources.allTypes}
                    />
                    {resourceTypes.map((type) => (
                        <FilterPill
                            key={type}
                            active={selectedType === type}
                            onClick={() => setSelectedType(type)}
                            label={typeLabel(type)}
                            count={counts.byType[type] ?? 0}
                        />
                    ))}
                </div>

                <h2 className="font-mono text-xs font-normal text-muted-foreground">
                    {filteredResources.length}{' '}
                    {filteredResources.length === 1 ? t.resources.resultsOne : t.resources.resultsMany}
                </h2>
            </motion.div>

            {/* Resources Grid */}
            {filteredResources.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
                >
                    {filteredResources.map((resource, i) => (
                        <motion.div
                            key={resource.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <ResourceCard resource={resource} />
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mx-auto max-w-md rounded-2xl border border-border bg-card p-12 text-center"
                >
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-green/10">
                        <BookOpen className="h-9 w-9 text-brand-green" />
                    </div>
                    <h3 className="mb-2 font-poiret text-2xl font-bold text-foreground">{t.resources.emptyTitle}</h3>
                    <p className="text-muted-foreground">{t.resources.emptyHint}</p>
                </motion.div>
            )}
        </div>
    );
};

export default ResourcesContent;
