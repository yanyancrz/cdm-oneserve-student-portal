import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const buttonClass =
    "mt-5 inline-flex items-center justify-center rounded-xl bg-[#106A2E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d5224] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/40 focus-visible:ring-offset-2";

// Use `to` for a link, or `onAction` for a button.
export default function AccessDenied({
    title = "Access restricted",
    message = "You don't have permission to view this page.",
    actionLabel,
    onAction,
    to,
    fullScreen = false,
}) {
    return (
        <div
            className={`flex items-center justify-center px-4 ${
                fullScreen ? "min-h-screen bg-[#F7F5EF]" : "py-12"
            }`}
        >
            <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                    <ShieldAlert size={24} />
                </div>

                <h1 className="mt-5 text-xl font-semibold text-gray-900">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-gray-500">{message}</p>

                {actionLabel && to && (
                    <Link to={to} className={buttonClass}>
                        {actionLabel}
                    </Link>
                )}

                {actionLabel && !to && onAction && (
                    <button type="button" onClick={onAction} className={buttonClass}>
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    );
}