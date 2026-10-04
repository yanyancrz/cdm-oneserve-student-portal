import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorMessage({
    title = "Something went wrong",
    message = "Please try again.",
    onRetry,
    fullScreen = false,
}) {
    return (
        <div
            className={`flex items-center justify-center px-4 ${
                fullScreen ? "min-h-screen bg-[#F7F5EF]" : "py-12"
            }`}
        >
            <div
                role="alert"
                className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm"
            >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                    <AlertTriangle size={22} />
                </div>

                <h2 className="mt-4 text-base font-semibold text-gray-900">{title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-gray-500">{message}</p>

                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#106A2E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d5224] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/40 focus-visible:ring-offset-2"
                    >
                        <RefreshCw size={15} />
                        Try again
                    </button>
                )}
            </div>
        </div>
    );
}