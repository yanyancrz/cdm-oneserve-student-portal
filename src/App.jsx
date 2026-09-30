import { BrowserRouter, Routes, Route } from "react-router-dom";

// ==========================================
// PWA GUARD
// ==========================================

import PWAInstallGuard from "./components/PWAInstallGuard/PWAInstallGuard";

import DeviceRestriction from "./components/DeviceRestriction/DeviceRestriction";

// ==========================================
// AUTH / PUBLIC PAGES
// ==========================================

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import OTPVerification from "./pages/OTPVerification/OTPVerification";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";

// ==========================================
// STUDENT / USER PAGES
// ==========================================

import Dashboard from "./pages/Dashboard/Dashboard";
import Profile from "./pages/Profile/Profile";
import SetupProfile from "./pages/Profile/SetupProfile";
import EditProfile from "./pages/Profile/EditProfile";
import VerifyEmailChange from "./pages/Profile/VerifyEmailChange";
import ProtectedRoute from "./pages/ProtectedRoute";

// ==========================================
// STUDENT LAYOUT
// ==========================================

import StudentLayout from "./layouts/StudentLayout";

// ==========================================
// LIBRARY PAGES
// ==========================================

import LibraryDashboard from "./pages/Library/Dashboard";
import BrowseBooks from "./pages/Library/BrowseBooks";
import ReserveBook from "./pages/Library/ReserveBook";
import BorrowHistory from "./pages/Library/BorrowHistory";
import BookDetails from "./pages/Library/BookDetails";
import AccessPass from "./pages/Library/AccessPass";
import Scanner from "./pages/Library/Scanner";

// ==========================================
// LOST & FOUND - USER
// ==========================================

import LostFound from "./pages/LostFound/LostFound";

// ==========================================
// BUSINESS HUB - USER
// ==========================================

import BusinessHub from "./pages/BusinessHub/BusinessHub";

// ==========================================
// ADMIN LAYOUT
// ==========================================

import AdminLayout from "./layouts/AdminLayout";

// ==========================================
// ADMIN PAGES
// ==========================================

import AdminDashboard from "./pages/Admin/AdminDashboard";
import RegistrationVerification from "./pages/Admin/RegistrationVerification";
import Users from "./pages/Admin/Users";
import AdminProfile from "./pages/Admin/AdminProfile";
import SchoolRecords from "./pages/Admin/SchoolRecords";
import Announcements from "./pages/Admin/Announcements";

// ==========================================
// LOST & FOUND ADMIN LAYOUT
// ==========================================

import LostFoundAdminLayout from "./layouts/LostFoundAdminLayout";

// ==========================================
// LOST & FOUND ADMIN PAGES
// ==========================================

import LostFoundAdminDashboard from "./pages/Admin/Lost&FoundAdmin/AdminDashboard";
import LostFoundReports from "./pages/Admin/Lost&FoundAdmin/LostFoundReports";
import LostFoundMatches from "./pages/Admin/Lost&FoundAdmin/LostFoundMatches";
import LostFoundClaims from "./pages/Admin/Lost&FoundAdmin/LostFoundClaims";


