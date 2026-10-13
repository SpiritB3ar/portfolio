"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, Sparkles, CornerDownLeft, ArrowRight, FileText, Hash } from "lucide-react";
import { useLanguage } from "@/app/providers/LanguageProvider";
import { askAssistant, renderMessage } from "./RecruiterChat";
import { dispatchOpenChat } from "./chat-events";
import type { AssistantChatMessage } from "@/app/components/types/types";

type Props = { open: boolean; onOpen: () => void; onClose: () => void };

type PageEntry = { label: string; href: string; anchor?: boolean };

export default function CommandPalette({ open, onOpen, onClose }: Props) {
    const { lang, t } = useLanguage();
    const router = useRouter();
    const reduce = useReducedMotion();
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const askIdRef = useRef(0);

    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const [asking, setAsking] = useState(false);
    const [answer, setAnswer] = useState<{ q: string; a: string } | null>(null);

    // Atajo global ⌘K / Ctrl+K (funciona aunque el palette esté cerrado).
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                if (open) onClose();
                else onOpen();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onOpen, onClose]);

    useEffect(() => {
        if (open) {
            setQuery("");
            setActive(0);
            setAnswer(null);
            setAsking(false);
            askIdRef.current++;
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [open]);

    const pages: PageEntry[] = useMemo(
        () => [
            { label: t.nav.home, href: "/" },
            { label: t.nav.about, href: "/about" },
            { label: t.nav.experience, href: "/experience" },
            { label: t.nav.projects, href: "/projects" },
            { label: t.nav.blogs, href: "/blogs" },
            { label: t.nav.resources, href: "/resources" },
            { label: t.home.aboutTitle, href: "/#about", anchor: true },
            { label: t.home.selectedWork, href: "/#featured", anchor: true },
        ],
        [t]
    );

    const q = query.trim().toLowerCase();
    const filtered = q ? pages.filter((p) => p.label.toLowerCase().includes(q)) : pages;
    const showAsk = q.length > 0 && !answer;
    const rowCount = (showAsk ? 1 : 0) + filtered.length;

    // La fila activa se mantiene visible en el scroll de la lista.
    useEffect(() => {
        const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
        el?.scrollIntoView({ block: "nearest" });
    }, [active, open, answer]);

    const doAsk = async () => {
        const question = query.trim();
        if (!question || asking) return;
        const id = ++askIdRef.current;
        setAnswer({ q: question, a: "" });
        setAsking(true);
        try {
            const reply = await askAssistant([{ role: "user" as const, content: question }], lang);
            if (askIdRef.current === id) setAnswer({ q: question, a: reply });
        } catch {
            if (askIdRef.current === id) setAnswer({ q: question, a: t.assistant.error });
        } finally {
            if (askIdRef.current === id) setAsking(false);
        }
    };

    const activate = (idx: number) => {
        if (showAsk && idx === 0) {
            void doAsk();
            return;
        }
        const pageIdx = showAsk ? idx - 1 : idx;
        const entry = filtered[pageIdx];
        if (!entry) return;
        onClose();
        router.push(entry.href);
    };

    const continueInChat = () => {
        if (!answer || asking) return;
        const seed: AssistantChatMessage[] = [
            { role: "user" as const, content: answer.q },
            { role: "assistant" as const, content: answer.a },
        ];
        dispatchOpenChat(seed);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, Math.max(rowCount - 1, 0)));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            activate(active);
        } else if (e.key === "Escape") {
            e.preventDefault();
            onClose();
        }
    };

    const motionProps = reduce
        ? {}
        : { initial: { opacity: 0, y: 8, scale: 0.98 }, exit: { opacity: 0, y: 8, scale: 0.98 } };

    const rowBase =
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors";

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 px-4 pt-[12vh]"
                    onClick={onClose}
                >
                    <motion.div
                        {...motionProps}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.18, ease: [0.21, 0.6, 0.35, 1] }}
                        role="dialog"
                        aria-modal="true"
                        aria-label={t.palette.title}
                        className="w-[min(640px,100%)] overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
                        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                    >
                        {/* Input */}
                        <div className="flex items-center gap-3 border-b border-border px-4">
                            <Search size={16} className="shrink-0 text-muted-foreground" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => {
                                    askIdRef.current++;
                                    setQuery(e.target.value);
                                    setActive(0);
                                    setAnswer(null);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={t.palette.placeholder}
                                aria-label={t.palette.placeholder}
                                className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                            />
                            <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
                                esc
                            </kbd>
                        </div>

                        {/* Body */}
                        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
                            {answer ? (
                                <div className="space-y-3 p-2">
                                    <p className="text-xs text-muted-foreground">{answer.q}</p>
                                    <div className="text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">
                                        {asking ? (
                                            <span className="animate-pulse">{t.palette.asking}</span>
                                        ) : (
                                            renderMessage(answer.a)
                                        )}
                                    </div>
                                    {!asking && (
                                        <button
                                            type="button"
                                            onClick={continueInChat}
                                            className={`${rowBase} bg-muted font-medium text-foreground hover:bg-brand-green hover:text-white focus-ring`}
                                        >
                                            <ArrowRight size={15} className="shrink-0" />
                                            {t.palette.continueInChat}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {showAsk && (
                                        <button
                                            type="button"
                                            data-active={active === 0}
                                            onMouseEnter={() => setActive(0)}
                                            onClick={() => activate(0)}
                                            className={`${rowBase} ${
                                                active === 0 ? "bg-muted text-foreground" : "text-muted-foreground"
                                            } focus-ring`}
                                        >
                                            <Sparkles size={15} className="shrink-0 text-brand-medium dark:text-brand-green" />
                                            <span className="min-w-0 truncate">
                                                {t.palette.ask}: “{query.trim()}”
                                            </span>
                                            <CornerDownLeft size={13} className="ml-auto shrink-0 opacity-60" />
                                        </button>
                                    )}
                                    {filtered.map((p, i) => {
                                        const idx = showAsk ? i + 1 : i;
                                        return (
                                            <button
                                                key={p.href}
                                                type="button"
                                                data-active={active === idx}
                                                onMouseEnter={() => setActive(idx)}
                                                onClick={() => activate(idx)}
                                                className={`${rowBase} ${
                                                    active === idx ? "bg-muted text-foreground" : "text-muted-foreground"
                                                } focus-ring`}
                                            >
                                                {p.anchor ? (
                                                    <Hash size={15} className="shrink-0" />
                                                ) : (
                                                    <FileText size={15} className="shrink-0" />
                                                )}
                                                <span className="min-w-0 truncate">{p.label}</span>
                                                <span className="ml-auto shrink-0 font-mono text-[10px] opacity-60">
                                                    {p.href}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </>
                            )}
                        </div>

                        {/* Footer hints */}
                        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
                            <span>↵ {t.palette.hintSelect}</span>
                            <span>↑↓ {t.palette.hintMove}</span>
                            <span>Esc {t.palette.hintClose}</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
