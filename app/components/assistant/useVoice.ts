"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

/** Minimal Web Speech API shapes (standard + webkit prefix). */
interface SpeechRecognitionResultItem {
    transcript: string;
}
interface SpeechRecognitionResult {
    length: number;
    isFinal: boolean;
    [index: number]: SpeechRecognitionResultItem | undefined;
}
interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult | undefined;
}
interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
    /** 'not-allowed' | 'no-speech' | 'network' | 'audio-capture' | 'aborted' | … */
    error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start(): void;
    stop(): void;
    abort?(): void;
    onstart: (() => void) | null;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
    onnomatch: (() => void) | null;
}

/** Dictation failure kinds surfaced to the UI (toast). */
export type VoiceErrorKind = "denied" | "no-speech" | "failed" | "unavailable";

/** Mic lifecycle surfaced to the UI. */
export type MicState = "idle" | "listening" | "recording" | "transcribing";

/**
 * How the mic produces text:
 * - `speech`   — live Web Speech API (Chrome: Google's recognizer). Best UX.
 * - `recorder` — record a clip, transcribe server-side with Whisper (/api/transcribe).
 *
 * Edge ships the Web Speech API but with no recognizer behind it unless
 * Windows' "online speech recognition" is enabled — and when it is missing the
 * API fails *silently* (no `onstart`, no `onerror`), leaving the mic stuck on
 * "listening" forever. Firefox and iOS Safari have no usable implementation at
 * all. Recording is the only path that works everywhere, so those browsers get
 * it directly and everyone else falls back to it automatically.
 */
type InputMode = "speech" | "recorder";

/** No `onstart` within this window means the speech backend never came up. */
const SPEECH_WATCHDOG_MS = 1200;
/** Hard cap on a dictation clip (bounds upload size and Whisper cost). */
const RECORD_MAX_MS = 30_000;

const mapRecognitionError = (kind: string | undefined): VoiceErrorKind | null => {
    if (!kind || kind === "aborted") return null; // user stopped it — not an error
    if (kind === "not-allowed" || kind === "service-not-allowed") return "denied";
    if (kind === "no-speech") return "no-speech";
    return "failed";
};
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