function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* ==================================================
                    PWA REQUIRED
                    AUTH / PUBLIC PAGES
                    ==================================================

                    These pages are accessible only from the
                    installed CDM OneServe PWA.

                    Normal browser:
                    ❌ BLOCKED

                    Installed PWA:
                    ✅ ALLOWED
                ================================================== */}

                <Route
                    path="/"
                    element={
                        <PWAInstallGuard>
                            <Login />
                        </PWAInstallGuard>
                    }
                />

                <Route
                    path="/register"
                    element={
                        <PWAInstallGuard>
                            <Register />
                        </PWAInstallGuard>
                    }
                />

                <Route
                    path="/otp"
                    element={
                        <PWAInstallGuard>
                            <OTPVerification />
                        </PWAInstallGuard>
                    }
                />

                <Route
                    path="/forgot-password"
                    element={
                        <PWAInstallGuard>
                            <ForgotPassword />
                        </PWAInstallGuard>
                    }
                />

                <Route
                    path="/reset-password"
                    element={
                        <PWAInstallGuard>
                            <ResetPassword />
                        </PWAInstallGuard>
                    }
                />


                {/* ==================================================
                    LIBRARY STAFF / QR SCANNER
                    ==================================================

                    IMPORTANT:

                    THIS IS THE ONLY MAIN EXCEPTION.

                    Scanner can be opened from:

                    Desktop browser       ✅
                    Mobile browser        ✅
                    Tablet browser        ✅
                    Installed PWA         ✅

                    No PWA restriction here.

                    Later we can add ROLE protection so only
                    Library Staff can actually use it.
                ================================================== */}

                <Route
                    path="/library/scanner"
                    element={<Scanner />}
                />


                {/* ==================================================
                    STUDENT / FACULTY PORTAL
                    ==================================================

                    PWA REQUIRED

                    Device restriction will be added here:

                    Mobile / Tablet:
                    ✅ ALLOW

                    Desktop:
                    ❌ BLOCK
                ================================================== */}

                <Route
                    element={
                        <PWAInstallGuard>
                            <DeviceRestriction type="mobile">
                                <StudentLayout />
                            </DeviceRestriction>
                        </PWAInstallGuard>
                    }
                >

                    {/* =========================
                        MAIN DASHBOARD
                    ========================= */}

                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />


                    {/* =========================
                        PROFILE
                    ========================= */}

                    <Route
                        path="/profile"
                        element={<Profile />}
                    />

                    <Route
                        path="/verify-email-change"
                        element={<VerifyEmailChange />}
                    />

                    <Route
                        path="/profile/edit"
                        element={<EditProfile />}
                    />


                    {/* =========================
                        SETUP PROFILE
                    ========================= */}

                    <Route
                        path="/setup-profile"
                        element={<SetupProfile />}
                    />


                    {/* =========================
                        PROTECTED PROFILE
                    ========================= */}

                    <Route
                        path="/protected-profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />


                    {/* ==================================================
                        CDM LIBHUB
                    ================================================== */}

                    <Route
                        path="/library"
                        element={<LibraryDashboard />}
                    />

                    <Route
                        path="/library/books"
                        element={<BrowseBooks />}
                    />

                    <Route
                        path="/library/book/:bookId"
                        element={<BookDetails />}
                    />

                    <Route
                        path="/library/reserve"
                        element={<ReserveBook />}
                    />

                    <Route
                        path="/library/loans"
                        element={<BorrowHistory />}
                    />

                    <Route
                        path="/library/access-pass"
                        element={<AccessPass />}
                    />


                    {/* ==================================================
                        BUSINESS HUB
                    ================================================== */}

                    <Route
                        path="/business-hub"
                        element={<BusinessHub />}
                    />


                    {/* ==================================================
                        LOST & FOUND
                    ================================================== */}

                    <Route
                        path="/lost-found"
                        element={<LostFound />}
                    />

                </Route>


                {/* ==================================================
                    ADMIN PORTAL
                    ==================================================

                    PWA REQUIRED

                    Device restriction will be added:

                    Desktop:
                    ✅ ALLOW

                    Mobile / Tablet:
                    ❌ BLOCK
                ================================================== */}

                <Route
                    element={
                        <PWAInstallGuard>
                            <DeviceRestriction type="desktop">
                                <AdminLayout />
                            </DeviceRestriction>
                        </PWAInstallGuard>
                    }
                >

                    <Route
                        path="/admin/dashboard"
                        element={<AdminDashboard />}
                    />

                    <Route
                        path="/admin/verification"
                        element={<RegistrationVerification />}
                    />

                    <Route
                        path="/admin/users"
                        element={<Users />}
                    />

                    <Route
                        path="/admin/profile"
                        element={<AdminProfile />}
                    />

                    <Route
                        path="/admin/school-records"
                        element={<SchoolRecords />}
                    />

                    <Route
                        path="/admin/announcements"
                        element={<Announcements />}
                    />

                </Route>


                {/* ==================================================
                    LOST & FOUND ADMIN PORTAL
                    ==================================================

                    PWA REQUIRED

                    Desktop:
                    ✅ ALLOW

                    Mobile / Tablet:
                    ❌ BLOCK
                ================================================== */}

                <Route
                    element={
                        <PWAInstallGuard>
                            <LostFoundAdminLayout />
                        </PWAInstallGuard>
                    }
                >

                    <Route
                        path="/admin/lost-found/dashboard"
                        element={<LostFoundAdminDashboard />}
                    />

                    <Route
                        path="/admin/lost-found/reports"
                        element={<LostFoundReports />}
                    />

                    <Route
                        path="/admin/lost-found/matches"
                        element={<LostFoundMatches />}
                    />

                    <Route
                        path="/admin/lost-found/claims"
                        element={<LostFoundClaims />}
                    />

                </Route>

            </Routes>

        </BrowserRouter>
    );
}

export default App;