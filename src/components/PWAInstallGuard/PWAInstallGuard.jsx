import { useEffect, useState } from "react";

import androidInstall from "../../assets/images/install/android.png";
import safariInstall from "../../assets/images/install/safari.jpg";

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

    // The screenshot currently shown full
    // screen, or null. Tapping a card opens
    // it so the on-screen steps are readable
    // on a phone, whatever the orientation.
    const [zoomed, setZoomed] = useState(null);

    // Escape closes the enlarged screenshot.
    useEffect(() => {
        if (!zoomed) return undefined;

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                setZoomed(null);
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () =>
            window.removeEventListener("keydown", onKeyDown);
    }, [zoomed]);

    return (
        <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center px-4 py-8 sm:p-6">

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

            {/* The card widens once the gallery is open,
                so the screenshots get real room instead of
                being squeezed into the compact card. */}

            <div
                className={`
                    relative
                    z-10
                    w-full
                    rounded-3xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    text-center
                    shadow-xl
                    transition-[max-width]
                    duration-300
                    sm:p-8
                    ${showSteps ? "max-w-2xl" : "max-w-md"}
                `}
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
                {/* Mobile install steps only: the two portrait screenshots
                    sit side by side on wider screens and stack on a phone. */}

                {showSteps && (
                    <div className="mt-5 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
                        <InstallStep
                            image={androidInstall}
                            platform="Android"
                            hint="Chrome: tap the menu, then Install app"
                            orientation="portrait"
                            onZoom={setZoomed}
                        />

                        <InstallStep
                            image={safariInstall}
                            platform="iPhone / iPad"
                            hint="Safari: tap Share, then Add to Home Screen"
                            orientation="portrait"
                            onZoom={setZoomed}
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


            {/* ENLARGED SCREENSHOT */}

            {zoomed && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Install guide for ${zoomed.platform}`}
                    onClick={() => setZoomed(null)}
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4"
                >
                    <button
                        type="button"
                        onClick={() => setZoomed(null)}
                        aria-label="Close"
                        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>

                    <img
                        src={zoomed.image}
                        alt={`How to install CDM OneServe on ${zoomed.platform}`}
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[85vh] max-w-full rounded-xl bg-white object-contain"
                    />

                    <p className="mt-3 text-sm font-medium text-white">
                        {zoomed.platform}
                    </p>
                </div>
            )}

        </div>
    );
}


// ==================================================
// ONE INSTALL STEP
// ==================================================
// A screenshot card. The image is never
// cropped (object-contain) and is no longer
// forced into a fixed-height box, which is
// what made the portrait phone screenshots
// tiny:
//
//   portrait  - keeps its natural shape, up to
//               28rem tall, centered.
//   landscape - fills the card width, up to
//               22rem tall.
//
// Tapping the screenshot opens it full screen.

function InstallStep({
    image,
    platform,
    hint,
    orientation = "landscape",
    onZoom,
}) {
    const isPortrait = orientation === "portrait";

    return (
        <div
            className={`rounded-2xl border border-slate-200 bg-slate-50 p-3 ${
                isPortrait ? "" : "sm:col-span-2"
            }`}
        >
            <button
                type="button"
                onClick={() => onZoom?.({ image, platform })}
                aria-label={`Enlarge the ${platform} install guide`}
                className="relative block w-full overflow-hidden rounded-xl bg-white"
            >
                <img
                    src={image}
                    alt={`How to install CDM OneServe on ${platform}`}
                    loading="lazy"
                    className={`block h-auto object-contain ${
                        isPortrait
                            ? "mx-auto max-h-[28rem] w-auto max-w-full"
                            : "max-h-[22rem] w-full"
                    }`}
                />

                <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white">
                    Tap to enlarge
                </span>
            </button>

            <p className="mt-2.5 text-sm font-semibold text-slate-800">
                {platform}
            </p>

            <p className="mt-0.5 text-xs leading-4 text-slate-500">
                {hint}
            </p>
        </div>
    );
}