import { BarChart3, BookOpen, CalendarDays, Compass, GraduationCap, LayoutDashboard, Megaphone, ScrollText, SearchCheck, ShieldCheck, Stethoscope, UserRound, Users } from "lucide-react";

const icons = {
    dashboard: LayoutDashboard, users: Users, heads: ShieldCheck, reports: BarChart3,
    audit: ScrollText, announcements: Megaphone, events: CalendarDays, profile: UserRound,
    records: GraduationCap, library: BookOpen, guidance: Compass, "lost-found": SearchCheck, clinic: Stethoscope,
};

export default function AdminPageHeader({ title, description, icon, children, className = "" }) {
    const Icon = icons[icon] || LayoutDashboard;
    return <header className={`admin-page-header flex flex-wrap items-start justify-between gap-4 ${className}`}>
        <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0E3B22] text-white"><Icon size={20} aria-hidden="true" /></span>
            <div className="min-w-0">
                <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">{title}</h1>
                {description && <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500">{description}</p>}
            </div>
        </div>
        {children && <div className="admin-no-print flex flex-wrap items-center gap-2">{children}</div>}
    </header>;
}
