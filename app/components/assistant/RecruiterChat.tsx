"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Bot, Send, X, RotateCcw, Trash2, Mic, Volume2, VolumeX, GraduationCap, Loader2 } from "lucide-react";
import { useLanguage } from "@/app/providers/LanguageProvider";
import type { AssistantChatMessage, AssistantReply } from "@/app/components/types/types";
import type { AssistantMode } from "@/lib/ai/types";
import { listenOpenChat } from "./chat-events";
import { useVoice } from "./useVoice";
import { readErrorMessage } from "@/lib/request-util";
import { toast } from "sonner";

const MAX_HISTORY = 12;

/** Routes the assistant may link to; anything else is a hallucinated href. */
const INTERNAL_ROUTES = new Set(["/", "/about", "/experience", "/projects", "/ai"]);

/**
 * Accepts a model-emitted internal href only when it points at a real page.
 * The model invents paths and casing ("/SKILLS"), and an unknown route 404s
 * on click and on Next's RSC prefetch.
 */
function resolveInternalHref(href: string): string | null {
    if (!href.startsWith("/") || href.startsWith("//")) return null;
    const [path] = href.split(/[?#]/);
    const normalised = path.replace(/\/+$/, "").toLowerCase() || "/";
    return INTERNAL_ROUTES.has(normalised) ? href : null;
}

/** Minimal markdown renderer for model replies: **bold** + [label](url).
 *  url acepta http(s) (nueva pestaña) y rutas relativas `/…` (next/link,
 *  el chat navega el sitio). Seguro: no dangerouslySetInnerHTML. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
    const parts: ReactNode[] = [];
    const re = /(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)\s]+\))/g;
    let last = 0;
    let k = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) parts.push(text.slice(last, m.index));
        const tok = m[0];
        if (tok.startsWith("**")) {
            parts.push(
                <strong key={`${keyPrefix}-b${k++}`} className="font-semibold">
                    {tok.slice(2, -2)}
                </strong>
            );
        } else {
            const lm = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(tok);
            const href = lm?.[2] ?? "";
            if (lm && /^https?:\/\//i.test(href)) {
                parts.push(
                    <a
                        key={`${keyPrefix}-a${k++}`}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:opacity-80"
                    >
                        {lm[1]}
                    </a>
                );
            } else if (lm && resolveInternalHref(href)) {
                parts.push(
                    <Link
                        key={`${keyPrefix}-a${k++}`}
                        href={resolveInternalHref(href) as string}
                        className="underline underline-offset-2 hover:opacity-80"
                    >
                        {lm[1]}
                    </Link>
                );
            } else if (lm) {
                // Unknown internal route: keep the label, drop the link.
                parts.push(lm[1]);
            } else {
                parts.push(tok);
            }
        }
        last = m.index + tok.length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
}

function renderMessage(content: string): ReactNode[] {
    return content.split("\n").map((line, i, arr) => (
        <span key={i}>
            {renderInline(line, `l${i}`)}
            {i < arr.length - 1 && <br />}
        </span>
    ));
}

export { renderMessage };

export async function askAssistantStream(
    messages: AssistantChatMessage[],
    lang: "en" | "es",
    mode: AssistantMode,
    onDelta: (fullText: string) => void
): Promise<string> {
    const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages.slice(-MAX_HISTORY), lang, mode, stream: true }),
    });
    if (!res.ok || !res.body) {
        throw new Error(await readErrorMessage(res, `HTTP ${res.status}`));
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buf = "";
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n\n")) >= 0) {
            const line = buf.slice(0, idx).trim();
            buf = buf.slice(idx + 2);
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") {
                try {
                    await reader.cancel();
                } catch {}
                return full;
            }
            try {
                const evt = JSON.parse(payload) as { delta?: string; error?: string };
                if (evt.error) throw new Error("upstream");
                if (evt.delta) {
                    full += evt.delta;
                    onDelta(full);
                }
            } catch (e) {
                if (e instanceof Error && e.message === "upstream") throw e;
                // Ignore malformed frames; the stream continues.
            }
        }
    }
    return full;
}

export async function askAssistant(
    messages: AssistantChatMessage[],
    lang: "en" | "es"
): Promise<string> {
    const MAX_ATTEMPTS = 3;
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const res = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: messages.slice(-MAX_HISTORY), lang }),
            });
            const body = (await res.json().catch(() => ({}))) as { message?: unknown };
            if (!res.ok) {
                // 429/502/503 = sobrecarga transitoria → reintentar con backoff.
                if ([429, 502, 503].includes(res.status) && attempt < MAX_ATTEMPTS) {
                    await new Promise((r) =>
                        setTimeout(r, 700 * 2 ** (attempt - 1) + Math.random() * 200)
                    );
                    continue;
                }
                throw new Error(typeof body?.message === "string" ? body.message : `HTTP ${res.status}`);
            }
            return (body as AssistantReply).reply ?? "";
        } catch (error) {
            lastError = error;
            // Fallo de red (fetch lanza TypeError) → reintentar; el resto ya viene formateado.
            const isNetworkFailure =
                error instanceof TypeError ||
                /fetch failed|network|timeout|timed out/i.test(
                    error instanceof Error ? error.message : ""
                );
            if (isNetworkFailure && attempt < MAX_ATTEMPTS) {
                await new Promise((r) =>
                    setTimeout(r, 700 * 2 ** (attempt - 1) + Math.random() * 200)
                );
                continue;
            }
            throw error;
        }
    }
    throw lastError instanceof Error ? lastError : new Error("Assistant request failed");
}

/** Floating recruiter-assistant widget (Fase 1: text chatbot, Gemini + RAG). */
export default function RecruiterChat() {
    const { lang, t } = useLanguage();
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
    const [failedQuery, setFailedQuery] = useState<string | null>(null);
    const voice = useVoice(lang);
    const { speakOn, speak } = voice;
    // Label/state of the mic button: live dictation, recording fallback, or
    // a server-side transcription in flight.
    const micLabel =
        voice.micState === "listening"
            ? t.assistant.listening
            : voice.micState === "recording"
              ? t.assistant.recording
              : voice.micState === "transcribing"
                ? t.assistant.transcribing
                : t.assistant.dictate;
    const micActive = voice.micState !== "idle";
    // First-visit discovery: ping ring + proactive teaser bubble. Mounted-only
    // localStorage read (no SSR/hydration mismatch, no setState-in-effect).
    const seenAssistant = useSyncExternalStore(
        () => () => {},
        () => localStorage.getItem("assistant-seen") === "1",
        () => true
    );
    const [tease, setTease] = useState(false);

    const markSeen = () => {
        try {
            localStorage.setItem("assistant-seen", "1");
        } catch {}
        setTease(false);
    };
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, open, loading]);

    // Al abrir (FAB, evento del palette o CTA del hero) el foco va al input.
    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [open]);

    // El palette ⌘K puede abrir el dock con la conversación ya sembrada.
    useEffect(
        () =>
            listenOpenChat((seed) => {
                markSeen();
                setOpen(true);
                if (seed && seed.length > 0) {
                    setMessages((prev) => [...prev, ...seed].slice(-MAX_HISTORY));
                }
            }),
        []
    );

    // Burbuja proactiva unos segundos después de llegar (solo primera visita).
    useEffect(() => {
        if (seenAssistant) return;
        const id = setTimeout(() => setTease(true), 6000);
        return () => clearTimeout(id);
    }, [seenAssistant]);

    // Lee en voz alta la última respuesta cuando el modo voz está activo.
    // Se omite mientras carga para no releer cada token del streaming.
    useEffect(() => {
        if (!speakOn || !open || loading) return;
        const last = messages[messages.length - 1];
        if (last?.role === "assistant" && last.content) speak(last.content);
    }, [messages, open, speakOn, speak, loading]);

    // Corta la voz al cerrar el dock.
    useEffect(() => {
        if (!open && typeof window !== "undefined") window.speechSynthesis?.cancel();
    }, [open ]);

    // Dictation failures used to die silently (mic closed, no text).
    // Surface them so the user knows what to do next.
    const { error: voiceError, clearError: clearVoiceError } = voice;
    useEffect(() => {
        if (!voiceError) return;
        toast.error(
            voiceError === "denied"
                ? t.assistant.voiceDenied
                : voiceError === "no-speech"
                  ? t.assistant.voiceNoSpeech
                  : voiceError === "unavailable"
                    ? t.assistant.voiceUnavailable
                    : t.assistant.voiceError
        );
        clearVoiceError();
    }, [voiceError, clearVoiceError, t]);

    const [mode, setMode] = useState<AssistantMode>("chat");

    const send = async (text?: string, overrideMode?: AssistantMode) => {
        const activeMode = overrideMode ?? mode;
        const content = (text ?? input).trim();
        if (!content || loading) return;
        const next: AssistantChatMessage[] = [...messages, { role: "user" as const, content }].slice(-MAX_HISTORY);
        setMessages(next);
        setInput("");
        setFailedQuery(null);
        setLoading(true);
        // Placeholder que el streaming va rellenando token a token.
        setMessages((prev): AssistantChatMessage[] =>
            [...prev, { role: "assistant" as const, content: "" }].slice(-MAX_HISTORY)
        );
        try {
            const full = await askAssistantStream(next, lang, activeMode, (partial) => {
                setMessages((prev): AssistantChatMessage[] => {
                    const copy = [...prev];
                    copy[copy.length - 1] = { role: "assistant" as const, content: partial };
                    return copy;
                });
            });
            if (!full.trim()) throw new Error("empty");
        } catch {
            setFailedQuery(content);
            setMessages((prev): AssistantChatMessage[] =>
                [...prev.slice(0, -1), { role: "assistant" as const, content: t.assistant.unavailable }].slice(
                    -MAX_HISTORY
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const toggleInterview = () => {
        if (mode === "interview") {
            setMode("chat");
            return;
        }
        setMode("interview");
        void send(t.assistant.interviewStart, "interview");
    };

    const clearConversation = () => {
        setMessages([]);
        setFailedQuery(null);
        setInput("");
    };

    return (
        <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-5 sm:right-5">
            {open && (
                <div className="flex h-[min(480px,calc(100dvh-9rem))] max-h-[480px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                {t.assistant.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t.assistant.subtitle}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                aria-label={t.assistant.interview}
                                title={t.assistant.interview}
                                onClick={toggleInterview}
                                className={`rounded-full p-1.5 transition-colors hover:bg-muted ${
                                    mode === "interview"
                                        ? "text-brand-medium dark:text-brand-green"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <GraduationCap size={16} />
                            </button>
                            <button
                                aria-label={t.assistant.readAloud}
                                title={t.assistant.readAloud}
                                onClick={voice.toggleSpeak}
                                className={`rounded-full p-1.5 transition-colors hover:bg-muted ${
                                    speakOn ? "text-brand-medium dark:text-brand-green" : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {speakOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            </button>
                            {messages.length > 0 && (
                                <button
                                    aria-label={t.assistant.clear}
                                    title={t.assistant.clear}
                                    onClick={clearConversation}
                                    className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <button
                                aria-label={t.assistant.close}
                                onClick={() => setOpen(false)}
                                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-3 space-y-3">
                        {mode === "interview" && (
                            <div className="flex justify-center">
                                <span className="rounded-full border border-brand-green/30 bg-brand-green/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-brand-medium dark:text-brand-green">
                                    {t.assistant.interviewActive}
                                </span>
                            </div>
                        )}
                        {messages.map((m, i) => {
                            // Oculta el placeholder vacío mientras llega el primer token.
                            if (m.role === "assistant" && !m.content) return null;
                            return (
                            <div key={i} className={`flex min-w-0 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`min-w-0 max-w-[88%] break-words rounded-2xl px-3 py-2 text-sm leading-relaxed [overflow-wrap:anywhere] ${
                                        m.role === "user"
                                            ? "bg-brand-green text-white dark:text-background"
                                            : "bg-muted text-foreground"
                                    }`}
                                >
                                    {m.role === "assistant" ? renderMessage(m.content) : m.content}
                                </div>
                            </div>
                            );
                        })}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                                    {t.assistant.thinking}
                                </div>
                            </div>
                        )}
                        {!loading && failedQuery && (
                            <div className="flex justify-start pt-1">
                                <button
                                    onClick={() => send(failedQuery)}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-brand-green/30 bg-brand-green/10 px-3 py-1.5 text-xs font-medium text-brand-medium transition-colors hover:bg-brand-green/20 dark:text-brand-green"
                                >
                                    <RotateCcw size={13} />
                                    {t.assistant.retry}
                                </button>
                            </div>
                        )}
                        {!loading && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {t.assistant.suggestions
                                    .filter(
                                        (s) =>
                                            !messages.some(
                                                (m) => m.role === "user" && m.content === s
                                            )
                                    )
                                    .map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => send(s)}
                                        className="max-w-full break-words rounded-xl border border-border px-2.5 py-1 text-left text-[11px] leading-snug text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <form
                        className="flex items-center gap-2 border-t border-border p-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            send();
                        }}
                    >
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={micActive ? micLabel : t.assistant.placeholder}
                            maxLength={2000}
                            className="focus-ring min-w-0 flex-1 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-green"
                        />
                        {voice.supported && (
                            <button
                                type="button"
                                aria-label={micLabel}
                                title={micLabel}
                                aria-busy={voice.busy}
                                onClick={() =>
                                    voice.toggleListening((text) =>
                                        setInput((prev) => (prev ? `${prev} ` : "") + text)
                                    )
                                }
                                className={`rounded-xl p-2.5 transition-colors pressable active:scale-90 ${
                                    micActive
                                        ? "bg-red-500/15 text-red-500 animate-pulse motion-reduce:animate-none"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                {voice.busy ? (
                                    <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
                                ) : (
                                    <Mic size={16} />
                                )}
                            </button>
                        )}
                        <button
                            type="submit"
                            aria-label={t.assistant.send}
                            disabled={loading || !input.trim()}
                            className="rounded-xl bg-brand-green p-2.5 text-white transition-colors hover:bg-brand-medium disabled:opacity-40 dark:text-background pressable active:scale-90"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}

            {!open && tease && (
                <div className="w-[calc(100vw-2rem)] max-w-xs rounded-2xl border border-border bg-popover p-4 shadow-2xl">
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug text-foreground">
                            {t.assistant.tease}
                        </p>
                        <button
                            aria-label={t.assistant.close}
                            onClick={markSeen}
                            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            markSeen();
                            setOpen(true);
                        }}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-medium dark:text-background pressable active:scale-[0.98]"
                    >
                        <Bot size={16} />
                        {t.assistant.teaseCta}
                    </button>
                </div>
            )}

            <button
                aria-label={open ? t.assistant.close : t.assistant.open}
                onClick={() => {
                    markSeen();
                    setOpen((v) => !v);
                }}
                className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-green text-white shadow-xl transition-colors hover:bg-brand-medium dark:text-background pressable active:scale-90"
            >
                {!seenAssistant && !open && (
                    <span
                        aria-hidden
                        className="absolute inset-0 animate-ping rounded-full bg-brand-green/40 motion-reduce:hidden"
                    />
                )}
                {open ? <X size={24} /> : <Bot size={26} />}
            </button>
        </div>
    );
}
