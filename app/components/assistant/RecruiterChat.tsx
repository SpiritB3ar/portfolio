"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { MessageCircle, Send, X, RotateCcw, Trash2, Mic, Volume2, VolumeX } from "lucide-react";
import { useLanguage } from "@/app/providers/LanguageProvider";
import type { AssistantChatMessage, AssistantReply } from "@/app/components/types/types";
import { listenOpenChat } from "./chat-events";
import { useVoice } from "./useVoice";

const MAX_HISTORY = 12;

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
            } else if (lm && href.startsWith("/") && !href.startsWith("//")) {
                parts.push(
                    <Link
                        key={`${keyPrefix}-a${k++}`}
                        href={href}
                        className="underline underline-offset-2 hover:opacity-80"
                    >
                        {lm[1]}
                    </Link>
                );
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

export async function askAssistant(
    messages: AssistantChatMessage[],
    lang: "en" | "es"
): Promise<string> {
    const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages.slice(-MAX_HISTORY), lang }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(typeof body?.message === "string" ? body.message : `HTTP ${res.status}`);
    }
    return (body as AssistantReply).reply ?? "";
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
                setOpen(true);
                if (seed && seed.length > 0) {
                    setMessages((prev) => [...prev, ...seed].slice(-MAX_HISTORY));
                }
            }),
        []
    );

    // Lee en voz alta la última respuesta cuando el modo voz está activo.
    useEffect(() => {
        if (!speakOn || !open) return;
        const last = messages[messages.length - 1];
        if (last?.role === "assistant") speak(last.content);
    }, [messages, open, speakOn, speak]);

    // Corta la voz al cerrar el dock.
    useEffect(() => {
        if (!open && typeof window !== "undefined") window.speechSynthesis?.cancel();
    }, [open ]);

    const send = async (text?: string) => {
        const content = (text ?? input).trim();
        if (!content || loading) return;
        const next: AssistantChatMessage[] = [...messages, { role: "user" as const, content }].slice(-MAX_HISTORY);
        setMessages(next);
        setInput("");
        setFailedQuery(null);
        setLoading(true);
        try {
            const reply = await askAssistant(next, lang);
            setMessages((prev): AssistantChatMessage[] => [...prev, { role: "assistant" as const, content: reply }].slice(-MAX_HISTORY));
        } catch {
            setFailedQuery(content);
            setMessages((prev): AssistantChatMessage[] =>
                [...prev, { role: "assistant" as const, content: t.assistant.unavailable }].slice(-MAX_HISTORY)
            );
        } finally {
            setLoading(false);
        }
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
                        {messages.map((m, i) => (
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
                        ))}
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
                            placeholder={voice.listening ? t.assistant.listening : t.assistant.placeholder}
                            maxLength={2000}
                            className="focus-ring min-w-0 flex-1 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-green"
                        />
                        {voice.supported && (
                            <button
                                type="button"
                                aria-label={voice.listening ? t.assistant.listening : t.assistant.dictate}
                                title={voice.listening ? t.assistant.listening : t.assistant.dictate}
                                onClick={() =>
                                    voice.toggleListening((text) =>
                                        setInput((prev) => (prev ? `${prev} ` : "") + text)
                                    )
                                }
                                className={`rounded-xl p-2.5 transition-colors pressable active:scale-90 ${
                                    voice.listening
                                        ? "bg-red-500/15 text-red-500 animate-pulse"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                <Mic size={16} />
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

            <button
                aria-label={open ? t.assistant.close : t.assistant.open}
                onClick={() => setOpen((v) => !v)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green text-white shadow-xl transition-colors hover:bg-brand-medium dark:text-background pressable active:scale-90"
            >
                {open ? <X size={22} /> : <MessageCircle size={22} />}
            </button>
        </div>
    );
}
