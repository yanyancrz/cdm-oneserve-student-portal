import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DigitalIDCard from "../../components/DigitalIDCard/DigitalIDCard";
import { API_URL } from "../../config/api";
import BackgroundLayout from "../../layouts/BackgroundLayout";

export default function ViewDigitalID() {

    const [digitalId, setDigitalId] = useState(null);
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();


    // ==========================================
    // LOAD DIGITAL ID + REQUEST STATUS
    // ==========================================

    useEffect(() => {

        const loadDigitalID = async () => {

            try {

                const email =
                    localStorage.getItem("userEmail");

                if (!email) {
                    setDigitalId(null);
                    setRequest(null);
                    return;
                }

                const encodedEmail =
                    encodeURIComponent(email);


                // ==========================================
                // 1. CHECK APPROVED DIGITAL ID
                // ==========================================

                const digitalIdResponse =
                    await fetch(
                        `${API_URL}/api/digitalid/view/${encodedEmail}`
                    );


                let digitalIdData = null;


                if (digitalIdResponse.ok) {

                    digitalIdData =
                        await digitalIdResponse.json();

                }


                console.log(
                    "Digital ID:",
                    digitalIdData
                );


                setDigitalId(
                    digitalIdData
                );


                // ==========================================
                // 2. CHECK DIGITAL ID REQUEST
                // ==========================================

                const requestResponse =
                    await fetch(
                        `${API_URL}/api/digitalid/${encodedEmail}`
                    );


                let requestData = null;


                if (requestResponse.ok) {

                    requestData =
                        await requestResponse.json();

                }


                console.log(
                    "Digital ID Request:",
                    requestData
                );


                setRequest(
                    requestData
                );

            }
            catch (error) {

                console.error(
                    "Failed to load Digital ID:",
                    error
                );

                setDigitalId(null);
                setRequest(null);

            }
            finally {

                setLoading(false);

            }

        };


        loadDigitalID();

    }, []);


    // Small reusable pulsing block for skeleton state
    const Bone = ({ className = "" }) => (
        <div className={`animate-pulse bg-gray-300/90 rounded-lg ${className}`} />
    );


    // ==========================================
    // LOADING — skeleton shaped like the ID card view,
    // since that's the most common end state
    // ==========================================

    if (loading) {

        return (

            <BackgroundLayout>

                <div className="min-h-screen bg-slate-100 p-4">

                    <div className="max-w-md mx-auto">

                        <Bone className="h-7 w-40 mb-4" />

                        <div className="bg-white rounded-2xl p-5 shadow-lg">

                            {/* card header — photo + name/id lines */}
                            <div className="flex items-center gap-4 mb-5">
                                <Bone className="w-16 h-16 rounded-full flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <Bone className="h-4 w-3/4 mb-2" />
                                    <Bone className="h-3 w-1/2 mb-2" />
                                    <Bone className="h-3 w-1/3" />
                                </div>
                            </div>

                            {/* card body — a few detail rows */}
                            <div className="space-y-3 mb-5">
                                <Bone className="h-3 w-full" />
                                <Bone className="h-3 w-5/6" />
                                <Bone className="h-3 w-2/3" />
                            </div>

                            {/* QR / barcode placeholder */}
                            <Bone className="h-28 w-28 mx-auto rounded-xl" />

                        </div>

                    </div>

                </div>

            </BackgroundLayout>

        );

    }


    // ==========================================
    // CHECK REQUEST STATUS
    // ==========================================

    const requestStatus =
        request?.status?.toLowerCase();


    const hasPendingRequest =
        requestStatus === "pending" ||
        requestStatus === "forapproval" ||
        requestStatus === "forrejection";


    // ==========================================
    // APPROVED DIGITAL ID
    // ==========================================

    if (
        digitalId &&
        digitalId.hasDigitalId
    ) {

        return (

            <BackgroundLayout>

                <div className="min-h-screen bg-slate-100 p-4">

                    <div className="max-w-md mx-auto">

                        <h1 className="text-2xl font-bold mb-4">
                            Digital ID
                        </h1>


                        <DigitalIDCard
                            {...digitalId}
                        />

                    </div>

                </div>

            </BackgroundLayout>

        );

    }


    // ==========================================
    // PENDING / ACTIVE REQUEST
    // ==========================================

    if (hasPendingRequest) {

        return (

            <BackgroundLayout>

                <div className="min-h-screen flex items-center justify-center p-4">

                    <div className="bg-white rounded-2xl p-6 shadow-lg w-full max-w-sm text-center">

                        <div
                            className="
                                w-14
                                h-14
                                mx-auto
                                mb-4
                                rounded-full
                                bg-amber-50
                                flex
                                items-center
                                justify-center
                            "
                        >

                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#D97706"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >

                                <circle
                                    cx="12"
                                    cy="12"
                                    r="9"
                                />

                                <path d="M12 7v5l3 2" />

                            </svg>

                        </div>


                        <h2 className="text-xl font-semibold mb-3">
                            Request Submitted
                        </h2>


                        <p className="text-gray-500 mb-4">
                            Your Digital ID request has been received
                            and is currently being processed.
                        </p>


                        <div
                            className="
                                bg-amber-50
                                border
                                border-amber-200
                                rounded-xl
                                p-3
                            "
                        >

                            <p
                                className="
                                    text-sm
                                    font-medium
                                    text-amber-700
                                "
                            >
                                Status: {request?.status || "Pending"}
                            </p>


                            <p
                                className="
                                    text-xs
                                    text-amber-600
                                    mt-2
                                "
                            >
                                You'll be notified once your Digital ID
                                is ready.
                            </p>

                        </div>

                    </div>

                </div>

            </BackgroundLayout>

        );

    }


    // ==========================================
    // NO REQUEST / NO DIGITAL ID
    // ==========================================

    return (

        <BackgroundLayout>

            <div className="min-h-screen flex items-center justify-center p-4">

                <div
                    className="
                        bg-white
                        rounded-2xl
                        p-6
                        shadow-lg
                        w-full
                        max-w-sm
                        text-center
                    "
                >

                    <div
                        className="
                            w-14
                            h-14
                            mx-auto
                            mb-4
                            rounded-full
                            bg-[#106A2E]/10
                            flex
                            items-center
                            justify-center
                        "
                    >

                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#106A2E"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >

                            <rect
                                x="3"
                                y="4"
                                width="18"
                                height="16"
                                rx="2"
                            />

                            <path d="M8 9h8" />

                            <path d="M8 13h5" />

                        </svg>

                    </div>


                    <h2 className="text-xl font-semibold mb-3">
                        No Digital ID Found
                    </h2>


                    <p className="text-gray-500 mb-5">
                        Please submit a Digital ID request first.
                    </p>


                    <button
                        onClick={() =>
                            navigate("/request-digital-id")
                        }
                        className="
                            w-full
                            bg-[#106A2E]
                            hover:bg-[#0D7856]
                            text-white
                            p-3
                            rounded-xl
                            font-medium
                            transition-all
                        "
                    >
                        Request Digital ID
                    </button>

                </div>

            </div>

        </BackgroundLayout>

    );

}