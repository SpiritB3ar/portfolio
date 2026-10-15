import { z } from "zod";

/**
 * Zod request schemas — one per writable resource. Routes validate bodies via
 * `parseBody(request, <schema>)` from `lib/api.ts`. Success/response shapes are
 * unchanged; these only gate and normalize inbound POST/PUT bodies.
 */

/**
 * Accepts a real string[] OR a comma-separated string. Kept as a plain union
 * (no transform) for clean type inference; routes normalize the validated value
 * to `string[]` with `toList()` before persisting.
 */
const stringList = z.union([z.array(z.string()), z.string()]);

/** Normalize a validated string-or-comma-string field to a clean string[]. */
export const toList = (value: string | string[]): string[] =>
    Array.isArray(value)
        ? value
        : value
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);

const nonEmpty = (label: string) => z.string().trim().min(1, `${label} is required`);

// ── Resource ────────────────────────────────────────────────────────────────
export const resourceSchema = z.object({
    title: nonEmpty("title"),
    description: nonEmpty("description"),
    content: nonEmpty("content"),
    coverImage: nonEmpty("coverImage"),
    link: z.string().optional().nullable(),
    type: nonEmpty("type"),
    categoryId: nonEmpty("categoryId"),
    tags: stringList,
    author: nonEmpty("author"),
    publishedAt: z.coerce.date(),
    readTimeMinutes: z.coerce.number().int().optional().nullable(),
});
export type ResourceInput = z.infer<typeof resourceSchema>;

// ── Project ─────────────────────────────────────────────────────────────────
export const projectSchema = z.object({
    title: nonEmpty("title"),
    description: nonEmpty("description"),
    content: nonEmpty("content"),
    coverImage: nonEmpty("coverImage"),
    githubUrl: z.string().optional().nullable(),
    liveUrl: z.string().optional().nullable(),
    category: nonEmpty("category"),
    technologies: stringList,
    publishedAt: z.coerce.date(),
});
export type ProjectInput = z.infer<typeof projectSchema>;

// ── Experience ──────────────────────────────────────────────────────────────
export const experienceSchema = z.object({
    title: nonEmpty("title"),
    company: nonEmpty("company"),
    description: nonEmpty("description"),
    location: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    clientImage: z.string().optional().nullable(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    technologies: stringList,
});
export type ExperienceInput = z.infer<typeof experienceSchema>;

// ── Education ───────────────────────────────────────────────────────────────
export const educationSchema = z.object({
    institution: nonEmpty("institution"),
    degree: nonEmpty("degree"),
    field: nonEmpty("field"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    order: z.coerce.number().int().optional().default(0),
});
export type EducationInput = z.infer<typeof educationSchema>;

// ── Skill ───────────────────────────────────────────────────────────────────
export const skillSchema = z.object({
    name: nonEmpty("name"),
    proficiency: z.coerce.number().int().min(0).max(100),
    categoryId: nonEmpty("categoryId"),
    order: z.coerce.number().int().optional().default(0),
});
export type SkillInput = z.infer<typeof skillSchema>;

// ── Skill category ──────────────────────────────────────────────────────────
export const skillCategorySchema = z.object({
    name: nonEmpty("name"),
    description: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    order: z.coerce.number().int().optional().default(0),
});
export type SkillCategoryInput = z.infer<typeof skillCategorySchema>;

// ── Resource category (shared by /api/categories and /api/resource-categories)
export const resourceCategorySchema = z.object({
    name: nonEmpty("name"),
    description: z.string().optional().nullable(),
});
export type ResourceCategoryInput = z.infer<typeof resourceCategorySchema>;

// ── User detail (home/hero content) ─────────────────────────────────────────
export const userDetailSchema = z.object({
    welcomeTitle: nonEmpty("welcomeTitle"),
    welcomeNote: nonEmpty("welcomeNote"),
    welcomeDescription: nonEmpty("welcomeDescription"),
    cvFile: z.string().optional().nullable(),
    userImage: nonEmpty("userImage"),
});
export type UserDetailInput = z.infer<typeof userDetailSchema>;

// ── Blog (no write endpoint yet — schema kept for the integration doc) ───────
export const blogSchema = z.object({
    title: nonEmpty("title"),
    cover: nonEmpty("cover"),
    link: nonEmpty("link"),
});
export type BlogInput = z.infer<typeof blogSchema>;

// ── Social link (GET/POST /api/user-social-links, GET/PUT/DELETE [id]) ──────
export const socialLinkSchema = z.object({
    name: nonEmpty("name"),
    link: nonEmpty("link"),
    icon: nonEmpty("icon"),
});
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;

// ── About paragraph (GET/POST /api/about-me, GET/PUT/DELETE [id]) ────────────
export const aboutSchema = z.object({
    paragraph: nonEmpty("paragraph"),
});
export type AboutInput = z.infer<typeof aboutSchema>;

// ── Recruiter assistant (Fase 1) ─────────────────────────────────────────────
const assistantMessageSchema = z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(2000),
});

export const assistantSchema = z.object({
    messages: z.array(assistantMessageSchema).min(1).max(20),
    lang: z.enum(["en", "es"]).default("en"),
});
export type AssistantInput = z.infer<typeof assistantSchema>;
