import { useState } from "react";
import toast from "react-hot-toast";

import PageHeader from "../../components/Library/PageHeader";
import EmptyState from "../../components/Library/EmptyState";
import { suggestBook } from "../../services/libraryService";
import { mockSuggestions } from "../../data/mockLibraryData";

const STATUS_STYLES = {
    Pending: { bg: "#FAEEDA", color: "#633806" },
    Approved: { bg: "#DCFCE7", color: "#106A2E" },
    Declined: { bg: "#FAECE7", color: "#712B13" },
};

const EMPTY_FORM = { title: "", author: "", isbn: "", reason: "", course: "" };

export default function SuggestBook() {

    const [form, setForm] = useState(EMPTY_FORM);
    const [suggestions, setSuggestions] = useState(mockSuggestions);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateField = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.title.trim() || !form.author.trim() || !form.reason.trim()) {
            toast("Please fill in the title, author, and reason.");
            return;
        }

        setIsSubmitting(true);

        const email = localStorage.getItem("userEmail");
        const newSuggestion = {
            id: `sug-local-${Date.now()}`,
            title: form.title.trim(),
            author: form.author.trim(),
            isbn: form.isbn.trim(),
            reason: form.reason.trim(),
            course: form.course.trim(),
            submittedDate: new Date().toISOString().slice(0, 10),
            status: "Pending",
        };

        try {
            // No backend endpoint exists yet — this call is expected to fail
            // until libraryService.js is wired up to a real API. The local
            // list update below keeps the page usable in the meantime.
            await suggestBook(email, newSuggestion);
        } catch (err) {
            console.error("suggestBook() has no backend yet:", err.message);
        }

        setSuggestions((prev) => [newSuggestion, ...prev]);
        setForm(EMPTY_FORM);
        toast.success("Suggestion submitted");
        setIsSubmitting(false);
    };

    return (

        <div
            className="min-h-screen pb-24"
            style={{
                background: "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)"
            }}
        >

            <div className="max-w-md sm:max-w-2xl mx-auto p-4 sm:p-6">

                <PageHeader title="Suggest a Book" subtitle="Help us grow the collection" />

                {/* FORM */}

                <form onSubmit={handleSubmit} className="bg-white/90 rounded-[24px] shadow-sm p-5 sm:p-6 mb-8">

                    <div className="space-y-4">

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                Book Title *
                            </label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={updateField("title")}
                                placeholder="e.g. Designing Data-Intensive Applications"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#106A2E]/50 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                Author *
                            </label>
                            <input
                                type="text"
                                value={form.author}
                                onChange={updateField("author")}
                                placeholder="e.g. Martin Kleppmann"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#106A2E]/50 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                ISBN
                            </label>
                            <input
                                type="text"
                                value={form.isbn}
                                onChange={updateField("isbn")}
                                placeholder="Optional"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#106A2E]/50 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                Course
                            </label>
                            <input
                                type="text"
                                value={form.course}
                                onChange={updateField("course")}
                                placeholder="e.g. BSCS - Database Systems"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#106A2E]/50 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                Reason *
                            </label>
                            <textarea
                                value={form.reason}
                                onChange={updateField("reason")}
                                placeholder="Why should the library add this book?"
                                rows={3}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#106A2E]/50 transition-colors resize-none"
                            />
                        </div>

                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="
                            w-full mt-6
                            bg-[#106A2E] text-white
                            p-3.5 rounded-xl font-semibold text-sm
                            hover:brightness-105 active:scale-[0.99]
                            disabled:opacity-60 disabled:active:scale-100
                            transition-all
                        "
                    >
                        {isSubmitting ? "Submitting..." : "Submit Suggestion"}
                    </button>

                </form>

                {/* PREVIOUS SUGGESTIONS */}

                <h2 className="font-semibold text-base text-[#1F1F1F] mb-3.5">
                    Your Suggestions
                </h2>

                {suggestions.length === 0 ? (
                    <EmptyState
                        title="No suggestions yet"
                        message="Books you suggest will show up here."
                    />
                ) : (
                    <div className="space-y-3">
                        {suggestions.map((s) => {
                            const statusStyle = STATUS_STYLES[s.status] ?? STATUS_STYLES.Pending;
                            return (
                                <div key={s.id} className="bg-white/90 rounded-2xl shadow-sm p-4">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="text-sm font-semibold text-[#1F1F1F] leading-snug">
                                            {s.title}
                                        </h3>
                                        <span
                                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                                            style={{ background: statusStyle.bg, color: statusStyle.color }}
                                        >
                                            {s.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-1">{s.author}</p>
                                    {s.course && (
                                        <p className="text-xs text-gray-400 mb-2">{s.course}</p>
                                    )}
                                    <p className="text-xs text-gray-400">
                                        Submitted {new Date(s.submittedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>

        </div>

    );

}