import {
    LayoutDashboard,
    BookOpen,
    BookOpenCheck,
    Undo2,
    CalendarClock,
    GraduationCap,
    Users,
    BarChart3,
    UserCog,
    ScrollText,
    Settings,
} from "lucide-react";

export const LIBRARY_BASE = "/admin/library";

// `permission` (optional) is a key from the permissions object returned by
// GET /api/admin/library/me. Items the user can't use are hidden in the UI,
// and the same permission protects the route. The backend still enforces it.
export const LIBRARY_NAV = [
    {
        items: [
            { label: "Dashboard", to: `${LIBRARY_BASE}/dashboard`, icon: LayoutDashboard },
        ],
    },
    {
        heading: "Catalog",
        items: [{ label: "Books", to: `${LIBRARY_BASE}/books`, icon: BookOpen }],
    },
    {
        heading: "Circulation",
        items: [
            { label: "Borrow Books", to: `${LIBRARY_BASE}/borrow`, icon: BookOpenCheck },
            { label: "Returns", to: `${LIBRARY_BASE}/returns`, icon: Undo2 },
            { label: "Reservations", to: `${LIBRARY_BASE}/reservations`, icon: CalendarClock },
        ],
    },
    {
        heading: "Patrons",
        items: [
            { label: "Students", to: `${LIBRARY_BASE}/students`, icon: GraduationCap },
            { label: "Faculty", to: `${LIBRARY_BASE}/faculty`, icon: Users },
        ],
    },
    {
        heading: "Reports",
        items: [
            { label: "Analytics & Reports", to: `${LIBRARY_BASE}/reports`, icon: BarChart3 },
        ],
    },
    {
        heading: "Administration",
        items: [
            {
                label: "Librarians",
                to: `${LIBRARY_BASE}/librarians`,
                icon: UserCog,
                permission: "canManageStaff",
            },
            { label: "Terms & Guidelines", to: `${LIBRARY_BASE}/terms`, icon: ScrollText },
            {
                label: "Library Settings",
                to: `${LIBRARY_BASE}/settings`,
                icon: Settings,
                permission: "canManageSettings",
            },
        ],
    },
];

export function findNavItem(pathname) {
    for (const group of LIBRARY_NAV) {
        const match = group.items.find((item) => item.to === pathname);
        if (match) return match;
    }
    return null;
}