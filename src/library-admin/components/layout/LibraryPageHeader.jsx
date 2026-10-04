// Shared page title block. `actions` is any node (buttons) shown on the right.
export default function LibraryPageHeader({ title, description, actions }) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <h1 className="font-display text-3xl text-[#1F1F1F] sm:text-4xl">{title}</h1>

                {description && (
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">{description}</p>
                )}
            </div>

            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}