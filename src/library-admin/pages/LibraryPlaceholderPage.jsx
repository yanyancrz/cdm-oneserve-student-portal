import { Hammer } from "lucide-react";

import LibraryPageHeader from "../components/layout/LibraryPageHeader";

// Temporary page for sections that are built in later parts.
// Each later part swaps its route element in routes/LibraryRoutes.jsx.
export default function LibraryPlaceholderPage({ title, description }) {
    return (
        <>
            <LibraryPageHeader title={title} description={description} />

            <div className="rounded-2xl border border-black/[0.05] bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E1F0E4] text-[#106A2E]">
                    <Hammer size={20} />
                </div>

                <p className="mt-4 text-sm font-medium text-gray-700">
                    This page isn't built yet.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                    It will be added in a later part of the Library Administration module.
                </p>
            </div>
        </>
    );
}