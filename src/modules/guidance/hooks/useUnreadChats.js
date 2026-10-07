import { useCallback, useEffect, useState } from "react";

import { guidanceApi } from "../services/guidanceApi";
import { onGuidanceEvent } from "../services/realtime";

const POLL_MS = 20 * 1000;

// =========================================================
// Total unread chat messages for the signed-in user.
//
// Recounts the moment a ChatMessage event arrives, and
// re-checks on a slow poll / when the tab comes back — so the
// Messages tab badge is always current.
// =========================================================
export function useUnreadChats(audience) {
    const [unread, setUnread] = useState(0);

    const refresh = useCallback(
        async (signal) => {
            try {
                const convos = await guidanceApi.getConversations(audience, signal);
                setUnread(convos.reduce((sum, c) => sum + (c.unreadCount || 0), 0));
            } catch (e) {
                if (e?.name !== "AbortError") {
                    // Keep the last count; the next tick corrects it.
                }
            }
        },
        [audience]
    );

    useEffect(() => {
        const controller = new AbortController();

        refresh(controller.signal);

        const refreshIfVisible = () => {
            if (!document.hidden) refresh(controller.signal);
        };

        const timer = setInterval(refreshIfVisible, POLL_MS);
        document.addEventListener("visibilitychange", refreshIfVisible);

        // A message anywhere in my chats -> recount at once.
        const offEvent = onGuidanceEvent("ChatMessage", () =>
            refresh(controller.signal)
        );

        return () => {
            controller.abort();
            clearInterval(timer);
            document.removeEventListener("visibilitychange", refreshIfVisible);
            offEvent();
        };
    }, [refresh]);

    return unread;
}
