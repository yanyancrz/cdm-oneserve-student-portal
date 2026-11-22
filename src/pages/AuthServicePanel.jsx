import { BookOpen, MessageCircleHeart, SearchCheck, Stethoscope } from "lucide-react";

const SERVICES = [
    { name: "Clinic", description: "Health records", icon: Stethoscope },
    { name: "Library", description: "Books, reservations, and e-resources", icon: BookOpen },
    { name: "Guidance", description: "Counseling and student support", icon: MessageCircleHeart },
    { name: "Lost & Found", description: "Report and claim lost items", icon: SearchCheck },
];

export default function AuthServicePanel({ compact = false, className = "" }) {
    if (compact) {
        return (
            <div className="auth-service-list mt-6 flex max-w-sm flex-wrap justify-center gap-2 lg:hidden">
                {SERVICES.map(({ name, icon: Icon }) => (
                    <span
                        key={name}
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-900/10 bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                        <Icon size={13} className="text-[#106A2E]" />
                        {name}
                    </span>
                ))}
            </div>
        );
    }

    return (
        <section className={`auth-enter auth-brand-enter hidden lg:block ${className}`}>
            <h2 className="text-5xl font-bold tracking-tight text-emerald-950">
                CDM OneServe
            </h2>

            <p className="mt-2 text-lg font-medium text-[#106A2E]">
                An Integrated Campus Service Management
            </p>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                One account for every service at Colegio de Montalban,
                from the clinic to the library and everything in between.
            </p>

            <ul className="mt-8 grid max-w-md gap-2.5">
                {SERVICES.map(({ name, description, icon: Icon }) => (
                    <li
                        key={name}
                        className="flex items-center gap-3 rounded-2xl border border-emerald-900/10 bg-white/75 p-3"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-[#106A2E]">
                            <Icon size={18} />
                        </div>

                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{name}</p>
                            <p className="text-xs leading-5 text-slate-600">{description}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
