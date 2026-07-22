import { useNavigate } from "react-router-dom";

// QuickActions.jsx
//
// Self-contained — owns its own navigation, so any page can drop in
// <QuickActions /> with no props and get the six core library actions.

const ACTIONS = [
    {
        key: "borrow",
        label: "Borrow Book",
        path: "/library/books",
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
        key: "reserve",
        label: "Reserve Book",
        path: "/library/reserve",
        bg: "#FAEEDA",
        color: "#633806",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },
    {
        key: "renew",
        label: "Renew Book",
        path: "/library/renew",
        bg: "#EEEDFE",
        color: "#3C3489",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                <path d="M3 21v-5h5" />
            </svg>
        ),
    },
    {
        key: "clearance",
        label: "Library Clearance",
        path: "/library/clearance",
        bg: "#FBEAF0",
        color: "#72243E",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <path d="M12 3a9 9 0 0 0-9 9c0 7 9 9 9 9s9-2 9-9a9 9 0 0 0-9-9z" />
            </svg>
        ),
    },
    {
        key: "suggest",
        label: "Suggest Book",
        path: "/library/suggest",
        bg: "#FAECE7",
        color: "#712B13",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6M10 22h4" />
                <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1v.2h6v-.2c0-.8.4-1.5 1-2.1A7 7 0 0 0 12 2Z" />
            </svg>
        ),
    },
    {
        key: "ask",
        label: "Ask Librarian",
        path: "/library/ask-librarian",
        bg: "#E0F2FE",
        color: "#075985",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },
];

export default function QuickActions() {

    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

            {
                ACTIONS.map((action) => (
                    <button
                        key={action.key}
                        onClick={() => navigate(action.path)}
                        className="
                            group
                            bg-white/90
                            border border-white/60
                            rounded-2xl
                            p-4
                            flex flex-col items-start justify-between
                            text-left
                            h-28
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
                            style={{ background: action.bg, color: action.color }}
                        >
                            {action.icon}
                        </div>
                        <span className="text-sm font-semibold text-[#1F1F1F] leading-snug">
                            {action.label}
                        </span>
                    </button>
                ))
            }

        </div>
    );

}