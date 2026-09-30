// src/pages/BusinessHub/BusinessHub.jsx

export default function BusinessHub() {
    return (
        <div
            className="min-h-screen p-4 sm:p-6 pb-24"
            style={{
                background: "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)"
            }}
        >
            <div className="max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto">
                <h1 className="text-xl sm:text-3xl font-semibold text-[#1F1F1F] tracking-tight mb-2">
                    Business Hub
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                    Student ventures and pitch opportunities — coming soon.
                </p>
            </div>
        </div>
    );
}