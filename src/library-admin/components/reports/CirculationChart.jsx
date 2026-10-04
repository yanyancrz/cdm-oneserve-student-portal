import { formatBucket } from "../../config/reportOptions";

export default function CirculationChart({ report }) {
    const points = report.points || [];
    const max = Math.max(1, ...points.map((p) => Math.max(p.borrowed, p.returned)));

    // Show about 14 labels at most so they never overlap.
    const step = Math.max(1, Math.ceil(points.length / 14));

    return (
        <section className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-[#1F1F1F]">Circulation trends</h2>
                    <p className="text-xs text-gray-500">
                        {report.totalBorrowed} borrowed, {report.totalReturned} returned
                    </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-[#106A2E]" /> Borrowed
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-[#F4D35E]" /> Returned
                    </span>
                </div>
            </div>

            {report.totalBorrowed === 0 && report.totalReturned === 0 ? (
                <p className="py-16 text-center text-sm text-gray-500">No circulation in this period.</p>
            ) : (
                <div className="mt-5 overflow-x-auto">
                    <div className="flex h-52 items-end gap-1" style={{ minWidth: `${points.length * 26}px` }}>
                        {points.map((p, index) => {
                            const label = formatBucket(p.date, report.granularity);

                            return (
                                <div
                                    key={p.date}
                                    className="flex h-full min-w-0 flex-1 flex-col justify-end"
                                    title={`${label}: ${p.borrowed} borrowed, ${p.returned} returned`}
                                >
                                    <div className="flex flex-1 items-end justify-center gap-0.5">
                                        <div
                                            className="w-1/2 max-w-[12px] rounded-t bg-[#106A2E]"
                                            style={{ height: `${(p.borrowed / max) * 100}%`, minHeight: p.borrowed ? 2 : 0 }}
                                        />
                                        <div
                                            className="w-1/2 max-w-[12px] rounded-t bg-[#F4D35E]"
                                            style={{ height: `${(p.returned / max) * 100}%`, minHeight: p.returned ? 2 : 0 }}
                                        />
                                    </div>

                                    <p className="mt-1.5 h-4 truncate text-center text-[10px] text-gray-400">
                                        {index % step === 0 ? label : ""}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}