import { GoogleGenAI } from "@google/genai";
import type { AIProvider, ChatMessage } from "./types";

/**
 * Gemini provider (Fase 1). Server only — never import from client code.
 * Model default: gemini-3.8-flash. Override with ASSISTANT_MODEL.
 */

const DEFAULT_MODEL = "gemini-3.8-flash";

export function getGeminiModelId(): string {
    return process.env.ASSISTANT_MODEL?.trim() || DEFAULT_MODEL;
}

export class GeminiProvider implements AIProvider {
    readonly modelId: string;
    private client: GoogleGenAI;

    constructor(apiKey?: string) {
        const key = apiKey ?? process.env.GEMINI_API_KEY;
        if (!key) throw new Error("GEMINI_API_KEY is not configured");
        this.modelId = getGeminiModelId();
        this.client = new GoogleGenAI({ apiKey: key });
    }

    async chat(messages: ChatMessage[]): Promise<string> {
        const system = messages.find((m) => m.role === "system")?.content;
        const history = messages.filter((m) => m.role !== "system");

        const contents = history.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

        const response = await this.client.models.generateContent({
            model: this.modelId,
            contents,
            config: {
                ...(system ? { systemInstruction: system } : {}),
                temperature: 0.3,
                maxOutputTokens: 1024,
            },
        });

        const text = response.text?.trim();
        if (!text) throw new Error("Empty response from Gemini");
        return text;
    }
}
