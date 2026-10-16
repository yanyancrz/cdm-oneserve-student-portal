import { display } from "./clinicFormat";

export default function DetailRow({ label, value, multiline = false }) {
    return (
        <div className="px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">{label}</p>
            <p className={`text-sm text-[#1F1F1F] mt-0.5 ${multiline ? "whitespace-pre-wrap" : ""}`}>
                {typeof value === "string" || typeof value === "number" ? display(value) : (value ?? "—")}
            </p>
        </div>
    );
}
