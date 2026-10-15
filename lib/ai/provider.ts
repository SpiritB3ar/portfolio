import type { AIProvider } from "./types";
import { GeminiProvider } from "./gemini";
import { CloudflareProvider } from "./cloudflare";

/**
 * Provider factory. "gemini" (external API key) or "cloudflare"
 * (Workers AI binding, Llama 3.3 70B by default) behind the same
 * AIProvider interface so the route and UI don't change.
 * Select with AI_PROVIDER env var (default: gemini).
 * The Gemini provider itself chains ASSISTANT_MODEL → ASSISTANT_FALLBACK_MODEL.
 */
export function getProvider(): AIProvider {
    const name = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();
    switch (name) {
        case "gemini":
            return new GeminiProvider();
        case "cloudflare":
            return new CloudflareProvider();
        default:
            throw new Error(`Unknown AI_PROVIDER "${name}" (expected "gemini" or "cloudflare")`);
    }
}
