import type { AIProvider, ChatMessage } from "./types";

/**
 * Cloudflare Workers AI provider. Server only — never import from client code.
 *
 * Runs on Cloudflare Workers via the `AI` binding (wrangler.jsonc) instead of
 * an external API key. Default model: Llama 3.3 70B Instruct. Override with
 * CLOUDFLARE_AI_MODEL (any Workers AI text-generation model id).
 *
 * The binding is resolved lazily per request through
 * `getCloudflareContext()`, so this module is safe to import anywhere
 * server-side (local `next dev` without the binding falls back to Gemini
 * via the provider factory — it never constructs this class).
 */

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

export function getCloudflareModelId(): string {
    return process.env.CLOUDFLARE_AI_MODEL?.trim() || DEFAULT_MODEL;
}

interface WorkersAIMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export class CloudflareProvider implements AIProvider {
    readonly modelId: string;
    usedModelId?: string;

    constructor() {
        this.modelId = getCloudflareModelId();
    }

    private toWorkersMessages(messages: ChatMessage[]): WorkersAIMessage[] {
        return messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
            content: m.content,
        }));
    }

    private async getBinding(): Promise<Ai> {
        // Lazy import: @opennextjs/cloudflare only resolves on Workers.
        const { getCloudflareContext } = await import("@opennextjs/cloudflare");
        const { env } = await getCloudflareContext();
        const ai = (env as unknown as { AI?: Ai }).AI;
        if (!ai) {
            throw new Error("Cloudflare AI binding is not configured (missing `AI` in env)");
        }
        return ai;
    }

    async chat(messages: ChatMessage[]): Promise<string> {
        const ai = await this.getBinding();
        const response = (await ai.run(this.modelId, {
            messages: this.toWorkersMessages(messages),
            temperature: 0.3,
            max_tokens: 1024,
        })) as { response?: string };
        const text = response.response?.trim();
        if (!text) throw new Error("Empty response from Workers AI");
        this.usedModelId = this.modelId;
        return text;
    }

    /**
     * Token streaming. Workers AI already returns SSE
     * (`data: {"response":"…"}`); each line is re-emitted as a raw delta.
     */
    async *stream(messages: ChatMessage[]): AsyncIterable<string> {
        const ai = await this.getBinding();
        this.usedModelId = this.modelId;
        const sse = (await ai.run(this.modelId, {
            messages: this.toWorkersMessages(messages),
            temperature: 0.3,
            max_tokens: 1024,
            stream: true,
        })) as unknown as ReadableStream<Uint8Array>;

        const reader = sse.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            let idx: number;
            while ((idx = buf.indexOf("\n")) >= 0) {
                const line = buf.slice(0, idx).trim();
                buf = buf.slice(idx + 1);
                if (!line.startsWith("data:")) continue;
                const payload = line.slice(5).trim();
                if (payload === "[DONE]") return;
                try {
                    const evt = JSON.parse(payload) as { response?: string; error?: string };
                    if (evt.error) throw new Error(`Workers AI error: ${evt.error}`);
                    if (evt.response) yield evt.response;
                } catch (e) {
                    if (e instanceof Error && e.message.startsWith("Workers AI error")) throw e;
                    // Ignore malformed frames; the stream continues.
                }
            }
        }
    }
}
