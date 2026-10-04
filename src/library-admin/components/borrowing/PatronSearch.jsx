import { useEffect, useState } from "react";
import { QrCode, Search } from "lucide-react";

import StatusBadge from "../common/StatusBadge";
import { borrowingService } from "../../services/borrowingService";

export default function PatronSearch({ onSelect, onScanClick }) {
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
            borrowingService
                .searchPatrons(query, { signal: controller.signal })
                .then((data) => {
                    setResults(data || []);
                    setError(null);
                })
                .catch((err) => {
                    if (err?.name === "AbortError") return;
                    setError(err?.message || "Unable to search patrons.");
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
            <h2 className="text-sm font-semibold text-[#1F1F1F]">1. Find the patron</h2>
            <p className="mt-0.5 text-xs text-gray-500">
                Search by student ID, employee ID, or name. Or scan the Library Access Pass.
            </p>

            <div className="mt-4 flex gap-2">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        placeholder="Student ID, employee ID, or name"
                        className="w-full rounded-lg border border-black/[0.08] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#106A2E]"
                    />
                </div>

                <button
                    type="button"
                    onClick={onScanClick}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                    <QrCode size={16} /> Scan QR
                </button>
            </div>

            <div className="mt-3">
                {query.length < 2 ? null : loading ? (
                    <p className="py-4 text-center text-sm text-gray-500">Searching...</p>
                ) : error ? (
                    <p className="py-4 text-center text-sm text-red-600">{error}</p>
                ) : results.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500">No matching student or faculty.</p>
                ) : (
                    <ul className="divide-y divide-black/[0.05] rounded-xl border border-black/[0.06]">
                        {results.map((p) => (
                            <li key={p.userId}>
                                <button
                                    type="button"
                                    onClick={() => onSelect(p)}
                                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-[#1F1F1F]">{p.fullName}</p>
                                        <p className="truncate text-xs text-gray-400">
                                            {p.idNumber || "No ID"} &middot; {p.role}
                                            {p.course ? ` · ${p.course}` : ""}
                                        </p>
                                    </div>

                                    <StatusBadge tone={p.canBorrow ? "green" : "red"}>
                                        {p.canBorrow ? "Can borrow" : "Blocked"}
                                    </StatusBadge>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}