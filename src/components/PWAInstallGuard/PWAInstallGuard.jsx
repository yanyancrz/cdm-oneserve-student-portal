import { useEffect, useState } from "react";

export default function PWAInstallGuard({
    children,
}) {
    const [isInstalled, setIsInstalled] =
        useState(false);

    const [checking, setChecking] =
        useState(true);

    useEffect(() => {

        // ==========================================
        // DEVELOPMENT MODE
        // ==========================================
        // Kapag localhost / npm run dev:
        // bypass muna ang PWA installation requirement
        // para ma-test ang Student/Admin features
        // gamit ang desktop browser.
        // ==========================================

        if (import.meta.env.DEV) {
            setIsInstalled(true);
            setChecking(false);

            console.log(
                "PWAInstallGuard: Development mode - bypass enabled"
            );

            return;
        }

        // ==========================================
        // PRODUCTION PWA CHECK
        // ==========================================

        const checkPWA = () => {

            const standalone =
                window.matchMedia(
                    "(display-mode: standalone)"
                ).matches;

            const fullscreen =
                window.matchMedia(
                    "(display-mode: fullscreen)"
                ).matches;

            const minimalUI =
                window.matchMedia(
                    "(display-mode: minimal-ui)"
                ).matches;

            const iosStandalone =
                window.navigator.standalone === true;

            const installed =
                standalone ||
                fullscreen ||
                minimalUI ||
                iosStandalone;

            setIsInstalled(installed);
            setChecking(false);
        };

        checkPWA();

        // ==========================================
        // DISPLAY MODE CHANGES
        // ==========================================

        const mediaQuery =
            window.matchMedia(
                "(display-mode: standalone)"
            );

        mediaQuery.addEventListener(
            "change",
            checkPWA
        );

        // ==========================================
        // PWA INSTALLED EVENT
        // ==========================================

        window.addEventListener(
            "appinstalled",
            checkPWA
        );

        // ==========================================
        // CLEANUP
        // ==========================================

        return () => {

            mediaQuery.removeEventListener(
                "change",
                checkPWA
            );

            window.removeEventListener(
                "appinstalled",
                checkPWA
            );
        };

    }, []);

    // ==========================================
    // CHECKING
    // ==========================================

    if (checking) {
        return (
            <div className="min-h-screen bg-[#F1F1F1] flex items-center justify-center">
                <div className="text-center">

                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#106A2E]" />

                    <p className="text-sm text-slate-500">
                        Loading CDM OneServe...
                    </p>

                </div>
            </div>
        );
    }

    // ==========================================
    // PRODUCTION:
    // PWA INSTALLATION REQUIRED
    // ==========================================

    if (!isInstalled) {
        return <InstallRequired />;
    }

    // ==========================================
    // ALLOWED
    // ==========================================

    return children;
}


// ==================================================
// INSTALL REQUIRED SCREEN
// ==================================================

function InstallRequired() {

    const handleInstall = async () => {

        const event =
            window.__deferredInstallPrompt;

        // ==========================================
        // INSTALL PROMPT NOT AVAILABLE
        // ==========================================

        if (!event) {

            alert(
                "Please use your browser's Install App or Add to Home Screen option."
            );

            return;
        }

        // ==========================================
        // SHOW INSTALL PROMPT
        // ==========================================

        event.prompt();

        const result =
            await event.userChoice;

        console.log(
            "PWA install result:",
            result.outcome
        );

        // ==========================================
        // CLEAR SAVED PROMPT
        // ==========================================

        window.__deferredInstallPrompt =
            null;

        // ==========================================
        // RECHECK AFTER INSTALL
        // ==========================================

        if (result.outcome === "accepted") {

            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-6">

            {/* BACKGROUND */}

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
                        top-[30%]
                        h-[32rem]
                        w-[32rem]
                        rounded-full
                        bg-cyan-300/10
                        blur-3xl
                    "
                />

                <div
                    className="
                        absolute
                        bottom-[-120px]
                        left-[30%]
                        h-[28rem]
                        w-[28rem]
                        rounded-full
                        bg-amber-300/10
                        blur-3xl
                    "
                />

            </div>


            {/* INSTALL CARD */}

            <div
                className="
                    relative
                    z-10
                    w-full
                    max-w-md
                    rounded-3xl
                    border
                    border-slate-200
                    bg-white
                    p-8
                    text-center
                    shadow-xl
                "
            >

                {/* ICON */}

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
                        shadow-lg
                        shadow-emerald-900/20
                    "
                >

                    <svg
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>

                </div>


                {/* TITLE */}

                <h1 className="text-2xl font-bold text-slate-800">
                    CDM OneServe
                </h1>


                {/* DESCRIPTION */}

                <p className="mt-2 text-sm leading-6 text-slate-500">
                    CDM OneServe is available as an
                    installed application.
                </p>


                {/* INFORMATION */}

                <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-left">

                    <p className="text-sm font-semibold text-[#106A2E]">
                        Install the app to continue
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-700">
                        This system cannot be accessed
                        directly from a normal browser
                        window.
                    </p>

                </div>


                {/* INSTALL BUTTON */}

                <button
                    type="button"
                    onClick={handleInstall}
                    className="
                        mt-6
                        w-full
                        rounded-xl
                        bg-[#106A2E]
                        px-5
                        py-3.5
                        text-sm
                        font-semibold
                        text-white
                        shadow-lg
                        transition
                        hover:bg-[#0d5927]
                        active:scale-[0.98]
                    "
                >
                    Install CDM OneServe
                </button>


                {/* HELP TEXT */}

                <p className="mt-4 text-xs leading-5 text-slate-400">
                    If the install button does not
                    appear, open your browser menu and
                    select <b>Install app</b> or{" "}
                    <b>Add to Home Screen</b>.
                </p>

            </div>

        </div>
    );
}