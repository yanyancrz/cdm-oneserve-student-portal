export default function TopBooksTable({ books }) {
    return (
        <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
            <div className="border-b border-black/[0.05] px-5 py-4">
                <h2 className="text-sm font-semibold text-[#1F1F1F]">Most borrowed books</h2>
                <p className="text-xs text-gray-500">Top 10 in this period.</p>
            </div>

            {books.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-gray-500">No borrows in this period.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-sm">
                        <thead>
                            <tr className="text-xs uppercase tracking-wide text-gray-400">
                                <th className="px-5 py-3 font-medium">#</th>
                                <th className="px-3 py-3 font-medium">Book</th>
                                <th className="px-3 py-3 font-medium">Author</th>
                                <th className="px-5 py-3 text-right font-medium">Borrowed</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-black/[0.04]">
                            {books.map((b, index) => (
                                <tr key={b.bookId}>
                                    <td className="px-5 py-3 text-gray-400">{index + 1}</td>
                                    <td className="max-w-[260px] truncate px-3 py-3 font-medium text-[#1F1F1F]" title={b.title}>
                                        {b.title}
                                    </td>
                                    <td className="max-w-[180px] truncate px-3 py-3 text-gray-600">{b.author}</td>
                                    <td className="px-5 py-3 text-right font-semibold text-gray-800">{b.borrowCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}