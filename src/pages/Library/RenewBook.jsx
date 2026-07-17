import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import PageHeader from "../../components/Library/PageHeader";
import EmptyState from "../../components/Library/EmptyState";

import { mockCurrentLoans } from "../../data/mockLibraryData";
import { addDays, formatDate, calculateDueDays } from "../../utils/libraryHelpers";

const RENEWAL_EXTENSION_DAYS = 14;

export default function RenewBook() {

    const navigate = useNavigate();
    const [loans, setLoans] = useState(mockCurrentLoans || []);

    const handleRenew = (loanId) => {
        setLoans((prev) =>
            prev.map((loan) => {
                if (loan.id !== loanId) return loan;

                const newRenewCount = loan.renewCount + 1;
                const nowEligible = newRenewCount < loan.maxRenewals;

                return {
                    ...loan,
                    dueDate: addDays(loan.dueDate, RENEWAL_EXTENSION_DAYS).toISOString(),
                    renewCount: newRenewCount,
                    renewStatus: nowEligible ? "Eligible" : "Not Eligible",
                };
            })
        );
        // Placeholder only — no backend call yet. libraryService.renewBook()
        // will replace this once that file exists.
        toast.success("Book renewed successfully");
    };

    const statusStyles = {
        Eligible: { bg: "#DCFCE7", color: "#106A2E" },
        Renewed: { bg: "#E1F5EE", color: "#106A2E" },
        "Not Eligible": { bg: "#F3F4F6", color: "#6B7280" },
    };

    return (

        <div
            className="min-h-screen pb-24"
            style={{
                background: "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)",
            }}
        >

            <div className="max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto p-4 sm:p-6">

                <PageHeader
                    title="Renew Book"
                    subtitle="Extend the due date on your current loans"
                />

                {loans.length === 0 ? (
                    <EmptyState
                        title="No books to renew"
                        message="You don't have any borrowed books right now."
                        actionLabel="Browse Books"
                        onAction={() => navigate("/library/books")}
                    />
                ) : (
                    <div className="space-y-3">
                        {loans.map((loan) => {
                            const daysRemaining = calculateDueDays(loan.dueDate);
                            const isOverdue = daysRemaining < 0;
                            const isDueSoon = daysRemaining >= 0 && daysRemaining <= 3;
                            const canRenew = loan.renewStatus === "Eligible" && !isOverdue;

                            const daysLabel = isOverdue
                                ? `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? "" : "s"} overdue`
                                : daysRemaining === 0
                                ? "Due today"
                                : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`;

                            const daysColor = isOverdue
                                ? "text-red-500"
                                : isDueSoon
                                ? "text-amber-600"
                                : "text-gray-500";

                            const statusStyle = statusStyles[loan.renewStatus] ?? statusStyles["Not Eligible"];

                            return (
                                <div
                                    key={loan.id}
                                    className="bg-white/90 rounded-2xl shadow-sm p-4 flex gap-4"
                                >
                                    <img
                                        src={loan.coverUrl}
                                        alt={`Cover of ${loan.bookTitle}`}
                                        className="w-16 h-20 rounded-lg object-cover flex-shrink-0"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className="text-sm font-semibold text-[#1F1F1F] leading-snug truncate">
                                                {loan.bookTitle}
                                            </h3>
                                            <span
                                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                                                style={{ background: statusStyle.bg, color: statusStyle.color }}
                                            >
                                                {loan.renewStatus}
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-500 mb-2">{loan.bookAuthor}</p>

                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] mb-3">
                                            <span className="text-gray-500">
                                                Due: <span className="font-semibold text-[#1F1F1F]">{formatDate(loan.dueDate)}</span>
                                            </span>
                                            <span className={`font-semibold ${daysColor}`}>
                                                {daysLabel}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] text-gray-400">
                                                Renewed {loan.renewCount} of {loan.maxRenewals} times
                                            </p>
                                            <button
                                                onClick={() => handleRenew(loan.id)}
                                                disabled={!canRenew}
                                                className={`
                                                    px-4 py-2 rounded-lg text-xs font-semibold transition-all
                                                    ${canRenew
                                                        ? "text-white bg-[#106A2E] hover:brightness-105 active:scale-[0.99]"
                                                        : "text-gray-400 bg-gray-100 cursor-not-allowed"
                                                    }
                                                `}
                                            >
                                                Renew
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-6 text-center">
                    <Link
                        to="/library"
                        className="text-sm font-semibold text-[#106A2E] hover:underline"
                    >
                        Back to Library
                    </Link>
                </div>

            </div>

        </div>

    );

}