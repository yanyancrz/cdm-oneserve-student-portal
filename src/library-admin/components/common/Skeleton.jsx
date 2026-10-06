// Central skeleton kit for the Library Administration module.
//
// Put this file at: src/library-admin/components/common/Skeleton.jsx
//
// RULE: pages and components never draw their own grey blocks.
// They import from this file, so the look of every loading state
// (color, speed, shape) can be changed here, in one place.
//
// Connected so far
//   BooksPage         -> SkeletonCountBar, SkeletonPagination
//   BookTable         -> Skeleton (row cells)
//   BookFilters       -> SkeletonFilterBar
//   PdfReader         -> SkeletonPdf
//   LibraryPageHeader -> SkeletonPageHeader
//
// Ready for the next files
//   SkeletonForm          -> Add / Edit modals
//   SkeletonDetails       -> view / preview modals
//   SkeletonStatCards     -> dashboard
//   SkeletonRows          -> student / faculty / borrow lists
//   SkeletonCards         -> card grids
//   SkeletonText          -> any paragraph
//   SkeletonLibraryShell  -> LibraryAccessGate (whole layout while /me loads)

const cx = (...parts) => parts.filter(Boolean).join(" ");

// Tells screen readers that something is loading. Without a label the wrapper is
// decorative, so one loading card does not read "Loading" five times.
function Busy({ label, className, children }) {
    if (!label) {
        return (
            <div aria-hidden="true" className={className}>
                {children}
            </div>
        );
    }

    return (
        <div role="status" aria-busy="true" aria-live="polite" className={className}>
            <span className="sr-only">{label}</span>
            {children}
        </div>
    );
}

// ---------------------------------------------------------
// BASE BLOCK
// tone: "light" (default, on white/cream) | "dark" (on the green sidebar)
// Pulses, unless the user turned on "reduce motion".
// ---------------------------------------------------------

// If the caller passes its own rounded-*, the default one is left out
// (otherwise rounded-md or rounded-none would lose to rounded-lg).
const HAS_ROUNDED = /(^|\s)rounded(-|\s|$)/;

export function Skeleton({ className = "", tone = "light" }) {
    return (
        <div
            aria-hidden="true"
            className={cx(
                tone === "dark" ? "bg-white/10" : "bg-gray-100",
                "motion-safe:animate-pulse",
                !HAS_ROUNDED.test(className) && "rounded-lg",
                className
            )}
        />
    );
}

// ---------------------------------------------------------
// TEXT LINES (modals, detail tabs)
// ---------------------------------------------------------

export function SkeletonText({ lines = 3, label = "Loading", className = "" }) {
    return (
        <Busy label={label} className={cx("space-y-2.5", className)}>
            {Array.from({ length: lines }, (_, n) => (
                <Skeleton
                    key={n}
                    // The last line is shorter, like the end of a paragraph.
                    className={cx("h-3.5", n === lines - 1 && lines > 1 ? "w-2/3" : "w-full")}
                />
            ))}
        </Busy>
    );
}

// ---------------------------------------------------------
// LIST ROWS
// variant: "plain" (no leading block) | "book" (cover) | "person" (avatar)
// ---------------------------------------------------------

const LEAD_BLOCK = {
    book: "h-14 w-10 rounded-md",
    person: "h-10 w-10 rounded-full",
};

// Different widths per row, so it looks like real content.
const TITLE_WIDTHS = ["w-1/2", "w-2/5", "w-3/5", "w-1/2", "w-2/5", "w-3/5"];

export function SkeletonRows({ rows = 5, variant = "plain", label = "Loading", className = "" }) {
    const lead = LEAD_BLOCK[variant];

    return (
        <Busy label={label} className={cx("space-y-3 p-5", className)}>
            {Array.from({ length: rows }, (_, n) => (
                <div
                    key={n}
                    className="flex items-center gap-4 rounded-xl border border-black/[0.04] p-3"
                >
                    {lead && <Skeleton className={cx("shrink-0", lead)} />}

                    <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className={cx("h-3.5", TITLE_WIDTHS[n % TITLE_WIDTHS.length])} />
                        <Skeleton className="h-3 w-1/3" />
                    </div>

                    <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
                    <Skeleton className="hidden h-8 w-24 md:block" />
                </div>
            ))}
        </Busy>
    );
}

