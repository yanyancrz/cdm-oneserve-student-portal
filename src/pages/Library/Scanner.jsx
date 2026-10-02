import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    LogOut,
} from "lucide-react";

import { API_URL } from "../../config/api";

// Route ng Login page mo. Palitan kung iba ang path.
const LOGIN_PATH = "/";

// Lahat ng keys na sine-save ng Login.jsx
const SESSION_KEYS = [
    "token",
    "authToken",
    "userId",
    "idNumber",
    "userName",
    "userEmail",
    "userRole",
    "role",
    "course",
    "yearLevel",
    "contactNumber",
    "profilePicture",
    "isProfileComplete",
];

export default function Scanner() {
    const navigate = useNavigate();

    const scannerRef = useRef(null);
    const processingRef = useRef(false);

    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    // Claim state
    const [claimingId, setClaimingId] = useState(null);
    const [claimMessage, setClaimMessage] = useState(null);

    // =========================================================
    // GET AUTH TOKEN
    // =========================================================

    const getAuthToken = () => {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("authToken") ||
            ""
        );
    };

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
        } catch (err) {
            console.warn("Scanner stop warning:", err);
        }

        try {
            await scanner.clear();
        } catch (err) {
            console.warn("Scanner clear warning:", err);
        }

        scannerRef.current = null;
        setScanning(false);
    };

    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogout = async () => {
        await stopScanner();

        SESSION_KEYS.forEach((key) => {
            localStorage.removeItem(key);
        });

        navigate(LOGIN_PATH, {
            replace: true,
        });
    };

    // =========================================================
    // VERIFY QR WITH API
    // =========================================================

    const verifyQr = async (qrText) => {
        if (processingRef.current) {
            return;
        }

        processingRef.current = true;

        setLoading(true);
        setError("");
        setClaimMessage(null);

        try {
            console.log("=================================");
            console.log("QR DATA:", qrText);
            console.log("API URL:", API_URL);
            console.log(
                "VERIFY ENDPOINT:",
                `${API_URL}/api/library/scanner/verify`
            );
            console.log("=================================");

            // =================================================
            // GET TOKEN
            // =================================================

            const token = getAuthToken();

            if (!token) {
                throw new Error(
                    "Your login session is missing. Please log in again."
                );
            }

            console.log("AUTH TOKEN FOUND:", token ? "YES" : "NO");

            // =================================================
            // STOP CAMERA
            // =================================================

            await stopScanner();

            // =================================================
            // CHECK API URL
            // =================================================

            if (!API_URL) {
                throw new Error("API URL is not configured.");
            }

            // =================================================
            // SEND QR TO API
            // =================================================

            const response = await fetch(
                `${API_URL}/api/library/scanner/verify`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        qrData: qrText,
                    }),
                }
            );

            // =================================================
            // READ RESPONSE AS TEXT FIRST
            // =================================================

            const responseText = await response.text();

            console.log("HTTP STATUS:", response.status);
            console.log("SERVER RESPONSE:", responseText);

            // =================================================
            // PARSE JSON
            // =================================================

            let data = null;

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch (jsonError) {
                    console.warn("Response is not JSON:", responseText);
                }
            }

            // =================================================
            // UNAUTHORIZED
            // =================================================

            if (response.status === 401) {
                // Remove expired/invalid token
                localStorage.removeItem("token");
                localStorage.removeItem("authToken");

                throw new Error(
                    "Your login session has expired or is invalid. Please log in again."
                );
            }

            // =================================================
            // FORBIDDEN
            // =================================================

            if (response.status === 403) {
                throw new Error(
                    data?.message ||
                        data?.error ||
                        "You do not have permission to use the library scanner."
                );
            }

            // =================================================
            // OTHER HTTP ERRORS
            // =================================================

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        data?.error ||
                        data?.data?.message ||
                        responseText ||
                        `Server returned HTTP ${response.status}.`
                );
            }

            // =================================================
            // SUCCESS BUT EMPTY RESPONSE
            // =================================================

            if (!data) {
                throw new Error("The server returned an empty response.");
            }

            console.log("Scanner verification:", data);

            // =================================================
            // GET RESULT
            // =================================================

            const verificationResult = data?.data ?? data;

            setResult(verificationResult);
        } catch (err) {
            console.error("QR verification error:", err);

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
    // CLAIM RESERVED BOOK
    // =========================================================

    const handleClaim = async (reservationId) => {
        setClaimingId(reservationId);
        setClaimMessage(null);

        try {
            const token = getAuthToken();

            if (!token) {
                throw new Error(
                    "Your login session is missing. Please log in again."
                );
            }

            const response = await fetch(
                `${API_URL}/api/library/reservations/claim/${reservationId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    "You do not have permission to claim reservations."
                );
            }

            const data = await response.json().catch(() => null);

            if (!response.ok || data?.success === false) {
                throw new Error(
                    data?.message || "Failed to claim the reservation."
                );
            }

            // Update the scan result without rescanning
            setResult((prev) => ({
                ...prev,
                borrowedBooks: (prev.borrowedBooks ?? 0) + 1,
                remainingBooks: Math.max(
                    0,
                    (prev.remainingBooks ?? 0) - 1
                ),
                reservedBooks: (prev.reservedBooks ?? []).filter(
                    (r) => r.reservationId !== reservationId
                ),
            }));

            setClaimMessage({
                type: "success",
                text: data?.message || "Book claimed successfully.",
            });
        } catch (err) {
            setClaimMessage({
                type: "error",
                text: err.message,
            });
        } finally {
            setClaimingId(null);
        }
    };

    // =========================================================
    // START CAMERA
    // =========================================================

    const startScanner = async () => {
        setResult(null);
        setError("");
        setClaimMessage(null);

        processingRef.current = false;

        try {
            // =================================================
            // CHECK API TOKEN
            // =================================================

            const token = getAuthToken();

            if (!token) {
                setError("No login session found. Please log in again.");

                return;
            }

            // =================================================
            // HTTPS CHECK
            // =================================================

            if (
                !window.isSecureContext &&
                window.location.hostname !== "localhost"
            ) {
                setError(
                    "Camera access requires HTTPS. Please open the secure CDM OneServe website."
                );

                return;
            }

            // =================================================
            // CAMERA SUPPORT
            // =================================================

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {
                setError("Camera access is not supported by this browser.");

                return;
            }

            // =================================================
            // CLEAN OLD SCANNER
            // =================================================

            await stopScanner();

            // =================================================
            // START SCANNING
            // =================================================

            setScanning(true);

            const scanner = new Html5Qrcode("library-qr-reader");

            scannerRef.current = scanner;

            // =================================================
            // CAMERA CONFIG
            // =================================================

            const config = {
                fps: 10,

                qrbox: {
                    width: 250,
                    height: 250,
                },

                aspectRatio: 1,

                rememberLastUsedCamera: true,

                showTorchButtonIfSupported: true,

                showZoomSliderIfSupported: true,

                defaultZoomValueIfSupported: 2,
            };

            // =================================================
            // START ENVIRONMENT CAMERA
            // =================================================

            try {
                await scanner.start(
                    {
                        facingMode: {
                            exact: "environment",
                        },
                    },

                    config,

                    async (decodedText) => {
                        console.log("QR detected:", decodedText);

                        if (processingRef.current) {
                            return;
                        }

                        await verifyQr(decodedText);
                    },

                    () => {
                        // Ignore continuous
                        // QR scanning errors.
                    }
                );

                console.log("Environment camera started.");

                return;
            } catch (cameraError) {
                console.warn("Primary camera error:", cameraError);
            }

            // =================================================
            // FALLBACK CAMERA
            // =================================================

            await stopScanner();

            console.log("Trying fallback camera...");

            const cameras = await Html5Qrcode.getCameras();

            console.log("Available cameras:", cameras);

            if (!cameras || cameras.length === 0) {
                throw new Error("No camera was detected.");
            }

            // =================================================
            // SELECT CAMERA
            // Prefer environment/back camera
            // =================================================

            let selectedCamera = cameras[0];

            const backCamera = cameras.find((camera) => {
                const label = camera.label || "";

                return /back|rear|environment/i.test(label);
            });

            if (backCamera) {
                selectedCamera = backCamera;
            }

            console.log("Selected camera:", selectedCamera);

            // =================================================
            // CREATE FALLBACK SCANNER
            // =================================================

            const fallbackScanner = new Html5Qrcode("library-qr-reader");

            scannerRef.current = fallbackScanner;

            setScanning(true);

            await fallbackScanner.start(
                selectedCamera.id,

                config,

                async (decodedText) => {
                    console.log("QR detected:", decodedText);

                    if (processingRef.current) {
                        return;
                    }

                    await verifyQr(decodedText);
                },

                () => {
                    // Ignore continuous
                    // scanning errors.
                }
            );

            console.log("Fallback camera started.");
        } catch (err) {
            console.error("Camera scanner error:", err);

            await stopScanner();

            setScanning(false);

            setError(
                err?.message ||
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
        setClaimMessage(null);
        setLoading(false);

        processingRef.current = false;

        setTimeout(() => {
            startScanner();
        }, 300);
    };

    // =========================================================
    // CLEANUP
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

                {/* =====================================================
                    HEADER
                ===================================================== */}

                <div className="mb-6">

                    <div className="flex items-center justify-between gap-3">

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

                        {/* LOGOUT */}

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="
                                flex
                                shrink-0
                                items-center
                                gap-2
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                px-3.5
                                py-2.5
                                text-xs
                                font-semibold
                                text-slate-600
                                shadow-sm
                                transition
                                hover:border-red-200
                                hover:bg-red-50
                                hover:text-red-600
                                active:scale-[0.98]
                            "
                        >
                            <LogOut size={15} />
                            Logout
                        </button>

                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Scan a student's or faculty member's QR code to
                        verify their borrowing eligibility and claim
                        their reserved books.
                    </p>

                </div>

                {/* =====================================================
                    RESULT
                ===================================================== */}

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
                                        <CheckCircle2 size={38} />
                                    ) : (
                                        <XCircle size={38} />
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
                                        {result.name || "N/A"}
                                    </p>
                                </div>

                            </div>

                            {/* ID + ROLE */}

                            <div className="grid gap-3 sm:grid-cols-2">

                                <div className="rounded-2xl bg-slate-50 p-4">

                                    <div className="mb-2 flex items-center gap-2 text-slate-400">
                                        <CreditCard size={16} />
                                        <span className="text-xs">
                                            ID Number
                                        </span>
                                    </div>

                                    <p className="font-semibold text-slate-800">
                                        {result.idNumber || "N/A"}
                                    </p>

                                </div>

                                <div className="rounded-2xl bg-slate-50 p-4">

                                    <div className="mb-2 flex items-center gap-2 text-slate-400">
                                        <ShieldCheck size={16} />
                                        <span className="text-xs">
                                            Role
                                        </span>
                                    </div>

                                    <p className="font-semibold text-slate-800">
                                        {result.role || "N/A"}
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
                                            {result.borrowedBooks ?? 0}
                                        </p>

                                        <p className="text-[11px] text-slate-400">
                                            Borrowed
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-2xl font-bold text-slate-800">
                                            {result.borrowLimit ?? 0}
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
                                                        0) > 0
                                                        ? "text-[#106A2E]"
                                                        : "text-red-600"
                                                }
                                            `}
                                        >
                                            {result.remainingBooks ?? 0}
                                        </p>

                                        <p className="text-[11px] text-slate-400">
                                            Remaining
                                        </p>
                                    </div>

                                </div>

                            </div>

                            {/* RESERVED BOOKS */}

                            {(result.reservedBooks?.length > 0 ||
                                claimMessage) && (

                                <div className="rounded-2xl border border-slate-200 p-5">

                                    <div className="mb-4 flex items-center gap-2">

                                        <BookOpen
                                            size={19}
                                            className="text-[#106A2E]"
                                        />

                                        <h3 className="font-semibold text-slate-800">
                                            Reserved Books
                                        </h3>

                                    </div>

                                    {claimMessage && (
                                        <div
                                            className={`mb-3 rounded-xl px-4 py-3 text-sm ${
                                                claimMessage.type ===
                                                "success"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-red-50 text-red-700"
                                            }`}
                                        >
                                            {claimMessage.text}
                                        </div>
                                    )}

                                    <div className="space-y-3">

                                        {(result.reservedBooks ?? []).map(
                                            (r) => {
                                                const noSlots =
                                                    (result.remainingBooks ??
                                                        0) <= 0;

                                                const noCopies =
                                                    r.availableCopies <= 0;

                                                const disabled =
                                                    claimingId !== null ||
                                                    noSlots ||
                                                    noCopies;

                                                return (
                                                    <div
                                                        key={r.reservationId}
                                                        className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"
                                                    >
                                                        {r.coverImage ? (
                                                            <img
                                                                src={
                                                                    r.coverImage
                                                                }
                                                                alt={
                                                                    r.bookTitle
                                                                }
                                                                className="h-16 w-12 shrink-0 rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#106A2E]">
                                                                <BookOpen
                                                                    size={20}
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="min-w-0 flex-1">

                                                            <p className="truncate text-sm font-semibold text-slate-800">
                                                                {r.bookTitle}
                                                            </p>

                                                            <p className="truncate text-xs text-slate-500">
                                                                {r.author}
                                                            </p>

                                                            <p className="mt-1 text-[11px] text-slate-400">
                                                                Expires{" "}
                                                                {new Date(
                                                                    r.expirationDate
                                                                ).toLocaleString()}
                                                            </p>

                                                            {noCopies && (
                                                                <p className="text-[11px] text-red-500">
                                                                    No available
                                                                    copies
                                                                </p>
                                                            )}

                                                            {!noCopies &&
                                                                noSlots && (
                                                                    <p className="text-[11px] text-red-500">
                                                                        Borrowing
                                                                        limit
                                                                        reached
                                                                    </p>
                                                                )}

                                                        </div>

                                                        <button
                                                            type="button"
                                                            disabled={disabled}
                                                            onClick={() =>
                                                                handleClaim(
                                                                    r.reservationId
                                                                )
                                                            }
                                                            className="shrink-0 rounded-xl bg-[#106A2E] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#0d5927] disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {claimingId ===
                                                            r.reservationId
                                                                ? "Claiming..."
                                                                : "Claimed"}
                                                        </button>
                                                    </div>
                                                );
                                            }
                                        )}

                                    </div>

                                </div>

                            )}

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
                                    {result.status || "N/A"}
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
                                <RotateCcw size={18} />
                                Scan Another QR
                            </button>

                        </div>

                    </div>

                ) : (

                    /* =====================================================
                       SCANNER
                    ===================================================== */

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
                                Position the QR code inside the scanning
                                area.
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

                            {!scanning && !loading && (

                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 px-6 text-center">

                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white">
                                        <QrCode size={32} />
                                    </div>

                                    <h2 className="text-lg font-semibold text-white">
                                        Ready to Scan
                                    </h2>

                                    <p className="mt-2 max-w-xs text-sm text-slate-300">
                                        Use this device's camera to scan a
                                        CDM Library Access Pass.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={startScanner}
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
                                        <Camera size={20} />
                                        Start Camera
                                    </button>

                                </div>

                            )}

                            {/* LOADING */}

                            {loading && (

                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90">

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

                        {scanning && !loading && (

                            <div className="flex justify-center px-5 py-4">

                                <button
                                    type="button"
                                    onClick={stopScanner}
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