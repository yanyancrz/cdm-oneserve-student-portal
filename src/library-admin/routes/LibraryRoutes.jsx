import { Route } from "react-router-dom";

import PWAInstallGuard from "../../components/PWAInstallGuard/PWAInstallGuard";
import DeviceRestriction from "../../components/DeviceRestriction/DeviceRestriction";

import { LibraryProvider } from "../context/LibraryContext";
import LibraryAccessGate from "../components/layout/LibraryAccessGate";
import LibraryLayout from "../components/layout/LibraryLayout";
import RequirePermission from "../components/layout/RequirePermission";
import LibraryPlaceholderPage from "../pages/LibraryPlaceholderPage";
import LibraryDashboard from "../components/dashboard/LibraryDashboard";
import BooksPage from "../pages/BooksPage";
import StudentsPage from "../pages/StudentsPage";
import FacultyPage from "../pages/FacultyPage";
import BorrowPage from "../pages/BorrowPage";
import ReservationsPage from "../pages/ReservationsPage";
import ReturnsPage from "../pages/ReturnsPage";
import ReportsPage from "../pages/ReportsPage";
import LibrariansPage from "../pages/LibrariansPage";
import TermsPage from "../pages/TermsPage";
import LibrarySettingsPage from "../pages/LibrarySettingsPage";

import { LIBRARY_BASE } from "../config/navigation";

const placeholder = (title, description) => (
    <LibraryPlaceholderPage title={title} description={description} />
);

// Drop this inside <Routes> in App.jsx:  {libraryRoutes}
//
// Order of protection (outside -> inside):
//   PWA install guard -> desktop-only -> LibraryProvider (calls /me)
//   -> LibraryAccessGate (must be an active Library Head / Staff)
//   -> LibraryLayout -> page (-> RequirePermission for Head-only pages)
//
// There is intentionally NO /admin/library/login. The shared "/" login is used.
export const libraryRoutes = (
    <Route
        element={
            <PWAInstallGuard>
                <DeviceRestriction type="desktop">
                    <LibraryProvider>
                        <LibraryAccessGate />
                    </LibraryProvider>
                </DeviceRestriction>
            </PWAInstallGuard>
        }
    >
        <Route element={<LibraryLayout />}>
            {/*
                The dashboard answers on BOTH /admin/library and /admin/library/dashboard.
                There is no redirect in between, so the sidebar's Dashboard link,
                the login redirect, and a typed URL all land on the page,
                whichever of the two paths they use.
            */}
            <Route
                path={LIBRARY_BASE}
                element={<LibraryDashboard />}
            />
            <Route
                path={`${LIBRARY_BASE}/dashboard`}
                element={<LibraryDashboard />}
            />

            <Route
                path={`${LIBRARY_BASE}/books`}
                element={<BooksPage />}
            />
            <Route
                path={`${LIBRARY_BASE}/students`}
                element={<StudentsPage />}
            />
            <Route
                path={`${LIBRARY_BASE}/faculty`}
                element={<FacultyPage />}
            />
            <Route
                path={`${LIBRARY_BASE}/borrow`}
                element={<BorrowPage />}
            />
            <Route
                path={`${LIBRARY_BASE}/reservations`}
                element={<ReservationsPage />}
            />
            <Route
                path={`${LIBRARY_BASE}/returns`}
                element={<ReturnsPage />}
            />
            <Route
                path={`${LIBRARY_BASE}/reports`}
                element={<ReportsPage />}
            />
            <Route
                path={`${LIBRARY_BASE}/terms`}
                element={<TermsPage />}
            />

            {/* Library Head only */}
            <Route
                path={`${LIBRARY_BASE}/librarians`}
                element={<LibrariansPage />}
            />

            <Route element={<RequirePermission permission="canManageSettings" />}>
                <Route
                    path={`${LIBRARY_BASE}/settings`}
                    element={<LibrarySettingsPage />}
                />
            </Route>
        </Route>
    </Route>
);