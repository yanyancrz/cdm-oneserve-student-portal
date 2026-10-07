import { ACCENTS } from "./GuidanceUi";

// Page title block with a soft curve at the bottom.
//   accent: "pink" (student, default) | "green" (counselor)
export default function PageHeader({ title, subtitle, right, accent = "green" }) {
    return (
        <header
            className={`relative overflow-hidden rounded-b-[28px] bg-gradient-to-br ${ACCENTS[accent].gradient} px-4 pb-7 text-white shadow-sm`}
            style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}
        >
            <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-8 h-32 w-32 rounded-full bg-white/5" />

            <div className="relative flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-semibold tracking-tight">{title}</h1>

                    {subtitle && <p className="mt-1 text-xs leading-5 text-white/85">{subtitle}</p>}
                </div>

                {right}
            </div>
        </header>
    );
}