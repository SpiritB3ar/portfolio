import { cookies, headers } from "next/headers";
import { getDictionary, Locale } from "./dictionary";

const resolveLocale = (): Locale => {
    const localeCookie = cookies().get("NEXT_LOCALE")?.value;
    if (localeCookie === "es" || localeCookie === "en") return localeCookie;
    const acceptLang = headers().get("accept-language") || "";
    return acceptLang.startsWith("es") ? "es" : "en";
};

/** Server-side dictionary for async pages (App Router RSC). */
export const serverT = () => getDictionary(resolveLocale());
