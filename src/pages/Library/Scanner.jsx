import { API_URL } from "../../config/api";
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

export default function Scanner() {
    const scannerRef = useRef(null);
    const processingRef = useRef(false);

    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    // ==========================================
    // STOP SCANNER
    // ==========================================

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
                "Scanner cleanup:",
                err
            );
        } finally {
            scannerRef.current = null;
            setScanning(false);
        }
    };

    // ==========================================
    // VERIFY QR WITH API
    // ==========================================

    const verifyQr = async (qrText) => {
        // Prevent duplicate QR processing
        if (processingRef.current) {
            return;
        }

        if (!qrText) {
            setError(
                "Unable to read the QR code."
            );

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
                "VERIFY ENDPOINT:",
                `${API_URL}/api/library/scanner/verify`
            );

            console.log(
                "================================="
            );

            // Stop camera before API verification
            await stopScanner();

            // ======================================
            // CHECK API URL
            // ======================================

            if (!API_URL) {
                throw new Error(
                    "API URL is not configured."
                );
            }

            // ======================================
            // VERIFY QR
            // ======================================

            const response = await fetch(
                `${API_URL}/api/library/scanner/verify`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        qrData: qrText,
                    }),
                }
            );

            // ======================================
            // READ API RESPONSE
            // ======================================

            let data = null;

            try {
                data =
                    await response.json();
            } catch {
                throw new Error(
                    "The server returned an invalid response."
                );
            }

            console.log(
                "Scanner verification:",
                data
            );

            // ======================================
            // API ERROR
            // ======================================

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        data?.data?.message ||
                        "Unable to verify QR code."
                );
            }

            // ======================================
            // SUCCESS
            // ======================================

            setResult(
                data?.data || data
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

    // ==========================================
    // QR DETECTED
    // ==========================================

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

    // ==========================================
    // START CAMERA
    // ==========================================

    const startScanner = async () => {
        // Reset UI
        setResult(null);
        setError("");
        setLoading(false);

        processingRef.current = false;

        // ======================================
        // STOP EXISTING SCANNER
        // ======================================

        await stopScanner();

        try {
            // ======================================
            // HTTPS / SECURE CONTEXT
            // ======================================

            const isLocalhost =
                window.location.hostname ===
                    "localhost" ||
                window.location.hostname ===
                    "127.0.0.1";

            if (
                !window.isSecureContext &&
                !isLocalhost
            ) {
                setError(
                    "Camera access requires HTTPS. Please open CDM OneServe using your secure HTTPS website."
                );

                return;
            }

            // ======================================
            // CAMERA SUPPORT
            // ======================================

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

            // ======================================
            // CHECK CAMERA PERMISSION
            // ======================================

            try {
                const permission =
                    await navigator.permissions?.query(
                        {
                            name: "camera",
                        }
                    );

                if (
                    permission &&
                    permission.state ===
                        "denied"
                ) {
                    setError(
                        "Camera permission is blocked. Please allow camera access in your browser settings."
                    );

                    return;
                }
            } catch {
                // Some browsers do not support
                // camera permission query.
            }

            // ======================================
            // CREATE SCANNER
            // ======================================

            const scanner =
                new Html5Qrcode(
                    "library-qr-reader"
                );

            scannerRef.current =
                scanner;

            setScanning(true);

            // ======================================
            // CAMERA CONFIG
            // ======================================

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

            // ======================================
            // START ENVIRONMENT CAMERA
            // ======================================

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
                    // These occur continuously while
                    // searching for a QR code.
                }
            );

            console.log(
                "Camera scanner started."
            );
        } catch (err) {
            console.error(
                "Primary camera error:",
                err
            );

            // ======================================
            // FALLBACK CAMERA
            // ======================================

            try {
                await stopScanner();

                console.log(
                    "Trying fallback camera..."
                );

                const cameras =
                    await Html5Qrcode.getCameras();

                if (
                    !cameras ||
                    cameras.length === 0
                ) {
                    throw new Error(
                        "No camera detected."
                    );
                }

                // Prefer rear camera
                const rearCamera =
                    cameras.find(
                        (camera) =>
                            /back|rear|environment/i.test(
                                camera.label
                            )
                    );

                const selectedCamera =
                    rearCamera ||
                    cameras[0];

                console.log(
                    "Selected camera:",
                    selectedCamera
                );

                const scanner =
                    new Html5Qrcode(
                        "library-qr-reader"
                    );

                scannerRef.current =
                    scanner;

                setScanning(true);

                await scanner.start(
                    selectedCamera.id,

                    {
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
                    },

                    async (
                        decodedText
                    ) => {
                        await handleQrDetected(
                            decodedText
                        );
                    },

                    () => {
                        // Ignore normal scan errors
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

            // ======================================
            // CAMERA FAILED
            // ======================================

            await stopScanner();

            setError(
                "Unable to access the camera. Please allow camera permission and make sure you are using HTTPS."
            );
        }
    };

    // ==========================================
    // SCAN AGAIN
    // ==========================================

    const scanAgain = async () => {
        await stopScanner();

        setResult(null);
        setError("");
        setLoading(false);

        processingRef.current =
            false;

        setTimeout(() => {
            startScanner();
        }, 300);
    };

    // ==========================================
    // CLEANUP
    // ==========================================

    useEffect(() => {
        return () => {
            const cleanup =
                async () => {
                    try {
                        await stopScanner();
                    } catch (err) {
                        console.warn(
                            "Scanner cleanup error:",
                            err
                        );
                    }
                };

            cleanup();
        };
    }, []);

    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="min-h-screen bg-[#f6f8f5] px-4 py-6 sm:px-6">

            <div className="mx-auto w-full max-w-2xl">

                {/* ==================================
                    HEADER
                ================================== */}

                <div className="mb-6">

                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#106A2E] text-white shadow-sm">

                            <QrCode size={23} />

                        </div>

                        <div>

                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#106A2E]">
                                CDM LibHub
                            </p>

                            <h1 className="text-2xl font-bold text-slate-800">
                                Library Scanner
                            </h1>

                        </div>

                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Scan a student's or faculty
                        member's QR code to verify
                        their borrowing eligibility.
                    </p>

                </div>

                {/* ==================================
                    RESULT
                ================================== */}

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

                            <div className="flex flex-col items-center text-center text-white">

                                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/15">

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

                                <h2 className="text-2xl font-bold">

                                    {result.cleared
                                        ? "CLEARED"
                                        : "NOT CLEARED"}

                                </h2>

                                <p className="mt-1 text-sm text-white/80">

                                    {result.message ||
                                        "QR verification completed."}

                                </p>

                            </div>

                        </div>

                        {/* DETAILS */}

                        <div className="space-y-3 p-5">

                            {/* NAME */}

                            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#106A2E]">

                                    <User size={21} />

                                </div>

                                <div>

                                    <p className="text-xs text-slate-400">
                                        Name
                                    </p>

                                    <p className="font-semibold text-slate-800">
                                        {result.name ||
                                            "N/A"}
                                    </p>

                                </div>

                            </div>

                            {/* ID + ROLE */}

                            <div className="grid gap-3 sm:grid-cols-2">

                                <div className="rounded-2xl bg-slate-50 p-4">

                                    <div className="mb-2 flex items-center gap-2 text-slate-400">

                                        <CreditCard
                                            size={16}
                                        />

                                        <span className="text-xs">
                                            ID Number
                                        </span>

                                    </div>

                                    <p className="font-semibold text-slate-800">
                                        {result.idNumber ||
                                            "N/A"}
                                    </p>

                                </div>

                                <div className="rounded-2xl bg-slate-50 p-4">

                                    <div className="mb-2 flex items-center gap-2 text-slate-400">

                                        <ShieldCheck
                                            size={16}
                                        />

                                        <span className="text-xs">
                                            Role
                                        </span>

                                    </div>

                                    <p className="font-semibold text-slate-800">
                                        {result.role ||
                                            "N/A"}
                                    </p>

                                </div>

                            </div>

                            {/* INSTITUTE */}

                            {result.institute && (

                                <div className="rounded-2xl bg-slate-50 p-4">

                                    <p className="text-xs text-slate-400">
                                        Institute
                                    </p>

                                    <p className="mt-1 font-semibold text-slate-800">
                                        {result.institute}
                                    </p>

                                </div>

                            )}

                            {/* BORROWING STATUS */}

                            <div className="rounded-2xl border border-slate-200 p-5">

                                <div className="mb-4 flex items-center gap-2">

                                    <BookOpen
                                        size={19}
                                        className="text-[#106A2E]"
                                    />

                                    <h3 className="font-semibold text-slate-800">
                                        Borrowing Status
                                    </h3>

                                </div>

                                <div className="grid grid-cols-3 gap-3 text-center">

                                    <div>

                                        <p className="text-2xl font-bold text-slate-800">
                                            {result.borrowedBooks ??
                                                0}
                                        </p>

                                        <p className="text-[11px] text-slate-400">
                                            Borrowed
                                        </p>

                                    </div>

                                    <div>

                                        <p className="text-2xl font-bold text-slate-800">
                                            {result.borrowLimit ??
                                                0}
                                        </p>

                                        <p className="text-[11px] text-slate-400">
                                            Limit
                                        </p>

                                    </div>

                                    <div>

                                        <p
                                            className={`
                                                text-2xl
                                                font-bold
                                                ${
                                                    (result.remainingBooks ??
                                                        0) >
                                                    0
                                                        ? "text-[#106A2E]"
                                                        : "text-red-600"
                                                }
                                            `}
                                        >

                                            {result.remainingBooks ??
                                                0}

                                        </p>

                                        <p className="text-[11px] text-slate-400">
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

                                <p className="text-xs font-medium uppercase tracking-wider">
                                    Account Status
                                </p>

                                <p className="mt-1 text-lg font-bold">
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

                    /* ==================================
                       SCANNER
                    ================================== */

                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

                        {/* HEADER */}

                        <div className="border-b border-slate-100 px-5 py-4">

                            <div className="flex items-center gap-2">

                                <Camera
                                    size={18}
                                    className="text-[#106A2E]"
                                />

                                <span className="font-semibold text-slate-800">
                                    Scan QR Code
                                </span>

                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                                Position the QR code inside
                                the scanning area.
                            </p>

                        </div>

                        {/* CAMERA AREA */}

                        <div className="relative overflow-hidden bg-slate-950 p-4">

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

                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 px-6 text-center">

                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white">

                                            <QrCode
                                                size={32}
                                            />

                                        </div>

                                        <h2 className="text-lg font-semibold text-white">
                                            Ready to Scan
                                        </h2>

                                        <p className="mt-2 max-w-xs text-sm text-slate-300">
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

                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90">

                                    <Loader2
                                        size={42}
                                        className="animate-spin text-white"
                                    />

                                    <p className="mt-4 text-lg font-semibold text-white">
                                        Checking account...
                                    </p>

                                    <p className="mt-2 text-sm text-slate-300">
                                        Please wait.
                                    </p>

                                </div>

                            )}

                        </div>

                        {/* STOP BUTTON */}

                        {scanning &&
                            !loading && (

                                <div className="flex justify-center px-5 py-4">

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

                            <div className="m-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                                {error}

                            </div>

                        )}

                    </div>

                )}

            </div>

        </div>
    );
}