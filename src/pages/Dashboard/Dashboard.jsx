import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Dashboard() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => {

        const email =
            localStorage.getItem(
                "userEmail"
            );

        fetch(
            `http://localhost:5212/api/profile/${email}`
        )
            .then(res => res.json())
            .then(data => setUser(data))
            .catch(console.error);

    }, []);

    const hasDigitalId = true; // Replace with actual logic to check if the user has a digital ID

    const initials =
    user?.fullName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U";

    const profilePicture =
        user?.profilePicture
            ? `http://localhost:5212${user.profilePicture}`
            : null;

    // SERVICES DATA — easier to filter, map, and maintain than separate JSX blocks

    const services = [
        {
            key: "library",
            title: "Library",
            description: "Books & resources",
            url: "https://library.cdmoneserve.vercel.app",
            bg: "#E1F5EE",
            color: "#085041",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
            ),
        },
        {
            key: "clinic",
            title: "Clinic",
            description: "Health services",
            url: "https://clinic.cdmoneserve.vercel.app",
            bg: "#FAECE7",
            color: "#712B13",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
            ),
        },
        {
            key: "business-hub",
            title: "Business Hub",
            description: "Student ventures",
            url: "https://businesshub.cdmoneserve.vercel.app",
            bg: "#FAEEDA",
            color: "#633806",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
            ),
        },
        {
            key: "lost-found",
            title: "Lost & Found",
            description: "Report items",
            url: "https://lostfound.cdmoneserve.vercel.app",
            bg: "#EEEDFE",
            color: "#3C3489",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10V8a4 4 0 0 1 8 0v2" />
                    <rect x="2" y="10" width="20" height="11" rx="2" />
                </svg>
            ),
        },
        {
            key: "guidance",
            title: "Guidance",
            description: "Counseling support",
            url: "https://guidance.cdmoneserve.vercel.app",
            bg: "#FBEAF0",
            color: "#72243E",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21l7.78-7.55 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
            ),
        },
    ];

    const filteredServices = services.filter((service) =>
        service.title.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <div
            className="min-h-screen p-4 pb-24"
            style={{
                background: "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)"
            }}
        >

            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <div className="max-w-md mx-auto">

                {/* GREETING */}

                <div className="flex items-center justify-between mb-4">

                    <div>
                        <h1 className="text-2xl font-semibold text-[#1F1F1F]">
                            Good Morning
                        </h1>
                       <p className="text-gray-600">
                            {localStorage.getItem("userName")}
                        </p>
                    </div>

                   {
                    profilePicture ? (

                        <img
                            src={profilePicture}
                            alt="Profile"
                            className="
                                w-11
                                h-11
                                rounded-full
                                object-cover
                                border
                                border-[#106A2E]/20
                                flex-shrink-0
                            "
                        />

                    ) : (

                        <div
                            className="
                                w-11
                                h-11
                                rounded-full
                                bg-[#106A2E]
                                text-white
                                flex
                                items-center
                                justify-center
                                text-sm
                                font-medium
                                flex-shrink-0
                            "
                        >
                            {initials}
                        </div>

                    )
                }

                </div>

                {/* NOTIFICATION / ANNOUNCEMENT BANNER */}

                <button
                    onClick={() => navigate("/notifications")}
                    className="
                        w-full
                        bg-white/85
                        border border-[#106A2E]/10
                        rounded-2xl
                        px-3.5
                        py-3
                        mb-4
                        flex
                        items-center
                        gap-2.5
                        text-left
                        hover:bg-white
                        transition-colors
                    "
                >

                    <div className="w-8 h-8 rounded-lg bg-[#F4D35E] text-[#1F1F1F] flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </div>

                    <p className="text-xs text-[#1F1F1F] leading-snug flex-1">
                        <span className="font-semibold">Library hours extended</span> this week for finals prep.
                    </p>

                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />

                </button>

                {/* SEARCH BAR */}

                <div className="relative mb-5">

                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>

                    <input
                        type="text"
                        placeholder="Search services..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="
                            w-full
                            pl-9
                            pr-3.5
                            py-2.5
                            rounded-xl
                            border border-[#106A2E]/15
                            bg-white/90
                            text-sm
                            text-[#1F1F1F]
                            outline-none
                            focus:border-[#106A2E]
                            focus:bg-white
                            transition-colors
                        "
                    />

                </div>

                {/* DIGITAL ID CARD */}

                <div className="bg-[#106A2E] rounded-2xl p-5 mb-6 relative overflow-hidden">

                    {/* decorative circle */}
                    <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />

                    <div className="flex items-center justify-between mb-1.5 relative z-10">
                        <span className="text-[11px] uppercase tracking-widest text-white/60">
                            CDM OneServe
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="16" rx="2" />
                                <circle cx="9" cy="10" r="2" />
                                <path d="M15 8h2M15 12h2M7 16h10" />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-white text-lg font-medium mb-1 relative z-10">
                        Digital Student ID
                    </h2>

                    <p className="text-white/70 text-sm mb-4 leading-relaxed relative z-10">
                        Access your Digital ID and QR Code anytime.
                    </p>

                    {
                        hasDigitalId ? (
                            <button
                                onClick={() => navigate("/view-digital-id")}
                                className="
                                    w-full
                                    bg-[#F4D35E]
                                    hover:opacity-90
                                    active:scale-[0.98]
                                    text-[#1F1F1F]
                                    p-3
                                    rounded-lg
                                    font-medium
                                    text-sm
                                    transition-all
                                    flex
                                    items-center
                                    justify-center
                                    gap-2
                                    relative
                                    z-10
                                "
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                    <path d="M14 14h3v3h-3zM17 17h4v4h-4z" />
                                </svg>
                                View Digital ID
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate("/request-digital-id")}
                                className="
                                    w-full
                                    bg-white
                                    hover:opacity-90
                                    active:scale-[0.98]
                                    text-[#106A2E]
                                    p-3
                                    rounded-lg
                                    font-medium
                                    text-sm
                                    transition-all
                                    relative
                                    z-10
                                "
                            >
                                Request Digital ID
                            </button>
                        )
                    }

                </div>

                {/* CAMPUS SERVICES */}

                <h2 className="flex items-center gap-2 font-medium text-base text-[#1F1F1F] mb-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                        <path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6" />
                    </svg>
                    Campus Services
                </h2>

                {/* CAROUSEL — free swipe/scroll with snap */}

                <div
                    className="
                        flex
                        gap-3
                        overflow-x-auto
                        pb-2
                        -mx-4
                        px-4
                        snap-x
                        snap-mandatory
                        scrollbar-hide
                    "
                    style={{ scrollbarWidth: "none" }}
                >

                    {
                        filteredServices.map((service) => (

                            <button
                                key={service.key}
                                onClick={() => window.open(service.url, "_blank")}
                                className="
                                    bg-white/90
                                    border border-[#106A2E]/10
                                    rounded-2xl
                                    p-4
                                    flex
                                    flex-col
                                    items-start
                                    justify-between
                                    text-left
                                    flex-shrink-0
                                    w-32
                                    h-32
                                    snap-start
                                    hover:border-[#106A2E]/30
                                    hover:-translate-y-0.5
                                    transition-all
                                "
                            >

                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: service.bg, color: service.color }}
                                >
                                    {service.icon}
                                </div>

                                <div>
                                    <div className="text-sm font-semibold text-[#1F1F1F]">
                                        {service.title}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5 leading-snug">
                                        {service.description}
                                    </div>
                                </div>

                            </button>

                        ))
                    }

                    {
                        filteredServices.length === 0 && (
                            <div className="w-full text-center text-sm text-gray-500 py-8">
                                No services match "{search}"
                            </div>
                        )
                    }

                </div>

            </div>

        </div>

    );

}
