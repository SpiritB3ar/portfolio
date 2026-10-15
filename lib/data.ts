import db from "./db";

export const getHomeData = () => db.userDetail.findFirst();

export const getSocialLinks = () => db.userSocialLink.findMany();

export const getProjects = () =>
  db.project.findMany({
    include: { tools: true },
    orderBy: { publishedAt: "desc" },
  });

export const getAboutParagraphs = () =>
  db.aboutContent.findMany({ orderBy: { createdAt: "asc" } });

export const getSkillCategories = () =>
  db.skillCategory.findMany({
    include: { skills: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });

export const getExperiences = () =>
  db.experience.findMany({ include: { inputs: true }, orderBy: { startDate: "desc" } });

export const getEducations = () =>
  db.education.findMany({ orderBy: { startDate: "desc" } });
