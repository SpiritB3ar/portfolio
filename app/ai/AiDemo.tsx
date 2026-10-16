"use client";
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useMountedReducedMotion } from "@/app/lib/use-mounted-reduced-motion";
import { Sparkles, ArrowUpRight, Loader2 } from 'lucide-react';
import { useLanguage } from '../providers/LanguageProvider';
import { askAssistant } from '../components/assistant/RecruiterChat';
import { dispatchOpenChat } from '../components/assistant/chat-events';
import type { AssistantChatMessage } from '../components/types/types';

export const AiDemo = () => {
    const { lang, t } = useLanguage();
    const reduce = useMountedReducedMotion();
    const [asking, setAsking] = useState<string | null>(null);
    const askIdRef = useRef(0);

    const askSample = async (sample: string) => {
        if (asking) return;
        const id = ++askIdRef.current;
        setAsking(sample);
        try {
            const reply = await askAssistant([{ role: "user" as const, content: sample }], lang);
            if (askIdRef.current !== id) return;
            const seed: AssistantChatMessage[] = [
                { role: "user" as const, content: sample },
                { role: "assistant" as const, content: reply },
            ];
            dispatchOpenChat(seed);
        } catch {
            if (askIdRef.current !== id) return;
            dispatchOpenChat([{ role: "user" as const, content: sample }]);
        } finally {
            if (askIdRef.current === id) setAsking(null);
        }
    };

    return (
        <motion.section
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: [0.21, 0.6, 0.35, 1] }}
            className="mb-14 sm:mb-16"
        >
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-brand-medium dark:text-brand-green">
                    {t.ai.demoLabel}
                </p>
                <div className="flex flex-col items-start gap-5">
                    <button
                        type="button"
                        onClick={() => dispatchOpenChat()}
                        className="focus-ring group inline-flex items-center gap-2 rounded-full bg-brand-green px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-medium dark:text-background pressable active:scale-[0.98]"
                    >
                        <Sparkles className="h-4 w-4" />
                        <span>{t.ai.demoButton}</span>
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                    <div>
                        <p className="mb-2 text-sm font-medium text-muted-foreground">{t.ai.samplesLabel}</p>
                        <div className="flex flex-wrap gap-2">
                            {t.assistant.suggestions.map((sample) => {
                                const busy = asking === sample;
                                return (
                                    <button
                                        key={sample}
                                        type="button"
                                        disabled={asking !== null}
                                        onClick={() => void askSample(sample)}
                                        className="focus-ring inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-left text-sm text-foreground transition-colors hover:border-brand-green/40 hover:text-brand-medium disabled:cursor-wait disabled:opacity-60 dark:hover:text-brand-green pressable active:scale-95"
                                    >
                                        {busy && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
                                        <span>{sample}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
};
