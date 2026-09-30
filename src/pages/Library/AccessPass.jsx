import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
    QrCode,
    ShieldCheck,
    User,
    GraduationCap,
    Building2,
    RefreshCw,
    AlertCircle,
    ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5212";

export default function AccessPass() {
    const navigate = useNavigate();

    const [accessPass, setAccessPass] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const getUserId = () => {
        /*
         * Adjust this if your login stores the user ID
         * under a different localStorage key.
         */

        const possibleKeys = [
            "userId",
            "userID",
            "id",
            "user",
            "currentUser",
            "student",
        ];

        for (const key of possibleKeys) {
            const value = localStorage.getItem(key);

            if (!value) continue;

            try {
                const parsed = JSON.parse(value);

                if (typeof parsed === "object" && parsed !== null) {
                    if (parsed.id) return parsed.id;
                    if (parsed.userId) return parsed.userId;
                    if (parsed.Id) return parsed.Id;
                    if (parsed.UserId) return parsed.UserId;
                }

                if (!isNaN(Number(value))) {
                    return Number(value);
                }
            } catch {
                if (!isNaN(Number(value))) {
                    return Number(value);
                }
            }
        }

        return null;
    };

    const loadAccessPass = async () => {
        setLoading(true);
        setError("");

        const userId = getUserId();

        if (!userId) {
            setError(
                "Hindi makita ang User ID. Mag-login ulit para makuha ang Library Access Pass."
            );
            setLoading(false);
            return;
        }

        try {
            const response = await fetch
                (`${API_URL}/api/library/access-pass/${userId}`)
            ;

            if (!response.ok) {
                let message = "Hindi makuha ang Library Access Pass.";

                try {
                    const errorData = await response.json();

                    if (errorData?.message) {
                        message = errorData.message;
                    }
                } catch {
                    // Ignore invalid JSON response
                }

                throw new Error(message);
            }

            const result = await response.json();

            if (!result.success || !result.data) {
                throw new Error(
                    result.message || "Walang Access Pass data."
                );
            }

            setAccessPass(result.data);
        } catch (err) {
            console.error("Access Pass Error:", err);
            setError(
                err.message ||
                    "May problema sa pagkuha ng Library Access Pass."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAccessPass();
    }, []);

    const getName = () => {
        return (
            accessPass?.studentName ||
            accessPass?.name ||
            "Unknown User"
        );
    };

    const getIdNumber = () => {
        return (
            accessPass?.studentNumber ||
            accessPass?.idNumber ||
            "—"
        );
    };

    const getRole = () => {
        return accessPass?.role || "Student";
    };

    const getProgram = () => {
        return accessPass?.program || "";
    };

    const getInstitute = () => {
        return accessPass?.institute || "Colegio de Montalban";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAF8] px-5 pb-28 pt-8">
                <div className="mx-auto max-w-md">
                    <div className="mb-8 h-8 w-40 animate-pulse rounded-lg bg-slate-200" />

                    <div className="rounded-[28px] bg-white p-6 shadow-sm">
                        <div className="mx-auto mb-6 h-8 w-44 animate-pulse rounded-lg bg-slate-200" />

                        <div className="mx-auto h-64 w-64 animate-pulse rounded-2xl bg-slate-200" />

                        <div className="mt-7 space-y-3">
                            <div className="h-5 animate-pulse rounded bg-slate-200" />
                            <div className="h-5 animate-pulse rounded bg-slate-200" />
                            <div className="h-5 animate-pulse rounded bg-slate-200" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F8FAF8] px-5 pb-28 pt-8">
                <div className="mx-auto max-w-md">
                    <button
                        onClick={() => navigate("/library")}
                        className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-600"
                    >
                        <ArrowLeft size={18} />
                        Library
                    </button>

                    <div className="rounded-[28px] border border-red-100 bg-white p-7 text-center shadow-sm">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                            <AlertCircle
                                size={28}
                                className="text-red-500"
                            />
                        </div>

                        <h1 className="text-xl font-bold text-slate-800">
                            Access Pass Unavailable
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            {error}
                        </p>

                        <button
                            onClick={loadAccessPass}
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#106A2E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0D5B27]"
                        >
                            <RefreshCw size={17} />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAF8] px-5 pb-28 pt-6">
            <div className="mx-auto max-w-md">

                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => navigate("/library")}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-600"
                    >
                        <ArrowLeft size={18} />
                        Library
                    </button>

                    <button
                        onClick={loadAccessPass}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-100 transition hover:text-[#106A2E]"
                        title="Refresh Access Pass"
                    >
                        <RefreshCw size={17} />
                    </button>
                </div>

                {/* Title */}
                <div className="mb-6">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#106A2E]">
                            <QrCode size={23} />
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#106A2E]">
                                CDM OneServe
                            </p>

                            <h1 className="text-2xl font-bold text-slate-800">
                                Library Access Pass
                            </h1>
                        </div>
                    </div>

                    <p className="text-sm leading-6 text-slate-500">
                        Ipakita ang QR code na ito sa library scanner
                        para sa iyong library check-in.
                    </p>
                </div>

                {/* Access Pass Card */}
                <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_10px_40px_rgba(16,106,46,0.10)] ring-1 ring-slate-100">

                    {/* Green Header */}
                    <div className="relative overflow-hidden bg-[#106A2E] px-6 py-6 text-white">
                        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/10" />
                        <div className="absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-white/5" />

                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                                    Colegio de Montalban
                                </p>

                                <h2 className="mt-1 text-xl font-bold">
                                    CDM Library
                                </h2>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                                <QrCode size={23} />
                            </div>
                        </div>
                    </div>

                    {/* QR */}
                    <div className="px-6 pt-7">
                        <div className="rounded-3xl bg-[#F7FAF7] p-5 ring-1 ring-emerald-100">
                            <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-white p-5 shadow-sm">
                                {accessPass?.qrData && (
                                    <QRCodeSVG
                                        value={accessPass.qrData}
                                        size={240}
                                        level="M"
                                        includeMargin={true}
                                        bgColor="#FFFFFF"
                                        fgColor="#1F1F1F"
                                        className="h-full w-full max-h-[240px] max-w-[240px]"
                                    />
                                )}
                            </div>

                            <div className="mt-4 text-center">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Scan at Library Entrance
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Dynamic QR Access Pass
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* User Information */}
                    <div className="px-6 py-6">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#106A2E]">
                                <User size={22} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-lg font-bold text-slate-800">
                                    {getName()}
                                </p>

                                <p className="text-sm text-slate-500">
                                    {getIdNumber()}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">

                            {/* Role */}
                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#106A2E] shadow-sm">
                                    <User size={17} />
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Role
                                    </p>

                                    <p className="text-sm font-semibold text-slate-700">
                                        {getRole()}
                                    </p>
                                </div>
                            </div>

                            {/* Institute */}
                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#106A2E] shadow-sm">
                                    <Building2 size={17} />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Institute
                                    </p>

                                    <p className="truncate text-sm font-semibold text-slate-700">
                                        {getInstitute()}
                                    </p>
                                </div>
                            </div>

                            {/* Program */}
                            {getProgram() && (
                                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#106A2E] shadow-sm">
                                        <GraduationCap size={17} />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                            Program
                                        </p>

                                        <p className="truncate text-sm font-semibold text-slate-700">
                                            {getProgram()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Verification */}
                    <div className="border-t border-slate-100 px-6 py-5">
                        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
                            <ShieldCheck
                                size={20}
                                className="shrink-0 text-[#106A2E]"
                            />

                            <div>
                                <p className="text-sm font-semibold text-[#106A2E]">
                                    Valid Library Access Pass
                                </p>

                                <p className="text-xs text-emerald-700/70">
                                    Present this QR code for library
                                    entry verification.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <div className="flex gap-3">
                        <QrCode
                            size={18}
                            className="mt-0.5 shrink-0 text-slate-400"
                        />

                        <p className="text-xs leading-5 text-slate-500">
                            Ang QR code na ito ay ginagamit bilang Library Access Pass.
                            I-scan ito sa circulation counter upang ma-check ang iyong
                            borrowing eligibility.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}