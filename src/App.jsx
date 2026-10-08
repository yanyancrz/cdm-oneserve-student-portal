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
// LIBRARY PAGES (student side)
// ==========================================
import LibraryDashboard from "./pages/Library/Dashboard";
import BrowseBooks from "./pages/Library/BrowseBooks";
import ReserveBook from "./pages/Library/ReserveBook";
import BorrowHistory from "./pages/Library/BorrowHistory";
import BookDetails from "./pages/Library/BookDetails";
import AccessPass from "./pages/Library/AccessPass";
import Scanner from "./pages/Library/Scanner";


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
import Announcements from "./pages/Admin/Announcements";

// ==========================================
// LIBRARY ADMINISTRATION MODULE (Head / Staff)
// ==========================================
import { libraryRoutes } from "./library-admin/routes/LibraryRoutes";

// ==========================================
// GUIDANCE ADMINISTRATION (Guidance Head / desktop)
// ==========================================
import { guidanceHeadRoutes } from "./guidance-admin/routes/GuidanceHeadRoutes";

// ==========================================
// GUIDANCE COUNSELING MODULE (Student / Faculty + Counselor)
// ==========================================
import { guidanceStudentRoutes, guidanceCounselorRoutes } from "./modules/guidance/routes/GuidanceRoutes";
import BlockRoles from "./components/RoleGuard/BlockRoles";
import { GUIDANCE_COUNSELOR_HOME } from "./modules/guidance/config/guidanceRoutes";

// =====================================================
// CAMPUSMARKET (marketplace)
// A module INSIDE OneServe. Three portals that stay apart:
//   /marketplace/*        buyer  - Student / Faculty (inside StudentLayout)
//   /marketplace/staff/*  staff  - the ONE Marketplace Staff account (desktop)
//   /marketplace/admin/*  admin  - the OneServe Admin, monitoring only (desktop)
// There is no marketplace login: the shared one above issues the single JWT.
// =====================================================
import { marketBuyerRoutes, marketStaffRoutes, marketAdminRoutes } from "./marketplace/MarketRoutes";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* ================= AUTH / PUBLIC (PWA required) ================= */}
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

                {/* ================= LIBRARY QR SCANNER (no PWA restriction) ================= */}
                <Route path="/library/scanner" element={<Scanner />} />

                {/* ================= STUDENT / FACULTY PORTAL (PWA + mobile) ================= */}
                <Route
                    element={
                        <PWAInstallGuard>
                            <DeviceRestriction type="mobile">
                                {/* Counselors never see the OneServe dashboard / modules */}
                                <BlockRoles roles={["Counselor"]} redirectTo={GUIDANCE_COUNSELOR_HOME}>
                                    <StudentLayout />
                                </BlockRoles>
                            </DeviceRestriction>
                        </PWAInstallGuard>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route path="/profile" element={<Profile />} />
                    <Route path="/verify-email-change" element={<VerifyEmailChange />} />
                    <Route path="/edit-profile" element={<EditProfile />} />
                    <Route path="/setup-profile" element={<SetupProfile />} />
                    <Route
                        path="/protected-profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />

                    {/* CDM LibHub (student side) */}
                    <Route path="/library" element={<LibraryDashboard />} />
                    <Route path="/library/books" element={<BrowseBooks />} />
                    <Route path="/library/book/:bookId" element={<BookDetails />} />
                    <Route path="/library/reserve" element={<ReserveBook />} />
                    <Route path="/library/loans" element={<BorrowHistory />} />
                    <Route path="/library/access-pass" element={<AccessPass />} />


                    {/* CampusMarket (buyer side) - Student / Faculty */}
                    {marketBuyerRoutes}

                    {/* Guidance Counseling (student side) - opened from the dashboard */}
                    {guidanceStudentRoutes}
                </Route>

                {/* ================= GUIDANCE COUNSELOR (mobile) ================= */}
                {guidanceCounselorRoutes}

                {/* ================= ADMIN PORTAL (PWA + desktop) ================= */}
                <Route
                    element={
                        <PWAInstallGuard>
                            <DeviceRestriction type="desktop">
                                <AdminLayout />
                            </DeviceRestriction>
                        </PWAInstallGuard>
                    }
                >
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/verification" element={<RegistrationVerification />} />
                    <Route path="/admin/users" element={<Users />} />
                    <Route path="/admin/profile" element={<AdminProfile />} />
                    <Route path="/admin/announcements" element={<Announcements />} />
                </Route>

                {/* ================= LIBRARY ADMINISTRATION (Head / Staff) ================= */}
                {libraryRoutes}

                {/* ================= GUIDANCE ADMINISTRATION (Guidance Head) ================= */}
                {guidanceHeadRoutes}

                {/* ================= CAMPUSMARKET STAFF (the one staff account) ================= */}
                {marketStaffRoutes}

                {/* ================= CAMPUSMARKET MONITORING (OneServe Admin, read-only) ================= */}
                {marketAdminRoutes}
            </Routes>
        </BrowserRouter>
    );
}

export default App;
