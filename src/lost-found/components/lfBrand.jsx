// Brand marks for Lost & Found (FIND) and Guidance Counseling.
//
// FIND uses the bundled white logo at
// `src/assets/images/FIND LOGO white.png` (imported below, so Vite
// hashes and serves it - spaces in the filename are fine).
//
// The Guidance seal has no file in the repo yet. When you add it,
// save it as `public/brand/guidance-logo.png` and the whole module
// picks it up with no code change - until then the <img> hides
// itself on error and the lucide fallback shows instead.

import findLogoWhite from "../../assets/images/FIND LOGO white.png";

export const FIND_LOGO_SRC = findLogoWhite;
export const FIND_SPLASH_SRC = findLogoWhite;
export const GUIDANCE_LOGO_SRC = "/brand/guidance-logo.png";

function hideOnError(event) {
    event.currentTarget.style.display = "none";
}

/** Green FIND mark for light surfaces (header, nav, cards). */
/** White FIND mark (header, nav, cards). */
export function FindLogo({
    className = "h-20 w-20 shrink-0 object-contain drop-shadow-lg sm:h-24 sm:w-24",
    alt = "FIND - Found Item & Notification Desk",
}) {
    return (
        <img
            src={FIND_LOGO_SRC}
            alt={alt}
            onError={hideOnError}
            className={`rounded-xl object-contain ${className}`}
            loading="eager"
        />
    );
}

/** White FIND mark for the dark loading splash. */
export function FindSplashLogo({ className = "h-24 w-auto", alt = "FIND - Found Item & Notification Desk" }) {
    return (
        <img
            src={FIND_SPLASH_SRC}
            alt={alt}
            onError={hideOnError}
            className={`object-contain ${className}`}
            loading="eager"
        />
    );
}

/** Guidance Counseling seal for light and dark surfaces. */
export function GuidanceLogo({ className = "h-10 w-10", alt = "Guidance Counseling - Appointment System" }) {
    return (
        <img
            src={GUIDANCE_LOGO_SRC}
            alt={alt}
            onError={hideOnError}
            className={`rounded-full object-cover ${className}`}
            loading="eager"
        />
    );
}
