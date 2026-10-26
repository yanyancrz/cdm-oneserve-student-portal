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
import Users from "./pages/Admin/Users";
import ServiceHeads from "./pages/Admin/ServiceHeads";
import AdminProfile from "./pages/Admin/AdminProfile";
import Announcements from "./pages/Admin/Announcements";
import Events from "./pages/Admin/Events";
import SchoolRecords from "./pages/Admin/SchoolRecords";
import Reports from "./pages/Admin/Reports";


// ==========================================
// CLINIC PAGES
// ==========================================

import Clinic from "./pages/Clinic/Clinic";
import MedicalRecords from "./pages/Clinic/MedicalRecords";
import MedicalRecordDetails from "./pages/Clinic/MedicalRecordDetails";
import VitalSigns from "./pages/Clinic/VitalSigns";
import VitalSignDetails from "./pages/Clinic/VitalSignDetails";
import DentalRecords from "./pages/Clinic/DentalRecords";
import Referrals from "./pages/Clinic/Referrals";

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
// LOST & FOUND (FIND, integrated)
// A module INSIDE OneServe:
//   /lost-found/*        user      - Student / Faculty (inside StudentLayout)
//   /lost-found/admin/*  console   - the module owner (LostFoundAdmin)
//                                    and the OneServe Admin, desktop only
// There is no lost-and-found login: the shared one above issues the single JWT.
// =====================================================
import { lostFoundUserRoutes, lostFoundAdminRoutes } from "./lost-found/LfRoutes";

// Web Push: the sync component runs the hook on every page load (it repairs
// a rotated subscription and never prompts). The banner is the single
// opt-in affordance that every role can reach, because the Profile page is
// only inside the student layout.
import { PushNotificationSync } from "./push/PushNotificationSync";
import { PushNotificationBanner } from "./push/PushNotificationBanner";

function App() {
    return (
        <BrowserRouter>
            <PushNotificationSync />

            <PushNotificationBanner />

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


                    {/* Clinic Monitoring System */}
                    <Route path="/clinic" element={<Clinic />} />
                    <Route path="/clinic/medical-records" element={<MedicalRecords />} />
                    <Route
                        path="/clinic/medical-records/:medicalRecordId"
                        element={<MedicalRecordDetails />}
                    />
                    <Route path="/clinic/vital-signs" element={<VitalSigns />} />
                    <Route
                        path="/clinic/vital-signs/:vitalSignLogId"
                        element={<VitalSignDetails />}
                    />
                    <Route path="/clinic/dental-records" element={<DentalRecords />} />
                    <Route path="/clinic/referrals" element={<Referrals />} />


                    {/* Guidance Counseling (student side) - opened from the dashboard */}
                    {guidanceStudentRoutes}

                    {/* Lost & Found (student side) - report, claim, recover */}
                    {lostFoundUserRoutes}
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
                    <Route path="/admin/users" element={<Users />} />
                    <Route path="/admin/service-heads" element={<ServiceHeads />} />
                    <Route path="/admin/school-records" element={<SchoolRecords />} />
<Route path="/admin/reports" element={<Reports />} />
                    <Route path="/admin/profile" element={<AdminProfile />} />
                    <Route path="/admin/announcements" element={<Announcements />} />
<Route path="/admin/events" element={<Events />} />
                </Route>

                {/* ================= LIBRARY ADMINISTRATION (Head / Staff) ================= */}
                {libraryRoutes}

                {/* ================= GUIDANCE ADMINISTRATION (Guidance Head) ================= */}
                {guidanceHeadRoutes}

                {/* ================= LOST & FOUND CONSOLE (module owner, desktop) ================= */}
                {lostFoundAdminRoutes}
            </Routes>
        </BrowserRouter>
    );
}

export default App;