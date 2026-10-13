import React from 'react'
import ProjectCard from '../components/ProjectCard'
import { getProjectsV2 } from '../requests/requests'
import { ProjectsHeader } from '../components/ProjectsHeader'
import { serverT } from '../lib/server-i18n'

const Projects = async () => {
    const t = serverT()
    const projects = await getProjectsV2()

    // Compute dynamic stats
    const totalProjects = projects?.length || 0;
    const allTechs = new Set<string>();
    const allCategories = new Set<string>();
    projects?.forEach(p => {
        (p.technologies || []).forEach(tech => allTechs.add(tech));
        (p.tools || []).forEach(tool => { if (tool?.name) allTechs.add(tool.name); });
        if (p.category) allCategories.add(p.category);
    });

    const stats = [
        { value: `${totalProjects}`, label: t.projects.statProjects },
        { value: `${allTechs.size}+`, label: t.projects.technologies },
        { value: `${allCategories.size}`, label: t.projects.statCategories },
        { value: '4+', label: t.projects.statYears },
    ];

    return (
        <div className="space-y-14 sm:space-y-16">
            {/* Hero */}
            <ProjectsHeader />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-y-8 md:grid-cols-4 md:divide-x md:divide-border">
                {stats.map((stat) => (
                    <div key={stat.label} className="px-2 text-center md:px-6">
                        <p className="text-2xl font-bold text-foreground sm:text-3xl">{stat.value}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Projects Grid */}
            <div className="space-y-8">
                <div className="flex items-end justify-between">
                    <div className="flex items-center gap-4">
                        <span className="h-px w-12 bg-border" />
                        <h2 className="font-poiret text-3xl font-bold text-foreground sm:text-4xl">
                            {t.projects.allTitle}
                        </h2>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                        {totalProjects} {t.projects.countLabel}
                    </p>
                </div>

                {projects && projects.length > 0 && (
                    <ProjectCard project={projects[0]} index={0} isNew featured />
                )}

                {projects && projects.length > 1 && (
                    <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
                        {projects.slice(1).map((item, i) => (
                            <ProjectCard key={item.id || i + 1} project={item} index={i + 1} />
                        ))}
                    </div>
                )}

                {totalProjects === 0 && (
                    <div className="rounded-2xl border border-dashed border-border py-16 text-center">
                        <p className="text-muted-foreground">{t.projects.empty}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Projects
