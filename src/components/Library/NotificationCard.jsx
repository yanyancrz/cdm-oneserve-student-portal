const NOTIFICATION_STYLES = {

    "due-soon": {
        bg: "#FAEEDA",
        color: "#633806",
        icon: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
            </svg>
        ),
    },

    "overdue": {
        bg: "#FEE2E2",
        color: "#B91C1C",
        icon: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
            </svg>
        ),
    },

    "reservation-created": {
        bg: "#EEEDFE",
        color: "#3C3489",
        icon: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
    },

    "reservation-approved": {
        bg: "#DCFCE7",
        color: "#106A2E",
        icon: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m22 4-10 10-3-3" />
            </svg>
        ),
    },

    "reservation-cancelled": {
        bg: "#F3F4F6",
        color: "#6B7280",
        icon: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="9" />
                <path d="m9 9 6 6" />
                <path d="m15 9-6 6" />
            </svg>
        ),
    },

    "reservation-rejected": {
        bg: "#FEE2E2",
        color: "#B91C1C",
        icon: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="9" />
                <path d="m9 9 6 6" />
                <path d="m15 9-6 6" />
            </svg>
        ),
    },

    "reservation-expired": {
        bg: "#F3F4F6",
        color: "#6B7280",
        icon: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
            </svg>
        ),
    },

    "book-available": {
        bg: "#DCFCE7",
        color: "#106A2E",
        icon: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
    },

    "closure": {
        bg: "#FAECE7",
        color: "#712B13",
        icon: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                <path d="M12 9v4M12 17h.01" />
            </svg>
        ),
    },

    "general": {
        bg: "#F3F4F6",
        color: "#4B5563",
        icon: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
            </svg>
        ),

        "borrow-created": {
            bg: "#E1F5EE",
            color: "#085041",
            icon: (
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
            ),
        },
    },
};


function formatNotificationTime(createdAt) {

    if (!createdAt) {
        return "";
    }

    const created = new Date(createdAt);
    const now = new Date();

    const difference = now.getTime() - created.getTime();

    const seconds = Math.floor(difference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return "Just now";
    }

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    if (hours < 24) {
        return `${hours}h ago`;
    }

    if (days === 1) {
        return "Yesterday";
    }

    if (days < 7) {
        return `${days}d ago`;
    }

    return created.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}


export default function NotificationCard({ notification }) {

    const style =
        NOTIFICATION_STYLES[notification.type] ??
        NOTIFICATION_STYLES.general;

    const time = formatNotificationTime(
        notification.createdAt
    );

    return (
        <div
            className={`
                flex items-start gap-3 p-4 rounded-2xl shadow-sm transition-colors
                ${notification.read ? "bg-white/70" : "bg-white"}
            `}
        >

            <div
                className="
                    w-9 h-9 rounded-lg
                    flex items-center justify-center
                    flex-shrink-0
                "
                style={{
                    background: style.bg,
                    color: style.color,
                }}
            >
                {style.icon}
            </div>

            <div className="min-w-0 flex-1">

                <div className="flex items-center gap-2">

                    <p className="text-sm font-medium text-[#1F1F1F] truncate">
                        {notification.title}
                    </p>

                    {!notification.read && (
                        <span
                            className="
                                w-1.5 h-1.5
                                rounded-full
                                bg-[#F4D35E]
                                flex-shrink-0
                            "
                        />
                    )}

                </div>

                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {notification.description}
                </p>

            </div>

            <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                {time}
            </span>

        </div>
    );
}