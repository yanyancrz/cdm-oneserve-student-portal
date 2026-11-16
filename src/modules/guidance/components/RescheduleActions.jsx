import { useRescheduling } from "./RescheduleContext";

export default function RescheduleActions({ appointment }) {
    const { proposals, open, showHistory } = useRescheduling();
    const history = proposals.filter((p) => p.appointmentId === appointment.id);
    const pending = history.find((p) => p.status === "Pending");
    const active = ["Pending", "Confirmed"].includes(appointment.status);
    return <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {active && <button type="button" onClick={() => open(appointment)} className="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-700">{pending ? "Review reschedule" : "Request reschedule"}</button>}
        {history.length > 0 && <button type="button" onClick={() => showHistory(appointment)} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600">Rescheduling history</button>}
    </div>;
}
