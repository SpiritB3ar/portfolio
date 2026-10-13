/**
 * Shared chat types for the recruiter assistant (Fase 1).
 * Provider-agnostic: both Gemini and a future Cloudflare provider
 * speak this shape so the API route and UI never change.
 */

export type AssistantRole = "system" | "user" | "assistant";

export interface ChatMessage {
    role: AssistantRole;
    content: string;
}

export type AssistantLang = "en" | "es";

/** POST /api/assistant request body. */
export interface AssistantRequest {
    messages: ChatMessage[];
    lang: AssistantLang;
}

/** POST /api/assistant success body. */
export interface AssistantResponse {
    reply: string;
    model: string;
}

/** Minimal provider contract — implemented by lib/ai/gemini.ts today,
 *  lib/ai/cloudflare.ts in Fase 4. */
export interface AIProvider {
    readonly modelId: string;
    chat(messages: ChatMessage[]): Promise<string>;
}
