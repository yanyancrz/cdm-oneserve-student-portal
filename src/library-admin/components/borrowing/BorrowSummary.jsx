import { LOAN_DAY_OPTIONS, previewDueDate } from "../../config/borrowOptions";
import { formatDate } from "../../utils/dateUtils";
import { formatPeso } from "../../utils/currencyUtils";

export default function BorrowSummary({
    patron,
    book,
    loanDays,
    onLoanDaysChange,
    accepted,
    onAcceptedChange,
    onConfirm,
    submitting,
    finePerDay = 10,
}) {
    const ready = Boolean(patron?.canBorrow && book && accepted);

    return (
        <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1F1F1F]">3. Confirm the loan</h2>

            {!book ? (
                <p className="mt-3 text-sm text-gray-500">Select a book to continue.</p>
            ) : (
                <>
                    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div>
                            <dt className="text-xs text-gray-400">Patron</dt>
                            <dd className="text-gray-800">{patron.fullName}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-400">Book</dt>
                            <dd className="truncate text-gray-800">{book.title}</dd>
                        </div>
                    </dl>

                    <div className="mt-4">
                        <p className="mb-1.5 text-xs font-medium text-gray-600">Loan period</p>

                        <div className="flex gap-2">
                            {LOAN_DAY_OPTIONS.map((days) => (
                                <button
                                    key={days}
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => onLoanDaysChange(days)}
                                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                                        loanDays === days
                                            ? "border-[#106A2E] bg-[#E1F0E4] text-[#106A2E]"
                                            : "border-black/[0.1] text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    {days} days
                                </button>
                            ))}
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                            Due on <span className="font-semibold text-gray-700">{formatDate(previewDueDate(loanDays))}</span>
                            . The server confirms the final date.
                        </p>
                    </div>

                    <label className="mt-4 flex items-start gap-2 text-xs text-gray-600">
                        <input
                            type="checkbox"
                            checked={accepted}
                            disabled={submitting}
                            onChange={(e) => onAcceptedChange(e.target.checked)}
                            className="mt-0.5"
                        />
                        <span>
                            The patron has been told the borrowing terms: return by the due date, and an overdue fine
                            of {formatPeso(finePerDay)} per day applies.
                        </span>
                    </label>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!ready || submitting}
                        className="mt-5 w-full rounded-lg bg-[#106A2E] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? "Issuing..." : "Confirm borrow"}
                    </button>
                </>
            )}
        </div>
    );
}