import db from "./db";
import { attachTools, withId, withIds } from "./mongo-util";

export const getHomeData = async () => {
    const row = (await db.orm.UserDetail.all()).at(0) ?? null;
    return row ? withId(row) : null;
};

export const getSocialLinks = async () => withIds(await db.orm.UserSocialLinks.all());

export const getProjects = async () => {
    const projects = await db.orm.Project.orderBy({ publishedAt: -1 }).all();
    return attachTools(projects);
};

export const getAboutParagraphs = async () =>
    withIds(await db.orm.AboutContent.orderBy({ createdAt: 1 }).all());

export const getSkillCategories = async () => {
    const cats = await db.orm.SkillCategory.include("skills").orderBy({ order: 1 }).all();
    return cats.map((c) => ({
        ...withId(c),
        skills: withIds([...c.skills].sort((a, b) => a.order - b.order)),
    }));
};

export const getExperiences = async () => {
    const exps = await db.orm.Experience.include("inputs").orderBy({ startDate: -1 }).all();
    return exps.map((e) => ({ ...withId(e), inputs: withIds(e.inputs) }));
};

export const getEducations = async () =>
    withIds(await db.orm.Education.orderBy({ startDate: -1 }).all());
