import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FileSearch,
    PackageSearch,
    PackageCheck,
    Clock3,
    CircleCheck,
    CircleX,
    GitCompare,
    HandCoins,
    ArrowRight,
    Search,
    RefreshCw,
    AlertCircle,
} from "lucide-react";

import { getAdminDashboard } from "../../../services/lostFoundAdminService";

const AdminDashboard = () => {
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ==========================================
    // LOAD DASHBOARD
    // ==========================================

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAdminDashboard();

            setDashboard(data);
        } catch (err) {
            console.error("Lost & Found admin dashboard error:", err);
            setError(
                err?.message ||
                "Unable to load Lost & Found dashboard."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (date) => {
        if (!date) return "N/A";

        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // ==========================================
    // REPORT TYPE
    // ==========================================

    const getReportTypeClass = (type) => {
        if (type?.toLowerCase() === "lost") {
            return "bg-red-50 text-red-700";
        }

        return "bg-green-50 text-green-700";
    };

    // ==========================================
    // STATUS
    // ==========================================

    const getStatusClass = (status) => {
        const value = status?.toLowerCase();

        if (value === "matched") {
            return "bg-blue-50 text-blue-700";
        }

        if (value === "claimed") {
            return "bg-purple-50 text-purple-700";
        }

        if (value === "closed") {
            return "bg-gray-100 text-gray-700";
        }

        return "bg-amber-50 text-amber-700";
    };

    // ==========================================
    // SKELETON CARD
    // ==========================================

    const SkeletonCard = () => (
        <div className="bg-white rounded-2xl border border-[#1F1F1F]/[0.05] p-5 animate-pulse">
            <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                    <div className="h-3 bg-gray-200 rounded w-24" />
                    <div className="h-8 bg-gray-200 rounded w-14" />
                </div>

                <div className="w-11 h-11 rounded-xl bg-gray-200" />
            </div>
        </div>
    );

    // ==========================================
    // STAT CARD
    // ==========================================

    const StatCard = ({
        label,
        value,
        icon: Icon,
        iconBg,
        iconColor,
        valueColor = "#1F1F1F",
    }) => (
        <div
            className="
                bg-white
                rounded-2xl
                border border-[#1F1F1F]/[0.05]
                p-5
                hover:-translate-y-0.5
                hover:shadow-md
                transition-all
                duration-200
            "
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">
                        {label}
                    </p>

                    <p
                        className="text-3xl font-semibold tracking-tight"
                        style={{ color: valueColor }}
                    >
                        {value ?? 0}
                    </p>
                </div>

                <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}
                >
                    <Icon
                        size={21}
                        strokeWidth={2}
                        className={iconColor}
                    />
                </div>
            </div>
        </div>
    );

    // ==========================================
    // ERROR STATE
    // ==========================================

    if (error && !dashboard) {
        return (
            <div className="min-h-screen bg-[#F1F1F1] p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
                            <AlertCircle
                                size={28}
                                className="text-red-600"
                            />
                        </div>

                        <h2 className="text-lg font-semibold text-[#1F1F1F]">
                            Unable to load dashboard
                        </h2>

                        <p className="text-sm text-gray-500 mt-2">
                            {error}
                        </p>

                        <button
                            onClick={loadDashboard}
                            className="
                                mt-5
                                inline-flex
                                items-center
                                gap-2
                                px-4
                                py-2.5
                                rounded-xl
                                bg-[#106A2E]
                                text-white
                                text-sm
                                font-medium
                                hover:bg-[#0D7856]
                                transition
                            "
                        >
                            <RefreshCw size={16} />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F1F1F1] p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">

                {/* ==========================================
                    HEADER
                ========================================== */}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-[#106A2E] bg-[#106A2E]/[0.08] px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F4D35E]" />
                                Lost &amp; Found Admin
                            </span>
                        </div>

                        <h1 className="text-2xl lg:text-3xl font-semibold text-[#1F1F1F] tracking-tight">
                            Lost &amp; Found Dashboard
                        </h1>

                        <p className="text-sm text-gray-500 mt-1.5">
                            Manage Lost &amp; Found reports, matches, and claims.
                        </p>
                    </div>

                    <button
                        onClick={loadDashboard}
                        disabled={loading}
                        className="
                            self-start
                            md:self-auto
                            inline-flex
                            items-center
                            gap-2
                            px-4
                            py-2.5
                            rounded-xl
                            border border-[#1F1F1F]/10
                            bg-white
                            text-[#1F1F1F]
                            text-sm
                            font-medium
                            hover:border-[#106A2E]/30
                            hover:text-[#106A2E]
                            transition-all
                            disabled:opacity-50
                        "
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                </div>

                {/* ==========================================
                    MAIN REPORT STATS
                ========================================== */}

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
                        {[1, 2, 3, 4].map((item) => (
                            <SkeletonCard key={item} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">

                        <StatCard
                            label="Total Reports"
                            value={dashboard?.totalReports}
                            icon={FileSearch}
                            iconBg="bg-[#106A2E]/10"
                            iconColor="text-[#106A2E]"
                            valueColor="#106A2E"
                        />

                        <StatCard
                            label="Lost Reports"
                            value={dashboard?.lostReports}
                            icon={Search}
                            iconBg="bg-red-50"
                            iconColor="text-red-600"
                            valueColor="#B42318"
                        />

                        <StatCard
                            label="Found Reports"
                            value={dashboard?.foundReports}
                            icon={PackageCheck}
                            iconBg="bg-green-50"
                            iconColor="text-green-700"
                            valueColor="#087443"
                        />

                        <StatCard
                            label="Pending Verification"
                            value={dashboard?.pendingVerification}
                            icon={Clock3}
                            iconBg="bg-amber-50"
                            iconColor="text-amber-600"
                            valueColor="#B54708"
                        />

                    </div>
                )}

                {/* ==========================================
                    SECONDARY STATS
                ========================================== */}

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                        {[1, 2, 3, 4].map((item) => (
                            <SkeletonCard key={item} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

                        <StatCard
                            label="Verified Reports"
                            value={dashboard?.verifiedReports}
                            icon={CircleCheck}
                            iconBg="bg-green-50"
                            iconColor="text-green-700"
                            valueColor="#087443"
                        />

                        <StatCard
                            label="Rejected Reports"
                            value={dashboard?.rejectedReports}
                            icon={CircleX}
                            iconBg="bg-red-50"
                            iconColor="text-red-600"
                            valueColor="#B42318"
                        />

                        <StatCard
                            label="Matched Reports"
                            value={dashboard?.matchedReports}
                            icon={GitCompare}
                            iconBg="bg-blue-50"
                            iconColor="text-blue-600"
                            valueColor="#175CD3"
                        />

                        <StatCard
                            label="Claimed Items"
                            value={dashboard?.claimedReports}
                            icon={HandCoins}
                            iconBg="bg-purple-50"
                            iconColor="text-purple-600"
                            valueColor="#6941C6"
                        />

                    </div>
                )}

                {/* ==========================================
                    CLAIM SUMMARY
                ========================================== */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

                    <div className="bg-white rounded-2xl border border-[#1F1F1F]/[0.05] p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                <Clock3
                                    size={19}
                                    className="text-amber-600"
                                />
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                                    Pending Claims
                                </p>

                                <p className="text-2xl font-semibold text-[#1F1F1F] mt-0.5">
                                    {loading ? "—" : dashboard?.pendingClaims ?? 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#1F1F1F]/[0.05] p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                                <CircleCheck
                                    size={19}
                                    className="text-green-700"
                                />
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                                    Approved Claims
                                </p>

                                <p className="text-2xl font-semibold text-[#1F1F1F] mt-0.5">
                                    {loading ? "—" : dashboard?.approvedClaims ?? 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#1F1F1F]/[0.05] p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                <CircleX
                                    size={19}
                                    className="text-red-600"
                                />
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                                    Rejected Claims
                                </p>

                                <p className="text-2xl font-semibold text-[#1F1F1F] mt-0.5">
                                    {loading ? "—" : dashboard?.rejectedClaims ?? 0}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ==========================================
                    RECENT REPORTS
                ========================================== */}

                <div className="bg-white rounded-2xl border border-[#1F1F1F]/[0.05] overflow-hidden">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 pt-6 pb-4">

                        <div>
                            <h2 className="text-xl font-semibold text-[#1F1F1F]">
                                Recent Reports
                            </h2>

                            <p className="text-sm text-gray-500 mt-1">
                                Latest Lost &amp; Found submissions.
                            </p>
                        </div>

                        <button
                            onClick={() =>
                                navigate("/admin/lost-found/reports")
                            }
                            className="
                                inline-flex
                                items-center
                                gap-1.5
                                text-sm
                                font-medium
                                text-[#106A2E]
                                hover:text-[#0D7856]
                                transition
                            "
                        >
                            View all
                            <ArrowRight size={15} />
                        </button>

                    </div>

                    {loading ? (
                        <div className="px-6 pb-6 space-y-3">
                            {[1, 2, 3, 4, 5].map((item) => (
                                <div
                                    key={item}
                                    className="h-16 bg-gray-100 rounded-xl animate-pulse"
                                />
                            ))}
                        </div>
                    ) : dashboard?.recentReports?.length > 0 ? (

                        <div className="overflow-x-auto">

                            <table className="w-full">

                                <thead>
                                    <tr className="border-t border-b border-[#1F1F1F]/[0.06] text-gray-500 text-xs uppercase tracking-wide">
                                        <th className="text-left py-3 px-6 font-medium">
                                            Item
                                        </th>

                                        <th className="text-left py-3 font-medium">
                                            Reporter
                                        </th>

                                        <th className="text-left py-3 font-medium">
                                            Type
                                        </th>

                                        <th className="text-left py-3 font-medium">
                                            Status
                                        </th>

                                        <th className="text-left py-3 font-medium">
                                            Verification
                                        </th>

                                        <th className="text-left py-3 pr-6 font-medium">
                                            Date
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {dashboard.recentReports.map((report) => (

                                        <tr
                                            key={report.id}
                                            className="
                                                border-b
                                                border-[#1F1F1F]/[0.05]
                                                last:border-b-0
                                                hover:bg-[#F7F5EF]/60
                                                transition
                                            "
                                        >

                                            <td className="py-4 px-6">
                                                <div>
                                                    <p className="text-sm font-medium text-[#1F1F1F]">
                                                        {report.itemName || "Unnamed Item"}
                                                    </p>

                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {report.category || "No category"}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="py-4">
                                                <div>
                                                    <p className="text-sm text-[#1F1F1F]">
                                                        {report.fullName || "Unknown User"}
                                                    </p>

                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {report.idNumber || "N/A"}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="py-4">
                                                <span
                                                    className={`
                                                        inline-flex
                                                        items-center
                                                        px-2.5
                                                        py-1
                                                        rounded-full
                                                        text-xs
                                                        font-medium
                                                        ${getReportTypeClass(
                                                            report.reportType
                                                        )}
                                                    `}
                                                >
                                                    {report.reportType || "N/A"}
                                                </span>
                                            </td>

                                            <td className="py-4">
                                                <span
                                                    className={`
                                                        inline-flex
                                                        items-center
                                                        px-2.5
                                                        py-1
                                                        rounded-full
                                                        text-xs
                                                        font-medium
                                                        ${getStatusClass(
                                                            report.status
                                                        )}
                                                    `}
                                                >
                                                    {report.status || "Pending"}
                                                </span>
                                            </td>

                                            <td className="py-4">
                                                <span
                                                    className={`
                                                        inline-flex
                                                        items-center
                                                        px-2.5
                                                        py-1
                                                        rounded-full
                                                        text-xs
                                                        font-medium
                                                        ${
                                                            report.verificationStatus?.toLowerCase() ===
                                                            "verified"
                                                                ? "bg-green-50 text-green-700"
                                                                : report.verificationStatus?.toLowerCase() ===
                                                                  "rejected"
                                                                ? "bg-red-50 text-red-700"
                                                                : "bg-amber-50 text-amber-700"
                                                        }
                                                    `}
                                                >
                                                    {report.verificationStatus ||
                                                        "Pending"}
                                                </span>
                                            </td>

                                            <td className="py-4 pr-6">
                                                <p className="text-sm text-gray-600 whitespace-nowrap">
                                                    {formatDate(
                                                        report.createdAt
                                                    )}
                                                </p>
                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    ) : (

                        <div className="px-6 py-14 text-center">

                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#106A2E]/[0.07] flex items-center justify-center">
                                <PackageSearch
                                    size={27}
                                    className="text-[#106A2E]"
                                />
                            </div>

                            <h3 className="text-base font-semibold text-[#1F1F1F]">
                                No reports yet
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                Lost &amp; Found reports will appear here.
                            </p>

                        </div>

                    )}

                </div>

                {/* ==========================================
                    QUICK ACTIONS
                ========================================== */}

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">

                    <button
                        onClick={() =>
                            navigate("/admin/lost-found/reports")
                        }
                        className="
                            bg-[#106A2E]
                            text-white
                            rounded-2xl
                            p-5
                            text-left
                            hover:bg-[#0D7856]
                            transition-all
                            group
                        "
                    >
                        <FileSearch size={22} className="mb-4" />

                        <p className="font-semibold">
                            Manage Reports
                        </p>

                        <p className="text-sm text-white/70 mt-1">
                            Review and verify Lost &amp; Found reports.
                        </p>

                        <div className="flex items-center gap-1.5 text-sm font-medium mt-4">
                            Open reports
                            <ArrowRight
                                size={15}
                                className="group-hover:translate-x-1 transition-transform"
                            />
                        </div>
                    </button>

                    <button
                        onClick={() =>
                            navigate("/admin/lost-found/matches")
                        }
                        className="
                            bg-white
                            border border-[#1F1F1F]/[0.06]
                            rounded-2xl
                            p-5
                            text-left
                            hover:-translate-y-0.5
                            hover:shadow-md
                            transition-all
                            group
                        "
                    >
                        <GitCompare
                            size={22}
                            className="text-[#106A2E] mb-4"
                        />

                        <p className="font-semibold text-[#1F1F1F]">
                            Manage Matches
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                            Review potential Lost &amp; Found matches.
                        </p>

                        <div className="flex items-center gap-1.5 text-sm font-medium text-[#106A2E] mt-4">
                            Open matches
                            <ArrowRight
                                size={15}
                                className="group-hover:translate-x-1 transition-transform"
                            />
                        </div>
                    </button>

                    <button
                        onClick={() =>
                            navigate("/admin/lost-found/claims")
                        }
                        className="
                            bg-white
                            border border-[#1F1F1F]/[0.06]
                            rounded-2xl
                            p-5
                            text-left
                            hover:-translate-y-0.5
                            hover:shadow-md
                            transition-all
                            group
                        "
                    >
                        <HandCoins
                            size={22}
                            className="text-[#106A2E] mb-4"
                        />

                        <p className="font-semibold text-[#1F1F1F]">
                            Manage Claims
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                            Review and process item claims.
                        </p>

                        <div className="flex items-center gap-1.5 text-sm font-medium text-[#106A2E] mt-4">
                            Open claims
                            <ArrowRight
                                size={15}
                                className="group-hover:translate-x-1 transition-transform"
                            />
                        </div>
                    </button>

                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;