// ---------------------------------------------------------
// STAT CARDS (dashboard)
// ---------------------------------------------------------

export function SkeletonStatCards({
    count = 4,
    label = "Loading statistics",
    gridClassName = "sm:grid-cols-2 xl:grid-cols-4",
}) {
    return (
        <Busy label={label} className={cx("grid gap-4", gridClassName)}>
            {Array.from({ length: count }, (_, n) => (
                <div
                    key={n}
                    className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-9 w-9 rounded-xl" />
                    </div>

                    <Skeleton className="mt-4 h-8 w-20" />
                    <Skeleton className="mt-3 h-3 w-32" />
                </div>
            ))}
        </Busy>
    );
}

// ---------------------------------------------------------
// CARD GRID (cover + two lines)
// ---------------------------------------------------------

export function SkeletonCards({
    count = 6,
    label = "Loading",
    gridClassName = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
}) {
    return (
        <Busy label={label} className={cx("grid gap-4", gridClassName)}>
            {Array.from({ length: count }, (_, n) => (
                <div
                    key={n}
                    className="overflow-hidden rounded-2xl border border-black/[0.05] bg-white"
                >
                    <Skeleton className="aspect-[3/4] rounded-none" />

                    <div className="space-y-2 p-3">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                </div>
            ))}
        </Busy>
    );
}

// ---------------------------------------------------------
// PAGE HEADER (same layout as LibraryPageHeader)
// ---------------------------------------------------------

export function SkeletonPageHeader({ withIcon = true, actions = 1, label = "Loading page" }) {
    return (
        <Busy
            label={label}
            className="mb-8 flex flex-col gap-5 border-b border-black/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between"
        >
            <div className="flex min-w-0 items-start gap-4">
                {withIcon && <Skeleton className="hidden h-12 w-12 shrink-0 rounded-2xl sm:block" />}

                <div className="min-w-0">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="mt-3 h-9 w-48 max-w-full" />
                    <Skeleton className="mt-3 h-1 w-12 rounded-full" />
                    <Skeleton className="mt-3 h-3.5 w-72 max-w-full" />
                </div>
            </div>

            {actions > 0 && (
                <div className="flex items-center gap-2">
                    {Array.from({ length: actions }, (_, n) => (
                        <Skeleton key={n} className="h-10 w-28 rounded-xl" />
                    ))}
                </div>
            )}
        </Busy>
    );
}

// ---------------------------------------------------------
// FILTER BAR (search + dropdowns, same heights as BookFilters)
// ---------------------------------------------------------

export function SkeletonFilterBar({ selects = 4, sort = true, label = "Loading filters..." }) {
    return (
        <Busy
            label={label}
            className="space-y-3 rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm"
        >
            <Skeleton className="h-[42px] w-full rounded-xl" />

            <div className="flex flex-wrap items-center gap-2">
                {Array.from({ length: selects }, (_, n) => (
                    <Skeleton key={n} className="h-[38px] w-[9.5rem] rounded-xl" />
                ))}

                {sort && <Skeleton className="ml-auto h-[38px] w-40 rounded-xl" />}
            </div>
        </Busy>
    );
}

// ---------------------------------------------------------
// COUNT BAR (title + "N books" pill, top of a table card)
// Decorative: the table next to it already announces the loading.
// ---------------------------------------------------------

export function SkeletonCountBar({ label }) {
    return (
        <Busy
            label={label}
            className="flex items-center justify-between gap-3 border-b border-black/[0.05] px-5 py-3.5"
        >
            <div className="flex items-center gap-2.5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-16 rounded-full" />
            </div>
        </Busy>
    );
}

