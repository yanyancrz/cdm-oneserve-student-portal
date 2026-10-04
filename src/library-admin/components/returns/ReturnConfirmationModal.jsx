import { useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";

import Modal from "../common/Modal";
import ReturnDetails from "./ReturnDetails";
import FineCalculator from "./FineCalculator";
import { CONDITIONS, PAYMENT_STATUSES } from "../../config/returnOptions";
import { returnService } from "../../services/returnService";
import { formatPeso } from "../../utils/currencyUtils";

export default function ReturnConfirmationModal({ loan, onClose, onDone }) {
    const [condition, setCondition] = useState("Good");
    const [paymentStatus, setPaymentStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null);

    if (!loan) return null;

    const hasFine = loan.fine > 0;
    const ready = Boolean(condition) && (!hasFine || Boolean(paymentStatus));

    const submit = async () => {
        setSaving(true);

        try {
            const data = await returnService.submit({
                transactionId: loan.transactionId,
                condition,
                paymentStatus: hasFine ? paymentStatus : null,
            });

            setResult(data);
            toast.success("Return recorded.");
            onDone?.();
        } catch (error) {
            toast.error(error?.message || "Unable to record the return.");
            onDone?.();
        } finally {
            setSaving(false);
        }
    };

    if (result) {
        return (
            <Modal
                open
                onClose={onClose}
                title="Return recorded"
                size="sm"
                footer={
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                        Done
                    </button>
                }
            >
                <div className="flex flex-col items-center text-center">
                    <CheckCircle2 size={40} className="text-[#106A2E]" />
                    <p className="mt-2 text-sm font-semibold text-[#1F1F1F]">{result.bookTitle}</p>
                    <p className="text-xs text-gray-500">returned by {result.patronName}</p>
                </div>

                <dl className="mt-5 space-y-1.5 text-sm">
                    <div className="flex justify-between"><dt className="text-gray-500">Condition</dt><dd className="font-medium">{result.condition}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Days overdue</dt><dd className="font-medium">{result.overdueDays}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Fine</dt><dd className="font-medium">{formatPeso(result.fine)}</dd></div>
                    {result.paymentStatus && (
                        <div className="flex justify-between"><dt className="text-gray-500">Payment</dt><dd className="font-medium">{result.paymentStatus}</dd></div>
                    )}
                    <div className="flex justify-between">
                        <dt className="text-gray-500">Copy</dt>
                        <dd className="font-medium">{result.copyReturnedToShelf ? "Back on shelf" : "Kept off shelf"}</dd>
                    </div>
                    <div className="flex justify-between"><dt className="text-gray-500">Processed by</dt><dd className="font-medium">{result.processedBy}</dd></div>
                </dl>
            </Modal>
        );
    }

    return (
        <Modal
            open
            onClose={saving ? undefined : onClose}
            title="Process return"
            size="md"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={!ready || saving}
                        className="rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Confirm return"}
                    </button>
                </>
            }
        >
            <div className="space-y-5">
                <ReturnDetails loan={loan} />

                <FineCalculator loan={loan} />

                <fieldset>
                    <legend className="mb-2 text-xs font-medium text-gray-600">Book condition</legend>

                    <div className="space-y-2">
                        {CONDITIONS.map((c) => (
                            <label
                                key={c.value}
                                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
                                    condition === c.value ? "border-[#106A2E] bg-[#E1F0E4]/50" : "border-black/[0.08]"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="condition"
                                    value={c.value}
                                    checked={condition === c.value}
                                    disabled={saving}
                                    onChange={() => setCondition(c.value)}
                                    className="mt-0.5"
                                />
                                <span>
                                    <span className="font-medium text-gray-800">{c.label}</span>
                                    <span className="block text-xs text-gray-500">{c.hint}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                {hasFine && (
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-600">
                            Fine payment status <span className="text-red-500">*</span>
                        </span>
                        <select
                            value={paymentStatus}
                            disabled={saving}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="w-full rounded-lg border border-black/[0.1] px-3 py-2 text-sm outline-none focus:border-[#106A2E]"
                        >
                            <option value="">Choose...</option>
                            {PAYMENT_STATUSES.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </label>
                )}
            </div>
        </Modal>
    );
}