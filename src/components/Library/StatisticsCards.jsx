// StatisticsCards.jsx
//
// Reusable — takes plain numbers as props so it stays decoupled from
// where those numbers come from (mock data today, a real API later).
//
// Matches the contract used in Dashboard.jsx:
// <StatisticsCards borrowed={...} reservations={...} favorites={...} overdue={...} />

const STAT_CONFIG = [
    {
        key: "borrowed",
        label: "Borrowed",
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
        key: "reservations",
        label: "Reservations",
        bg: "#FAEEDA",
        color: "#633806",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },
    {
        key: "favorites",
        label: "Favorites",
        bg: "#FBEAF0",
        color: "#72243E",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21l7.78-7.55 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
        ),
    },
    {
        key: "overdue",
        label: "Overdue",
        bg: "#FAECE7",
        color: "#712B13",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
            </svg>
        ),
    },
];

export default function StatisticsCards({ borrowed = 0, reservations = 0, favorites = 0, overdue = 0 }) {

    const values = { borrowed, reservations, favorites, overdue };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

            {
                STAT_CONFIG.map((stat) => (
                    <div
                        key={stat.key}
                        className="
                            bg-white/90
                            border border-white/60
                            rounded-2xl
                            p-4
                            shadow-sm
                            flex flex-col gap-3
                        "
                    >
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: stat.bg, color: stat.color }}
                        >
                            {stat.icon}
                        </div>
                        <div>
                            <p
                                className={`text-2xl font-semibold leading-none ${
                                    stat.key === "overdue" && values[stat.key] > 0
                                        ? "text-[#712B13]"
                                        : "text-[#1F1F1F]"
                                }`}
                            >
                                {values[stat.key]}
                            </p>
                            <p className="text-xs text-gray-500 mt-1.5">
                                {stat.label}
                            </p>
                        </div>
                    </div>
                ))
            }

        </div>
    );

}