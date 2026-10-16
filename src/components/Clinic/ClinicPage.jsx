// Shared page wrapper for Clinic screens.
export default function ClinicPage({ children }) {
    return (
        <div
            className="min-h-screen px-4 pt-5 sm:px-6 sm:pt-7 pb-28"
            style={{
                background:
                    "linear-gradient(180deg, #F4F8F6 0%, #F8FAF9 55%, #FFFFFF 100%)",
            }}
        >
            <div className="mx-auto w-full max-w-7xl">
                {children}
            </div>
        </div>
    );
}
