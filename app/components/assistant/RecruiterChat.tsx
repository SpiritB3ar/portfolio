"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useLanguage } from "@/app/providers/LanguageProvider";
import type { AssistantChatMessage, AssistantReply } from "@/app/components/types/types";

const MAX_HISTORY = 12;

/** Minimal markdown renderer for model replies: **bold** + [label](https://url).
 *  Keeps the widget dependency-free and XSS-safe (no dangerouslySetInnerHTML;
 *  only http(s) links become <a>). */
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

async function askAssistant(
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
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, open, loading]);

    const send = async (text?: string) => {
        const content = (text ?? input).trim();
        if (!content || loading) return;
        const next: AssistantChatMessage[] = [...messages, { role: "user" as const, content }].slice(-MAX_HISTORY);
        setMessages(next);
        setInput("");
        setLoading(true);
        try {
            const reply = await askAssistant(next, lang);
            setMessages((prev): AssistantChatMessage[] => [...prev, { role: "assistant" as const, content: reply }].slice(-MAX_HISTORY));
        } catch {
            setMessages((prev): AssistantChatMessage[] =>
                [...prev, { role: "assistant" as const, content: t.assistant.unavailable }].slice(-MAX_HISTORY)
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-5 sm:right-5">
            {open && (
                <div className="flex h-[min(480px,calc(100dvh-9rem))] max-h-[480px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-stone-200 bg-[#FBF6EA] shadow-2xl dark:border-emerald-900 dark:bg-[#03100E]">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-emerald-900">
                        <div>
                            <p className="text-sm font-semibold text-stone-900 dark:text-emerald-50">
                                {t.assistant.title}
                            </p>
                            <p className="text-xs text-stone-500 dark:text-emerald-200/60">
                                {t.assistant.subtitle}
                            </p>
                        </div>
                        <button
                            aria-label={t.assistant.close}
                            onClick={() => setOpen(false)}
                            className="rounded-full p-1.5 text-stone-500 hover:bg-stone-200/60 dark:text-emerald-100/70 dark:hover:bg-emerald-900/50"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-3 space-y-3">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex min-w-0 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`min-w-0 max-w-[88%] break-words rounded-2xl px-3 py-2 text-sm leading-relaxed [overflow-wrap:anywhere] ${
                                        m.role === "user"
                                            ? "bg-stone-900 text-stone-50 dark:bg-emerald-400 dark:text-emerald-950"
                                            : "bg-stone-200/70 text-stone-800 dark:bg-emerald-900/50 dark:text-emerald-50"
                                    }`}
                                >
                                    {m.role === "assistant" ? renderMessage(m.content) : m.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="rounded-2xl bg-stone-200/70 px-3 py-2 text-sm text-stone-500 dark:bg-emerald-900/50 dark:text-emerald-200/70">
                                    {t.assistant.thinking}
                                </div>
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
                                        className="max-w-full break-words rounded-xl border border-stone-300 px-2.5 py-1 text-left text-[11px] leading-snug text-stone-600 hover:bg-stone-200/60 dark:border-emerald-800 dark:text-emerald-100/70 dark:hover:bg-emerald-900/40"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <form
                        className="flex items-center gap-2 border-t border-stone-200 p-3 dark:border-emerald-900"
                        onSubmit={(e) => {
                            e.preventDefault();
                            send();
                        }}
                    >
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t.assistant.placeholder}
                            maxLength={2000}
                            className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white/70 px-3 py-2 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-400 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-50 dark:placeholder:text-emerald-200/40 dark:focus:border-emerald-700"
                        />
                        <button
                            type="submit"
                            aria-label={t.assistant.send}
                            disabled={loading || !input.trim()}
                            className="rounded-xl bg-stone-900 p-2.5 text-stone-50 hover:bg-stone-700 disabled:opacity-40 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}

            <button
                aria-label={open ? t.assistant.close : t.assistant.open}
                onClick={() => setOpen((v) => !v)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-900 text-stone-50 shadow-xl hover:bg-stone-700 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
            >
                {open ? <X size={22} /> : <MessageCircle size={22} />}
            </button>
        </div>
    );
}
