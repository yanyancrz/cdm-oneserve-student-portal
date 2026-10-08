import { House, BookOpen, QrCode, LibraryBig } from "lucide-react";

import ModuleBottomNav from "./ModuleBottomNav";

// =====================================================
// Library navigation
//
// A thin wrapper over the shared <ModuleBottomNav>. The markup that used to be
// duplicated here is now in one place, so the Library and the Marketplace cannot
// drift apart - they are the same bar with different tabs.
// =====================================================

const navItems = [
    {
        label: "Home",
        path: "/library",
        icon: House,
        end: true,
    },
    {
        label: "Books",
        path: "/library/books",
        icon: BookOpen,
    },
    {
        label: "Pass",
        path: "/library/access-pass",
        icon: QrCode,
    },
    {
        label: "Loans",
        path: "/library/loans",
        icon: LibraryBig,
    },
];

export default function LibraryBottomNav() {
    return (
        <ModuleBottomNav
            items={navItems}
            brandIcon={LibraryBig}
            brandTitle="CDM OneServe"
            brandSubtitle="Library"
            homePath="/library"
        />
    );
}