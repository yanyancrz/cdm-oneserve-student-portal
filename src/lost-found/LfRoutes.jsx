import { Navigate, Route } from "react-router-dom";
import { Monitor } from "lucide-react";

import PWAInstallGuard from "./../components/PWAInstallGuard/PWAInstallGuard";
import DeviceRestriction from "./../components/DeviceRestriction/DeviceRestriction";

import LfLayout from "./user/LfLayout";
import LfHomePage from "./user/LfHomePage";
import LfBrowsePage from "./user/LfBrowsePage";
import LfReportDetailsPage from "./user/LfReportDetailsPage";
import LfReportFormPage from "./user/LfReportFormPage";
import LfSubmitClaimPage from "./user/LfSubmitClaimPage";
import LfRecoveryPage from "./user/LfRecoveryPage";
import LfMyItemsPage from "./user/LfMyItemsPage";
import LfMyClaimsPage from "./user/LfMyClaimsPage";
import LfPickupPage from "./user/LfPickupPage";
import LfMatchesPage from "./user/LfMatchesPage";
import LfNotificationsPage from "./user/LfNotificationsPage";
import LfAdminGate from "./admin/LfAdminGate";
import LfAdminLayout from "./admin/LfAdminLayout";
import LfAdminOverviewPage from "./admin/LfAdminOverviewPage";
import LfAdminReportsPage from "./admin/LfAdminReportsPage";
import LfAdminClaimsPage from "./admin/LfAdminClaimsPage";
import LfAdminSchedulesPage from "./admin/LfAdminSchedulesPage";

// =====================================================
// LOST & FOUND routes
//
//   /lost-found/*        USER  - Student / Faculty,
//                                  inside StudentLayout
//                                  (PWA + mobile guards).
//
//   /lost-found/admin/*  CONSOLE - the module owner
//                                  (LostFoundAdmin) and
//                                  the OneServe Admin.
//                                  Desktop only.
//
// There is no lost-and-found login: the shared OneServe
// login issues the one JWT and every endpoint reads the
// caller from it.
// =====================================================

// ---------- USER (inside the StudentLayout group) ----------

export const lostFoundUserRoutes = (
    <Route path="/lost-found" element={<LfLayout />}>
        <Route index element={<LfHomePage />} />
        <Route path="browse" element={<LfBrowsePage />} />
        <Route path="my-items" element={<LfMyItemsPage />} />
        <Route path="claims" element={<LfMyClaimsPage />} />
        <Route path="pickup/:claimId" element={<LfPickupPage />} />
        <Route path="matches" element={<LfMatchesPage />} />
        <Route path="notifications" element={<LfNotificationsPage />} />

        <Route path="report/new" element={<LfReportFormPage />} />
        <Route path="report/:reportId" element={<LfReportDetailsPage />} />
        <Route
            path="report/:reportId/edit"
            element={<LfReportFormPage />}
        />
        <Route
            path="report/:reportId/claim"
            element={<LfSubmitClaimPage />}
        />
        <Route
            path="report/:reportId/recover"
            element={<LfRecoveryPage />}
        />

        {/* Unknown sub-routes land on the module home. */}
        <Route path="*" element={<Navigate to="." replace />} />
    </Route>
);

// ---------- CONSOLE (module owner, desktop) ----------

export const lostFoundAdminRoutes = (
    <Route
        element={
            <PWAInstallGuard>
                <DeviceRestriction type="desktop">
                    <LfAdminGate>
                        <LfAdminLayout />
                    </LfAdminGate>
                </DeviceRestriction>
            </PWAInstallGuard>
        }
    >
        <Route path="/lost-found/admin" element={<LfAdminOverviewPage />} />
        <Route
            path="/lost-found/admin/reports"
            element={<LfAdminReportsPage />}
        />
        <Route
            path="/lost-found/admin/claims"
            element={<LfAdminClaimsPage />}
        />
        <Route
            path="/lost-found/admin/schedules"
            element={<LfAdminSchedulesPage />}
        />
    </Route>
);

/**
 * A desktop-only notice for the console, used when a
 * module owner opens the student surface by accident.
 * Kept here rather than in the user layout because the
 * user layout is inside the mobile-only group already.
 */
export function LfDesktopOnlyNotice() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F7F5EF] px-4">
            <div className="w-full max-w-md rounded-[24px] border border-[#0E3B22]/10 bg-white p-7 text-center shadow-xl shadow-black/5">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#106A2E] to-[#0E3B22] text-white shadow-lg">
                    <Monitor size={26} />
                </div>

                <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#106A2E]/60">
                    Lost &amp; Found
                </p>

                <h1 className="mt-1.5 text-lg font-bold text-slate-800">
                    Desktop Required
                </h1>

                <p className="mt-2.5 text-sm leading-6 text-slate-500">
                    The Lost &amp; Found console is for desktop and laptop.
                    Use one to review reports, decide claims and run
                    pickups.
                </p>

                <a
                    href="/lost-found"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#106A2E] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0E3B22]"
                >
                    Go to the report board
                </a>
            </div>
        </div>
    );
}
