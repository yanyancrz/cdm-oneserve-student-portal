export default function LoadingSpinner({ label = "Loading...", fullScreen = false }) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={`flex items-center justify-center ${
                fullScreen ? "min-h-screen bg-[#F7F5EF]" : "py-16"
            }`}
        >
            <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#106A2E]/20 border-t-[#106A2E]" />
                <p className="text-sm text-gray-500">{label}</p>
            </div>
        </div>
    );
}