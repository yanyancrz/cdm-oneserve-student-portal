import { useEffect, useState } from "react";

import androidInstall from "../../assets/images/install/android.png";
import macosInstall from "../../assets/images/install/macos.jpg";
import safariInstall from "../../assets/images/install/safari.jpg";
import windowsInstall from "../../assets/images/install/windows.jpg";

export default function PWAInstallGuard({
    children,
}) {

    // ==========================================
    // DEVELOPMENT MODE
    // ==========================================
    // Kapag localhost / npm run dev:
    // bypass muna ang PWA installation requirement
    // para ma-test ang Student/Admin features
    // gamit ang desktop browser. Nasa initial
    // state ito (hindi sa effect) para hindi
    // mag-set ng state habang nagre-render.
    // ==========================================

    const isDev = import.meta.env.DEV;

    const [isInstalled, setIsInstalled] =
        useState(isDev);

    const [checking, setChecking] =
        useState(!isDev);

    useEffect(() => {

        if (isDev) {
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

        // isDev is a build-time constant -
        // it cannot change, so it is not a
        // real dependency.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // The step-by-step gallery stays
    // hidden until asked for: the
    // screen stays compact, and the
    // screenshots are only fetched
    // once the applicant opens it.
    const [showSteps, setShowSteps] = useState(false);

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


                {/* HOW TO INSTALL BUTTON */}

                <button
                    type="button"
                    onClick={() =>
                        setShowSteps((v) => !v)
                    }
                    aria-expanded={showSteps}
                    className="
                        mt-6
                        w-full
                        inline-flex
                        items-center
                        justify-center
                        gap-2
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
                    How to Install

                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform ${
                            showSteps
                                ? "rotate-180"
                                : ""
                        }`}
                    >
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </button>

                {/* STEP-BY-STEP GALLERY */}

                {showSteps && (
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InstallStep
                            image={androidInstall}
                            platform="Android"
                            hint="Chrome: tap the menu, then Install app"
                        />

                        <InstallStep
                            image={windowsInstall}
                            platform="Windows"
                            hint="Chrome or Edge: open the menu, then Install app"
                        />

                        <InstallStep
                            image={macosInstall}
                            platform="macOS"
                            hint="Chrome: open the menu, then Install app"
                        />

                        <InstallStep
                            image={safariInstall}
                            platform="iPhone / iPad"
                            hint="Safari: tap Share, then Add to Home Screen"
                        />
                    </div>
                )}

                {/* HELP TEXT */}

                <p className="mt-4 text-xs leading-5 text-slate-400">
                    Once installed, open CDM OneServe
                    from the Home Screen or desktop -
                    it then runs in its own window.
                </p>

            </div>

        </div>
    );
}


// ==================================================
// ONE INSTALL STEP
// ==================================================
// A screenshot card. The image keeps its
// aspect ratio (object-contain) so the
// on-screen steps in the screenshot are
// never cropped, whatever the device.

function InstallStep({ image, platform, hint }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-white">
                <img
                    src={image}
                    alt={`How to install CDM OneServe on ${platform}`}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                />
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-800">
                {platform}
            </p>

            <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                {hint}
            </p>
        </div>
    );
}