import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import AdminLayout from "../../layouts/AdminLayout";

export default function AdminDashboard() {

    const navigate = useNavigate();
    const location = useLocation();

    const [filter, setFilter] = useState("All");

    const [stats, setStats] = useState([]);

    const [requests, setRequests] = useState([]);

    const statusStyles = {
        Pending: "bg-[#FCEFCB] text-[#A16207]",
        Approved: "bg-[#E1F0E4] text-[#106A2E]",
        Rejected: "bg-[#F6E3E1] text-[#9F3434]",
    };

    const initials = (name) =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

    const filteredRequests =
        filter === "All"
            ? requests
            : requests.filter((r) => r.status === filter);

    const tabs = ["All", "Pending", "Approved", "Rejected"];

    useEffect(() => {

    fetch(`${API_URL}/api/digitalid/admin/dashboard`)
        .then(res => res.json())
        .then(data => {

            setStats([
                {
                    key: "pending",
                    label: "Pending Requests",
                    value: data.pending,
                    color: "#A16207",
                    bg: "#FCEFCB"
                },
                {
                    key: "approved",
                    label: "Approved IDs",
                    value: data.approved,
                    color: "#106A2E",
                    bg: "#E1F0E4"
                },
                {
                    key: "rejected",
                    label: "Rejected Requests",
                    value: data.rejected,
                    color: "#9F3434",
                    bg: "#F6E3E1"
                },
                {
                    key: "total",
                    label: "Total Users",
                    value: data.totalUsers,
                    color: "#1F1F1F",
                    bg: "#ECE9E2"
                }
            ]);

        });

    fetch(`${API_URL}/api/digitalid/admin/recent-requests`)
        .then(res => res.json())
        .then(data => {

            setRequests(data);

        });

}, []);

    return (

        <div
            className="min-h-screen flex"
        >

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
                .font-display { font-family: 'Fraunces', serif; }
            `}</style>
            
            {/* MAIN CONTENT */}

            <main className="flex-1 px-10 py-8 max-w-[1200px]">

                {/* TOP BAR */}

                <div className="flex items-center justify-between mb-9">

                    <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#106A2E]/70 font-medium mb-1">
                            Tuesday, June 23
                        </p>
                        <h2 className="font-display text-3xl text-[#1F1F1F]">
                            Good morning, Admin
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">

                        <button
                            onClick={() => navigate("/admin/requests")}
                            className="
                                flex
                                items-center
                                gap-2
                                px-5
                                py-2.5
                                rounded-full
                                text-sm
                                font-medium
                                text-white
                                transition-colors
                            "
                            style={{ background: "#106A2E" }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="16" rx="2" />
                                <path d="M7 8h10M7 12h10M7 16h6" />
                            </svg>
                            Review requests
                        </button>

                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0"
                            style={{ background: "#1F1F1F" }}
                        >
                            AD
                        </div>

                    </div>

                </div>

                {/* STATS */}

                <div className="grid grid-cols-4 gap-5 mb-8">

                    {
                        stats.map((stat) => {

                            
                            return (

                                <div
                                    key={stat.key}
                                    className="bg-white rounded-2xl p-5 border border-[#1F1F1F]/[0.05] hover:-translate-y-0.5 hover:shadow-md transition-all"
                                >

                                    <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-2">
                                        {stat.label}
                                    </p>

                                    <div className="flex items-end justify-between">

                                        <p
                                            className="font-display text-3xl"
                                            style={{ color: stat.color }}
                                        >
                                            {stat.value}
                                        </p>

                                    </div>
                                    
                                </div>

                            );

                        })
                    }

                </div>

                {/* RECENT REQUESTS */}

                <div className="bg-white rounded-2xl border border-[#1F1F1F]/[0.05] overflow-hidden">

                    <div className="flex items-center justify-between px-6 pt-6 pb-4">

                        <h3 className="font-display text-xl text-[#1F1F1F]">
                            Recent Digital ID Requests
                        </h3>

                        <button
                            onClick={() => navigate("/admin/requests")}
                            className="text-sm font-medium text-[#106A2E] hover:underline"
                        >
                            View all →
                        </button>

                    </div>

                    {/* FILTER TABS */}

                    <div className="flex gap-2 px-6 pb-4">

                        {
                            tabs.map((tab) => (

                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab)}
                                    className={`
                                        px-3.5
                                        py-1.5
                                        rounded-full
                                        text-xs
                                        font-medium
                                        transition-colors
                                        ${
                                            filter === tab
                                                ? "bg-[#106A2E] text-white"
                                                : "bg-[#F7F5EF] text-gray-500 hover:bg-[#ECE9E2]"
                                        }
                                    `}
                                >
                                    {tab}
                                </button>

                            ))
                        }

                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full">

                            <thead>

                                <tr className="border-t border-b border-[#1F1F1F]/[0.06] text-gray-500 text-xs uppercase tracking-wide">

                                    <th className="text-left py-3 px-6 font-medium">
                                        Name
                                    </th>

                                    <th className="text-left py-3 font-medium">
                                        Role
                                    </th>

                                    <th className="text-left py-3 font-medium">
                                        Institute / Program
                                    </th>

                                    <th className="text-left py-3 font-medium">
                                        Date
                                    </th>

                                    <th className="text-left py-3 font-medium">
                                        Status
                                    </th>

                                    <th className="text-right py-3 px-6 font-medium">
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {
                                    filteredRequests.map((req) => (

                                        <tr
                                            key={req.id}
                                            className="border-b border-[#1F1F1F]/[0.05] last:border-0 hover:bg-[#F7F5EF]/60 transition-colors"
                                        >

                                            <td className="py-4 px-6">

                                                <div className="flex items-center gap-3">

                                                    <div
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                                                        style={{ background: "#E1F0E4", color: "#106A2E" }}
                                                    >
                                                        {initials(req.fullName)}
                                                    </div>

                                                    <span className="font-medium text-[#1F1F1F] text-sm">
                                                        {req.fullName}
                                                    </span>

                                                </div>

                                            </td>

                                            <td className="text-gray-600 text-sm">
                                                {req.role}
                                            </td>

                                            <td className="text-gray-600 text-sm max-w-[220px] truncate">
                                                {req.detail}
                                            </td>

                                            <td className="text-gray-500 text-sm">
                                                {new Date(req.requestedAt).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric"
                                                })}
                                            </td>

                                            <td>

                                                <span
                                                    className={`
                                                        px-3
                                                        py-1
                                                        rounded-full
                                                        text-xs
                                                        font-medium
                                                        ${statusStyles[req.status]}
                                                    `}
                                                >
                                                    {req.status}
                                                </span>

                                            </td>

                                            <td className="text-right px-6">

                                                <button
                                                    onClick={() => navigate("/admin/requests")}
                                                    className="text-sm font-medium text-[#106A2E] hover:underline"
                                                >
                                                    View
                                                </button>

                                            </td>

                                        </tr>

                                    ))
                                }

                                {
                                    filteredRequests.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center text-sm text-gray-400 py-10">
                                                No {filter.toLowerCase()} requests right now.
                                            </td>
                                        </tr>
                                    )
                                }

                            </tbody>

                        </table>

                    </div>

                </div>

            </main>

        </div>

    );
}