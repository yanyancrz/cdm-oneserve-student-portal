import { LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";

// =====================================================
// Back to Portal
//
// Every module lives INSIDE CDM OneServe, so every module has to have a way
// back out. Without it the only way out is editing the URL or hitting the
// browser back button repeatedly, which on a phone is genuinely disorienting.
//
// ONE PLACE, so all of them behave the same. Guidance previously had a "Portal"
// tab in its own bottom nav; Library had nothing at all; Marketplace had a
// back arrow that went to the previous screen rather than to OneServe - which is
// a different thing, and can walk you further away from the portal rather than
// toward it.
//
// WHERE IT GOES depends on who is signed in, because OneServe has two
// dashboards:
//   Student / Faculty / Staff / Head  ->  the mobile Student Dashboard
//   Admin / SuperAdmin               ->  the desktop Admin Dashboard
//
// That decision is made from the role the shared login already stored. The
// destination is a constant either way - there is nothing to authorise here, and
// both dashboards enforce their own access when they load.
// =====================================================

export const ONESERVE_STUDENT_HOME = "/dashboard";
export const ONESERVE_ADMIN_HOME = "/admin/dashboard";

/** Roles that belong in the OneServe ADMIN dashboard rather than the student one. */
const ADMIN_ROLES = new Set(["admin", "superadmin"]);

/** Roles whose job is a module portal, not a OneServe dashboard. */
const PORTAL_ROLES = new Set([
    "counselor",
    "libraryadmin",
    "librarystaff",
    "guidanceadmin",
    "lostfoundadmin",
    "clinicadmin",
    "marketplaceadmin",
]);

/**
 * The OneServe dashboard this role actually belongs on.
 *
 * The module-head and staff roles get the student dashboard on purpose. They are
 * signed in with a normal Student/Faculty account underneath, and their module
 * portal is where they went to do the job - sending them to a dashboard they
 * cannot act in would be a dead end.
 */
export function portalHomeForRole(role) {
    const normalized = String(role || "")
        .trim()
        .toLowerCase();

    if (ADMIN_ROLES.has(normalized)) return ONESERVE_ADMIN_HOME;
    if (PORTAL_ROLES.has(normalized)) return ONESERVE_STUDENT_HOME;

    // Student, Faculty, and anything unknown. The student dashboard is the safe
    // default: the Admin dashboard redirects a non-admin away from itself.
    return ONESERVE_STUDENT_HOME;
}

function currentRole() {
    return localStorage.getItem("role") || localStorage.getItem("userRole") || "";
}

const SIZES = {
    // A dark header (the marketplace shells).
    onDark: "text-white/60 hover:bg-white/10 hover:text-white focus-visible:ring-white/40",
    // A light header or sidebar.
    onLight:
        "border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 focus-visible:ring-slate-300",
    onLightSolid:
        "bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 focus-visible:ring-slate-300",
};

/**
 * The "Back to Portal" control.
 *
 * `tone` picks the palette, because it is rendered on dark green in the
 * marketplace shells and on white in the library ones. There is no default that
 * works everywhere, and guessing wrong means unreadable text - so it is explicit.
 */
export default function BackToPortal({
    tone = "onLight",
    label = "Back to Portal",
    className = "",
    iconOnly = false,
}) {
    const href = portalHomeForRole(currentRole());

    const base =
        "inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold outline-none focus-visible:ring-2";

    const sizing = iconOnly ? "h-9 w-9 p-0" : "px-3 py-2";

    return (
        <Link
            to={href}
            title={label}
            aria-label={label}
            className={`${base} ${sizing} ${SIZES[tone] || SIZES.onLight} ${className}`}
        >
            <LayoutGrid size={iconOnly ? 15 : 14} aria-hidden="true" />
            {!iconOnly && <span>{label}</span>}
        </Link>
    );
}