import { SkeletonPageHeader } from "../common/Skeleton";

// Shared page title block.
//
// Props
//  - title        : page title (required)
//  - description  : short helper text under the title
//  - actions      : any node (buttons) shown on the right
//  - eyebrow      : (optional) small label above the title, e.g. "Catalog"
//  - icon         : (optional) a lucide icon component, e.g. icon={BookOpen}
//  - loading      : (optional) show a skeleton. For pages whose title comes from data.
export default function LibraryPageHeader({
    title,
    description,
    actions,
    eyebrow,
    icon: Icon,
    loading = false,
}) {
    if (loading) {
        return <SkeletonPageHeader withIcon={Boolean(Icon)} actions={actions ? 1 : 0} />;
    }

    return (
        <div className="mb-8 flex flex-col gap-5 border-b border-black/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
                {Icon && (
                    <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E1F0E4] text-[#106A2E] shadow-sm ring-1 ring-[#106A2E]/10 sm:flex">
                        <Icon size={22} aria-hidden="true" />
                    </div>
                )}

                <div className="min-w-0">
                    {eyebrow && (
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#106A2E]">
                            {eyebrow}
                        </p>
                    )}

                    <h1 className="break-words font-display text-3xl leading-tight tracking-tight text-[#1F1F1F] sm:text-4xl">
                        {title}
                    </h1>

                    {/* Brand accent: CDM green to gold */}
                    <span
                        aria-hidden="true"
                        className="mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-[#106A2E] to-[#F4D35E]"
                    />

                    {description && (
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {actions && (
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {actions}
                </div>
            )}
        </div>
    );
}