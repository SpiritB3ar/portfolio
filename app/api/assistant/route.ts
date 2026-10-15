import { NextRequest, NextResponse } from "next/server";
import { fail, ok, serverError, parseBody } from "@/lib/api";
import { assistantSchema } from "@/lib/validators";
import { buildSystemMessage } from "@/lib/ai/profile-context";
import { isRetryableAssistantError } from "@/lib/ai/gemini";
import {
    buildReplyCacheKey,
    getCachedReply,
    setCachedReply,
} from "@/lib/ai/reply-cache";
import { getProvider } from "@/lib/ai/provider";
import { isRateLimited } from "@/lib/ai/rate-limit";
import type { ChatMessage } from "@/lib/ai/types";
import type { AIProvider } from "@/lib/ai/types";

/** The full chain (primary retries + fallback + cache) can take a while. */
export const maxDuration = 60;

/**
 * Server-Sent Events reply: `data: {"delta":"…"}` chunks + `data: [DONE]`.
 * Auth/rate-limit/validation errors are returned as JSON BEFORE the stream
 * starts; mid-stream failures send `data: {"error":"upstream"}` instead.
 * Streaming bypasses the reply cache (partials can't be cached).
 */
function streamReply(provider: AIProvider, messages: ChatMessage[]): Response {
    const encoder = new TextEncoder();
    const send = (payload: string) => encoder.encode(`data: ${payload}\n\n`);
    const readable = new ReadableStream<Uint8Array>({
        async start(controller) {
            try {
                if (provider.stream) {
                    for await (const delta of provider.stream(messages)) {
                        controller.enqueue(send(JSON.stringify({ delta })));
                    }
                } else {
                    const reply = await provider.chat(messages);
                    controller.enqueue(send(JSON.stringify({ delta: reply })));
                }
                controller.enqueue(send("[DONE]"));
                controller.close();
            } catch (error) {
                console.error("Assistant stream failed", error);
                controller.enqueue(send(JSON.stringify({ error: "upstream" })));
                controller.close();
            }
        },
    });
    return new Response(readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}

/**
 * POST /api/assistant — recruiter Q&A (Fase 1: Gemini + RAG).
 * Body: { messages: [{role, content}...], lang: 'en'|'es' }.
 * The server prepends the grounded system prompt built from Prisma,
 * so the model only answers from real profile data.
 *
 * Resilience cascade: primary model (retries) → fallback model →
 * last-resort reply cache → 503/500.
 */
export async function POST(request: NextRequest) {
    // Declared outside try so the catch block can serve the cached reply
    // for this exact question as a last resort.
    let cacheKey: string | null = null;
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

        const providerName = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();
        if (providerName !== "cloudflare" && !process.env.GEMINI_API_KEY) {
            return fail(503, "Assistant is not configured yet. Please contact via the links on this page.");
        }

        const system = await buildSystemMessage(data.lang ?? "en", data.mode ?? "chat");
        const messages: ChatMessage[] = [system, ...data.messages];

        const provider = getProvider();
        if (data.stream) {
            return streamReply(provider, messages);
        }
        cacheKey = buildReplyCacheKey(data.lang ?? "en", data.messages);

        const reply = await provider.chat(messages);

        if (cacheKey) {
            setCachedReply(cacheKey, reply, provider.usedModelId ?? provider.modelId);
        }
        return ok({
            reply,
            model: provider.usedModelId ?? provider.modelId,
        });
    } catch (error) {
        // Upstream auth/quota errors → 502 with a safe message (config
        // problems are never masked by the cache).
        const message = error instanceof Error ? error.message : "";
        if (/API_KEY|401|403|PERMISSION_DENIED/i.test(message)) {
            console.error("Assistant upstream auth error", error);
            return NextResponse.json(
                { message: "Assistant is temporarily unavailable. Please try again later." },
                { status: 502 }
            );
        }
        // Last resort: the whole model chain failed — serve the stored
        // reply for the same question when one exists.
        if (cacheKey) {
            const hit = getCachedReply(cacheKey);
            if (hit) {
                console.warn("Assistant serving cached reply (upstream down)", {
                    model: hit.model,
                });
                return ok({ reply: hit.reply, model: hit.model, cached: true });
            }
        }
        // Transient overload/timeout → 503 so the client can auto-retry
        // with backoff; rest → 500.
        if (isRetryableAssistantError(error)) {
            console.error("Assistant transient upstream error (chain exhausted)", error);
            return NextResponse.json(
                { message: "Assistant is overloaded right now. Please try again in a few seconds." },
                { status: 503 }
            );
        }
        return serverError(error, "Failed to generate assistant reply");
    }
}
