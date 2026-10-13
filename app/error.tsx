"use client";

import { useEffect } from "react";
import { useLanguage } from "./providers/LanguageProvider";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const { t } = useLanguage();

    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <section className="relative z-10 flex min-h-[60dvh] flex-col items-center justify-center gap-5 py-24 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-destructive">
                500
            </p>
            <h1 className="font-poiret text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {t.errorPage.title}
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                {t.errorPage.subtitle}
            </p>
            <button
                type="button"
                onClick={reset}
                className="focus-ring mt-2 inline-flex items-center gap-2 rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-medium dark:text-background"
            >
                {t.errorPage.retry}
            </button>
        </section>
    );
}
