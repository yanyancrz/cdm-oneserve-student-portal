import {
    LayoutDashboard,
    BarChart3,
    GraduationCap,
    Settings,
    UserCog,
    UsersRound,
} from "lucide-react";

export const GUIDANCE_HEAD_BASE = "/admin/guidance";
export const GUIDANCE_HEAD_HOME = `${GUIDANCE_HEAD_BASE}/dashboard`;

// `permission` (optional) is a key from GET /api/admin/guidance/me.
// Items the signed-in role can't use are hidden, and the same permission
// protects the route. The API enforces it again on the server.
export const GUIDANCE_HEAD_NAV = [
    {
        items: [{ label: "Dashboard", to: GUIDANCE_HEAD_HOME, icon: LayoutDashboard }],
    },
    {
        heading: "People",
        items: [
            { label: "Counselors", to: `${GUIDANCE_HEAD_BASE}/counselors`, icon: UsersRound, permission: "canManageCounselors" },
            { label: "Students", to: `${GUIDANCE_HEAD_BASE}/students`, icon: GraduationCap, permission: "canViewStudents" },
        ],
    },
    {
        heading: "Insights",
        items: [
            { label: "Reports", to: `${GUIDANCE_HEAD_BASE}/reports`, icon: BarChart3, permission: "canViewReports" },
        ],
    },
    {
        heading: "Administration",
        items: [
            {
                label: "Settings",
                to: `${GUIDANCE_HEAD_BASE}/settings`,
                icon: Settings,
                permission: "canManageSettings",
            },
        ],
    },
    {
        heading: "Account",
        items: [
            // No permission: every signed-in Guidance Head can reach their own
            // account, whatever role they hold.
            { label: "My account", to: `${GUIDANCE_HEAD_BASE}/account`, icon: UserCog },
        ],
    },
];

export function findNavItem(pathname) {
    for (const group of GUIDANCE_HEAD_NAV) {
        const match = group.items.find((item) => item.to === pathname);
        if (match) return match;
    }
    return null;
}
