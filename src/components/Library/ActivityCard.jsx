const ACTIVITY_STYLES = {
    borrowed: {
        bg: "#E1F5EE",
        color: "#085041",
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
    },
    reserved: {
        bg: "#FAEEDA",
        color: "#633806",
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },
    renewed: {
        bg: "#EEEDFE",
        color: "#3C3489",
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                <path d="M3 21v-5h5" />
            </svg>
        ),
    },
    returned: {
        bg: "#DCFCE7",
        color: "#106A2E",
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
            </svg>
        ),
    },
};

export default function ActivityCard({ activity }) {

    const activityType = activity.type?.toLowerCase();

    const style =
        ACTIVITY_STYLES[activityType] ??
        ACTIVITY_STYLES.borrowed;

    return (
        <div className="flex items-center gap-3 px-3 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">

            <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: style.bg, color: style.color }}
            >
                {style.icon}
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1F1F1F] truncate">
                    {activity.title}
                </p>
                <span
                    className="inline-block mt-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full capitalize"
                    style={{ background: style.bg, color: style.color }}
                >
                    {activity.type}
                </span>
            </div>

            <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                {new Date(activity.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric"
                })}
            </span>

        </div>
    );

}