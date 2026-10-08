// =====================================================
// CDM OneServe design tokens
//
// The marketplace used its own green (#173F2C) while the Login page and the
// rest of OneServe use #106A2E. Two near-identical dark greens is the kind of
// drift nobody notices until two screens are open side by side and the seam
// shows. This file is the single place the marketplace reads its colours from,
// extracted from the Login page's existing values.
//
// It is documentation-as-code, not a rebrand: every value here already exists in
// Login.jsx / Dashboard.jsx. If OneServe's green ever changes, it changes here
// once.
// =====================================================

/** Brand greens. `#106A2E` is the primary; `#0E3B22` is its gradient partner. */
export const BRAND = {
    /** Primary. Links, active states, small accents. */
    primary: "#106A2E",

    /** Dark partner for gradients and the dark header/sidebar surfaces. */
    primaryDark: "#0E3B22",

    /** Tinted panel fill - icon chips, info blocks. */
    primaryTint: "#E1F0E4",

    /**
     * Tailwind classes, for places a raw hex cannot reach (gradients with
     * alpha, ring colours). Kept beside the hex so the two cannot drift.
     */
    primaryClass: "text-[#106A2E]",
    primaryBgClass: "bg-[#106A2E]",
    primaryBorderClass: "border-[#106A2E]",
    primaryTintClass: "bg-[#E1F0E4]",
    gradientClass: "bg-gradient-to-br from-[#106A2E] to-[#0E3B22]",
};

/** The warm off-white every public surface sits on. */
export const CANVAS = "#F7F5EF";

/**
 * The dark surface used by headers and sidebars.
 *
 * This is the marketplace header/sidebar colour, kept because a large dark panel
 * in the brand green reads as a header; the gradient goes primary -> primaryDark.
 */
export const SURFACE_DARK = {
    base: "bg-[#0E3B22]",
    gradient: "bg-gradient-to-br from-[#106A2E] to-[#0E3B22]",
    border: "border-[#0E3B22]",
    /** Muted text on the dark surface. */
    muted: "text-white/50",
    faint: "text-white/40",
    /** Hover fill on the dark surface. */
    hover: "hover:bg-white/10",
};

/**
 * The ambient background - the soft coloured orbs plus the faint grid that the
 * Login page uses behind its card.
 *
 * This lives in marketUi.jsx as the <AmbientBackground /> component rather than
 * here as a stored element: a .js file cannot hold JSX, and a component reads
 * better at the call site than <AMBIENT_BACKGROUND /> does.
 */

/**
 * The entrance animation. One definition, injected once per page shell rather
 * than re-declared per file under different names.
 */
export const REVEAL_STYLES = `
    @keyframes oneserveReveal {
        from { opacity: 0; transform: translateY(15px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    .oneserve-reveal {
        animation: oneserveReveal .65s cubic-bezier(.2,.8,.2,1) both;
    }

    .oneserve-reveal-delay-1 { animation: oneserveReveal .65s cubic-bezier(.2,.8,.2,1) .08s both; }
    .oneserve-reveal-delay-2 { animation: oneserveReveal .65s cubic-bezier(.2,.8,.2,1) .16s both; }
    .oneserve-reveal-delay-3 { animation: oneserveReveal .65s cubic-bezier(.2,.8,.2,1) .24s both; }
`;

/** Card radii, matching the Login page's 28px hero card and its 2xl lists. */
export const RADIUS = {
    card: "rounded-[28px]",
    panel: "rounded-2xl",
    control: "rounded-xl",
    pill: "rounded-full",
};

/** Elevation. Login uses `shadow-xl shadow-black/5` on its card. */
export const SHADOW = {
    card: "shadow-xl shadow-black/5",
    button: "shadow-lg shadow-emerald-900/20",
};

/** Primary button - gradient fill, the Login page's own sign-in button. */
export const BUTTON_PRIMARY = `${RADIUS.control} ${BRAND.gradientClass} text-white ${SHADOW.button} transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none`;

/**
 * Text input - grey until focused, then white with a brand border. The grey
 * fill is the detail that makes the Login form feel like part of the system, and
 * it was missing from every marketplace input.
 */
export const INPUT_BASE = `w-full ${RADIUS.control} border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#106A2E] focus:bg-white`;

/** The dark header/sidebar surface classes, for marketplace shells. */
export const DARK_SURFACE = `${SURFACE_DARK.base} ${SURFACE_DARK.border}`;