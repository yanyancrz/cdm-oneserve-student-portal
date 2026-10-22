import { useEffect, useRef, useState } from "react";
import { BookOpen, CheckCircle2, LibraryBig, ShieldCheck } from "lucide-react";

// The mandatory gate shown the first time a patron opens the Library module
// (and again whenever the Library Head changes the terms).
export default function LibraryTermsGate({ terms = [], userName = "", onConfirm }) {
    const [checked, setChecked] = useState(false);
    const [saving, setSaving] = useState(false);
    const [scrolledToBottom, setScrolledToBottom] = useState(
        terms.length === 0
    );
    const scrollRef = useRef(null);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        const atBottom =
            el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
        if (atBottom) setScrolledToBottom(true);
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        // If the content already fits, allow confirmation immediately.
        if (el.scrollHeight <= el.clientHeight + 8) {
            setScrolledToBottom(true);
        }
        handleScroll();
    }, [terms]);

    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previous;
        };
    }, []);

    const confirm = async () => {
        if (!checked || !scrolledToBottom || saving) return;

        setSaving(true);

        try {
            await onConfirm?.();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="library-terms-title"
                className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]"
            >
                <div className="relative overflow-hidden bg-gradient-to-br from-[#10B981] via-[#0E3B22] to-[#052E16] px-5 py-5 text-white sm:px-7 sm:py-6">
                    <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" />

                    <div className="relative flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-emerald-100">
                            <LibraryBig size={24} />
                        </div>

                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-200/80">
                                CDM Library
                            </p>
                            <h2 id="library-terms-title" className="mt-1 text-xl font-semibold sm:text-2xl">
                                Guidance, Terms &amp; Guidelines
                            </h2>
                            <p className="mt-1 text-xs leading-5 text-white/65">
                                {userName ? `Welcome, ${userName}. ` : ""}
                                Please read the library rules before continuing.
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7"
                >
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                        <div className="flex items-start gap-2.5">
                            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#106A2E]" />
                            <div>
                                <p className="text-sm font-semibold text-[#0E3B22]">Guidance</p>
                                <p className="mt-1 text-xs leading-5 text-emerald-900/70">
                                    Use the library responsibly. Keep the books and your account in good
                                    standing, follow the circulation hours, and ask the librarian when
                                    you are unsure about a rule.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-slate-400">
                        <BookOpen size={15} />
                        Terms &amp; Guidelines
                    </div>

                    <ol className="mt-2 divide-y divide-slate-100">
                        {terms.map((term, index) => (
                            <li key={term.id ?? index} className="flex gap-3 py-3.5">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E1F0E4] text-[11px] font-bold text-[#106A2E]">
                                    {index + 1}
                                </span>

                                <div className="min-w-0">
                                    {term.title && (
                                        <p className="text-sm font-semibold text-slate-800">{term.title}</p>
                                    )}

                                    {term.content && (
                                        <p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-500">
                                            {term.content}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>

                    {terms.length === 0 && (
                        <p className="py-6 text-center text-sm text-slate-500">
                            The library guidelines are being prepared. Please ask the librarian for
                            the current rules.
                        </p>
                    )}
                </div>

                <div className="border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                        <input
                            type="checkbox"
                            checked={checked}
                            disabled={!scrolledToBottom}
                            onChange={(event) => setChecked(event.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#106A2E] disabled:cursor-not-allowed disabled:opacity-50"
                        />

                        <span className="text-xs leading-5 text-slate-600">
                            I have read and understood the Library Guidance, Terms and Guidelines. I
                            agree to follow them, including the inside-library-use rule for the last
                            available copy.
                        </span>
                        {!scrolledToBottom && (
                            <p className="mt-2 text-xs font-medium text-amber-700">
                                Scroll to the bottom of the terms to enable the confirmation.
                            </p>
                        )}
                    </label>

                    <button
                        type="button"
                        onClick={confirm}
                        disabled={!checked || !scrolledToBottom || saving}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#106A2E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0d5726] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <CheckCircle2 size={17} />
                        {saving ? "Saving..." : "Confirm and continue"}
                    </button>
                </div>
            </div>
        </div>
    );
}
