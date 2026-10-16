// Shared loading / empty / error states for the Clinic module.

const ERROR_COPY = {
    "no-identity": {
        title: "Student ID not found",
        message: "We couldn't read your student ID from your session. Please log out and sign in again.",
        retry: false,
    },
    network: {
        title: "Can't reach the clinic",
        message: "Check your internet connection and try again.",
        retry: true,
    },
    "not-found": {
    title: "No clinic records available",
    message: "We couldn't find a clinic student record linked to your student ID. If you think this is a mistake, please contact the clinic staff.",
    retry: false,
    },
    server: {
        title: "Clinic service unavailable",
        message: "The clinic service is having problems right now. Please try again later.",
        retry: true,
    },
    malformed: {
        title: "Unexpected response",
        message: "The clinic service returned data we couldn't read. Please try again later.",
        retry: true,
    },
    request: {
        title: "Request failed",
        message: "We couldn't load your clinic data. Please try again.",
        retry: true,
    },
};

const Bone = ({ className = "" }) => (
    <div className={`animate-pulse bg-gray-300/90 rounded-lg ${className}`} />
);

export function ClinicLoading({ rows = 3 }) {
    return (
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="bg-white/80 rounded-2xl p-4 shadow-sm">
                    <Bone className="h-4 w-1/2 mb-3" />
                    <Bone className="h-3 w-3/4 mb-2" />
                    <Bone className="h-3 w-1/3" />
                </div>
            ))}
        </div>
    );
}

function StateCard({ icon, title, message, actionLabel, onAction }) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-14 px-6 bg-white/60 rounded-[24px]">
            <div className="w-14 h-14 rounded-2xl bg-[#106A2E]/10 text-[#106A2E] flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="text-base font-semibold text-[#1F1F1F] mb-1.5">{title}</h3>
            {message && (
                <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-5">{message}</p>
            )}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="bg-[#106A2E] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:brightness-105 active:scale-[0.99] transition-all"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

const ALERT_ICON = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
    </svg>
);

const EMPTY_ICON = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);

export function ClinicError({ error, onRetry }) {
    const copy = ERROR_COPY[error?.kind] || ERROR_COPY.request;
    return (
        <StateCard
            icon={ALERT_ICON}
            title={copy.title}
            message={copy.message}
            actionLabel={copy.retry ? "Try again" : undefined}
            onAction={copy.retry ? onRetry : undefined}
        />
    );
}

export function ClinicEmpty({ title, message, actionLabel, onAction }) {
    return (
        <StateCard
            icon={EMPTY_ICON}
            title={title}
            message={message}
            actionLabel={actionLabel}
            onAction={onAction}
        />
    );
}
