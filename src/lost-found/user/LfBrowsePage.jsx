import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PackageSearch, SearchCheck } from "lucide-react";

import { lfApi } from "../services/lfApi";
import { LOST_FOUND_HOME_ROUTE } from "../session";
import { formatDate, LF_COLORS } from "../config/lfTheme";
import { lfImageUrl } from "../config/lfImage";
import {
    LfEmpty,
    LfImage,
    LfNotice,
    LfSearchInput,
    LfSkeleton,
    LfStatusChip,
    LfTypeTag,
} from "../components/lfUi";

// =====================================================
// The board. Lost and found reports live side by side;
// only published reports are visible, and a report whose
// item was handed over drops off on its own.
//
// The type filter is also the URL query (?type=Found), so
// a "view all found" link from the home screen lands here
// already filtered.
//
// Search is SERVER-side. The backend matches the keyword
// plus related words across the item name, description,
// category and location, and returns the rows already
// ranked - exact title first, broader matches below. A
// second filter pass here would silently drop the good
// broad matches (searching "cellphone" must keep
// "Samsung Smartphone"), so the list shows what the
// server sent.
// =====================================================

const TABS = [
    { value: "", label: "All" },
    { value: "Lost", label: "Lost" },
    { value: "Found", label: "Found" },
];

// Same list as the report form and the home screen - the one set of
// categories the whole module filters by.
const CATEGORIES = [
    "Electronics",
    "Clothing",
    "Accessories",
    "Books & Supplies",
    "ID & Cards",
    "Keys",
    "Umbrella",
    "Bottle & Container",
    "Sports Gear",
    "Other",
];

export default function LfBrowsePage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [type, setType] = useState(searchParams.get("type") || "");
    // Deep-linked from the home search (?q=...): the board searches the full
    // catalog, while home only filters its own rails.
    const [search, setSearch] = useState(searchParams.get("q") || "");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [category, setCategory] = useState(searchParams.get("category") || "");
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Debounce the search so every keystroke is not a
    // network round-trip.
    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
        return () => window.clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                // The server ranks the results - exact title match first,
                // related words below it. Type and category narrow the
                // board alongside the search; neither clears the keyword.
                const response = await lfApi.publicReports({
                    type: type || undefined,
                    category: category || undefined,
                    search: debouncedSearch || undefined,
                });

                if (cancelled) return;
                setReports(response.data || []);
            } catch (err) {
                if (cancelled) return;
                setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [type, category, debouncedSearch]);

    // Keep the URL in sync with the active tab, so a
    // filtered view is shareable. Compares against the live
    // query value instead of depending on the searchParams
    // object itself (which would re-run every render).
    const typeParam = searchParams.get("type") || "";
    const categoryParam = searchParams.get("category") || "";
    useEffect(() => {
        if (typeParam === (type || "") && categoryParam === (category || "")) return;
        const next = new URLSearchParams(searchParams);
        if (type) next.set("type", type);
        else next.delete("type");
        if (category) next.set("category", category);
        else next.delete("category");
        setSearchParams(next, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, category]);

    const counts = useMemo(() => {
        const all = reports.length;
        const lost = reports.filter((r) => r.reportType === "Lost").length;
        const found = all - lost;
        return { all, lost, found };
    }, [reports]);

    return (
        <div className="space-y-4">
            <LfSearchInput value={search} onChange={setSearch} placeholder="Search item name, description, category…" />

            {/* ---------- tabs ---------- */}
            <div className="flex gap-2" role="tablist" aria-label="Filter by report type">
                {TABS.map((tab) => {
                    const active = type === tab.value;
                    const count =
                        tab.value === "Lost"
                            ? counts.lost
                            : tab.value === "Found"
                              ? counts.found
                              : counts.all;

                    return (
                        <button
                            key={tab.value}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setType(tab.value)}
                            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                                active
                                    ? "text-white"
                                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                            style={
                                active
                                    ? { backgroundColor: LF_COLORS.primary }
                                    : undefined
                            }
                        >
                            {tab.label}
                            <span className={`ml-1.5 ${active ? "text-white/70" : "text-slate-400"}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ---------- category ---------- */}
            <div
                className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="group"
                aria-label="Filter by category"
            >
                <button
                    type="button"
                    onClick={() => setCategory("")}
                    aria-pressed={category === ""}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                        category === ""
                            ? "border-[#106A2E] bg-[#106A2E] text-white"
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                >
                    All categories
                </button>
                {CATEGORIES.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => setCategory(category === option ? "" : option)}
                        aria-pressed={category === option}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                            category === option
                                ? "border-[#106A2E] bg-[#106A2E] text-white"
                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            {loading ? (
                <LfSkeleton rows={4} />
            ) : error ? (
                <LfNotice tone="bad">{error}</LfNotice>
            ) : reports.length === 0 ? (
                <LfEmpty
                    icon={PackageSearch}
                    title="Nothing on the board"
                    message={
                        search
                            ? "No published reports match that search. Try a different word - related items are found too, so \"cellphone\" also matches a smartphone."
                            : "No published reports for this filter yet. Found something? Report it so its owner can find it."
                    }
                />
            ) : (
                <ul className="space-y-3">
                    {reports.map((report) => (
                        <BoardRow
                            key={report.reportId}
                            report={report}
                            onOpen={() =>
                                navigate(`${LOST_FOUND_HOME_ROUTE}/report/${report.reportId}`)
                            }
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

function BoardRow({ report, onOpen }) {
    const image = lfImageUrl(report.imagePath);
    const isFound = report.reportType === "Found";

    return (
        <li>
            <button
                type="button"
                onClick={onOpen}
                className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:shadow-md"
            >
                <LfImage
                    src={image}
                    alt={report.itemName}
                    className="h-16 w-16 shrink-0 rounded-xl"
                />
                <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-800">
                            {report.itemName}
                        </span>
                        <LfTypeTag type={report.reportType} />
                    </span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">
                        {report.description || "No description."}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        <span>{report.category || "Uncategorized"}</span>
                        {report.location && <span>{report.location}</span>}
                        <span>{formatDate(report.dateLostFound)}</span>
                    </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                        style={{
                            backgroundColor: isFound
                                ? `${LF_COLORS.secondary}14`
                                : `${LF_COLORS.primary}14`,
                            color: isFound ? LF_COLORS.secondary : LF_COLORS.primary,
                        }}
                    >
                        {isFound ? "Found" : "Lost"}
                    </span>
                    <LfStatusChip status={report.status} />
                    <SearchCheck size={14} className="text-slate-300" aria-hidden="true" />
                </span>
            </button>
        </li>
    );
}
