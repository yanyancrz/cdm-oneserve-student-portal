import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
    QrCode,
    Camera,
    CheckCircle2,
    XCircle,
    RotateCcw,
    User,
    CreditCard,
    BookOpen,
    ShieldCheck,
    Loader2,
} from "lucide-react";

import { API_URL } from "../../config/api";

export default function Scanner() {
    const scannerRef = useRef(null);
    const processingRef = useRef(false);

    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    // =========================================================
    // STOP SCANNER
    // =========================================================

    const stopScanner = async () => {
        const scanner = scannerRef.current;

        if (!scanner) {
            setScanning(false);
            return;
        }

        try {
            const state = scanner.getState();

            // Html5Qrcode scanning state = 2
            if (state === 2) {
                await scanner.stop();
            }

            try {
                await scanner.clear();
            } catch (clearError) {
                console.warn(
                    "Scanner clear warning:",
                    clearError
                );
            }
        } catch (err) {
            console.warn(
                "Scanner cleanup warning:",
                err
            );
        }

        scannerRef.current = null;
        setScanning(false);
    };

    // =========================================================
    // GET AUTH TOKEN
    // =========================================================

    const getAuthToken = () => {
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("authToken");

        return token;
    };

    // =========================================================
    // VERIFY QR WITH API
    // =========================================================

    const verifyQr = async (qrText) => {
        // Prevent duplicate requests
        if (processingRef.current) {
            return;
        }

        processingRef.current = true;

        setLoading(true);
        setError("");

        try {
            console.log(
                "================================="
            );

            console.log(
                "QR DATA:",
                qrText
            );

            console.log(
                "API URL:",
                API_URL
            );

            console.log(
                "================================="
            );

            // Stop camera first
            await stopScanner();

            // =====================================================
            // CHECK API URL
            // =====================================================

            if (!API_URL) {
                throw new Error(
                    "API URL is not configured."
                );
            }

            // =====================================================
            // GET JWT TOKEN
            // =====================================================

            const token = getAuthToken();

            console.log(
                "JWT TOKEN EXISTS:",
                Boolean(token)
            );

            if (!token) {
                throw new Error(
                    "Your login session is missing or expired. Please log in again."
                );
            }

            // =====================================================
            // API ENDPOINT
            // =====================================================

            const endpoint =
                `${API_URL}/api/library/scanner/verify`;

            console.log(
                "VERIFY ENDPOINT:",
                endpoint
            );

            // =====================================================
            // SEND REQUEST
            // =====================================================

            const response = await fetch(
                endpoint,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        qrData: qrText,
                    }),
                }
            );

            console.log(
                "HTTP STATUS:",
                response.status
            );

            console.log(
                "HTTP STATUS TEXT:",
                response.statusText
            );

            // =====================================================
            // READ SERVER RESPONSE
            // =====================================================

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            let data = null;

            if (
                contentType.includes(
                    "application/json"
                )
            ) {
                try {
                    data =
                        await response.json();
                } catch (jsonError) {
                    console.error(
                        "JSON parsing error:",
                        jsonError
                    );

                    throw new Error(
                        "The server returned an invalid JSON response."
                    );
                }
            } else {
                const text =
                    await response.text();

                console.log(
                    "NON-JSON SERVER RESPONSE:",
                    text
                );

                data = {
                    message:
                        text ||
                        "The server returned an invalid response.",
                };
            }

            console.log(
                "SERVER RESPONSE:",
                data
            );

            // =====================================================
            // 401 UNAUTHORIZED
            // =====================================================

            if (response.status === 401) {
                console.error(
                    "401 Unauthorized - JWT rejected by API."
                );

                // Remove invalid tokens
                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "authToken"
                );

                throw new Error(
                    "Your login session is invalid or expired. Please log in again."
                );
            }

            // =====================================================
            // 403 FORBIDDEN
            // =====================================================

            if (response.status === 403) {
                throw new Error(
                    data?.message ||
                        data?.error ||
                        data?.data?.message ||
                        "You are not authorized to use the library scanner."
                );
            }

            // =====================================================
            // OTHER SERVER ERRORS
            // =====================================================

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        data?.error ||
                        data?.data?.message ||
                        `Server returned HTTP ${response.status}.`
                );
            }

            // =====================================================
            // SUCCESS
            // =====================================================

            const verificationResult =
                data?.data || data;

            console.log(
                "VERIFICATION RESULT:",
                verificationResult
            );

            setResult(
                verificationResult
            );

        } catch (err) {
            console.error(
                "QR verification error:",
                err
            );

            setError(
                err?.message ||
                    "Unable to connect to the library server."
            );
        } finally {
            setLoading(false);
            processingRef.current = false;
        }
    };

    // =========================================================
    // QR SUCCESS HANDLER
    // =========================================================

    const handleQrDetected = async (
        decodedText
    ) => {
        console.log(
            "QR detected:",
            decodedText
        );

        if (
            processingRef.current
        ) {
            return;
        }

        if (!decodedText) {
            return;
        }

        await verifyQr(
            decodedText
        );
    };

    // =========================================================
    // START SCANNER
    // =========================================================

    const startScanner = async () => {
        // Reset state
        setResult(null);
        setError("");
        setLoading(false);
        processingRef.current = false;

        try {
            // =====================================================
            // SECURE CONTEXT CHECK
            // =====================================================

            if (
                !window.isSecureContext &&
                window.location.hostname !==
                    "localhost"
            ) {
                setError(
                    "Camera access requires HTTPS. Please open the secure CDM OneServe website."
                );

                return;
            }

            // =====================================================
            // CAMERA SUPPORT CHECK
            // =====================================================

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices
                    .getUserMedia
            ) {
                setError(
                    "Camera access is not supported by this browser."
                );

                return;
            }

            // =====================================================
            // CLEAR OLD SCANNER
            // =====================================================

            await stopScanner();

            // =====================================================
            // SHOW SCANNING STATE
            // =====================================================

            setScanning(true);

            // =====================================================
            // CREATE SCANNER
            // =====================================================

            const scanner =
                new Html5Qrcode(
                    "library-qr-reader"
                );

            scannerRef.current =
                scanner;

            // =====================================================
            // CAMERA CONFIGURATION
            // =====================================================

            const config = {
                fps: 10,

                qrbox: {
                    width: 250,
                    height: 250,
                },

                aspectRatio: 1,

                rememberLastUsedCamera:
                    true,

                showTorchButtonIfSupported:
                    true,

                showZoomSliderIfSupported:
                    true,

                defaultZoomValueIfSupported:
                    2,
            };

            // =====================================================
            // PRIMARY CAMERA
            // =====================================================

            console.log(
                "Trying primary camera..."
            );

            await scanner.start(
                {
                    facingMode: {
                        exact: "environment",
                    },
                },

                config,

                async (
                    decodedText
                ) => {
                    await handleQrDetected(
                        decodedText
                    );
                },

                () => {
                    // Normal QR scanning errors.
                    // These happen continuously while
                    // searching for a QR code.
                }
            );

            console.log(
                "Primary camera started."
            );

        } catch (primaryError) {
            console.error(
                "Primary camera error:",
                primaryError
            );

            // =====================================================
            // FALLBACK CAMERA
            // =====================================================

            try {
                console.log(
                    "Trying fallback camera..."
                );

                await stopScanner();

                const cameras =
                    await Html5Qrcode.getCameras();

                console.log(
                    "Available cameras:",
                    cameras
                );

                if (
                    !cameras ||
                    cameras.length === 0
                ) {
                    throw new Error(
                        "No camera was found."
                    );
                }

                // =================================================
                // SELECT CAMERA
                // =================================================

                let selectedCamera =
                    cameras.find(
                        (camera) =>
                            /back|rear|environment/i.test(
                                camera.label ||
                                    ""
                            )
                    );

                if (
                    !selectedCamera
                ) {
                    selectedCamera =
                        cameras[
                            cameras.length -
                                1
                        ];
                }

                console.log(
                    "Selected camera:",
                    selectedCamera
                );

                // =================================================
                // CREATE FALLBACK SCANNER
                // =================================================

                const fallbackScanner =
                    new Html5Qrcode(
                        "library-qr-reader"
                    );

                scannerRef.current =
                    fallbackScanner;

                setScanning(true);

                // =================================================
                // FALLBACK CONFIG
                // =================================================

                const fallbackConfig = {
                    fps: 10,

                    qrbox: {
                        width: 250,
                        height: 250,
                    },

                    aspectRatio: 1,

                    rememberLastUsedCamera:
                        true,

                    showTorchButtonIfSupported:
                        true,

                    showZoomSliderIfSupported:
                        true,

                    defaultZoomValueIfSupported:
                        2,
                };

                // =================================================
                // START FALLBACK
                // =================================================

                await fallbackScanner.start(
                    selectedCamera.id,

                    fallbackConfig,

                    async (
                        decodedText
                    ) => {
                        await handleQrDetected(
                            decodedText
                        );
                    },

                    () => {
                        // Ignore normal QR scan errors
                    }
                );

                console.log(
                    "Fallback camera started."
                );

                return;

            } catch (fallbackError) {
                console.error(
                    "Fallback camera error:",
                    fallbackError
                );
            }

            // =====================================================
            // CAMERA FAILED
            // =====================================================

            await stopScanner();

            setScanning(false);

            setError(
                "Unable to access the camera. Please allow camera permission and make sure you are using HTTPS."
            );
        }
    };

    // =========================================================
    // SCAN AGAIN
    // =========================================================

    const scanAgain = async () => {
        await stopScanner();

        setResult(null);
        setError("");
        setLoading(false);
        processingRef.current = false;

        setTimeout(() => {
            startScanner();
        }, 300);
    };

    // =========================================================
    // CLEANUP WHEN PAGE CLOSES
    // =========================================================

    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="min-h-screen bg-[#f6f8f5] px-4 py-6 sm:px-6">

            <div className="mx-auto w-full max-w-2xl">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="mb-6">

                    <div className="flex items-center gap-3">

                        <div
                            className="
                                flex
                                h-11
                                w-11
                                items-center
                                justify-center
                                rounded-2xl
                                bg-[#106A2E]
                                text-white
                                shadow-sm
                            "
                        >
                            <QrCode size={23} />
                        </div>

                        <div>

                            <p
                                className="
                                    text-[11px]
                                    font-semibold
                                    uppercase
                                    tracking-[0.18em]
                                    text-[#106A2E]
                                "
                            >
                                CDM LibHub
                            </p>

                            <h1
                                className="
                                    text-2xl
                                    font-bold
                                    text-slate-800
                                "
                            >
                                Library Scanner
                            </h1>

                        </div>

                    </div>

                    <p
                        className="
                            mt-2
                            text-sm
                            leading-6
                            text-slate-500
                        "
                    >
                        Scan a student's or faculty
                        member's QR code to verify
                        their borrowing eligibility.
                    </p>

                </div>

                {/* ==================================================
                    RESULT
                ================================================== */}

                {result ? (

                    <div
                        className={`
                            overflow-hidden
                            rounded-3xl
                            border
                            bg-white
                            shadow-sm
                            ${
                                result.cleared
                                    ? "border-emerald-200"
                                    : "border-red-200"
                            }
                        `}
                    >

                        {/* STATUS HEADER */}

                        <div
                            className={`
                                px-6
                                py-8
                                ${
                                    result.cleared
                                        ? "bg-[#106A2E]"
                                        : "bg-red-600"
                                }
                            `}
                        >

                            <div
                                className="
                                    flex
                                    flex-col
                                    items-center
                                    text-center
                                    text-white
                                "
                            >

                                <div
                                    className="
                                        mb-3
                                        flex
                                        h-16
                                        w-16
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-white/15
                                    "
                                >

                                    {result.cleared ? (
                                        <CheckCircle2
                                            size={38}
                                        />
                                    ) : (
                                        <XCircle
                                            size={38}
                                        />
                                    )}

                                </div>

                                <h2
                                    className="
                                        text-2xl
                                        font-bold
                                    "
                                >
                                    {result.cleared
                                        ? "CLEARED"
                                        : "NOT CLEARED"}
                                </h2>

                                <p
                                    className="
                                        mt-1
                                        text-sm
                                        text-white/80
                                    "
                                >
                                    {result.message ||
                                        "Verification completed."}
                                </p>

                            </div>

                        </div>

                        {/* DETAILS */}

                        <div className="space-y-3 p-5">

                            {/* NAME */}

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-4
                                    rounded-2xl
                                    bg-slate-50
                                    p-4
                                "
                            >

                                <div
                                    className="
                                        flex
                                        h-11
                                        w-11
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-emerald-50
                                        text-[#106A2E]
                                    "
                                >
                                    <User size={21} />
                                </div>

                                <div>

                                    <p
                                        className="
                                            text-xs
                                            text-slate-400
                                        "
                                    >
                                        Name
                                    </p>

                                    <p
                                        className="
                                            font-semibold
                                            text-slate-800
                                        "
                                    >
                                        {result.name ||
                                            "N/A"}
                                    </p>

                                </div>

                            </div>

                            {/* ID + ROLE */}

                            <div
                                className="
                                    grid
                                    gap-3
                                    sm:grid-cols-2
                                "
                            >

                                <div
                                    className="
                                        rounded-2xl
                                        bg-slate-50
                                        p-4
                                    "
                                >

                                    <div
                                        className="
                                            mb-2
                                            flex
                                            items-center
                                            gap-2
                                            text-slate-400
                                        "
                                    >

                                        <CreditCard
                                            size={16}
                                        />

                                        <span className="text-xs">
                                            ID Number
                                        </span>

                                    </div>

                                    <p
                                        className="
                                            font-semibold
                                            text-slate-800
                                        "
                                    >
                                        {result.idNumber ||
                                            "N/A"}
                                    </p>

                                </div>

                                <div
                                    className="
                                        rounded-2xl
                                        bg-slate-50
                                        p-4
                                    "
                                >

                                    <div
                                        className="
                                            mb-2
                                            flex
                                            items-center
                                            gap-2
                                            text-slate-400
                                        "
                                    >

                                        <ShieldCheck
                                            size={16}
                                        />

                                        <span className="text-xs">
                                            Role
                                        </span>

                                    </div>

                                    <p
                                        className="
                                            font-semibold
                                            text-slate-800
                                        "
                                    >
                                        {result.role ||
                                            "N/A"}
                                    </p>

                                </div>

                            </div>

                            {/* INSTITUTE */}

                            {result.institute && (
                                <div
                                    className="
                                        rounded-2xl
                                        bg-slate-50
                                        p-4
                                    "
                                >

                                    <p
                                        className="
                                            text-xs
                                            text-slate-400
                                        "
                                    >
                                        Institute
                                    </p>

                                    <p
                                        className="
                                            mt-1
                                            font-semibold
                                            text-slate-800
                                        "
                                    >
                                        {result.institute}
                                    </p>

                                </div>
                            )}

                            {/* PROGRAM */}

                            {result.program && (
                                <div
                                    className="
                                        rounded-2xl
                                        bg-slate-50
                                        p-4
                                    "
                                >

                                    <p
                                        className="
                                            text-xs
                                            text-slate-400
                                        "
                                    >
                                        Program
                                    </p>

                                    <p
                                        className="
                                            mt-1
                                            font-semibold
                                            text-slate-800
                                        "
                                    >
                                        {result.program}
                                    </p>

                                </div>
                            )}

                            {/* BORROWING STATUS */}

                            <div
                                className="
                                    rounded-2xl
                                    border
                                    border-slate-200
                                    p-5
                                "
                            >

                                <div
                                    className="
                                        mb-4
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >

                                    <BookOpen
                                        size={19}
                                        className="text-[#106A2E]"
                                    />

                                    <h3
                                        className="
                                            font-semibold
                                            text-slate-800
                                        "
                                    >
                                        Borrowing Status
                                    </h3>

                                </div>

                                <div
                                    className="
                                        grid
                                        grid-cols-3
                                        gap-3
                                        text-center
                                    "
                                >

                                    <div>

                                        <p
                                            className="
                                                text-2xl
                                                font-bold
                                                text-slate-800
                                            "
                                        >
                                            {result.borrowedBooks ??
                                                0}
                                        </p>

                                        <p
                                            className="
                                                text-[11px]
                                                text-slate-400
                                            "
                                        >
                                            Borrowed
                                        </p>

                                    </div>

                                    <div>

                                        <p
                                            className="
                                                text-2xl
                                                font-bold
                                                text-slate-800
                                            "
                                        >
                                            {result.borrowLimit ??
                                                0}
                                        </p>

                                        <p
                                            className="
                                                text-[11px]
                                                text-slate-400
                                            "
                                        >
                                            Limit
                                        </p>

                                    </div>

                                    <div>

                                        <p
                                            className={`
                                                text-2xl
                                                font-bold
                                                ${
                                                    (
                                                        result.remainingBooks ??
                                                        0
                                                    ) > 0
                                                        ? "text-[#106A2E]"
                                                        : "text-red-600"
                                                }
                                            `}
                                        >
                                            {result.remainingBooks ??
                                                0}
                                        </p>

                                        <p
                                            className="
                                                text-[11px]
                                                text-slate-400
                                            "
                                        >
                                            Remaining
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* ACCOUNT STATUS */}

                            <div
                                className={`
                                    rounded-2xl
                                    p-4
                                    text-center
                                    ${
                                        result.cleared
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-red-50 text-red-700"
                                    }
                                `}
                            >

                                <p
                                    className="
                                        text-xs
                                        font-medium
                                        uppercase
                                        tracking-wider
                                    "
                                >
                                    Account Status
                                </p>

                                <p
                                    className="
                                        mt-1
                                        text-lg
                                        font-bold
                                    "
                                >
                                    {result.status ||
                                        "N/A"}
                                </p>

                            </div>

                            {/* SCAN AGAIN */}

                            <button
                                type="button"
                                onClick={scanAgain}
                                className="
                                    flex
                                    w-full
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-2xl
                                    bg-[#106A2E]
                                    px-5
                                    py-3.5
                                    text-sm
                                    font-semibold
                                    text-white
                                    transition
                                    hover:bg-[#0d5927]
                                    active:scale-[0.98]
                                "
                            >

                                <RotateCcw
                                    size={18}
                                />

                                Scan Another QR

                            </button>

                        </div>

                    </div>

                ) : (

                    /* ==================================================
                       SCANNER
                    ================================================== */

                    <div
                        className="
                            overflow-hidden
                            rounded-3xl
                            border
                            border-slate-200
                            bg-white
                            shadow-sm
                        "
                    >

                        {/* HEADER */}

                        <div
                            className="
                                border-b
                                border-slate-100
                                px-5
                                py-4
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                "
                            >

                                <Camera
                                    size={18}
                                    className="text-[#106A2E]"
                                />

                                <span
                                    className="
                                        font-semibold
                                        text-slate-800
                                    "
                                >
                                    Scan QR Code
                                </span>

                            </div>

                            <p
                                className="
                                    mt-1
                                    text-xs
                                    text-slate-500
                                "
                            >
                                Position the QR code inside
                                the scanning area.
                            </p>

                        </div>

                        {/* CAMERA AREA */}

                        <div
                            className="
                                relative
                                overflow-hidden
                                bg-slate-950
                                p-4
                            "
                        >

                            {/* HTML5 QR CONTAINER */}

                            <div
                                id="library-qr-reader"
                                className="
                                    mx-auto
                                    min-h-[320px]
                                    w-full
                                    max-w-md
                                    overflow-hidden
                                    rounded-2xl
                                "
                            />

                            {/* READY STATE */}

                            {!scanning &&
                                !loading && (

                                    <div
                                        className="
                                            absolute
                                            inset-0
                                            flex
                                            flex-col
                                            items-center
                                            justify-center
                                            bg-slate-950
                                            px-6
                                            text-center
                                        "
                                    >

                                        <div
                                            className="
                                                mb-4
                                                flex
                                                h-16
                                                w-16
                                                items-center
                                                justify-center
                                                rounded-full
                                                bg-white/10
                                                text-white
                                            "
                                        >

                                            <QrCode
                                                size={32}
                                            />

                                        </div>

                                        <h2
                                            className="
                                                text-lg
                                                font-semibold
                                                text-white
                                            "
                                        >
                                            Ready to Scan
                                        </h2>

                                        <p
                                            className="
                                                mt-2
                                                max-w-xs
                                                text-sm
                                                text-slate-300
                                            "
                                        >
                                            Use this device's
                                            camera to scan a
                                            CDM Library
                                            Access Pass.
                                        </p>

                                        <button
                                            type="button"
                                            onClick={
                                                startScanner
                                            }
                                            className="
                                                mt-6
                                                flex
                                                items-center
                                                justify-center
                                                gap-2
                                                rounded-xl
                                                bg-[#106A2E]
                                                px-6
                                                py-3
                                                text-sm
                                                font-semibold
                                                text-white
                                                shadow-lg
                                                transition
                                                hover:bg-[#0d5927]
                                                active:scale-[0.98]
                                            "
                                        >

                                            <Camera
                                                size={20}
                                            />

                                            Start Camera

                                        </button>

                                    </div>

                                )}

                            {/* LOADING */}

                            {loading && (

                                <div
                                    className="
                                        absolute
                                        inset-0
                                        flex
                                        flex-col
                                        items-center
                                        justify-center
                                        bg-slate-950/90
                                    "
                                >

                                    <Loader2
                                        size={42}
                                        className="
                                            animate-spin
                                            text-white
                                        "
                                    />

                                    <p
                                        className="
                                            mt-4
                                            text-lg
                                            font-semibold
                                            text-white
                                        "
                                    >
                                        Checking account...
                                    </p>

                                    <p
                                        className="
                                            mt-2
                                            text-sm
                                            text-slate-300
                                        "
                                    >
                                        Please wait.
                                    </p>

                                </div>

                            )}

                        </div>

                        {/* STOP BUTTON */}

                        {scanning &&
                            !loading && (

                                <div
                                    className="
                                        flex
                                        justify-center
                                        px-5
                                        py-4
                                    "
                                >

                                    <button
                                        type="button"
                                        onClick={
                                            stopScanner
                                        }
                                        className="
                                            rounded-xl
                                            border
                                            border-slate-200
                                            px-5
                                            py-2.5
                                            text-sm
                                            font-semibold
                                            text-slate-600
                                            transition
                                            hover:bg-slate-50
                                        "
                                    >
                                        Stop Camera
                                    </button>

                                </div>

                            )}

                        {/* ERROR */}

                        {error && (

                            <div
                                className="
                                    m-4
                                    rounded-2xl
                                    border
                                    border-red-200
                                    bg-red-50
                                    px-4
                                    py-3
                                    text-sm
                                    text-red-700
                                "
                            >
                                {error}
                            </div>

                        )}

                    </div>

                )}

            </div>

        </div>
    );
}