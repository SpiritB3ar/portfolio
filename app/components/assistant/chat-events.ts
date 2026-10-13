import type { AssistantChatMessage } from "@/app/components/types/types";

export const OPEN_CHAT_EVENT = "dranzr:open-chat";

type OpenChatDetail = { seed?: AssistantChatMessage[] };

/** Abre el dock del asistente, opcionalmente con mensajes sembrados
 *  (usado por el ⌘K palette para "continuar en el chat"). */
export function dispatchOpenChat(seed?: AssistantChatMessage[]) {
    window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT, { detail: { seed } }));
}

export function listenOpenChat(handler: (seed?: AssistantChatMessage[]) => void) {
    const fn = (e: Event) => handler((e as CustomEvent<OpenChatDetail>).detail?.seed);
    window.addEventListener(OPEN_CHAT_EVENT, fn);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, fn);
}
