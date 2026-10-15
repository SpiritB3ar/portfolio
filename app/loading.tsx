import { cookies, headers } from "next/headers";
import { getDictionary, Locale } from "./lib/dictionary";

const resolveLocale = async (): Promise<Locale> => {
    const localeCookie = (await cookies()).get("NEXT_LOCALE")?.value;
    if (localeCookie === "es" || localeCookie === "en") return localeCookie;
    const acceptLang = (await headers()).get("accept-language") || "";
    return acceptLang.startsWith("es") ? "es" : "en";
};

export default async function Loading() {
    const t = getDictionary(await resolveLocale());

    return (
        <div
            role="status"
            className="relative z-10 flex min-h-[60dvh] w-full flex-col items-center justify-center gap-4 py-24"
        >
            <span className="sr-only">{t.common.loading}</span>
            <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-10 w-72 max-w-[80vw] animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-52 max-w-[60vw] animate-pulse rounded-full bg-muted" />
        </div>
    );
}
