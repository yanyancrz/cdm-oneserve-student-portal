import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ServiceCard from "../../components/ServiceCard/ServiceCard";

export default function Dashboard() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);

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

    const hasDigitalId = false; // Replace with actual logic to check if the user has a digital ID

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

    return (

        <div className="min-h-screen bg-[#F1F1F1] p-4 pb-24">

            <div className="max-w-md mx-auto">

                {/* GREETING */}

                <div className="flex items-center justify-between mb-6">

                    <div>
                        <h1 className="text-2xl font-semibold text-[#1F1F1F]">
                            Good Morning
                        </h1>
                       <p className="text-gray-500">
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

                <div className="grid gap-2.5">

                    <ServiceCard
                        icon="📚"
                        title="Library"
                        description="Access library information and services."
                        url="https://library.cdmoneserve.vercel.app"
                    />

                    <ServiceCard
                        icon="🏥"
                        title="Clinic"
                        description="View clinic services and announcements."
                        url="https://clinic.cdmoneserve.vercel.app"
                    />

                    <ServiceCard
                        icon="💼"
                        title="Business Hub"
                        description="Explore student businesses and services."
                        url="https://businesshub.cdmoneserve.vercel.app"
                    />

                    <ServiceCard
                        icon="📦"
                        title="Lost & Found"
                        description="Report or locate lost belongings."
                        url="https://lostfound.cdmoneserve.vercel.app"
                    />

                    <ServiceCard
                        icon="🎓"
                        title="Guidance"
                        description="Guidance counseling and student support."
                        url="https://guidance.cdmoneserve.vercel.app"
                    />

                </div>

            </div>

        </div>

    );

}
