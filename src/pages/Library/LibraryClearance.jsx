import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import PageHeader from "../../components/Library/PageHeader";

import { mockClearance } from "../../data/mockLibraryData";

const STATUS_STYLES = {
    Cleared: { bg: "#DCFCE7", color: "#106A2E" },
    Pending: { bg: "#FAEEDA", color: "#633806" },
    Blocked: { bg: "#FEE2E2", color: "#B91C1C" },
};

export default function LibraryClearance() {

    const [clearance, setClearance] = useState(mockClearance);
    const [hasRequested, setHasRequested] = useState(false);

    const statusStyle = STATUS_STYLES[clearance.status] ?? STATUS_STYLES.Pending;

    const hasOutstandingItems =
        clearance.outstandingBooks > 0 || clearance.outstandingBalance > 0;

    const completedSteps = clearance.approvalSteps.filter((s) => s.complete).length;
    const totalSteps = clearance.approvalSteps.length;

    const canRequest = !hasOutstandingItems && clearance.status !== "Cleared";

    const handleRequestClearance = () => {
        // Placeholder only — no backend call yet. libraryService's
        // requestClearance() will replace this once that file exists.
        setHasRequested(true);
        setClearance((prev) => ({ ...prev, status: "Pending" }));
        toast.success("Clearance request submitted");
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
                    title="Library Clearance"
                    subtitle="Track your clearance status and requirements"
                />

                {/* STATUS CARD */}
                <div className="bg-white/90 rounded-[24px] shadow-sm p-5 sm:p-7 mb-5">

                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Clearance Status</p>
                            <span
                                className="inline-block text-sm font-semibold px-3 py-1.5 rounded-full"
                                style={{ background: statusStyle.bg, color: statusStyle.color }}
                            >
                                {clearance.status}
                            </span>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-[#106A2E]/10 text-[#106A2E] flex items-center justify-center flex-shrink-0">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 12l2 2 4-4" />
                                <circle cx="12" cy="12" r="9" />
                            </svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-[#F7FAF8] rounded-xl p-3.5">
                            <p className="text-[11px] text-gray-400 mb-1">Outstanding Books</p>
                            <p className={`text-lg font-semibold ${clearance.outstandingBooks > 0 ? "text-red-600" : "text-[#1F1F1F]"}`}>
                                {clearance.outstandingBooks}
                            </p>
                        </div>
                        <div className="bg-[#F7FAF8] rounded-xl p-3.5">
                            <p className="text-[11px] text-gray-400 mb-1">Outstanding Balance</p>
                            <p className={`text-lg font-semibold ${clearance.outstandingBalance > 0 ? "text-red-600" : "text-[#1F1F1F]"}`}>
                                ₱{clearance.outstandingBalance.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {hasOutstandingItems && (
                        <div className="border-2 border-dashed border-red-200 rounded-xl p-4 text-center mb-2">
                            <p className="text-xs text-red-600">
                                Return all borrowed books and settle any fines before requesting clearance.
                            </p>
                        </div>
                    )}
                </div>

                {/* APPROVAL PROGRESS */}
                <div className="bg-white/90 rounded-[24px] shadow-sm p-5 sm:p-7 mb-5">

                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-semibold text-[#1F1F1F]">
                            Approval Progress
                        </h3>
                        <span className="text-xs text-gray-400">
                            {completedSteps} of {totalSteps} complete
                        </span>
                    </div>

                    <div className="relative pl-7">

                        <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-gray-200" />

                        <div className="space-y-5">
                            {clearance.approvalSteps.map((step) => (
                                <div key={step.id} className="relative flex items-center gap-3">
                                    <div
                                        className={`
                                            absolute -left-7 w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0
                                            ${step.complete ? "bg-[#106A2E]" : "bg-white border-2 border-gray-200"}
                                        `}
                                    >
                                        {step.complete && (
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 6 9 17l-5-5" />
                                            </svg>
                                        )}
                                    </div>
                                    <p className={`text-sm ${step.complete ? "text-[#1F1F1F] font-semibold" : "text-gray-400"}`}>
                                        {step.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* REQUEST CLEARANCE */}
                {clearance.status === "Cleared" ? (
                    <div className="bg-white/90 rounded-[24px] shadow-sm p-6 text-center">
                        <p className="text-sm text-gray-500">
                            You're all cleared. No further action needed.
                        </p>
                    </div>
                ) : (
                    <button
                        onClick={handleRequestClearance}
                        disabled={!canRequest || hasRequested}
                        className={`
                            w-full p-3.5 rounded-xl font-semibold text-sm transition-all
                            ${canRequest && !hasRequested
                                ? "text-white bg-[#106A2E] hover:brightness-105 active:scale-[0.99]"
                                : "text-gray-400 bg-gray-100 cursor-not-allowed"
                            }
                        `}
                    >
                        {hasRequested ? "Clearance Requested" : "Request Clearance"}
                    </button>
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