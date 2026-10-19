import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import LibraryPageHeader from "../components/layout/LibraryPageHeader";

import { settingsService } from "../services/settingsService";
import { formatDate } from "../utils/dateUtils";

const input =
    "w-full rounded-lg border border-black/[0.1] px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#106A2E] disabled:bg-gray-50";

function Field({ label, hint, children }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-[11px] text-gray-400">{hint}</span>}
        </label>
    );
}

const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

const toForm = (s) => ({
    firstSemStart: toDateInput(s.firstSemStart),
    firstSemEnd: toDateInput(s.firstSemEnd),
    secondSemStart: toDateInput(s.secondSemStart),
    secondSemEnd: toDateInput(s.secondSemEnd),
    studentBorrowLimit: String(s.studentBorrowLimit),
    facultyBorrowLimit: String(s.facultyBorrowLimit),
    defaultLoanDays: String(s.defaultLoanDays),
    reservationPickupDays: String(s.reservationPickupDays),
});

export default function LibrarySettingsPage() {
    const [settings, setSettings] = useState(null);
    const [values, setValues] = useState(null);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        setError(null);

        settingsService
            .get({ signal: controller.signal })
            .then((data) => {
                setSettings(data);
                setValues(toForm(data));
            })
            .catch((err) => {
                if (err?.name === "AbortError") return;
                setError(err?.message || "Unable to load the settings.");
            });

        return () => controller.abort();
    }, [reloadKey]);

    const bind = (key) => ({
        value: values[key],
        disabled: saving,
        onChange: (e) => setValues((prev) => ({ ...prev, [key]: e.target.value })),
    });

    const dirty = settings && values && JSON.stringify(values) !== JSON.stringify(toForm(settings));

    const submit = async (e) => {
        e.preventDefault();

        for (const key of ["studentBorrowLimit", "facultyBorrowLimit"]) {
            const n = Number(values[key]);
            if (!Number.isInteger(n) || n < 1 || n > 50) {
                toast.error("Borrowing limits must be whole numbers from 1 to 50.");
                return;
            }
        }

        const pickup = Number(values.reservationPickupDays);

        if (!Number.isInteger(pickup) || pickup < 1 || pickup > 14) {
            toast.error("The pickup period must be from 1 to 14 days.");
            return;
        }

        setSaving(true);

        try {
            const data = await settingsService.update(values);
            setSettings(data);
            setValues(toForm(data));
            toast.success("Settings saved.");
        } catch (err) {
            toast.error(err?.message || "Unable to save the settings.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <LibraryPageHeader title="Library Settings" description="Semester calendar, borrowing limits, and loan durations." />

            {error && !settings ? (
                <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
                    <p className="text-sm font-medium text-gray-700">Unable to load the settings.</p>
                    <p className="mt-1 text-xs text-gray-400">{error}</p>
                    <button
                        type="button"
                        onClick={() => setReloadKey((n) => n + 1)}
                        className="mt-4 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                        Try again
                    </button>
                </div>
            ) : !values ? (
                <div className="h-80 animate-pulse rounded-2xl bg-gray-100" aria-busy="true" aria-label="Loading settings" />
            ) : (
                <form
                    onSubmit={submit}
                    className="max-w-3xl space-y-6 rounded-2xl border border-black/[0.05] bg-white p-6 shadow-sm"
                >
                    <div>
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">Semester calendar &amp; borrowing ban</h2>

                        <p className="mt-1 text-xs text-gray-500">
                            A late return bans the patron from borrowing until the end of the current semester.
                            Set the semester dates so the ban can be lifted automatically.
                        </p>

                        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="First Sem start">
                                <input type="date" className={input} {...bind("firstSemStart")} />
                            </Field>
                            <Field label="First Sem end">
                                <input type="date" className={input} {...bind("firstSemEnd")} />
                            </Field>
                            <Field label="Second Sem start">
                                <input type="date" className={input} {...bind("secondSemStart")} />
                            </Field>
                            <Field label="Second Sem end">
                                <input type="date" className={input} {...bind("secondSemEnd")} />
                            </Field>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">Borrowing limits</h2>

                        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Student limit (books)">
                                <input type="number" min={1} max={50} className={input} {...bind("studentBorrowLimit")} />
                            </Field>
                            <Field label="Faculty limit (books)">
                                <input type="number" min={1} max={50} className={input} {...bind("facultyBorrowLimit")} />
                            </Field>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">Loans and reservations</h2>

                        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Default loan duration" hint="Used when a reservation is turned into a loan.">
                                <select className={input} {...bind("defaultLoanDays")}>
                                    {settings.loanDayOptions.map((d) => (
                                        <option key={d} value={String(d)}>{d} days</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Reservation pickup period (days)" hint="How long an approved reservation is held.">
                                <input type="number" min={1} max={14} className={input} {...bind("reservationPickupDays")} />
                            </Field>
                        </div>
                    </div>

                    <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                        Changes apply to new transactions. A late return bans the patron from borrowing until the
                        end of the current semester.
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
                        <p className="text-xs text-gray-400">
                            {settings.updatedAt
                                ? `Last updated ${formatDate(settings.updatedAt)}${settings.updatedByName ? ` by ${settings.updatedByName}` : ""}`
                                : "Using the default values."}
                        </p>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={!dirty || saving}
                                onClick={() => setValues(toForm(settings))}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                disabled={!dirty || saving}
                                className="rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save settings"}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </>
    );
}