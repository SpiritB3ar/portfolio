"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Minimal Web Speech API shapes (standard + webkit prefix). */
interface SpeechRecognitionResultItem {
    transcript: string;
}
interface SpeechRecognitionResult {
    length: number;
    [index: number]: SpeechRecognitionResultItem | undefined;
}
interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult | undefined;
}
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
    lang: string;
    interimResults: boolean;
    start(): void;
    stop(): void;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
}
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
        const rec = new Ctor();
        rec.lang = lang === "es" ? "es-ES" : "en-US";
        rec.interimResults = false;
        rec.onresult = (e) => {
            const text = Array.from(
                { length: e.results.length },
                (_, i) => e.results[i]?.[0]?.transcript ?? ""
            )
                .join(" ")
                .trim();
            if (text) onText(text);
        };
        rec.onend = () => setListening(false);
        rec.onerror = () => setListening(false);
        recogRef.current = rec;
        setListening(true);
        rec.start();
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

    return { supported, listening, speakOn, toggleListening, toggleSpeak, speak };
}
