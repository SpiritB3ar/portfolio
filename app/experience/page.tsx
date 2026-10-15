import ExperienceTimeline from '../components/ExperienceTimeline'
import EducationTimeline from '../components/EducationTimeline'
import { ExperiencePathProps } from '../components/ExperienceTimeline'
import { getExperiences, getEducations, getSkillCategories } from '@/lib/data'
import { ExperienceTitle } from '../components/ExperienceTitle'
import { ExperienceIntro } from '../components/ExperienceIntro'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { serverT } from '../lib/server-i18n'

const AI_CATEGORY_SLUG = 'ai-machine-learning'

const Experience = async () => {
    const t = serverT()
    const [experiences, educations, skillCategories] = await Promise.all([
        getExperienceData(),
        getEducations(),
        getSkillCategories()
    ]);

    const aiCategory = skillCategories?.find(
        (c) => c.slug === AI_CATEGORY_SLUG || c.name.toLowerCase().includes('ai')
    ) ?? null

    return (
        <div className="flex flex-col">
            <ExperienceTitle />
            <ExperienceIntro aiCategory={aiCategory} />

            <div className="border-b border-border">
                <CollapsibleSection
                    title={t.experience.journeyTitle}
                    subtitle={t.experience.journeySubtitle}
                    defaultOpen
                >
                    {experiences.length > 0 ? (
                        <ExperienceTimeline experiences={experiences} />
                    ) : (
                        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
                            <p className="text-muted-foreground">{t.experience.empty}</p>
                        </div>
                    )}
                </CollapsibleSection>

                {educations && educations.length > 0 && (
                    <CollapsibleSection
                        title={t.experience.educationTitle}
                        subtitle={t.experience.educationSubtitle}
                    >
                        <EducationTimeline educations={educations} />
                    </CollapsibleSection>
                )}
            </div>
        </div>
    )
}

export default Experience

const getExperienceData = async () => {
    const results = await getExperiences();
    const experiences: ExperiencePathProps[] = []
    for (let i of results) {
        const activities: string[] = []
        if (i.inputs?.length > 0) {
            for (let j of i.inputs) {
                activities.push(j.content)
            }
        }
        experiences.push({
            title: i.company || i.name || '',
            position: i.title,
            cover: i.image ?? '',
            company: i.company ?? undefined,
            description: i.description ?? undefined,
            location: i.location ?? undefined,
            technologies: i.technologies,
            activities,
            startDate: i.startDate,
            endDate: i.endDate ?? undefined
        })
    }

    return experiences;
}
