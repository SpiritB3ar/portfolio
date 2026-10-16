"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

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
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
    onnomatch: (() => void) | null;
}

/** Dictation failure kinds surfaced to the UI (toast). */
export type VoiceErrorKind = "denied" | "no-speech" | "failed";

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

/** Plain text for speech synthesis: strips **bold** and [label](url) → label. */
export const speakable = (md: string): string =>
    md
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1");

/** Voice input (dictation) + spoken replies for the assistant. */
export function useVoice(lang: "en" | "es") {
    const recogRef = useRef<SpeechRecognitionInstance | null>(null);
    const [listening, setListening] = useState(false);
    const [speakOn, setSpeakOn] = useState(false);
    const [error, setError] = useState<VoiceErrorKind | null>(null);
    // Mounted-only feature detection: avoids SSR/client hydration mismatch.
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );
    const supported = mounted && getCtor() !== null;

    const toggleListening = (onText: (text: string) => void) => {
        const Ctor = getCtor();
        if (!Ctor) return;
        if (listening) {
            recogRef.current?.stop();
            return;
        }
        setError(null);
        const rec = new Ctor();
        rec.lang = lang === "es" ? "es-ES" : "en-US";
        // continuous: survive pauses in speech (single-utterance mode ends
        // the session at the first pause, often before any final result).
        rec.continuous = true;
        rec.interimResults = true;
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
        rec.onend = () => setListening(false);
        rec.onerror = (e) => {
            setListening(false);
            const kind = mapRecognitionError(e?.error);
            if (kind) setError(kind);
        };
        rec.onnomatch = () => setError("no-speech");
        recogRef.current = rec;
        setListening(true);
        try {
            rec.start();
        } catch {
            // e.g. rapid double-tap while the previous session still tears down
            setListening(false);
            setError("failed");
        }
    };

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

    // Stop recognition + pending speech on unmount.
    useEffect(() => {
        return () => {
            recogRef.current?.stop();
            if (typeof window !== "undefined") window.speechSynthesis?.cancel();
        };
    }, []);

    const clearError = () => setError(null);

    return { supported, listening, speakOn, toggleListening, toggleSpeak, speak, error, clearError };
}
