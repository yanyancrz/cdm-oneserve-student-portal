export default function InstituteChart({ items }) {
    const total = items.reduce((sum, i) => sum + i.borrowed, 0);
    const max = Math.max(1, ...items.map((i) => i.borrowed));

    return (
        <section className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1F1F1F]">Institute usage</h2>
            <p className="text-xs text-gray-500">Borrows by the institute of the book.</p>

            {total === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">No borrows in this period.</p>
            ) : (
                <ul className="mt-4 space-y-3">
                    {items.map((i) => (
                        <li key={i.institute}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                                <span className="font-medium text-gray-700">{i.institute}</span>
                                <span className="text-gray-500">
                                    {i.borrowed} ({Math.round((i.borrowed / total) * 100)}%)
                                </span>
                            </div>

                            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-[#0D7856]"
                                    style={{ width: `${(i.borrowed / max) * 100}%` }}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}