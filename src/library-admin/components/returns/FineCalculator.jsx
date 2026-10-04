import { formatPeso } from "../../utils/currencyUtils";

// Display only. The server computes the official fine again when the return is saved.
export default function FineCalculator({ loan }) {
    return (
        <div
            className={`rounded-xl border p-4 ${
                loan.fine > 0 ? "border-red-200 bg-red-50" : "border-[#106A2E]/20 bg-[#E1F0E4]/50"
            }`}
        >
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Days overdue</span>
                <span className="font-semibold text-gray-800">{loan.overdueDays}</span>
            </div>

            <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-gray-600">Fine per day</span>
                <span className="font-semibold text-gray-800">{formatPeso(loan.finePerDay)}</span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-black/[0.08] pt-3">
                <span className="text-sm font-medium text-gray-700">Total fine</span>
                <span className={`text-lg font-semibold ${loan.fine > 0 ? "text-red-600" : "text-[#106A2E]"}`}>
                    {formatPeso(loan.fine)}
                </span>
            </div>
        </div>
    );
}