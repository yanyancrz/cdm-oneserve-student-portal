import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import toast from "react-hot-toast";

export default function Dashboard() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [search, setSearch] = useState("");
    const [announcementIndex, setAnnouncementIndex] = useState(0);
    const [digitalIdStatus, setDigitalIdStatus] = useState(null);

    useEffect(() => {

            const email =
                localStorage.getItem("userEmail");

            fetch(`${API_URL}/api/profile/${email}`)
                .then(res => res.json())
                .then(data => setUser(data))
                .catch(console.error);

            fetch(`${API_URL}/api/digitalid/${email}`)
                .then(res => res.json())
                .then(data => setDigitalIdStatus(data))
                .catch(console.error);

    }, []);

    const hasDigitalId =
    digitalIdStatus?.hasDigitalId ?? false;

    const requestSubmitted =
    digitalIdStatus?.requestSubmitted ?? false; 

    const initials =
    user?.fullName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U";

    const profilePicture =
        user?.profilePicture
            ? `${API_URL}${user.profilePicture}`
            : null;

    // Today's date, shown under the greeting
    const todayLabel = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });


    const services = [
        {
            key: "library",
            title: "Library",
            description: "Books & resources",
            route: "/library",
            bg: "#E1F5EE",
            color: "#085041",
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21l7.78-7.55 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
            ),
        },
    ];

    const filteredServices = services.filter((service) =>
        service.title.toLowerCase().includes(search.toLowerCase())
    );

    // ANNOUNCEMENTS DATA — multiple banners, cycled via the side "next" button

    const announcements = [
        {
            key: "library-hours",
            title: "Library hours extended",
            message: "this week for finals prep.",
            isNew: true,
        },
        {
            key: "clinic-checkup",
            title: "Free health checkups",
            message: "available at the clinic until Friday.",
            isNew: true,
        },
        {
            key: "business-hub-pitch",
            title: "Pitch Day registration open",
            message: "submit your student venture by next Monday.",
            isNew: false,
        },
    ];

    const currentAnnouncement = announcements[announcementIndex];

    const goToNextAnnouncement = () => {
        setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    };

    const goToPreviousAnnouncement = () => {
        setAnnouncementIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
    };

    // PLACEHOLDER DATA — Notifications section
    // TODO: replace with real data once a /api/notifications/:email endpoint exists

    const notifications = [
        {
            key: "notif-digitalid",
            title: "Digital ID Approved",
            time: "2h ago",
            icon: "id",
            tint: "#E1F5EE",
            iconColor: "#085041",
        },
        {
            key: "notif-library",
            title: "Library Book Due Tomorrow",
            time: "5h ago",
            icon: "book",
            tint: "#FAEEDA",
            iconColor: "#633806",
        },
        {
            key: "notif-guidance",
            title: "Guidance Appointment Confirmed",
            time: "1d ago",
            icon: "check",
            tint: "#FBEAF0",
            iconColor: "#72243E",
        },
        {
            key: "notif-lostfound",
            title: "Lost Item Matched",
            time: "2d ago",
            icon: "search",
            tint: "#EEEDFE",
            iconColor: "#3C3489",
        },
    ];

    const notificationIcons = {
        id: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M15 8h2M15 12h2M7 16h10" />
            </svg>
        ),
        book: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
        check: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
            </svg>
        ),
        search: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
            </svg>
        ),
    };

    // PLACEHOLDER DATA — Recent Activity section
    // TODO: replace with real data once a /api/activity/:email endpoint exists

    const recentActivity = [
        { key: "act-1", label: "Viewed Digital ID", time: "Today, 9:41 AM" },
        { key: "act-2", label: "Opened Library", time: "Yesterday, 4:12 PM" },
        { key: "act-3", label: "Submitted Lost Item Report", time: "Jul 14, 11:03 AM" },
        { key: "act-4", label: "Guidance Appointment", time: "Jul 12, 2:30 PM" },
    ];

    return (

        <div
            className="min-h-screen p-4 sm:p-6 pb-24"
            style={{
                background: "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)"
            }}
        >

            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <div className="max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto">

                {/* GREETING */}

                <div className="flex items-center justify-between mb-6">

                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1F1F1F] tracking-tight">
                            Good Morning
                        </h1>
                        <p className="text-gray-600 text-sm sm:text-base mt-0.5">
                            {localStorage.getItem("userName")}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            {todayLabel}
                        </p>
                    </div>

                   {
                    profilePicture ? (

                        <img
                            src={profilePicture}
                            alt="Profile"
                            className="
                                w-12
                                h-12
                                rounded-full
                                object-cover
                                border-2
                                border-white
                                shadow-md
                                flex-shrink-0
                            "
                        />

                    ) : (

                        <div
                            className="
                                w-12
                                h-12
                                rounded-full
                                bg-[#106A2E]
                                text-white
                                flex
                                items-center
                                justify-center
                                text-sm
                                font-semibold
                                shadow-md
                                border-2
                                border-white
                                flex-shrink-0
                            "
                        >
                            {initials}
                        </div>

                    )
                }

                </div>

                {/* SEARCH BAR */}

                <div className="relative mb-6">

                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
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
                            pl-11
                            pr-4
                            py-3.5
                            rounded-2xl
                            border border-white/60
                            bg-white/80
                            backdrop-blur-sm
                            text-sm
                            text-[#1F1F1F]
                            placeholder:text-gray-400
                            outline-none
                            shadow-sm
                            focus:border-[#106A2E]/40
                            focus:bg-white
                            focus:shadow-md
                            transition-all
                            duration-200
                        "
                    />

                </div>

                {/* DIGITAL ID CARD — hero card, gateway to campus services */}

                <div className="bg-[#106A2E] rounded-[24px] p-6 mb-7 relative overflow-hidden shadow-lg shadow-[#106A2E]/20">

                    {/* decorative shapes */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/[0.06]" />
                    <div className="absolute -bottom-14 -left-6 w-32 h-32 rounded-full bg-white/[0.05]" />
                    <div className="absolute top-6 right-6 w-24 h-24 rounded-full border border-white/10" />

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-white/70 bg-white/10 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F4D35E]" />
                            CDM OneServe
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="16" rx="2" />
                                <circle cx="9" cy="10" r="2" />
                                <path d="M15 8h2M15 12h2M7 16h10" />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-white text-xl font-semibold mb-1.5 relative z-10 tracking-tight">
                        Digital Student ID
                    </h2>

                    <p className="text-white/70 text-sm mb-5 leading-relaxed relative z-10 max-w-[80%]">
                        Your gateway to Library, Clinic, Lost &amp; Found, and Guidance.
                    </p>

                    {
                    hasDigitalId ? (

                        <button
                            onClick={() => navigate("/view-digital-id")}
                            className="
                                w-full
                                bg-[#F4D35E]
                                text-[#1F1F1F]
                                p-3.5
                                rounded-xl
                                font-semibold
                                text-sm
                                relative z-10
                                shadow-md
                                hover:brightness-105
                                active:scale-[0.99]
                                transition-all
                            "
                        >
                            View Digital ID
                        </button>

                    ) : requestSubmitted ? (

                        <button
                            onClick={() => navigate("/view-digital-id")}
                            className="
                                w-full
                                bg-amber-400
                                text-[#1F1F1F]
                                p-3.5
                                rounded-xl
                                font-semibold
                                text-sm
                                relative z-10
                                shadow-md
                                hover:brightness-105
                                active:scale-[0.99]
                                transition-all
                            "
                        >
                            Request Pending
                        </button>

                    ) : (

                        <button
                            onClick={() => navigate("/request-digital-id")}
                            className="
                                w-full
                                bg-white
                                text-[#106A2E]
                                p-3.5
                                rounded-xl
                                font-semibold
                                text-sm
                                relative z-10
                                shadow-md
                                hover:brightness-105
                                active:scale-[0.99]
                                transition-all
                            "
                        >
                            Request Digital ID
                        </button>

                    )
                }

                </div>

                {/* CAMPUS SERVICES */}

                <div className="flex items-center justify-between mb-3.5">
                    <h2 className="flex items-center gap-2 font-semibold text-base text-[#1F1F1F]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#106A2E]">
                            <path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6" />
                        </svg>
                        Campus Services
                    </h2>
                    {!hasDigitalId && (
                        <span className="text-[11px] text-gray-500 bg-white/70 px-2.5 py-1 rounded-full">
                            Digital ID required
                        </span>
                    )}
                </div>

                {/* GRID on larger screens, CAROUSEL on mobile — free swipe/scroll with snap */}

                <div
                    className="
                        grid grid-cols-4 gap-3
                        sm:grid
                        overflow-x-auto
                        pb-2
                        -mx-4 px-4 sm:mx-0 sm:px-0
                        snap-x snap-mandatory
                        scrollbar-hide
                        mb-7
                        auto-cols-[minmax(7.5rem,1fr)]
                        grid-flow-col
                        sm:grid-flow-row
                    "
                    style={{ scrollbarWidth: "none" }}
                >

                    {
                        filteredServices.map((service) => (

                            <button
                                    key={service.key}
                                    onClick={() => {
                                        if (!hasDigitalId) {
                                            toast("You need a Digital ID to access Campus Services.");
                                            return;
                                        }

                                        if (service.route) {
                                            navigate(service.route);
                                        }
                                        else if (service.url) {
                                            window.open(service.url, "_blank");
                                        }
                                    }}
                                    className="
                                        group
                                        bg-white/90
                                        border border-white/60
                                        rounded-2xl
                                        p-4
                                        flex
                                        flex-col
                                        items-start
                                        justify-between
                                        text-left
                                        flex-shrink-0
                                        w-32
                                        sm:w-auto
                                        h-32
                                        snap-start
                                        shadow-sm
                                        hover:shadow-md
                                        hover:border-[#106A2E]/25
                                        hover:-translate-y-0.5
                                        active:scale-[0.98]
                                        transition-all
                                        duration-200
                                    "
                                >

                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
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
                            <div className="w-full col-span-4 text-center text-sm text-gray-500 py-8">
                                No services match "{search}"
                            </div>
                        )
                    }

                </div>

                {/* ANNOUNCEMENTS — rectangle card style, matching Digital ID card, with a side button to cycle through multiple announcements */}

                <div className="bg-[#F4D35E] rounded-[24px] p-5 mb-7 relative overflow-hidden shadow-md shadow-[#F4D35E]/30">

                    {/* decorative circle, mirroring the Digital ID card's style */}
                    <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/15" />

                    <div className="flex items-center justify-between mb-3 relative z-10">

                        <span className="text-[11px] font-medium uppercase tracking-widest text-[#1F1F1F]/60">
                            Announcements
                        </span>

                        <div className="flex items-center gap-1.5">

                            {
                                announcements.map((item, index) => (
                                    <span
                                        key={item.key}
                                        className={`
                                            rounded-full
                                            transition-all
                                            duration-200
                                            ${index === announcementIndex ? "w-4 h-1.5 bg-[#1F1F1F]" : "w-1.5 h-1.5 bg-[#1F1F1F]/25"}
                                        `}
                                    />
                                ))
                            }

                        </div>

                    </div>

                    <div className="flex items-center gap-3 relative z-10">

                        {/* SIDE BUTTON — goes back to the previous announcement */}

                        <button
                            onClick={goToPreviousAnnouncement}
                            aria-label="Previous announcement"
                            className="
                                w-9
                                h-9
                                rounded-full
                                bg-white/40
                                text-[#1F1F1F]
                                flex
                                items-center
                                justify-center
                                flex-shrink-0
                                active:scale-95
                                hover:bg-white/60
                                transition-all
                            "
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                        </button>

                        <div className="w-10 h-10 rounded-xl bg-white/40 text-[#1F1F1F] flex items-center justify-center flex-shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                            {currentAnnouncement.isNew && (
                                <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-[#106A2E] bg-white/50 px-1.5 py-0.5 rounded mb-1">
                                    New
                                </span>
                            )}
                            <h2 className="text-[#1F1F1F] text-base font-semibold leading-snug">
                                {currentAnnouncement.title}
                            </h2>
                            <p className="text-[#1F1F1F]/70 text-xs leading-relaxed mt-0.5">
                                {currentAnnouncement.message}
                            </p>
                        </div>

                        {/* SIDE BUTTON — advances to the next announcement */}

                        <button
                            onClick={goToNextAnnouncement}
                            aria-label="Next announcement"
                            className="
                                w-9
                                h-9
                                rounded-full
                                bg-white/40
                                text-[#1F1F1F]
                                flex
                                items-center
                                justify-center
                                flex-shrink-0
                                active:scale-95
                                hover:bg-white/60
                                transition-all
                            "
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </button>

                    </div>

                </div>

                {/* NOTIFICATIONS — new section, placeholder data only, pending API integration */}

                <div className="mb-7">

                    <h2 className="flex items-center gap-2 font-semibold text-base text-[#1F1F1F] mb-3.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#106A2E]">
                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                        </svg>
                        Notifications
                    </h2>

                    <div className="bg-white/80 rounded-2xl divide-y divide-gray-100 shadow-sm overflow-hidden sm:grid sm:grid-cols-2 sm:divide-y-0 sm:gap-px sm:bg-gray-100">

                        {
                            notifications.map((item) => (
                                <div
                                    key={item.key}
                                    className="flex items-center gap-3 p-4 bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ background: item.tint, color: item.iconColor }}
                                    >
                                        {notificationIcons[item.icon]}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-[#1F1F1F] truncate">
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {item.time}
                                        </p>
                                    </div>
                                </div>
                            ))
                        }

                    </div>

                </div>

                {/* RECENT ACTIVITY — new section, placeholder data only, pending API integration */}

                <div>

                    <h2 className="flex items-center gap-2 font-semibold text-base text-[#1F1F1F] mb-3.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#106A2E]">
                            <path d="M12 8v4l3 3" />
                            <circle cx="12" cy="12" r="9" />
                        </svg>
                        Recent Activity
                    </h2>

                    <div className="bg-white/80 rounded-2xl shadow-sm p-2">

                        {
                            recentActivity.map((item, index) => (
                                <div
                                    key={item.key}
                                    className={`
                                        flex items-center gap-3 px-3 py-3
                                        ${index !== recentActivity.length - 1 ? "border-b border-gray-100" : ""}
                                    `}
                                >
                                    <div className="w-6 h-6 rounded-full bg-[#106A2E]/10 text-[#106A2E] flex items-center justify-center flex-shrink-0">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-[#1F1F1F]">
                                            {item.label}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-400 flex-shrink-0">
                                        {item.time}
                                    </span>
                                </div>
                            ))
                        }

                    </div>

                </div>

            </div>

        </div>

    );

}