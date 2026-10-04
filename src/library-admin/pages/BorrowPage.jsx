import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import LibraryPageHeader from "../components/layout/LibraryPageHeader";
import PatronSearch from "../components/borrowing/PatronSearch";
import PatronCard from "../components/borrowing/PatronCard";
import BookSelection from "../components/borrowing/BookSelection";
import BorrowSummary from "../components/borrowing/BorrowSummary";
import BorrowReceipt from "../components/borrowing/BorrowReceipt";
import ScanPatronModal from "../components/borrowing/ScanPatronModal";
import StatusBadge from "../components/common/StatusBadge";

import { DEFAULT_LOAN_DAYS } from "../config/borrowOptions";
import { borrowingService } from "../services/borrowingService";
import { formatDate } from "../utils/dateUtils";

const STATUS_TONE = { Borrowed: "green", Overdue: "red", Returned: "gray" };

function RecentBorrows({ reloadKey }) {
    const [rows, setRows] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        borrowingService
            .list({ page: 1, pageSize: 5 }, { signal: controller.signal })
            .then((data) => {
                setRows(data?.items || []);
                setError(null);
            })
            .catch((err) => {
                if (err?.name === "AbortError") return;
                setError(err?.message || "Unable to load recent borrows.");
            });

        return () => controller.abort();
    }, [reloadKey]);

    return (
        <section className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
            <div className="border-b border-black/[0.05] px-5 py-4">
                <h2 className="text-sm font-semibold text-[#1F1F1F]">Recent transactions</h2>
            </div>

            {error ? (
                <p className="px-5 py-8 text-center text-sm text-gray-500">{error}</p>
            ) : !rows ? (
                <div className="space-y-2 p-5">
                    {[0, 1, 2].map((n) => (
                        <div key={n} className="h-9 animate-pulse rounded-lg bg-gray-100" />
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-500">No borrow transactions yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead>
                            <tr className="text-xs uppercase tracking-wide text-gray-400">
                                <th className="px-5 py-3 font-medium">Patron</th>
                                <th className="px-3 py-3 font-medium">Book</th>
                                <th className="px-3 py-3 font-medium">Borrowed</th>
                                <th className="px-3 py-3 font-medium">Due</th>
                                <th className="px-5 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.04]">
                            {rows.map((r) => (
                                <tr key={r.transactionId}>
                                    <td className="px-5 py-3">
                                        <p className="font-medium text-[#1F1F1F]">{r.patronName}</p>
                                        <p className="text-xs text-gray-400">{r.patronId || "—"}</p>
                                    </td>
                                    <td className="max-w-[240px] truncate px-3 py-3 text-gray-700">{r.bookTitle}</td>
                                    <td className="px-3 py-3 text-gray-600">{formatDate(r.borrowDate)}</td>
                                    <td className="px-3 py-3 text-gray-600">{formatDate(r.dueDate)}</td>
                                    <td className="px-5 py-3">
                                        <StatusBadge tone={STATUS_TONE[r.status] || "gray"}>{r.status}</StatusBadge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default function BorrowPage() {
    const [patron, setPatron] = useState(null);
    const [book, setBook] = useState(null);
    const [loanDays, setLoanDays] = useState(DEFAULT_LOAN_DAYS);
    const [accepted, setAccepted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const [scanOpen, setScanOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const resetBook = () => {
        setBook(null);
        setAccepted(false);
        setLoanDays(DEFAULT_LOAN_DAYS);
    };

    const resetAll = () => {
        setPatron(null);
        setReceipt(null);
        resetBook();
    };

    const choosePatron = (p) => {
        setPatron(p);
        setReceipt(null);
        resetBook();
    };

    const confirm = async () => {
        setSubmitting(true);

        try {
            const result = await borrowingService.borrow({
                userId: patron.userId,
                bookId: book.bookId,
                loanDays,
                acceptedTerms: accepted,
            });

            setReceipt(result);
            setReloadKey((n) => n + 1);
            toast.success("Book issued.");

            // Refresh the borrowing slots shown for this patron.
            try {
                setPatron(await borrowingService.patron(`uid:${patron.userId}`));
            } catch {
                // The receipt already shows the remaining slots.
            }
        } catch (error) {
            toast.error(error?.message || "Unable to complete the borrow.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <LibraryPageHeader title="Borrow Books" description="Scan or search a patron, then issue books." />

            <div className="space-y-6">
                {receipt ? (
                    <div className="mx-auto w-full max-w-xl">
                        <BorrowReceipt
                            receipt={receipt}
                            onBorrowAnother={() => {
                                setReceipt(null);
                                resetBook();
                            }}
                            onDone={resetAll}
                        />
                    </div>
                ) : !patron ? (
                    <div className="mx-auto w-full max-w-2xl">
                        <PatronSearch onSelect={choosePatron} onScanClick={() => setScanOpen(true)} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <div className="space-y-6">
                            <PatronCard patron={patron} onChange={resetAll} disabled={submitting} />
                            {patron.canBorrow && (
                                <BookSelection selected={book} onSelect={setBook} disabled={submitting} />
                            )}
                        </div>

                        {patron.canBorrow && (
                            <BorrowSummary
                                patron={patron}
                                book={book}
                                loanDays={loanDays}
                                onLoanDaysChange={setLoanDays}
                                accepted={accepted}
                                onAcceptedChange={setAccepted}
                                onConfirm={confirm}
                                submitting={submitting}
                            />
                        )}
                    </div>
                )}

                <RecentBorrows reloadKey={reloadKey} />
            </div>

            <ScanPatronModal open={scanOpen} onClose={() => setScanOpen(false)} onPatron={choosePatron} />
        </>
    );
}