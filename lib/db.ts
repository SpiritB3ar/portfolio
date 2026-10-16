import mongo from "@prisma/orm-mongo/runtime";
import type { Contract } from "../prisma/contract";
import contractJson from "../prisma/contract.json" with { type: "json" };

function createClient() {
    return mongo<Contract>({
        contractJson,
        url: process.env.DATABASE_URL!,
    });
}

type MongoClient = ReturnType<typeof createClient>;

// Singleton across HMR (same pattern as the Prisma 6 client before).
declare global {
    var __mongoClient: MongoClient | undefined;
}

const db = globalThis.__mongoClient ?? createClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.__mongoClient = db;
}

export default db;
