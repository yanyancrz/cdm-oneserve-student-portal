import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileText, Pencil } from "lucide-react";

import LibraryPageHeader from "../components/layout/LibraryPageHeader";
import EmptyState from "../components/common/EmptyState";

import { useLibrary } from "../context/LibraryContext";
import { termsService } from "../services/termsService";
import { formatDate } from "../utils/dateUtils";

const MAX = 4000;

export default function TermsPage() {
    const { permissions } = useLibrary();

    // Only the Library Head edits. The server enforces this too.
    const canEdit = Boolean(permissions?.canManageSettings);

    const [terms, setTerms] = useState(null);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const [editing, setEditing] = useState(false);
    const [drafts, setDrafts] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        setError(null);

        termsService
            .get({ signal: controller.signal })
            .then(setTerms)
            .catch((err) => {
                if (err?.name === "AbortError") return;
                setError(err?.message || "Unable to load the terms.");
            });

        return () => controller.abort();
    }, [reloadKey]);

    const startEdit = () => {
        setDrafts(Object.fromEntries(terms.map((t) => [t.termKey, t.content])));
        setEditing(true);
    };

    const save = async () => {
        const empty = terms.find((t) => !String(drafts[t.termKey] || "").trim());

        if (empty) {
            toast.error(`"${empty.title}" cannot be empty.`);
            return;
        }

        const changed = terms
            .filter((t) => drafts[t.termKey].trim() !== t.content)
            .map((t) => ({ termKey: t.termKey, content: drafts[t.termKey] }));

        if (changed.length === 0) {
            setEditing(false);
            return;
        }

        setSaving(true);

        try {
            setTerms(await termsService.update(changed));
            toast.success("Terms updated.");
            setEditing(false);
        } catch (err) {
            toast.error(err?.message || "Unable to save the terms.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <LibraryPageHeader title="Terms & Guidelines" description="Library borrowing rules and policies." />

            {error && !terms ? (
                <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
                    <p className="text-sm font-medium text-gray-700">Unable to load the terms.</p>
                    <p className="mt-1 text-xs text-gray-400">{error}</p>
                    <button
                        type="button"
                        onClick={() => setReloadKey((n) => n + 1)}
                        className="mt-4 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                        Try again
                    </button>
                </div>
            ) : !terms ? (
                <div className="space-y-3" aria-busy="true" aria-label="Loading terms">
                    {[0, 1, 2, 3].map((n) => (
                        <div key={n} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
                    ))}
                </div>
            ) : terms.length === 0 ? (
                <div className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                    <EmptyState icon={FileText} title="No terms yet." />
                </div>
            ) : (
                <div className="space-y-4">
                    {canEdit && (
                        <div className="flex justify-end gap-2">
                            {editing ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setEditing(false)}
                                        disabled={saving}
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={save}
                                        disabled={saving}
                                        className="rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                                    >
                                        {saving ? "Saving..." : "Save changes"}
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={startEdit}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                                >
                                    <Pencil size={15} /> Edit terms
                                </button>
                            )}
                        </div>
                    )}

                    {terms.map((t) => (
                        <section key={t.termKey} className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
                            <div className="flex items-baseline justify-between gap-3">
                                <h2 className="text-sm font-semibold text-[#1F1F1F]">{t.title}</h2>
                                <span className="text-[11px] text-gray-400">Updated {formatDate(t.updatedAt)}</span>
                            </div>

                            {editing ? (
                                <>
                                    <textarea
                                        rows={4}
                                        maxLength={MAX}
                                        disabled={saving}
                                        value={drafts[t.termKey] ?? ""}
                                        onChange={(e) => setDrafts((prev) => ({ ...prev, [t.termKey]: e.target.value }))}
                                        className="mt-3 w-full rounded-lg border border-black/[0.1] px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#106A2E]"
                                    />
                                    <p className="text-right text-[11px] text-gray-400">
                                        {(drafts[t.termKey] || "").length} / {MAX}
                                    </p>
                                </>
                            ) : (
                                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">{t.content}</p>
                            )}
                        </section>
                    ))}

                    {!canEdit && (
                        <p className="text-center text-xs text-gray-400">Only the Library Head can edit the terms.</p>
                    )}
                </div>
            )}
        </>
    );
}