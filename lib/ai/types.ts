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

/** Conversation mode: free Q&A or mock technical interview. */
export type AssistantMode = "chat" | "interview";

/** POST /api/assistant request body. */
export interface AssistantRequest {
    messages: ChatMessage[];
    lang: AssistantLang;
    stream?: boolean;
    mode?: AssistantMode;
}

/** POST /api/assistant success body. `cached` is true when the reply
 *  comes from the in-memory fallback cache (upstream was down). */
export interface AssistantResponse {
    reply: string;
    model: string;
    cached?: boolean;
}

/** Minimal provider contract — implemented by lib/ai/gemini.ts today,
 *  lib/ai/cloudflare.ts in Fase 4. */
export interface AIProvider {
    readonly modelId: string;
    /** Model that actually produced the last reply (differs from modelId
     *  when a fallback model was used). Set on success, undefined before. */
    usedModelId?: string;
    chat(messages: ChatMessage[]): Promise<string>;
    /** Token streaming (optional). Falls back to `chat` when absent. */
    stream?(messages: ChatMessage[]): AsyncIterable<string>;
}
