import { GoogleGenAI } from "@google/genai";
import type { AIProvider, ChatMessage } from "./types";

/**
 * Gemini provider (Fase 1). Server only — never import from client code.
 * Model default: gemini-3.8-flash. Override with ASSISTANT_MODEL.
 * Fallback chain: ASSISTANT_MODEL → ASSISTANT_FALLBACK_MODEL (if set).
 */

const DEFAULT_MODEL = "gemini-3.8-flash";
const DEFAULT_FALLBACK_MODEL = "gemini-3.8-flash-lite";

/** Total attempts (1 initial + retries) for transient upstream failures. */
const MAX_ATTEMPTS = Math.max(
    1,
    Number.parseInt(process.env.ASSISTANT_MAX_ATTEMPTS ?? "3", 10) || 3
);

/** Attempts per fallback model (smaller budget — the primary already tried). */
const FALLBACK_ATTEMPTS = 2;

/** Per-attempt timeout in ms — aborta el intento para reintentar. */
const ATTEMPT_TIMEOUT_MS = Math.max(
    1000,
    Number.parseInt(process.env.ASSISTANT_TIMEOUT_MS ?? "20000", 10) || 20000
);

/** Base backoff in ms — espera 800ms, 1600ms, 3200ms… + jitter. */
const BACKOFF_BASE_MS = 800;

/**
 * True for transient upstream failures worth retrying: overload (503),
 * rate limit (429), gateway errors (502/504) y timeouts de red.
 * Auth errors (401/403) y 400s NO son reintentables.
 */
export function isRetryableAssistantError(error: unknown): boolean {
    const status =
        typeof (error as { status?: unknown })?.status === "number"
            ? (error as { status: number }).status
            : undefined;
    if (status !== undefined) {
        if ([429, 500, 502, 503, 504].includes(status)) return true;
        // 4xx (salvo 429) = error del cliente/auth → no reintentar.
        if (status >= 400 && status < 500) return false;
    }
    const message = error instanceof Error ? error.message : String(error ?? "");
    return /UNAVAILABLE|RESOURCE_EXHAUSTED|overload|high demand|try again later|temporar|timeout|timed out|ETIMEDOUT|ECONNRESET|ENOTFOUND|EAI_AGAIN|fetch failed|network|deadline exceeded|socket hang up|empty response|429|50[0234]/i.test(
        message
    );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function getGeminiModelId(): string {
    return process.env.ASSISTANT_MODEL?.trim() || DEFAULT_MODEL;
}

/** Fallback model tried when the primary is overloaded. Empty = disabled. */
export function getFallbackModelId(): string {
    const raw = process.env.ASSISTANT_FALLBACK_MODEL;
    // Unset → default lite sibling; explicit empty string → disabled.
    if (raw === undefined) return DEFAULT_FALLBACK_MODEL;
    return raw.trim();
}

export class GeminiProvider implements AIProvider {
    readonly modelId: string;
    readonly fallbackModelId: string;
    usedModelId?: string;
    private client: GoogleGenAI;

    constructor(apiKey?: string) {
        const key = apiKey ?? process.env.GEMINI_API_KEY;
        if (!key) throw new Error("GEMINI_API_KEY is not configured");
        this.modelId = getGeminiModelId();
        this.fallbackModelId = getFallbackModelId();
        this.client = new GoogleGenAI({ apiKey: key });
    }

    async chat(messages: ChatMessage[]): Promise<string> {

        const system = messages.find((m) => m.role === "system")?.content;
        const history = messages.filter((m) => m.role !== "system");

        const contents = history.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

        const chain = [this.modelId];
        if (this.fallbackModelId && this.fallbackModelId !== this.modelId) {
            chain.push(this.fallbackModelId);
        }

        let lastError: unknown = null;
        for (let index = 0; index < chain.length; index++) {
            const model = chain[index];
            const attempts = index === 0 ? MAX_ATTEMPTS : FALLBACK_ATTEMPTS;
            for (let attempt = 1; attempt <= attempts; attempt++) {
                try {
                    const response = await this.client.models.generateContent({
                        model,
                        contents,
                        config: {
                            ...(system ? { systemInstruction: system } : {}),
                            temperature: 0.3,
                            maxOutputTokens: 1024,
                            abortSignal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
                        },
                    });

                    const text = response.text?.trim();
                    if (!text) throw new Error("Empty response from Gemini");
                    this.usedModelId = model;
                    if (index > 0) {
                        console.warn(`Assistant served by fallback model "${model}"`);
                    }
                    return text;
                } catch (error) {
                    lastError = error;
                    // Non-transient (auth, 404, bad request) → fail fast, no fallback.
                    if (!isRetryableAssistantError(error)) throw error;
                    if (attempt === attempts) {
                        console.warn(
                            `Assistant model "${model}" exhausted ${attempts} attempt(s), trying next`,
                            error
                        );
                        break;
                    }
                    const backoff =
                        BACKOFF_BASE_MS * 2 ** (attempt - 1) +
                        Math.floor(Math.random() * 250);
                    console.warn(
                        `Assistant ${model} attempt ${attempt}/${attempts} failed (retryable), retrying in ${backoff}ms`,
                        error
                    );
                    await sleep(backoff);
                }
            }
        }
        throw lastError instanceof Error
            ? lastError
            : new Error("Assistant request failed after retries");
    }

    /**
     * Token streaming (primary model only — no fallback chain mid-stream).
     * Yields RAW chunk text; the caller concatenates. Throws before the
     * first chunk on failure so the route can answer 500/503 instead.
     */
    async *stream(messages: ChatMessage[]): AsyncIterable<string> {
        const system = messages.find((m) => m.role === "system")?.content;
        const history = messages.filter((m) => m.role !== "system");

        const contents = history.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

        this.usedModelId = this.modelId;
        const response = await this.client.models.generateContentStream({
            model: this.modelId,
            contents,
            config: {
                ...(system ? { systemInstruction: system } : {}),
                temperature: 0.3,
                maxOutputTokens: 1024,
            },
        });

        for await (const chunk of response) {
            const text = chunk.text;
            if (text) yield text;
        }
    }
}
