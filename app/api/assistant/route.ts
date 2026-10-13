import { NextRequest, NextResponse } from "next/server";
import { fail, ok, serverError, parseBody } from "@/lib/api";
import { assistantSchema } from "@/lib/validators";
import { buildSystemMessage } from "@/lib/ai/profile-context";
import { getProvider } from "@/lib/ai/provider";
import { isRateLimited } from "@/lib/ai/rate-limit";
import type { ChatMessage } from "@/lib/ai/types";

/**
 * POST /api/assistant — recruiter Q&A (Fase 1: Gemini + RAG).
 * Body: { messages: [{role, content}...], lang: 'en'|'es' }.
 * The server prepends the grounded system prompt built from Prisma,
 * so the model only answers from real profile data.
 */
export async function POST(request: NextRequest) {
    try {
        const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            "unknown";
        if (isRateLimited(ip)) {
            return fail(429, "Too many requests. Please wait a minute and try again.");
        }

        const parsed = await parseBody(request, assistantSchema);
        if ("response" in parsed) return parsed.response;
        const { data } = parsed;

        if (!process.env.GEMINI_API_KEY) {
            return fail(503, "Assistant is not configured yet. Please contact via the links on this page.");
        }

        const system = await buildSystemMessage(data.lang ?? "en");
        const messages: ChatMessage[] = [system, ...data.messages];

        const provider = getProvider();
        const reply = await provider.chat(messages);

        return ok({ reply, model: provider.modelId });
    } catch (error) {
        // Upstream auth/quota errors → 502 with a safe message; rest → 500.
        const message = error instanceof Error ? error.message : "";
        if (/API_KEY|401|403|PERMISSION_DENIED/i.test(message)) {
            console.error("Assistant upstream auth error", error);
            return NextResponse.json(
                { message: "Assistant is temporarily unavailable. Please try again later." },
                { status: 502 }
            );
        }
        return serverError(error, "Failed to generate assistant reply");
    }
}
