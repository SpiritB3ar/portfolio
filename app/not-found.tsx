import Link from "next/link";
import { cookies, headers } from "next/headers";
import { getDictionary, Locale } from "./lib/dictionary";

const resolveLocale = (): Locale => {
    const localeCookie = cookies().get("NEXT_LOCALE")?.value;
    if (localeCookie === "es" || localeCookie === "en") return localeCookie;
    const acceptLang = headers().get("accept-language") || "";
    return acceptLang.startsWith("es") ? "es" : "en";
};

export default function NotFound() {
    const t = getDictionary(resolveLocale());

    return (
        <section className="relative z-10 flex min-h-[60dvh] flex-col items-center justify-center gap-5 py-24 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-medium dark:text-brand-green">
                404
            </p>
            <h1 className="font-poiret text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {t.notFound.title}
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                {t.notFound.subtitle}
            </p>
            <Link
                href="/"
                className="focus-ring mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-brand-green hover:text-brand-medium dark:hover:border-brand-green dark:hover:text-brand-green"
            >
                {t.notFound.backHome}
            </Link>
        </section>
    );
}
