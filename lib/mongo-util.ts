import db from "./db";

/**
 * Prisma 8 Mongo documents expose the storage id as `_id` (and readonly
 * arrays); the rest of the app (pages, admin UI, public JSON) uses `id` and
 * mutable arrays. These helpers normalize the boundary so no consumer has
 * to change.
 */
type MutableArrays<T> = {
    [K in keyof T]: T[K] extends readonly (infer U)[] ? U[] : T[K];
};

export type PublicDoc<T extends { _id: string }> = Omit<MutableArrays<T>, "_id"> & { id: string };

export function withId<T extends { _id: string }>(doc: T): PublicDoc<T> {
    const { _id, ...rest } = doc;
    const out: Record<string, unknown> = { ...rest, id: _id };
    for (const key of Object.keys(out)) {
        const value = out[key];
        if (Array.isArray(value)) out[key] = [...value];
    }
    return out as PublicDoc<T>;
}

export function withIds<T extends { _id: string }>(docs: readonly T[]): Array<PublicDoc<T>> {
    return docs.map(withId);
}

type ProjectLike = { _id: string; toolIDs: readonly string[] };

/** App-level join for Project ↔ ProjectTool (v8 PSL has no array M2M). */
export async function attachTools<P extends ProjectLike>(projects: readonly P[]) {
    const tools = await db.orm.ProjectTool.all();
    const byId = new Map(tools.map((t) => [t._id, t] as const));
    return projects.map((p) => ({
        ...withId(p),
        tools: p.toolIDs.flatMap((id) => {
            const t = byId.get(id);
            return t ? [withId(t)] : [];
        }),
    }));
}
