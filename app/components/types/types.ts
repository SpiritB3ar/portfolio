export interface HomeDataType {
    welcomeTitle: string
    welcomeNote: string
    welcomeDescription: string
    cvFile: string | null
    userImage: string
}

export interface SocialLinkType {
    name: string,
    link: string,
    icon: string
}

export interface AboutType {
    paragraph: string,
}

export interface ExperienceType {
    inputs: ExperienceInput[];
    image: string;
    title: string;
    name: string;
    company?: string;
    description?: string;
    location?: string;
    technologies?: string[];
    start: string;
    end: string;
}

interface ExperienceInput {
    id: string;
    content: string;
    experienceId: string;
    createdAt: string;
    updatedAt: string;
}


export interface ProjectType {
    id: string
    tools: { name: string }[]
    technologies: string[]
    title: string
    about?: string | null
    description?: string | null
    cover: string | null
    coverImage?: string
    link: string | null
    liveUrl?: string | null
    githubUrl?: string | null
    category?: string | null
    slug: string
    publishedAt?: Date | null
}

export interface BlogType {
    title: string
    cover: string
    link: string
    createdAt?: Date
}

export type ResourceCategoryType = {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export type SkillCategoryType = {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    order: number;
    skills?: SkillType[];
    createdAt: Date;
    updatedAt: Date;
};

export type SkillType = {
    id: string;
    name: string;
    slug: string;
    proficiency: number;
    categoryId: string;
    category?: SkillCategoryType;
    order: number;
    createdAt: Date;
    updatedAt: Date;
};

export type ResourceType = {
    id: string;
    title: string;
    slug: string;
    description: string;
    content: string;
    coverImage: string;
    link?: string | null;
    type: 'Article' | 'Video' | 'Ebook' | 'Tutorial' | 'Tool' | 'Case Study';
    category: ResourceCategoryType;
    tags: string[];
    author: string;
    publishedAt: Date;
    readTimeMinutes?: number | null;
    createdAt: Date;
    updatedAt: Date;
};

export type EducationType = {
    id: string;
    institution: string;
    degree: string;
    field: string;
    slug: string;
    startDate: Date;
    endDate?: Date | null;
    order: number;
    createdAt: Date;
    updatedAt: Date;
};

export type AssistantChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

export type AssistantReply = {
    reply: string;
    model: string;
};