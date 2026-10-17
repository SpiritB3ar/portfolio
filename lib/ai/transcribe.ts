/**
 * Speech-to-text for the assistant's dictation fallback. Server only —
 * never import from client code.
 *
 * Browsers whose Web Speech API has no recognizer behind it (Edge with
 * Windows' "online speech recognition" off, Firefox, iOS Safari) record a
 * clip with MediaRecorder and post it to /api/transcribe, which runs Whisper
 * on Workers AI through the `AI` binding — same provider/binding as the chat.
 *
 * The binding is resolved lazily per request through `getCloudflareContext()`,
 * so this module is safe to import anywhere server-side (`next dev` without
 * the binding throws a handled error instead of crashing the build).
 */

const MODEL = "@cf/openai/whisper-large-v3-turbo";

/** Whisper expects an ISO language code; our UI only speaks en/es. */
const LANGUAGE: Record<string, string> = { en: "en", es: "es" };

/**
 * btoa over a large buffer: spread of a typed array isn't allowed under this
 * project's `target: es5`, so convert chunks to real arrays first, and keep
 * each chunk small enough for the argument limit.
 */
function toBase64(bytes: Uint8Array): string {
    let binary = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + CHUNK)));
    }
    return btoa(binary);
}

/**
 * Transcribe an audio clip (webm/opus, mp4, ogg…) to plain text.
 * Returns "" when the clip holds no recognizable speech.
 */
export async function transcribeAudio(audio: Uint8Array, lang: string): Promise<string> {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext();
    const ai = (env as unknown as { AI?: Ai }).AI;
    if (!ai) {
        throw new Error("Cloudflare AI binding is not configured (missing `AI` in env)");
    }

    // The two Whisper builds disagree on the output shape: large-v3-turbo
    // nests the text under transcription_info, the older one exposes it flat.
    const result = (await ai.run(MODEL, {
        audio: toBase64(audio),
        language: LANGUAGE[lang] ?? "en",
        task: "transcribe",
    })) as { text?: string; transcription_info?: { text?: string } };

    return (result.transcription_info?.text ?? result.text ?? "").trim();
}
