// BorrowedBookCard.jsx
//
// Used by RenewBook.jsx. One card per active loan.
//
// Expected shape (see mockCurrentLoans in data/mockLibraryData.js):
// loan = {
//   id, bookId, bookTitle, bookAuthor, coverUrl,
//   borrowDate, dueDate, renewCount, maxRenewals, renewStatus
// }
//
// NOTE: date math here (days remaining) is done locally with plain
// Date arithmetic since utils/libraryHelpers.js (calculateDueDays) doesn't
// exist yet. Once it does, this should call that instead of duplicating
// the logic across files.

function getDaysRemaining(dueDate) {
    const due = new Date(dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

export default function BorrowedBookCard({ loan, onRenew }) {

    const daysRemaining = getDaysRemaining(loan.dueDate);
    const isOverdue = daysRemaining < 0;
    const isEligible = loan.renewStatus === "Eligible" && loan.renewalCount < loan.maxRenewals;

    const statusStyles = {
        Eligible: { bg: "#E1F5EE", color: "#085041" },
        Renewed: { bg: "#EEEDFE", color: "#3C3489" },
        "Not Eligible": { bg: "#FAECE7", color: "#712B13" },
    };
    const statusStyle = statusStyles.Eligible;

    return (
        <div className="bg-white/90 rounded-2xl shadow-sm p-4 flex gap-4">

            <img
                src={loan.coverUrl}
                alt={`Cover of ${loan.bookTitle}`}
                className="w-16 h-22 object-cover rounded-lg flex-shrink-0"
                style={{ height: "5.5rem" }}
            />

            <div className="flex-1 min-w-0">

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

                <p className="text-xs text-gray-500 mb-2 truncate">{loan.bookAuthor}</p>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400">
                            Due {new Date(loan.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                        <p className={`text-xs font-medium ${isOverdue ? "text-[#712B13]" : "text-[#106A2E]"}`}>
                            {isOverdue
                                ? `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? "" : "s"} overdue`
                                : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`}
                        </p>
                    </div>

                    <button
                        onClick={() => onRenew(loan.id)}
                        disabled={!isEligible}
                        className="
                            bg-[#106A2E] text-white
                            text-xs font-semibold
                            px-3.5 py-2 rounded-lg
                            hover:brightness-105 active:scale-[0.98]
                            disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:active:scale-100
                            transition-all
                        "
                    >
                        {loan.renewStatus === "Renewed" ? "Renewed" : "Renew"}
                    </button>
                </div>

            </div>

        </div>
    );

}