const getCtor = (): SpeechRecognitionCtor | null => {
    if (typeof window === "undefined") return null;
    const w = window as unknown as {
        SpeechRecognition?: SpeechRecognitionCtor;
        webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** MediaRecorder + getUserMedia must both exist for the fallback path. */
const hasRecorder = (): boolean =>
    typeof MediaRecorder !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function";

/** Chromium builds that ship the API without a speech recognizer behind it. */
const needsRecorder = (): boolean => /Edg\/|Brave\//.test(navigator.userAgent);

const MIME_CANDIDATES = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
];

const pickMimeType = (): string =>
    MIME_CANDIDATES.find((m) => {
        try {
            return MediaRecorder.isTypeSupported(m);
        } catch {
            return false;
        }
    }) ?? "";

/** Client-only capability probe (never called during SSR). */
const resolveMode = (): InputMode | null => {
    const speech = getCtor() !== null;
    const recorder = hasRecorder();
    if (needsRecorder()) return recorder ? "recorder" : speech ? "speech" : null;
    if (speech) return "speech";
    return recorder ? "recorder" : null;
};

/** Plain text for speech synthesis: strips **bold** and [label](url) → label. */
export const speakable = (md: string): string =>
    md
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1");

/** Voice input (live dictation with recording fallback) + spoken replies. */
export function useVoice(lang: "en" | "es") {
    const recogRef = useRef<SpeechRecognitionInstance | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const abortRef = useRef(false);
    const timersRef = useRef<number[]>([]);

    const [micState, setMicState] = useState<MicState>("idle");
    const [modeOverride, setModeOverride] = useState<InputMode | null>(null);
    const [speakOn, setSpeakOn] = useState(false);
    const [error, setError] = useState<VoiceErrorKind | null>(null);

    // Mounted-only feature detection: avoids SSR/client hydration mismatch.
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );
    const autoMode = useMemo(() => (mounted ? resolveMode() : null), [mounted]);
    const mode = modeOverride ?? autoMode;

    const clearTimers = useCallback(() => {
        timersRef.current.forEach((id) => window.clearTimeout(id));
        timersRef.current = [];
    }, []);

    useEffect(() => clearTimers, [clearTimers]);

    /**
     * Normal stop: a recording is uploaded and transcribed, a dictation session
     * just ends. Aborting (no transcription) is reserved for unmount.
     */
    const stopMic = useCallback(() => {
        clearTimers();
        try {
            recogRef.current?.stop();
        } catch {}
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== "inactive") {
            try {
                recorder.stop();
            } catch {}
        }
    }, [clearTimers]);

    const transcribeClip = useCallback(
        async (blob: Blob, onText: (text: string) => void) => {
            setMicState("transcribing");
            try {
                const res = await fetch(`/api/transcribe?lang=${lang}`, {
                    method: "POST",
                    headers: { "Content-Type": blob.type || "audio/webm" },
                    body: blob,
                });
                if (!res.ok) {
                    setMicState("idle");
                    setError("failed");
                    return;
                }
                const data = (await res.json()) as { text?: string };
                const text = data.text?.trim();
                setMicState("idle");
                if (text) onText(text);
                else setError("no-speech");
            } catch {
                setMicState("idle");
                setError("failed");
            }
        },
        [lang]
    );

    const startRecording = useCallback(
        async (onText: (text: string) => void) => {
            if (!hasRecorder()) {
                setError("unavailable");
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mimeType = pickMimeType();
                const recorder = mimeType
                    ? new MediaRecorder(stream, { mimeType })
                    : new MediaRecorder(stream);
                chunksRef.current = [];
                abortRef.current = false;
                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };
                recorder.onstop = () => {
                    clearTimers();
                    stream.getTracks().forEach((t) => t.stop());
                    recorderRef.current = null;
                    const chunks = chunksRef.current;
                    chunksRef.current = [];
                    if (abortRef.current || chunks.length === 0) {
                        setMicState("idle");
                        return;
                    }
                    void transcribeClip(
                        new Blob(chunks, { type: recorder.mimeType || "audio/webm" }),
                        onText
                    );
                };
                recorderRef.current = recorder;
                recorder.start();
                setMicState("recording");
                // Never upload more than RECORD_MAX_MS of audio.
                timersRef.current.push(
                    window.setTimeout(() => {
                        const active = recorderRef.current;
                        if (active?.state === "recording") active.stop();
                    }, RECORD_MAX_MS)
                );
            } catch (e) {
                setMicState("idle");
                const denied =
                    e instanceof DOMException &&
                    (e.name === "NotAllowedError" || e.name === "SecurityError");
                setError(denied ? "denied" : "failed");
            }
        },
        [clearTimers, transcribeClip]
    );

    const startSpeech = useCallback(
        (onText: (text: string) => void) => {
            const Ctor = getCtor();
            if (!Ctor) {
                setModeOverride("recorder");
                return;
            }
            // The recognizer is unreachable (Chromium build without a speech
            // backend): switch to recording for good and say why.
            const downgrade = () => {
                setMicState("idle");
                setModeOverride("recorder");
                setError("unavailable");
            };

            const rec = new Ctor();
            let started = false;
            rec.lang = lang === "es" ? "es-ES" : "en-US";
            // continuous: survive pauses in speech (single-utterance mode ends
            // the session at the first pause, often before any final result).
            rec.continuous = true;
            rec.interimResults = true;
            rec.onstart = () => {
                started = true;
                clearTimers();
            };
            rec.onresult = (e) => {
                // Only final segments — interim ones would duplicate as they settle.
                let chunk = "";
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    const r = e.results[i];
                    if (r?.isFinal) chunk += `${r[0]?.transcript ?? ""} `;
                }
                chunk = chunk.trim();
                if (chunk) onText(chunk);
            };
            rec.onend = () => {
                clearTimers();
                recogRef.current = null;
                setMicState("idle");
            };
            rec.onerror = (e) => {
                clearTimers();
                recogRef.current = null;
                setMicState("idle");
                if (e?.error === "network") {
                    downgrade();
                    return;
                }
                const kind = mapRecognitionError(e?.error);
                if (kind) setError(kind);
            };
            rec.onnomatch = () => setError("no-speech");
            recogRef.current = rec;
            setMicState("listening");
            try {
                rec.start();
            } catch {
                // e.g. rapid double-tap while the previous session still tears down
                recogRef.current = null;
                setMicState("idle");
                setError("failed");
                return;
            }
            timersRef.current.push(
                window.setTimeout(() => {
                    if (started) return;
                    // No recognizer came up: abandon this dead session. Don't
                    // start recording here — that needs a fresh user gesture.
                    try {
                        rec.abort?.();
                    } catch {}
                    recogRef.current = null;
                    downgrade();
                }, SPEECH_WATCHDOG_MS)
            );
        },
        [clearTimers, lang]
    );

    const toggleListening = useCallback(
        (onText: (text: string) => void) => {
            if (micState === "transcribing") return;
            if (micState !== "idle") {
                stopMic();
                return;
            }
            setError(null);
            abortRef.current = false;
            if (mode === "recorder") void startRecording(onText);
            else startSpeech(onText);
        },
        [micState, mode, startRecording, startSpeech, stopMic]
    );

    const toggleSpeak = () => {
        if (speakOn && typeof window !== "undefined") window.speechSynthesis?.cancel();
        setSpeakOn((v) => !v);
    };

    const speak = useCallback(
        (text: string) => {
            if (typeof window === "undefined" || !window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(speakable(text));
            utterance.lang = lang === "es" ? "es-ES" : "en-US";
            window.speechSynthesis.speak(utterance);
        },
        [lang]
    );

    // Unmount: abort (don't transcribe), release the mic and stop speaking.
    useEffect(() => {
        return () => {
            abortRef.current = true;
            timersRef.current.forEach((id) => window.clearTimeout(id));
            try {
                recogRef.current?.stop();
            } catch {}
            const recorder = recorderRef.current;
            if (recorder && recorder.state !== "inactive") {
                try {
                    recorder.stop();
                } catch {}
            }
            if (typeof window !== "undefined") window.speechSynthesis?.cancel();
        };
    }, []);

    const clearError = () => setError(null);

    return {
        supported: mode !== null,
        micState,
        busy: micState === "transcribing",
        speakOn,
        toggleListening,
        toggleSpeak,
        speak,
        error,
        clearError,
    };
}
