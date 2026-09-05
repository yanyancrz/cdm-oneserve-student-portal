import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import QRCode from "react-qr-code";

import PageHeader from "../../components/Library/PageHeader";
import EmptyState from "../../components/Library/EmptyState";

import { getBorrowById } from "../../services/libraryService";

import { API_URL } from "../../config/api";
import noCover from "../../assets/images/no-cover.png";


function formatDate(date) {

    if (!date) {
        return "—";
    }

    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}


export default function BorrowClaimPass() {

    const { borrowId } = useParams();

    const navigate = useNavigate();

    const [borrow, setBorrow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {

        const loadBorrow = async () => {

            try {

                const response = await getBorrowById(borrowId);

                setBorrow(
                    response.data ?? response
                );

            } catch (err) {

                console.error(err);

                setError(
                    err.message ||
                    "Failed to load borrow claim pass."
                );

            } finally {

                setLoading(false);

            }

        };

        loadBorrow();

    }, [borrowId]);


    if (loading) {

        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{
                    background:
                        "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)",
                }}
            >
                <p className="text-sm text-gray-500">
                    Loading claim pass...
                </p>
            </div>
        );

    }


    if (error || !borrow) {

        return (
            <div
                className="min-h-screen pb-24"
                style={{
                    background:
                        "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)",
                }}
            >

                <div className="max-w-md mx-auto p-4 sm:p-6">

                    <PageHeader
                        title="Borrow Claim Pass"
                    />

                    <EmptyState
                        title="Claim pass unavailable"
                        message={
                            error ||
                            "This borrow transaction could not be found."
                        }
                        actionLabel="Back to Library"
                        onAction={() =>
                            navigate("/library")
                        }
                    />

                </div>

            </div>
        );

    }


    const qrValue =
        `CDM-ONESERVE-BORROW-${borrow.borrowId}`;


    const isForClaiming =
        borrow.status === "ForClaiming";


    return (

        <div
            className="min-h-screen pb-24"
            style={{
                background:
                    "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)",
            }}
        >

            <div className="max-w-md sm:max-w-xl mx-auto p-4 sm:p-6">

                <PageHeader
                    title="Borrow Claim Pass"
                    subtitle="Present this pass at the library counter"
                />


                <div className="
                    bg-white/95
                    rounded-[28px]
                    shadow-sm
                    overflow-hidden
                ">

                    {/* HEADER */}

                    <div className="
                        bg-[#106A2E]
                        text-white
                        px-5
                        py-4
                        flex
                        items-center
                        justify-between
                        gap-3
                    ">

                        <div>

                            <p className="
                                text-[10px]
                                uppercase
                                tracking-[0.18em]
                                opacity-80
                                mb-1
                            ">
                                CDM OneServe Library
                            </p>

                            <h2 className="
                                text-lg
                                font-semibold
                            ">
                                Borrow Claim Pass
                            </h2>

                        </div>


                        <span className="
                            text-[10px]
                            font-semibold
                            px-2.5
                            py-1
                            rounded-full
                            bg-white/15
                        ">
                            {borrow.status}
                        </span>

                    </div>


                    {/* BOOK INFO */}

                    <div className="p-5">

                        <div className="
                            flex
                            gap-4
                            items-start
                            mb-6
                        ">

                            <img
                                src={
                                    borrow.coverImage
                                        ? `${API_URL}/${borrow.coverImage}`
                                        : noCover
                                }
                                onError={(e) => {
                                    e.currentTarget.src = noCover;
                                }}
                                alt={`Cover of ${borrow.bookTitle}`}
                                className="
                                    w-20
                                    h-28
                                    rounded-xl
                                    object-cover
                                    flex-shrink-0
                                    shadow-sm
                                "
                            />


                            <div className="min-w-0 flex-1">

                                <h3 className="
                                    text-base
                                    font-semibold
                                    text-[#1F1F1F]
                                    leading-snug
                                    mb-1
                                ">
                                    {borrow.bookTitle}
                                </h3>

                                <p className="
                                    text-sm
                                    text-gray-500
                                    mb-3
                                ">
                                    {borrow.author}
                                </p>


                                <div className="
                                    text-xs
                                    text-gray-500
                                    space-y-1
                                ">

                                    <p>
                                        Borrow ID:{" "}
                                        <span className="
                                            font-semibold
                                            text-[#1F1F1F]
                                        ">
                                            #{borrow.borrowId}
                                        </span>
                                    </p>

                                    <p>
                                        Request Date:{" "}
                                        <span className="
                                            font-semibold
                                            text-[#1F1F1F]
                                        ">
                                            {formatDate(
                                                borrow.borrowDate
                                            )}
                                        </span>
                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* QR CODE */}

                        <div className="
                            bg-[#F7FAF8]
                            rounded-2xl
                            p-6
                            text-center
                            mb-5
                        ">

                            <div className="
                                inline-flex
                                bg-white
                                p-4
                                rounded-2xl
                                shadow-sm
                                mb-4
                            ">

                                <QRCode
                                    value={qrValue}
                                    size={180}
                                />

                            </div>


                            <p className="
                                text-xs
                                font-semibold
                                text-[#1F1F1F]
                                mb-1
                            ">
                                Scan to verify borrow request
                            </p>

                            <p className="
                                text-[11px]
                                text-gray-500
                            ">
                                {qrValue}
                            </p>

                        </div>


                        {/* INSTRUCTIONS */}

                        {isForClaiming ? (

                            <div className="
                                bg-[#E1F5EE]
                                border
                                border-[#106A2E]/10
                                rounded-xl
                                p-4
                                mb-5
                            ">

                                <div className="flex items-start gap-3">

                                    <div className="
                                        w-9
                                        h-9
                                        rounded-full
                                        bg-[#106A2E]
                                        text-white
                                        flex
                                        items-center
                                        justify-center
                                        flex-shrink-0
                                    ">
                                        ✓
                                    </div>

                                    <div>

                                        <p className="
                                            text-sm
                                            font-semibold
                                            text-[#106A2E]
                                            mb-1
                                        ">
                                            Ready for Claiming
                                        </p>

                                        <p className="
                                            text-xs
                                            text-gray-600
                                            leading-relaxed
                                        ">
                                            Present this QR code at the library counter.
                                            The librarian will verify your borrow request
                                            before releasing the physical book.
                                        </p>

                                    </div>

                                </div>

                            </div>

                        ) : (

                            <div className="
                                bg-gray-100
                                rounded-xl
                                p-4
                                mb-5
                            ">

                                <p className="
                                    text-sm
                                    font-semibold
                                    text-gray-700
                                    mb-1
                                ">
                                    Status: {borrow.status}
                                </p>

                                <p className="
                                    text-xs
                                    text-gray-500
                                    leading-relaxed
                                ">
                                    This claim pass is no longer awaiting library verification.
                                </p>

                            </div>

                        )}


                        {/* ACTIONS */}

                        <div className="grid grid-cols-2 gap-3">

                            <Link
                                to="/library/borrow-history"
                                className="
                                    p-3.5
                                    rounded-xl
                                    text-sm
                                    font-semibold
                                    text-[#106A2E]
                                    bg-[#E1F5EE]
                                    text-center
                                    hover:brightness-105
                                    transition-all
                                "
                            >
                                Borrow History
                            </Link>

                            <Link
                                to="/library"
                                className="
                                    p-3.5
                                    rounded-xl
                                    text-sm
                                    font-semibold
                                    text-white
                                    bg-[#106A2E]
                                    text-center
                                    hover:brightness-105
                                    transition-all
                                "
                            >
                                Back to Library
                            </Link>

                        </div>



                    </div>

                </div>

            </div>

        </div>

    );

}