import { useEffect } from "react";
import { APPOINTMENTS_UPDATED } from "../components/RescheduleContext";
import { onGuidanceEvent } from "../services/realtime";

export function useAppointmentUpdates(load) {
    useEffect(() => {
        const controller = new AbortController();
        const update = () => load(controller.signal);
        const off = onGuidanceEvent("Notification", update);
        window.addEventListener(APPOINTMENTS_UPDATED, update);
        window.addEventListener("focus", update);
        return () => {
            controller.abort(); off();
            window.removeEventListener(APPOINTMENTS_UPDATED, update);
            window.removeEventListener("focus", update);
        };
    }, [load]);
}
