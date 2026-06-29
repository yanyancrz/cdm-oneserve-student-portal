import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import ViewRequestModal from "../../components/Admin/ViewRequestModal";
import { toast } from "react-hot-toast";

export default function DigitalIDRequests() {

    const [requests, setRequests] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [filter, setFilter] = useState("Pending");
    const [forApproval, setForApproval] = useState([]);
    const [forRejection, setForRejection] = useState([]);

    useEffect(() => {

        loadRequests();
        loadQueues();

    }, []);

    const approveAll = async () => {

        const response = await fetch(
            `${API_URL}/api/digitalid/admin/approve-all`,
            {
                method: "PUT"
            }
        );

        if (response.ok) {
            toast.success(
                "All requests approved"
            );

            window.location.reload();
        }
    };

    const rejectAll = async () => {

        const response = await fetch(
            `${API_URL}/api/digitalid/admin/reject-all`,
            {
                method: "PUT"
            }
        );

        if (response.ok) {
            toast.success(
                "All requests rejected"
            );

            window.location.reload();
        }
    };

    const handleForApproval = async (id) => {

        const response = await fetch(
            `${API_URL}/api/digitalid/admin/for-approval/${id}`,
            {
                method: "PUT"
            }
        );

        if (response.ok) {
            toast.success(
                "Added to Approval Queue"
            );

            loadQueues();

            setSelectedRequest(null);
        }
    };

    const handleForRejection = async (id) => {

        const response = await fetch(
            `${API_URL}/api/digitalid/admin/for-rejection/${id}`,
            {
                method: "PUT"
            }
        );

        if (response.ok) {
            toast.success(
                "Added to Rejection Queue"
            );

            loadQueues();

            setSelectedRequest(null);
        }
    };

    const filteredRequests =
        requests
            .filter(x =>
                x.status === filter
            )
            .filter(x =>
                x.fullName
                    ?.toLowerCase()
                    .includes(
                        search.toLowerCase()
                    )
            );

    const statusStyles = {
        pending: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
        approved: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
        rejected: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
    };

    const getStatusStyle = (status) =>
        statusStyles[status?.toLowerCase()] || "bg-gray-100 text-gray-600 ring-1 ring-gray-200";

    const loadRequests = async () => {

        try {

            setLoading(true);

            const response = await fetch(
                `${API_URL}/api/digitalid/admin/pending`
            );

            const data = await response.json();

            setRequests(data);

        }
        finally {

            setLoading(false);

        }
    };

    const loadQueues = async () => {

        const approvalRes = await fetch(
            `${API_URL}/api/digitalid/admin/for-approval`
        );

        const approvalData =
            await approvalRes.json();

        setForApproval(approvalData);

        const rejectionRes = await fetch(
            `${API_URL}/api/digitalid/admin/for-rejection`
        );

        const rejectionData =
            await rejectionRes.json();

        setForRejection(rejectionData);
    };

    const filterTabs = [
        { key: "Pending", label: "Pending" },
        { key: "Approved", label: "Approved" },
        { key: "Rejected", label: "Rejected" },
    ];

    const showQueues = filter === "Pending";

    return (

        <div className="p-8  min-h-screen">

            {/* HEADER */}

            <div className="flex flex-wrap justify-between items-end gap-4 mb-7">

                <div>
                    <h1 className="text-[26px] font-bold text-gray-800 tracking-tight">
                        Digital ID Requests
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {filteredRequests.length} request{filteredRequests.length !== 1 && "s"} found
                    </p>
                </div>

                <div className="flex items-center gap-3">

                    <div className="relative">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="7" />
                            <path d="M21 21l-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="
                                border
                                border-gray-200
                                rounded-xl
                                pl-9
                                pr-4
                                py-2.5
                                w-64
                                text-sm
                                bg-white
                                focus:outline-none
                                focus:ring-2
                                focus:ring-[#0E3B22]/20
                                focus:border-[#0E3B22]
                                transition
                            "
                        />
                    </div>

                    <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">

                        {filterTabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`
                                    px-4
                                    py-2
                                    rounded-lg
                                    text-sm
                                    font-medium
                                    transition-all
                                    ${filter === tab.key
                                        ? "bg-white text-[#0E3B22] shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}

                    </div>

                </div>

            </div>

            {/* TABLE CARD */}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                <table className="w-full text-sm">

                    <thead>
                        <tr className="bg-[#F7F5EF] border-b border-gray-100">
                            <th className="p-4 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide">
                                Name
                            </th>
                            <th className="p-4 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide">
                                Role
                            </th>
                            <th className="p-4 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide">
                                Institute
                            </th>
                            <th className="p-4 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide">
                                Status
                            </th>
                            <th className="p-4 text-center font-semibold text-gray-500 uppercase text-xs tracking-wide">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>

                        {loading && (
                            <tr>
                                <td colSpan={5} className="p-14 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-6 h-6 border-2 border-gray-200 border-t-[#0E3B22] rounded-full animate-spin" />
                                        <span>Loading requests...</span>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {!loading && filteredRequests.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-14 text-center text-gray-400">
                                    No {filter.toLowerCase()} requests found.
                                </td>
                            </tr>
                        )}

                        {!loading && filteredRequests.map(req => (

                            <tr
                                key={req.id}
                                className="border-t border-gray-100 hover:bg-[#F7F5EF]/60 transition-colors"
                            >

                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                                            style={{ background: "#0E3B22" }}
                                        >
                                            {req.fullName?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                        <span className="font-medium text-gray-800">
                                            {req.fullName}
                                        </span>
                                    </div>
                                </td>

                                <td className="p-4 text-gray-600">
                                    {req.role}
                                </td>

                                <td className="p-4 text-gray-600">
                                    {req.institute}
                                </td>

                                <td className="p-4">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(req.status)}`}
                                    >
                                        {req.status}
                                    </span>
                                </td>

                                <td className="p-4">

                                    <div className="flex justify-center gap-2">

                                        <button
                                            onClick={() => setSelectedRequest(req)}
                                            className="
                                                px-3
                                                py-1.5
                                                text-xs
                                                font-medium
                                                rounded-lg
                                                border
                                                border-gray-200
                                                text-gray-600
                                                hover:bg-gray-50
                                                hover:border-gray-300
                                                transition
                                            "
                                        >
                                            View
                                        </button>

                                    </div>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            {/* QUEUES — only shown while reviewing Pending requests */}

            {showQueues && (

                <>

                    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

                        <div className="flex justify-between items-center mb-4">

                            <div>
                                <h2 className="text-lg font-bold text-gray-800">
                                    For Approval Queue
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {forApproval.length} request{forApproval.length !== 1 && "s"} reviewed and ready to approve
                                </p>
                            </div>

                            <button
                                onClick={approveAll}
                                disabled={forApproval.length === 0}
                                className="
                                    bg-emerald-600
                                    text-white
                                    px-4
                                    py-2.5
                                    rounded-xl
                                    text-sm
                                    font-medium
                                    hover:bg-emerald-700
                                    transition
                                    disabled:opacity-40
                                    disabled:cursor-not-allowed
                                "
                            >
                                Approve All Reviewed Requests
                            </button>

                        </div>

                        <div className="rounded-xl border border-gray-100 overflow-hidden">

                            <table className="w-full text-sm">

                                <thead>
                                    <tr className="bg-[#F7F5EF]">
                                        <th className="text-left p-3 font-semibold text-gray-500 uppercase text-xs tracking-wide">Name</th>
                                        <th className="text-left p-3 font-semibold text-gray-500 uppercase text-xs tracking-wide">Role</th>
                                        <th className="text-left p-3 font-semibold text-gray-500 uppercase text-xs tracking-wide">Institute</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {forApproval.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-gray-400 text-sm">
                                                No requests in the approval queue.
                                            </td>
                                        </tr>
                                    )}

                                    {forApproval.map(req => (

                                        <tr key={req.id} className="border-t border-gray-100">
                                            <td className="p-3 font-medium text-gray-800">{req.fullName}</td>
                                            <td className="p-3 text-gray-600">{req.role}</td>
                                            <td className="p-3 text-gray-600">{req.institute}</td>
                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                    <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

                        <div className="flex justify-between items-center mb-4">

                            <div>
                                <h2 className="text-lg font-bold text-gray-800">
                                    For Rejection Queue
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {forRejection.length} request{forRejection.length !== 1 && "s"} reviewed and marked for rejection
                                </p>
                            </div>

                            <button
                                onClick={rejectAll}
                                disabled={forRejection.length === 0}
                                className="
                                    bg-rose-500
                                    text-white
                                    px-4
                                    py-2.5
                                    rounded-xl
                                    text-sm
                                    font-medium
                                    hover:bg-rose-600
                                    transition
                                    disabled:opacity-40
                                    disabled:cursor-not-allowed
                                "
                            >
                                Reject All Reviewed Requests
                            </button>

                        </div>

                        <div className="rounded-xl border border-gray-100 overflow-hidden">

                            <table className="w-full text-sm">

                                <thead>
                                    <tr className="bg-[#F7F5EF]">
                                        <th className="text-left p-3 font-semibold text-gray-500 uppercase text-xs tracking-wide">Name</th>
                                        <th className="text-left p-3 font-semibold text-gray-500 uppercase text-xs tracking-wide">Role</th>
                                        <th className="text-left p-3 font-semibold text-gray-500 uppercase text-xs tracking-wide">Institute</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {forRejection.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-gray-400 text-sm">
                                                No requests in the rejection queue.
                                            </td>
                                        </tr>
                                    )}

                                    {forRejection.map(req => (

                                        <tr key={req.id} className="border-t border-gray-100">
                                            <td className="p-3 font-medium text-gray-800">{req.fullName}</td>
                                            <td className="p-3 text-gray-600">{req.role}</td>
                                            <td className="p-3 text-gray-600">{req.institute}</td>
                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </>

            )}

            <ViewRequestModal
                request={selectedRequest}
                onClose={() => setSelectedRequest(null)}
                onForApproval={(id) => handleForApproval(id)}
                onForRejection={(id) => handleForRejection(id)}
            />

        </div>

    );

}