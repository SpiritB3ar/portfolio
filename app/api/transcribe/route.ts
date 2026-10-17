import { NextRequest, NextResponse } from "next/server";
import { fail, ok, serverError } from "@/lib/api";
import { isRateLimited } from "@/lib/ai/rate-limit";
import { transcribeAudio } from "@/lib/ai/transcribe";

/** A short dictation clip transcribes in a couple of seconds. */
export const maxDuration = 30;

/** ~30 s of Opus is a few hundred KB; this bounds upload size and cost. */
const MAX_BYTES = 8 * 1024 * 1024;

/** Below this the clip can't hold decodable speech — don't pay for Whisper. */
const MIN_BYTES = 512;

/**
 * POST /api/transcribe — dictation fallback for browsers whose Web Speech API
 * never starts (Edge, Firefox, iOS Safari). Body: the raw audio clip
 * (`audio/webm`, `audio/mp4`, …); `?lang=en|es` hints the spoken language.
 *
 * Public like /api/assistant (the proxy allowlists it) and rate-limited by IP.
 */
export async function POST(request: NextRequest) {
    try {
        const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        if (isRateLimited(ip)) {
            return fail(429, "Too many requests. Please wait a minute and try again.");
        }

        if (!(request.headers.get("content-type") ?? "").startsWith("audio/")) {
            return fail(415, "Unsupported audio format");
        }

        // A body-less POST (curl, aborted upload) rejects here rather than 500.
        let audio: Uint8Array;
        try {
            audio = new Uint8Array(await request.arrayBuffer());
        } catch {
            return fail(400, "Empty audio");
        }
        if (audio.byteLength === 0) return fail(400, "Empty audio");
        if (audio.byteLength > MAX_BYTES) return fail(413, "Audio clip too long");
        if (audio.byteLength < MIN_BYTES) return fail(422, "No speech detected");

        const lang = request.nextUrl.searchParams.get("lang") === "es" ? "es" : "en";

        let text: string;
        try {
            text = await transcribeAudio(audio, lang);
        } catch (error) {
            // Missing `AI` binding (local `next dev`, misconfigured deploy) is a
            // config problem, not a failure of this request — never a 500.
            if (error instanceof Error && error.message.includes("AI binding")) {
                console.error("Transcription is not configured", error);
                return NextResponse.json(
                    { message: "Voice input is unavailable right now. Please type your question." },
                    { status: 503 }
                );
            }
            // Workers AI throws (instead of returning empty text) on clips it
            // can't decode — a bad upload, not a server bug.
            console.error("Transcription upstream failed", error);
            return fail(502, "Could not transcribe audio");
        }

        if (!text) return fail(422, "No speech detected");
        return ok({ text });
    } catch (error) {
        return serverError(error, "Failed to transcribe audio");
    }
}
