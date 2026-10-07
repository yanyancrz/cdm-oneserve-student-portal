import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Settings2 } from "lucide-react";

import { ErrorMessage, PageHeader } from "../components/common";
import guidanceHeadService from "../services/guidanceHeadService";

const input =
    "w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-[#106A2E]";
const label = "mb-1.5 block text-sm font-medium text-gray-700";
const hint = "mt-1 text-xs text-gray-400";

function NumberField({ id, value, onChange, min, max, title, description }) {
    return (
        <div className="rounded-xl border border-black/[0.05] bg-[#FAFAF7] p-4">
            <label className={label} htmlFor={id}>
                {title}
            </label>

            <input
                id={id}
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`${input} max-w-[160px]`}
            />

            <p className={hint}>{description}</p>
        </div>
    );
}

export default function GuidanceSettingsPage() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        // Deferred so the effect body never sets state synchronously.
        queueMicrotask(() => {
            setLoading(true);
            setLoadError(null);

            guidanceHeadService
                .getSettings({ signal: controller.signal })
                .then(setSettings)
                .catch((err) => {
                    if (err?.name === "AbortError") return;
                    setLoadError(err?.message || "Unable to load the settings.");
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        });

        return () => controller.abort();
    }, []);

    const update = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

    const clamp = (value, min, max, fallback) => {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) return fallback;
        return Math.min(max, Math.max(min, parsed));
    };

    const save = async (event) => {
        event.preventDefault();

        const payload = {
            autoExpireDays: clamp(settings.autoExpireDays, 0, 90, 0),
            slotMinutes: clamp(settings.slotMinutes, 5, 240, 30),
            maxAdvanceDays: clamp(settings.maxAdvanceDays, 1, 365, 60),
            allowSameDay: Boolean(settings.allowSameDay),
        };

        setSaving(true);

        try {
            const saved = await guidanceHeadService.saveSettings(payload);
            setSettings(saved);
            toast.success("Guidance settings saved.");
        } catch (err) {
            toast.error(err?.message || "Unable to save the settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loadError && !settings) {
        return (
            <ErrorMessage
                title="Unable to load the settings"
                message={loadError}
                onRetry={() => window.location.reload()}
            />
        );
    }

    return (
        <>
            <PageHeader
                eyebrow="Administration"
                icon={Settings2}
                title="Settings"
                description="Rules the whole Guidance module follows when students book and when unanswered requests expire."
                loading={loading && !settings}
            />

            <form
                onSubmit={save}
                className="max-w-3xl space-y-4 rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm"
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <NumberField
                        id="set-autoexpire"
                        value={settings?.autoExpireDays ?? ""}
                        onChange={(v) => update("autoExpireDays", v)}
                        min={0}
                        max={90}
                        title="Auto-expire after (days)"
                        description="How many days past the appointment date an unanswered request stays Pending before it becomes Expired. 0 = the next day."
                    />

                    <NumberField
                        id="set-slot"
                        value={settings?.slotMinutes ?? ""}
                        onChange={(v) => update("slotMinutes", v)}
                        min={5}
                        max={240}
                        title="Appointment slot length (minutes)"
                        description="How long each bookable time slot is. Changing this re-slices every counselor's working hours."
                    />

                    <NumberField
                        id="set-advance"
                        value={settings?.maxAdvanceDays ?? ""}
                        onChange={(v) => update("maxAdvanceDays", v)}
                        min={1}
                        max={365}
                        title="Booking window (days ahead)"
                        description="The furthest date a student may book. Requests beyond this are refused by the API."
                    />

                    <div className="rounded-xl border border-black/[0.05] bg-[#FAFAF7] p-4">
                        <p className={label}>Same-day bookings</p>

                        <label className="mt-1 inline-flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={Boolean(settings?.allowSameDay)}
                                onChange={(e) => update("allowSameDay", e.target.checked)}
                                className="h-4 w-4 rounded border-black/20 text-[#106A2E] accent-[#106A2E]"
                            />
                            <span className="text-sm text-gray-700">
                                Allow students to book for today
                            </span>
                        </label>

                        <p className={hint}>
                            When off, students must pick a date starting tomorrow.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] pt-4">
                    <button
                        type="submit"
                        disabled={saving || !settings}
                        className="rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save settings"}
                    </button>
                </div>
            </form>

            <p className="mt-4 max-w-3xl text-xs leading-relaxed text-gray-400">
                These values live in the <code className="rounded bg-gray-100 px-1">guidance_settings</code>{" "}
                table. Changing them takes effect on the very next booking - no restart needed.
            </p>
        </>
    );
}
