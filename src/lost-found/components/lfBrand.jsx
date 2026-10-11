// Brand marks for Lost & Found (FIND) and Guidance Counseling.
//
// The PNGs live in `public/brand/` so a missing file never breaks
// the Vite build - the <img> simply hides itself on error and the
// lucide fallback shows instead:
//
//   public/brand/find-logo.png      - Image 1, green FIND on transparent/dark
//   public/brand/find-splash.png    - Image 2, white FIND for the dark splash
//   public/brand/guidance-logo.png  - Image 3, Guidance Counseling seal
//
// Save the three chat images to those paths (exact names) and the
// whole module picks them up with no code change.

export const FIND_LOGO_SRC = "/brand/find-logo.png";
export const FIND_SPLASH_SRC = "/brand/find-splash.png";
export const GUIDANCE_LOGO_SRC = "/brand/guidance-logo.png";

function hideOnError(event) {
    event.currentTarget.style.display = "none";
}

/** Green FIND mark for light surfaces (header, nav, cards). */
export function FindLogo({ className = "h-10 w-10", alt = "FIND - Found Item & Notification Desk" }) {
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
