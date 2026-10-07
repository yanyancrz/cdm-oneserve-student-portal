import { useEffect } from "react";

import { connectGuidanceHub } from "../services/realtime";

// =========================================================
// Keeps the Guidance SignalR connection alive while the user
// moves around the Guidance module, and reconnects the moment
// the tab comes back to life.
//
// Mount once per Guidance layout (it stays mounted while the
// user navigates between tabs, so the socket survives).
// =========================================================
export function useGuidanceRealtime() {
    useEffect(() => {
        connectGuidanceHub().catch(() => {});

        const revive = () => {
            if (!document.hidden) connectGuidanceHub().catch(() => {});
        };

        document.addEventListener("visibilitychange", revive);
        window.addEventListener("focus", revive);
        window.addEventListener("online", revive);

        return () => {
            document.removeEventListener("visibilitychange", revive);
            window.removeEventListener("focus", revive);
            window.removeEventListener("online", revive);
        };
    }, []);
}
