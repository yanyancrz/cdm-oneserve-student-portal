import { RECORDS_PER_PAGE } from "./recordTable.js";

export function TableFilters({ table }) {
    return (
        <div className="flex flex-wrap items-end gap-3 text-xs">
            <label>
                <span className="block font-semibold">Search records</span>
                <input type="search" className="rounded-lg border p-2" value={table.search}
                    onChange={(event) => table.changeSearch(event.target.value)} />
            </label>
            {Object.keys(table.counts).length > 1 && <label>
                <span className="block font-semibold">Category</span>
                <select className="rounded-lg border p-2" value={table.category}
                    onChange={(event) => table.changeCategory(event.target.value)}>
                    {Object.entries(table.counts).map(([label, count]) =>
                        <option key={label} value={label}>{label || "All"} ({count})</option>)}
                </select>
            </label>}
            <button type="button" className="rounded-lg border p-2" onClick={table.reset}>Reset filters</button>
        </div>
    );
}

export function SortHeader({ table, field, children, className }) {
    const active = table.sort.key === field;
    return (
        <th scope="col" className={className}
            aria-sort={active ? (table.sort.desc ? "descending" : "ascending") : undefined}>
            <button type="button" className="whitespace-nowrap" onClick={() => table.changeSort(field)}>
                {children} <span aria-hidden="true">{active ? (table.sort.desc ? "↓" : "↑") : "↕"}</span>
            </button>
        </th>
    );
}

export function RecordPagination({ page, pages, total, onPage }) {
    const numbers = pages <= 7
        ? Array.from({ length: pages }, (_, index) => index + 1)
        : [...new Set([1, page - 1, page, page + 1, pages])]
            .filter((number) => number >= 1 && number <= pages)
            .sort((a, b) => a - b);
    const button = "rounded-lg border px-2 py-1 disabled:opacity-40";
    return (
        <nav aria-label="Table pagination" className="flex flex-wrap items-center gap-2 py-3 text-xs">
            <span className="mr-2">Page {page} of {pages} · {total ? (page - 1) * RECORDS_PER_PAGE + 1 : 0}–{Math.min(total, page * RECORDS_PER_PAGE)} of {total}</span>
            <button type="button" className={button} disabled={page === 1} onClick={() => onPage(page - 1)}>Previous</button>
            {numbers.map((number, index) => (
                <span key={number} className="inline-flex items-center gap-2">
                    {number - numbers[index - 1] > 1 && <span aria-hidden="true">…</span>}
                    <button type="button" className={button + (page === number ? " bg-green-100 font-bold" : "")}
                        aria-current={page === number ? "page" : undefined}
                        onClick={() => onPage(number)}>{number}</button>
                </span>
            ))}
            <button type="button" className={button} disabled={page === pages} onClick={() => onPage(page + 1)}>Next</button>
        </nav>
    );
}

export function MissingDuration({ item }) {
    if (item?.missingDays == null) return null;
    const days = item.missingDays;
    return <span className="block text-xs text-slate-600">
        {item.missingReturnedAt ? "Successfully returned after" : "Missing for"} {days} {days === 1 ? "day" : "days"}
    </span>;
}
