import { useEffect, useState } from "react";
import { BookOpen, Check, Search } from "lucide-react";

import { bookService } from "../../services/bookService";

export default function BookSelection({ selected, onSelect, disabled }) {
    const [term, setTerm] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const query = term.trim();

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setError(null);
            setLoading(false);
            return undefined;
        }

        const controller = new AbortController();
        setLoading(true);

        const timer = setTimeout(() => {
            // Only books with at least one copy on the shelf.
            bookService
                .list(
                    { search: query, availability: "Available", sortBy: "title", page: 1, pageSize: 6 },
                    { signal: controller.signal }
                )
                .then((data) => {
                    setResults(data?.items || []);
                    setError(null);
                })
                .catch((err) => {
                    if (err?.name === "AbortError") return;
                    setError(err?.message || "Unable to search books.");
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        }, 350);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    return (
        <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1F1F1F]">2. Select the book</h2>
            <p className="mt-0.5 text-xs text-gray-500">Only books with an available copy are listed.</p>

            <div className="relative mt-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="search"
                    value={term}
                    disabled={disabled}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Title, author, ISBN, or call number"
                    className="w-full rounded-lg border border-black/[0.08] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#106A2E] disabled:bg-gray-50"
                />
            </div>

            <div className="mt-3">
                {query.length < 2 ? null : loading ? (
                    <p className="py-4 text-center text-sm text-gray-500">Searching...</p>
                ) : error ? (
                    <p className="py-4 text-center text-sm text-red-600">{error}</p>
                ) : results.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500">No available book matches your search.</p>
                ) : (
                    <ul className="divide-y divide-black/[0.05] rounded-xl border border-black/[0.06]">
                        {results.map((b) => {
                            const isSelected = selected?.bookId === b.bookId;

                            return (
                                <li key={b.bookId}>
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => onSelect(b)}
                                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50 disabled:opacity-60 ${
                                            isSelected ? "bg-[#E1F0E4]/50" : ""
                                        }`}
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <BookOpen size={16} className="shrink-0 text-[#106A2E]" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-[#1F1F1F]">{b.title}</p>
                                                <p className="truncate text-xs text-gray-400">
                                                    {b.author}
                                                    {b.callNo ? ` · ${b.callNo}` : ""}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2 text-xs text-gray-500">
                                            {b.availableCopies} / {b.totalCopies} available
                                            {isSelected && <Check size={16} className="text-[#106A2E]" />}
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}