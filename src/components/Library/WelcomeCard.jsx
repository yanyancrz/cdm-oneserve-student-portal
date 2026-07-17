// WelcomeCard.jsx
//
// Matches the contract from Dashboard.jsx:
// <WelcomeCard studentName={...} digitalId={...} libraryStatus={...} dateLabel={...} />
//
// Identity (studentName, digitalId) is passed in from OneServe's existing
// profile / Digital ID APIs — this component doesn't fetch or own any of
// that data itself, it only displays it.

const STATUS_STYLES = {
    Active: { bg: "rgba(255,255,255,0.15)", color: "#FFFFFF", dot: "#4ADE80" },
    Restricted: { bg: "rgba(255,255,255,0.15)", color: "#FFFFFF", dot: "#F4D35E" },
    Suspended: { bg: "rgba(255,255,255,0.15)", color: "#FFFFFF", dot: "#F87171" },
};

export default function WelcomeCard({ studentName, digitalId, libraryStatus, dateLabel }) {

    const statusStyle = STATUS_STYLES[libraryStatus] ?? STATUS_STYLES.Active;

    return (
        <div className="bg-[#106A2E] rounded-[24px] p-5 sm:p-6 relative overflow-hidden shadow-lg shadow-[#106A2E]/20">

            {/* decorative shapes, echoing the main OneServe Digital ID card */}
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/[0.06] pointer-events-none" />
            <div className="absolute -bottom-12 -left-8 w-28 h-28 rounded-full bg-white/[0.05] pointer-events-none" />

            <div className="flex items-start justify-between relative z-10 mb-5">
                <div>
                    <p className="text-white/60 text-xs mb-1">{dateLabel}</p>
                    <h2 className="text-white text-xl font-semibold tracking-tight">
                        Welcome, {studentName}
                    </h2>
                </div>

                <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.dot }} />
                    {libraryStatus}
                </span>
            </div>

            <div className="relative z-10 bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <circle cx="9" cy="10" r="2" />
                        <path d="M15 8h2M15 12h2M7 16h10" />
                    </svg>
                </div>
                <div className="min-w-0">
                    <p className="text-white/60 text-[11px] uppercase tracking-wide">
                        Digital Student ID
                    </p>
                    <p className="text-white text-sm font-medium truncate">
                        {digitalId}
                    </p>
                </div>
            </div>

        </div>
    );

}