import { Route } from "react-router-dom";

import PWAInstallGuard from "../../components/PWAInstallGuard/PWAInstallGuard";
import DeviceRestriction from "../../components/DeviceRestriction/DeviceRestriction";

import { GuidanceHeadProvider } from "../context/GuidanceHeadContext";
import GuidanceHeadGate from "../components/layout/GuidanceHeadGate";
import GuidanceHeadLayout from "../components/layout/GuidanceHeadLayout";
import RequireGuidancePermission from "../components/layout/RequireGuidancePermission";
import GuidanceDashboardPage from "../pages/GuidanceDashboardPage";
import GuidanceCounselorsPage from "../pages/GuidanceCounselorsPage";
import GuidanceCounselorDetailPage from "../pages/GuidanceCounselorDetailPage";
import GuidanceStudentsPage from "../pages/GuidanceStudentsPage";
import GuidanceStudentDetailPage from "../pages/GuidanceStudentDetailPage";
import GuidanceReportsPage from "../pages/GuidanceReportsPage";
import GuidanceSettingsPage from "../pages/GuidanceSettingsPage";

import { GUIDANCE_HEAD_BASE } from "../config/navigation";

// Drop this inside <Routes> in App.jsx:  {guidanceHeadRoutes}
//
// Order of protection (outside -> inside):
//   PWA install guard -> desktop-only -> GuidanceHeadProvider (calls /me)
//   -> GuidanceHeadGate (must be an active Guidance Head) -> GuidanceHeadLayout
//   -> page (-> RequireGuidancePermission for permission-gated pages)
//
// There is intentionally NO /admin/guidance/login. The shared "/" login is used,
// and the Guidance Head role is redirected here straight after signing in.
export const guidanceHeadRoutes = (
    <Route
        element={
            <PWAInstallGuard>
                <DeviceRestriction type="desktop">
                    <GuidanceHeadProvider>
                        <GuidanceHeadGate />
                    </GuidanceHeadProvider>
                </DeviceRestriction>
            </PWAInstallGuard>
        }
    >
        <Route element={<GuidanceHeadLayout />}>
            {/*
                The dashboard answers on BOTH /admin/guidance and
                /admin/guidance/dashboard, so the sidebar link, the login
                redirect and a typed URL all land on the same page.
            */}
            <Route path={GUIDANCE_HEAD_BASE} element={<GuidanceDashboardPage />} />
            <Route
                path={`${GUIDANCE_HEAD_BASE}/dashboard`}
                element={<GuidanceDashboardPage />}
            />

            <Route
                path={`${GUIDANCE_HEAD_BASE}/counselors`}
                element={<GuidanceCounselorsPage />}
            />
            <Route
                path={`${GUIDANCE_HEAD_BASE}/counselors/:counselorId`}
                element={<GuidanceCounselorDetailPage />}
            />

            <Route
                path={`${GUIDANCE_HEAD_BASE}/students`}
                element={<GuidanceStudentsPage />}
            />
            <Route
                path={`${GUIDANCE_HEAD_BASE}/students/:studentId`}
                element={<GuidanceStudentDetailPage />}
            />

            <Route
                path={`${GUIDANCE_HEAD_BASE}/reports`}
                element={<GuidanceReportsPage />}
            />

            <Route element={<RequireGuidancePermission permission="canManageSettings" />}>
                <Route
                    path={`${GUIDANCE_HEAD_BASE}/settings`}
                    element={<GuidanceSettingsPage />}
                />
            </Route>
        </Route>
    </Route>
);
