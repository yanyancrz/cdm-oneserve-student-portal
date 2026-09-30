import { useEffect, useState } from "react";

export default function DeviceRestriction({
    type = "mobile",
    children,
}) {
    const [allowed, setAllowed] = useState(null);

    useEffect(() => {

        // ==========================================
        // DEVELOPMENT MODE
        // ==========================================
        // Kapag local development:
        // puwedeng gamitin ang Student/Admin
        // kahit desktop ang ginagamit na device.
        //
        // Production/deployed PWA:
        // active ang device restriction.
        // ==========================================

        if (import.meta.env.DEV) {
            setAllowed(true);
            return;
        }

        const checkDevice = () => {

            const userAgent =
                navigator.userAgent ||
                navigator.vendor ||
                window.opera ||
                "";

            const isMobile =
                /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(
                    userAgent
                );

            if (type === "mobile") {
                setAllowed(isMobile);
            }
            else if (type === "desktop") {
                setAllowed(!isMobile);
            }
            else {
                setAllowed(true);
            }
        };

        checkDevice();

        window.addEventListener(
            "resize",
            checkDevice
        );

        return () => {
            window.removeEventListener(
                "resize",
                checkDevice
            );
        };

    }, [type]);

    // ==========================================
    // CHECKING
    // ==========================================

    if (allowed === null) {
        return (
            <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6">
                <div className="text-center">

                    <div
                        className="
                            mx-auto
                            mb-4
                            h-8
                            w-8
                            rounded-full
                            border-4
                            border-[#106A2E]/20
                            border-t-[#106A2E]
                            animate-spin
                        "
                    />

                    <p className="text-sm text-slate-500">
                        Checking device...
                    </p>

                </div>
            </div>
        );
    }

    // ==========================================
    // ALLOWED
    // ==========================================

    if (allowed) {
        return children;
    }

    // ==========================================
    // BLOCKED
    // ==========================================

    const isMobilePortal =
        type === "mobile";

    return (
        <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6">

            <div className="pointer-events-none fixed inset-0 overflow-hidden">

                <div
                    className="
                        absolute
                        -left-28
                        -top-28
                        h-96
                        w-96
                        rounded-full
                        bg-emerald-400/10
                        blur-3xl
                    "
                />

                <div
                    className="
                        absolute
                        right-[-140px]
                        bottom-[-120px]
                        h-[30rem]
                        w-[30rem]
                        rounded-full
                        bg-amber-300/10
                        blur-3xl
                    "
                />

                <div
                    className="
                        absolute
                        inset-0
                        opacity-[0.035]
                        bg-[linear-gradient(rgba(16,106,46,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(16,106,46,.35)_1px,transparent_1px)]
                        bg-[size:40px_40px]
                    "
                />

            </div>

            <div
                className="
                    relative
                    z-10
                    w-full
                    max-w-md
                    rounded-[28px]
                    border
                    border-slate-200
                    bg-white
                    p-8
                    text-center
                    shadow-xl
                    shadow-black/5
                "
            >

                <div
                    className="
                        mx-auto
                        mb-5
                        flex
                        h-16
                        w-16
                        items-center
                        justify-center
                        rounded-2xl
                        bg-gradient-to-br
                        from-[#106A2E]
                        to-[#0E3B22]
                        text-white
                        shadow-lg
                        shadow-emerald-900/20
                    "
                >

                    {isMobilePortal ? (
                        <svg
                            width="30"
                            height="30"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect
                                x="5"
                                y="2"
                                width="14"
                                height="20"
                                rx="2"
                            />

                            <line
                                x1="12"
                                y1="18"
                                x2="12.01"
                                y2="18"
                            />
                        </svg>
                    ) : (
                        <svg
                            width="30"
                            height="30"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect
                                x="2"
                                y="3"
                                width="20"
                                height="14"
                                rx="2"
                            />

                            <path d="M8 21h8" />

                            <path d="M12 17v4" />
                        </svg>
                    )}

                </div>

                <p
                    className="
                        text-[11px]
                        font-semibold
                        uppercase
                        tracking-[0.18em]
                        text-[#106A2E]
                    "
                >
                    CDM OneServe
                </p>

                <h1
                    className="
                        mt-2
                        text-2xl
                        font-bold
                        text-slate-800
                    "
                >
                    {isMobilePortal
                        ? "Mobile Device Required"
                        : "Desktop Device Required"}
                </h1>

                <p
                    className="
                        mx-auto
                        mt-3
                        max-w-sm
                        text-sm
                        leading-6
                        text-slate-500
                    "
                >
                    {isMobilePortal
                        ? "The CDM OneServe student portal is designed for mobile devices only."
                        : "The CDM OneServe admin portal is designed for desktop and laptop devices only."}
                </p>

                <div
                    className="
                        mt-6
                        rounded-2xl
                        bg-emerald-50
                        p-4
                        text-left
                    "
                >

                    <p className="text-sm font-semibold text-slate-800">
                        {isMobilePortal
                            ? "Use a mobile device"
                            : "Use a desktop or laptop"}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        {isMobilePortal
                            ? "Open the installed CDM OneServe PWA on your phone."
                            : "Open the installed CDM OneServe PWA on your desktop or laptop."}
                    </p>

                </div>

            </div>

        </div>
    );
}