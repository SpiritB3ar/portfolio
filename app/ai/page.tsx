import { getSkillCategoriesV2 } from '../requests/requests';
import { AiHeader } from './AiHeader';
import { AiDemo } from './AiDemo';
import { AiHow } from './AiHow';
import { AiStack } from './AiStack';

const AI_CATEGORY_SLUG = 'ai-machine-learning';

const AI = async () => {
    const skillCategories = await getSkillCategoriesV2();
    const aiCategory = skillCategories?.find(
        (c) => c.slug === AI_CATEGORY_SLUG || c.name.toLowerCase().includes('ai')
    ) ?? null;

    return (
        <div className="flex flex-col">
            <AiHeader />
            <AiDemo />
            <AiHow />
            <AiStack aiCategory={aiCategory} />
        </div>
    );
};

export default AI;