// ---------------------------------------------------------
// PAGINATION (bottom of a table card). Decorative, like the count bar.
// ---------------------------------------------------------

export function SkeletonPagination({ label }) {
    return (
        <Busy
            label={label}
            className="flex items-center justify-between gap-3 border-t border-black/[0.05] px-5 py-3.5"
        >
            <Skeleton className="h-3.5 w-40" />

            <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map((n) => (
                    <Skeleton key={n} className="h-8 w-8 rounded-lg" />
                ))}
            </div>
        </Busy>
    );
}

// ---------------------------------------------------------
// FORM (Add / Edit modals)
// ---------------------------------------------------------

export function SkeletonForm({ fields = 6, textarea = true, label = "Loading form..." }) {
    return (
        <Busy label={label} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: fields }, (_, n) => (
                    <div key={n} className="space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                ))}
            </div>

            {textarea && (
                <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                </div>
            )}
        </Busy>
    );
}

// ---------------------------------------------------------
// DETAILS (cover + fact grid, for view / preview modals)
// ---------------------------------------------------------

export function SkeletonDetails({ label = "Loading details..." }) {
    return (
        <Busy label={label} className="flex flex-col gap-6 md:flex-row">
            <Skeleton className="h-56 w-40 shrink-0 rounded-xl" />

            <div className="min-w-0 flex-1">
                <div className="mb-4 flex items-center gap-2">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-3.5 w-40" />
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
                    {Array.from({ length: 9 }, (_, n) => (
                        <div key={n} className="space-y-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>

                <div className="mt-5 space-y-2.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-2/3" />
                </div>
            </div>
        </Busy>
    );
}

// ---------------------------------------------------------
// PDF PAGE (Digital Reader)
// bare: no border or rounded corners (when it sits inside another box)
// ---------------------------------------------------------

export function SkeletonPdf({ className = "", bare = false, label = "Loading e-book..." }) {
    return (
        <Busy
            label={label}
            className={cx(
                "flex items-center justify-center bg-gray-50",
                !bare && "rounded-2xl border border-gray-200",
                className
            )}
        >
            <div className="w-[min(70%,28rem)] space-y-3 rounded-lg bg-white p-6 shadow-sm">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="mt-4 h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
            </div>
        </Busy>
    );
}

// ---------------------------------------------------------
// WHOLE LAYOUT (sidebar + topbar + content)
// For LibraryAccessGate: shown while /me is loading.
// ---------------------------------------------------------

export function SkeletonLibraryShell({ label = "Loading library..." }) {
    return (
        <div
            role="status"
            aria-busy="true"
            aria-live="polite"
            className="min-h-screen bg-[#F7F5EF]"
        >
            <span className="sr-only">{label}</span>

            {/* Sidebar */}
            <aside
                aria-hidden="true"
                className="fixed inset-y-0 left-0 z-50 flex w-20 flex-col gap-3 border-r border-white/10 bg-[#0E3B22] p-3 lg:w-64 lg:p-4"
            >
                <Skeleton tone="dark" className="mx-auto mb-4 h-10 w-10 lg:h-16 lg:w-32" />

                {Array.from({ length: 8 }, (_, n) => (
                    <Skeleton key={n} tone="dark" className="h-10 w-full rounded-xl" />
                ))}
            </aside>

            <div aria-hidden="true" className="min-h-screen pl-20 lg:pl-64">
                {/* Topbar */}
                <div className="flex min-h-[72px] items-center justify-between border-b border-[#E5E1D8] bg-white px-4 py-3 sm:px-6 lg:px-8">
                    <Skeleton className="h-4 w-56" />

                    <div className="flex items-center gap-3">
                        <Skeleton className="hidden h-8 w-36 rounded-full md:block" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-5 p-4 sm:p-6 lg:p-8">
                    <SkeletonPageHeader />
                    <SkeletonFilterBar />

                    <div className="rounded-2xl border border-black/[0.05] bg-white shadow-sm">
                        <SkeletonRows rows={5} variant="book" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Skeleton;