import { useEffect, useMemo, useState } from "react";
import {
    Search,
    RefreshCw,
    Eye,
    CheckCircle2,
    XCircle,
    PackageSearch,
    AlertCircle,
    X,
    MapPin,
    CalendarDays,
    User,
    FileText,
} from "lucide-react";

import {
    getAdminReports,
    verifyReport,
    rejectReport,
} from "../../../services/lostFoundAdminService";

const LostFoundReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [verificationFilter, setVerificationFilter] = useState("All");

    const [selectedReport, setSelectedReport] = useState(null);

    // ==========================================
    // LOAD REPORTS
    // ==========================================

    const loadReports = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAdminReports();

            setReports(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Load admin reports error:", err);

            setError(
                err?.message ||
                "Unable to load Lost & Found reports."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    // ==========================================
    // FILTER REPORTS
    // ==========================================

    const filteredReports = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return reports.filter((report) => {
            const matchesSearch =
                !keyword ||
                report.itemName?.toLowerCase().includes(keyword) ||
                report.category?.toLowerCase().includes(keyword) ||
                report.description?.toLowerCase().includes(keyword) ||
                report.location?.toLowerCase().includes(keyword) ||
                report.fullName?.toLowerCase().includes(keyword) ||
                report.idNumber?.toLowerCase().includes(keyword);

            const matchesType =
                typeFilter === "All" ||
                report.reportType?.toLowerCase() ===
                    typeFilter.toLowerCase();

            const matchesStatus =
                statusFilter === "All" ||
                report.status?.toLowerCase() ===
                    statusFilter.toLowerCase();

            const matchesVerification =
                verificationFilter === "All" ||
                report.verificationStatus?.toLowerCase() ===
                    verificationFilter.toLowerCase();

            return (
                matchesSearch &&
                matchesType &&
                matchesStatus &&
                matchesVerification
            );
        });
    }, [
        reports,
        search,
        typeFilter,
        statusFilter,
        verificationFilter,
    ]);

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
    // REPORT TYPE BADGE
    // ==========================================

    const getReportTypeClass = (type) => {
        if (type?.toLowerCase() === "lost") {
            return "bg-red-50 text-red-700";
        }

        return "bg-green-50 text-green-700";
    };

    // ==========================================
    // STATUS BADGE
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
    // VERIFICATION BADGE
    // ==========================================

    const getVerificationClass = (status) => {
        const value = status?.toLowerCase();

        if (value === "verified") {
            return "bg-green-50 text-green-700";
        }

        if (value === "rejected") {
            return "bg-red-50 text-red-700";
        }

        return "bg-amber-50 text-amber-700";
    };

    // ==========================================
    // VERIFY REPORT
    // ==========================================

    const handleVerify = async (report) => {
        const confirmed = window.confirm(
            `Verify the report for "${report.itemName}"?`
        );

        if (!confirmed) return;

        try {
            setActionLoading(true);
            setError("");

            await verifyReport(report.id);

            setSelectedReport(null);

            await loadReports();
        } catch (err) {
            console.error("Verify report error:", err);

            setError(
                err?.message ||
                "Unable to verify this report."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // ==========================================
    // VERIFY ALL PENDING REPORTS
    // ==========================================

    const handleVerifyAll = async () => {
        const pendingReports = reports.filter(
            (report) =>
                report.verificationStatus?.toLowerCase() === "pending"
        );

        if (pendingReports.length === 0) {
            setError("There are no pending reports to verify.");
            return;
        }

        const confirmed = window.confirm(
            `Verify all ${pendingReports.length} pending report${
                pendingReports.length > 1 ? "s" : ""
            }?`
        );

        if (!confirmed) return;

        try {
            setActionLoading(true);
            setError("");

            // Verify sequentially so automatic matching can safely
            // process each newly verified report without duplicate races.
            for (const report of pendingReports) {
                await verifyReport(report.id);
            }

            await loadReports();
        } catch (err) {
            console.error("Verify all reports error:", err);

            setError(
                err?.message ||
                "Unable to verify all pending reports."
            );

            await loadReports();
        } finally {
            setActionLoading(false);
        }
    };

    // ==========================================
    // REJECT REPORT
    // ==========================================

    const handleReject = async (report) => {
        const confirmed = window.confirm(
            `Reject the report for "${report.itemName}"?`
        );

        if (!confirmed) return;

        try {
            setActionLoading(true);
            setError("");

            await rejectReport(report.id);

            setSelectedReport(null);

            await loadReports();
        } catch (err) {
            console.error("Reject report error:", err);

            setError(
                err?.message ||
                "Unable to reject this report."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // ==========================================
    // RESET FILTERS
    // ==========================================

    const clearFilters = () => {
        setSearch("");
        setTypeFilter("All");
        setStatusFilter("All");
        setVerificationFilter("All");
    };

    // ==========================================
    // SKELETON
    // ==========================================

    const TableSkeleton = () => (
        <div className="space-y-3 p-6 animate-pulse">
            {[1, 2, 3, 4, 5].map((item) => (
                <div
                    key={item}
                    className="h-16 rounded-xl bg-gray-100"
                />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F1F1F1] p-6 lg:p-8">

            <div className="max-w-7xl mx-auto">

                {/* ==========================================
                    HEADER
                ========================================== */}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-[#106A2E] bg-[#106A2E]/[0.08] px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F4D35E]" />
                                Lost &amp; Found Admin
                            </span>
                        </div>

                        <h1 className="text-2xl lg:text-3xl font-semibold text-[#1F1F1F] tracking-tight">
                            Lost &amp; Found Reports
                        </h1>

                        <p className="text-sm text-gray-500 mt-1.5">
                            Review and manage submitted Lost &amp; Found reports.
                        </p>
                    </div>

                    <div className="self-start md:self-auto flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleVerifyAll}
                            disabled={
                                loading ||
                                actionLoading ||
                                !reports.some(
                                    (report) =>
                                        report.verificationStatus?.toLowerCase() ===
                                        "pending"
                                )
                            }
                            className="
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
                                transition-all
                                disabled:opacity-50
                                disabled:cursor-not-allowed
                            "
                        >
                            <CheckCircle2 size={16} />
                            Verify All Reports
                        </button>

                        <button
                            onClick={loadReports}
                            disabled={loading || actionLoading}
                            className="
                                inline-flex
                                items-center
                                gap-2
                                px-4
                                py-2.5
                                rounded-xl
                                border border-[#1F1F1F]/10
                                bg-white
                                text-sm
                                font-medium
                                text-[#1F1F1F]
                                hover:text-[#106A2E]
                                hover:border-[#106A2E]/30
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

                </div>

                {/* ==========================================
                    ERROR
                ========================================== */}

                {error && (
                    <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* ==========================================
                    FILTERS
                ========================================== */}

                <div className="bg-white rounded-2xl border border-[#1F1F1F]/[0.05] p-5 mb-5">

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">

                        {/* Search */}

                        <div className="relative md:col-span-2 xl:col-span-1">

                            <Search
                                size={18}
                                className="
                                    absolute
                                    left-3.5
                                    top-1/2
                                    -translate-y-1/2
                                    text-gray-400
                                "
                            />

                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                className="
                                    w-full
                                    pl-10
                                    pr-4
                                    py-3
                                    rounded-xl
                                    border
                                    border-[#1F1F1F]/10
                                    bg-[#F9F9F7]
                                    text-sm
                                    text-[#1F1F1F]
                                    placeholder:text-gray-400
                                    outline-none
                                    focus:border-[#106A2E]/40
                                    focus:bg-white
                                    transition
                                "
                            />

                        </div>

                        {/* Type */}

                        <select
                            value={typeFilter}
                            onChange={(e) =>
                                setTypeFilter(e.target.value)
                            }
                            className="
                                px-4
                                py-3
                                rounded-xl
                                border
                                border-[#1F1F1F]/10
                                bg-[#F9F9F7]
                                text-sm
                                text-[#1F1F1F]
                                outline-none
                                focus:border-[#106A2E]/40
                            "
                        >
                            <option value="All">
                                All Types
                            </option>
                            <option value="Lost">
                                Lost
                            </option>
                            <option value="Found">
                                Found
                            </option>
                        </select>

                        {/* Status */}

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                            className="
                                px-4
                                py-3
                                rounded-xl
                                border
                                border-[#1F1F1F]/10
                                bg-[#F9F9F7]
                                text-sm
                                text-[#1F1F1F]
                                outline-none
                                focus:border-[#106A2E]/40
                            "
                        >
                            <option value="All">
                                All Statuses
                            </option>
                            <option value="Pending">
                                Pending
                            </option>
                            <option value="Matched">
                                Matched
                            </option>
                            <option value="Claimed">
                                Claimed
                            </option>
                            <option value="Closed">
                                Closed
                            </option>
                        </select>

                        {/* Verification */}

                        <select
                            value={verificationFilter}
                            onChange={(e) =>
                                setVerificationFilter(
                                    e.target.value
                                )
                            }
                            className="
                                px-4
                                py-3
                                rounded-xl
                                border
                                border-[#1F1F1F]/10
                                bg-[#F9F9F7]
                                text-sm
                                text-[#1F1F1F]
                                outline-none
                                focus:border-[#106A2E]/40
                            "
                        >
                            <option value="All">
                                All Verification
                            </option>
                            <option value="Pending">
                                Pending
                            </option>
                            <option value="Verified">
                                Verified
                            </option>
                            <option value="Rejected">
                                Rejected
                            </option>
                        </select>

                    </div>

                    {/* Filter bottom */}

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">

                        <p className="text-xs text-gray-500">
                            Showing{" "}
                            <span className="font-semibold text-[#1F1F1F]">
                                {filteredReports.length}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-[#1F1F1F]">
                                {reports.length}
                            </span>{" "}
                            reports
                        </p>

                        {(search ||
                            typeFilter !== "All" ||
                            statusFilter !== "All" ||
                            verificationFilter !== "All") && (
                            <button
                                onClick={clearFilters}
                                className="
                                    text-xs
                                    font-medium
                                    text-[#106A2E]
                                    hover:underline
                                "
                            >
                                Clear filters
                            </button>
                        )}

                    </div>

                </div>

                {/* ==========================================
                    REPORT TABLE
                ========================================== */}

                <div className="bg-white rounded-2xl border border-[#1F1F1F]/[0.05] overflow-hidden">

                    <div className="px-6 pt-6 pb-4">

                        <div className="flex items-center justify-between">

                            <div>
                                <h2 className="text-lg font-semibold text-[#1F1F1F]">
                                    Submitted Reports
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Review reports submitted by students and faculty.
                                </p>
                            </div>

                        </div>

                    </div>

                    {loading ? (
                        <TableSkeleton />
                    ) : filteredReports.length === 0 ? (

                        <div className="px-6 py-16 text-center">

                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#106A2E]/[0.07] flex items-center justify-center">
                                <PackageSearch
                                    size={27}
                                    className="text-[#106A2E]"
                                />
                            </div>

                            <h3 className="text-base font-semibold text-[#1F1F1F]">
                                No reports found
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                Try adjusting your search or filters.
                            </p>

                        </div>

                    ) : (

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
                                            Date
                                        </th>

                                        <th className="text-left py-3 font-medium">
                                            Status
                                        </th>

                                        <th className="text-left py-3 font-medium">
                                            Verification
                                        </th>

                                        <th className="text-right py-3 px-6 font-medium">
                                            Action
                                        </th>

                                    </tr>
                                </thead>

                                <tbody>

                                    {filteredReports.map((report) => (

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

                                            {/* Item */}

                                            <td className="py-4 px-6">

                                                <div className="min-w-[170px]">

                                                    <p className="text-sm font-medium text-[#1F1F1F]">
                                                        {report.itemName ||
                                                            "Unnamed Item"}
                                                    </p>

                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {report.category ||
                                                            "No category"}
                                                    </p>

                                                </div>

                                            </td>

                                            {/* Reporter */}

                                            <td className="py-4">

                                                <div className="min-w-[150px]">

                                                    <p className="text-sm text-[#1F1F1F]">
                                                        {report.fullName ||
                                                            "Unknown User"}
                                                    </p>

                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {report.idNumber ||
                                                            "N/A"}
                                                    </p>

                                                </div>

                                            </td>

                                            {/* Type */}

                                            <td className="py-4">

                                                <span
                                                    className={`
                                                        inline-flex
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
                                                    {report.reportType ||
                                                        "N/A"}
                                                </span>

                                            </td>

                                            {/* Date */}

                                            <td className="py-4">

                                                <span className="text-sm text-gray-600 whitespace-nowrap">
                                                    {formatDate(
                                                        report.dateLostFound
                                                    )}
                                                </span>

                                            </td>

                                            {/* Status */}

                                            <td className="py-4">

                                                <span
                                                    className={`
                                                        inline-flex
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
                                                    {report.status ||
                                                        "Pending"}
                                                </span>

                                            </td>

                                            {/* Verification */}

                                            <td className="py-4">

                                                <span
                                                    className={`
                                                        inline-flex
                                                        px-2.5
                                                        py-1
                                                        rounded-full
                                                        text-xs
                                                        font-medium
                                                        ${getVerificationClass(
                                                            report.verificationStatus
                                                        )}
                                                    `}
                                                >
                                                    {report.verificationStatus ||
                                                        "Pending"}
                                                </span>

                                            </td>

                                            {/* Action */}

                                            <td className="py-4 px-6">

                                                <div className="flex items-center justify-end gap-2">

                                                    <button
                                                        onClick={() =>
                                                            setSelectedReport(
                                                                report
                                                            )
                                                        }
                                                        title="View details"
                                                        className="
                                                            w-9
                                                            h-9
                                                            rounded-lg
                                                            border
                                                            border-[#1F1F1F]/10
                                                            bg-white
                                                            flex
                                                            items-center
                                                            justify-center
                                                            text-gray-600
                                                            hover:text-[#106A2E]
                                                            hover:border-[#106A2E]/30
                                                            transition
                                                        "
                                                    >
                                                        <Eye size={17} />
                                                    </button>

                                                    {report.verificationStatus?.toLowerCase() ===
                                                        "pending" && (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    handleVerify(
                                                                        report
                                                                    )
                                                                }
                                                                disabled={
                                                                    actionLoading
                                                                }
                                                                title="Verify report"
                                                                className="
                                                                    w-9
                                                                    h-9
                                                                    rounded-lg
                                                                    bg-green-50
                                                                    flex
                                                                    items-center
                                                                    justify-center
                                                                    text-green-700
                                                                    hover:bg-green-100
                                                                    transition
                                                                    disabled:opacity-50
                                                                "
                                                            >
                                                                <CheckCircle2
                                                                    size={17}
                                                                />
                                                            </button>

                                                            <button
                                                                onClick={() =>
                                                                    handleReject(
                                                                        report
                                                                    )
                                                                }
                                                                disabled={
                                                                    actionLoading
                                                                }
                                                                title="Reject report"
                                                                className="
                                                                    w-9
                                                                    h-9
                                                                    rounded-lg
                                                                    bg-red-50
                                                                    flex
                                                                    items-center
                                                                    justify-center
                                                                    text-red-600
                                                                    hover:bg-red-100
                                                                    transition
                                                                    disabled:opacity-50
                                                                "
                                                            >
                                                                <XCircle
                                                                    size={17}
                                                                />
                                                            </button>
                                                        </>
                                                    )}

                                                </div>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

            {/* ==========================================
                VIEW REPORT MODAL
            ========================================== */}

            {selectedReport && (

                <div
                    className="
                        fixed
                        inset-0
                        z-50
                        bg-black/40
                        backdrop-blur-sm
                        flex
                        items-center
                        justify-center
                        p-4
                    "
                    onClick={() =>
                        setSelectedReport(null)
                    }
                >

                    <div
                        className="
                            w-full
                            max-w-2xl
                            max-h-[90vh]
                            overflow-y-auto
                            bg-white
                            rounded-3xl
                            shadow-2xl
                        "
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* Modal header */}

                        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1F1F1F]/[0.06]">

                            <div>

                                <p className="text-xs uppercase tracking-widest text-[#106A2E] font-medium">
                                    Report #{selectedReport.id}
                                </p>

                                <h2 className="text-xl font-semibold text-[#1F1F1F] mt-1">
                                    {selectedReport.itemName ||
                                        "Lost & Found Report"}
                                </h2>

                            </div>

                            <button
                                onClick={() =>
                                    setSelectedReport(null)
                                }
                                className="
                                    w-9
                                    h-9
                                    rounded-xl
                                    bg-gray-100
                                    flex
                                    items-center
                                    justify-center
                                    text-gray-500
                                    hover:bg-gray-200
                                    transition
                                "
                            >
                                <X size={18} />
                            </button>

                        </div>

                        {/* Modal body */}

                        <div className="p-6 space-y-6">

                            {/* Badges */}

                            <div className="flex flex-wrap gap-2">

                                <span
                                    className={`
                                        inline-flex
                                        px-3
                                        py-1.5
                                        rounded-full
                                        text-xs
                                        font-medium
                                        ${getReportTypeClass(
                                            selectedReport.reportType
                                        )}
                                    `}
                                >
                                    {selectedReport.reportType}
                                </span>

                                <span
                                    className={`
                                        inline-flex
                                        px-3
                                        py-1.5
                                        rounded-full
                                        text-xs
                                        font-medium
                                        ${getStatusClass(
                                            selectedReport.status
                                        )}
                                    `}
                                >
                                    {selectedReport.status}
                                </span>

                                <span
                                    className={`
                                        inline-flex
                                        px-3
                                        py-1.5
                                        rounded-full
                                        text-xs
                                        font-medium
                                        ${getVerificationClass(
                                            selectedReport.verificationStatus
                                        )}
                                    `}
                                >
                                    {selectedReport.verificationStatus}
                                </span>

                            </div>

                            {/* Item information */}

                            <div>

                                <h3 className="text-sm font-semibold text-[#1F1F1F] mb-3">
                                    Item Information
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                                    <InfoBox
                                        label="Item Name"
                                        value={
                                            selectedReport.itemName
                                        }
                                    />

                                    <InfoBox
                                        label="Category"
                                        value={
                                            selectedReport.category
                                        }
                                    />

                                    <InfoBox
                                        label="Date"
                                        value={formatDate(
                                            selectedReport.dateLostFound
                                        )}
                                        icon={CalendarDays}
                                    />

                                    <InfoBox
                                        label="Location"
                                        value={
                                            selectedReport.location
                                        }
                                        icon={MapPin}
                                    />

                                </div>

                            </div>

                            {/* Description */}

                            <div>

                                <h3 className="text-sm font-semibold text-[#1F1F1F] mb-3">
                                    Description
                                </h3>

                                <div className="rounded-xl bg-[#F7F5EF] p-4">

                                    <div className="flex gap-3">

                                        <FileText
                                            size={18}
                                            className="text-[#106A2E] mt-0.5 shrink-0"
                                        />

                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {selectedReport.description ||
                                                "No description provided."}
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* Reporter */}

                            <div>

                                <h3 className="text-sm font-semibold text-[#1F1F1F] mb-3">
                                    Reporter Information
                                </h3>

                                <div className="rounded-xl border border-[#1F1F1F]/[0.07] p-4">

                                    <div className="flex items-start gap-3">

                                        <div className="w-10 h-10 rounded-xl bg-[#106A2E]/10 flex items-center justify-center shrink-0">
                                            <User
                                                size={19}
                                                className="text-[#106A2E]"
                                            />
                                        </div>

                                        <div>

                                            <p className="text-sm font-medium text-[#1F1F1F]">
                                                {selectedReport.fullName ||
                                                    "Unknown User"}
                                            </p>

                                            <p className="text-xs text-gray-500 mt-0.5">
                                                ID Number:{" "}
                                                {selectedReport.idNumber ||
                                                    "N/A"}
                                            </p>

                                            <p className="text-xs text-gray-500 mt-0.5">
                                                User ID:{" "}
                                                {selectedReport.userId ||
                                                    "N/A"}
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* Photo */}

                            {selectedReport.photo && (

                                <div>

                                    <h3 className="text-sm font-semibold text-[#1F1F1F] mb-3">
                                        Item Photo
                                    </h3>

                                    <img
                                        src={selectedReport.photo}
                                        alt={selectedReport.itemName}
                                        className="
                                            w-full
                                            max-h-72
                                            object-contain
                                            rounded-2xl
                                            bg-gray-100
                                        "
                                    />

                                </div>

                            )}

                        </div>

                        {/* Modal footer */}

                        <div className="px-6 py-5 border-t border-[#1F1F1F]/[0.06] flex flex-col sm:flex-row justify-end gap-2">

                            <button
                                onClick={() =>
                                    setSelectedReport(null)
                                }
                                className="
                                    px-4
                                    py-2.5
                                    rounded-xl
                                    border
                                    border-[#1F1F1F]/10
                                    text-sm
                                    font-medium
                                    text-gray-600
                                    hover:bg-gray-50
                                    transition
                                "
                            >
                                Close
                            </button>

                            {selectedReport.verificationStatus?.toLowerCase() ===
                                "pending" && (
                                <>
                                    <button
                                        onClick={() =>
                                            handleReject(
                                                selectedReport
                                            )
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                        className="
                                            inline-flex
                                            items-center
                                            justify-center
                                            gap-2
                                            px-4
                                            py-2.5
                                            rounded-xl
                                            bg-red-50
                                            text-red-700
                                            text-sm
                                            font-medium
                                            hover:bg-red-100
                                            transition
                                            disabled:opacity-50
                                        "
                                    >
                                        <XCircle size={16} />
                                        Reject
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleVerify(
                                                selectedReport
                                            )
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                        className="
                                            inline-flex
                                            items-center
                                            justify-center
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
                                            disabled:opacity-50
                                        "
                                    >
                                        <CheckCircle2
                                            size={16}
                                        />
                                        Verify Report
                                    </button>
                                </>
                            )}

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};

// ==========================================
// INFO BOX
// ==========================================

const InfoBox = ({
    label,
    value,
    icon: Icon,
}) => (
    <div className="rounded-xl bg-[#F7F5EF] p-3.5">

        <div className="flex items-center gap-2 mb-1">

            {Icon && (
                <Icon
                    size={14}
                    className="text-[#106A2E]"
                />
            )}

            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
                {label}
            </p>

        </div>

        <p className="text-sm text-[#1F1F1F] font-medium">
            {value || "N/A"}
        </p>

    </div>
);

export default LostFoundReports;