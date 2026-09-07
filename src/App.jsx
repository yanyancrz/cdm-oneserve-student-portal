import { BrowserRouter, Routes, Route } from "react-router-dom";

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
import RequestDigitalID from "./pages/RequestDigitalID/RequestDigitalID";
import ViewDigitalID from "./pages/ViewDigitalID/ViewDigitalID";
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
import BorrowBook from "./pages/Library/BorrowBook";
import ReserveBook from "./pages/Library/ReserveBook";
import RenewBook from "./pages/Library/RenewBook";
import BorrowHistory from "./pages/Library/BorrowHistory";
import Favorites from "./pages/Library/Favorites";
import LibraryClearance from "./pages/Library/LibraryClearance";
import AskLibrarian from "./pages/Library/AskLibrarian";
import Notifications from "./pages/Library/Notifications";
import SuggestBook from "./pages/Library/SuggestBook";
import BookDetails from "./pages/Library/BookDetails";
import BorrowClaimPass from "./pages/Library/BorrowClaimPass";

// ==========================================
// LOST & FOUND - USER
// ==========================================

import LostFound from "./pages/LostFound/LostFound";

// ==========================================
// DIGITAL ID ADMIN LAYOUT
// ==========================================

import AdminLayout from "./layouts/AdminLayout";

// ==========================================
// DIGITAL ID ADMIN PAGES
// ==========================================

import AdminDashboard from "./pages/Admin/AdminDashboard";
import DigitalIDRequests from "./pages/Admin/DigitalIDRequests";
import Users from "./pages/Admin/Users";
import AdminProfile from "./pages/Admin/AdminProfile";

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

// Future Lost & Found Admin pages
// import LostFoundNotifications from "./pages/Admin/Lost&FoundAdmin/LostFoundNotifications";
// import LostFoundAdminProfile from "./pages/Admin/Lost&FoundAdmin/AdminProfile";


function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* ==================================================
                    PUBLIC PAGES
                ================================================== */}

                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/otp"
                    element={<OTPVerification />}
                />

                <Route
                    path="/setup-profile"
                    element={<SetupProfile />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPassword />}
                />

                <Route
                    path="/edit-profile"
                    element={<EditProfile />}
                />

                <Route
                    path="/request-digital-id"
                    element={<RequestDigitalID />}
                />

                <Route
                    path="/library/ask-librarian"
                    element={<AskLibrarian />}
                />


                {/* ==================================================
                    STUDENT / FACULTY PAGES
                ================================================== */}

                <Route element={<StudentLayout />}>

                    {/* =========================
                        DASHBOARD
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
                        DIGITAL ID
                    ========================= */}

                    <Route
                        path="/view-digital-id"
                        element={<ViewDigitalID />}
                    />

                    <Route
                        path="/request-digital-id"
                        element={<RequestDigitalID />}
                    />


                    {/* =========================
                        SETUP PROFILE
                    ========================= */}

                    <Route
                        path="/setup-profile"
                        element={<SetupProfile />}
                    />

                    <Route
                        path="/edit-profile"
                        element={<EditProfile />}
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
                        LIBRARY
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
                        path="/library/borrow"
                        element={<BorrowBook />}
                    />

                    <Route
                        path="/library/reserve"
                        element={<ReserveBook />}
                    />

                    <Route
                        path="/library/renew"
                        element={<RenewBook />}
                    />

                    <Route
                        path="/library/borrow-history"
                        element={<BorrowHistory />}
                    />

                    <Route
                        path="/library/favorites"
                        element={<Favorites />}
                    />

                    <Route
                        path="/library/clearance"
                        element={<LibraryClearance />}
                    />

                    <Route
                        path="/library/notifications"
                        element={<Notifications />}
                    />

                    <Route
                        path="/library/suggest"
                        element={<SuggestBook />}
                    />

                    <Route
                        path="/library/book/:bookId"
                        element={<BookDetails />}
                    />

                    <Route
                        path="/library/borrow-pass/:borrowId"
                        element={<BorrowClaimPass />}
                    />


                    {/* ==================================================
                        LOST & FOUND - STUDENT / FACULTY
                    ================================================== */}

                    <Route
                        path="/lost-found"
                        element={<LostFound />}
                    />

                </Route>


                {/* ==================================================
                    DIGITAL ID ADMIN PORTAL
                ================================================== */}

                <Route
                    path="/admin"
                    element={<AdminLayout />}
                >

                    {/* =========================
                        DIGITAL ID ADMIN
                    ========================= */}

                    <Route
                        path="dashboard"
                        element={<AdminDashboard />}
                    />

                    <Route
                        path="requests"
                        element={<DigitalIDRequests />}
                    />

                    <Route
                        path="users"
                        element={<Users />}
                    />

                    <Route
                        path="profile"
                        element={<AdminProfile />}
                    />

                </Route>


                {/* ==================================================
                    LOST & FOUND ADMIN PORTAL
                ================================================== */}

                <Route
                    path="/admin/lost-found"
                    element={<LostFoundAdminLayout />}
                >

                    <Route
                        path="dashboard"
                        element={<LostFoundAdminDashboard />}
                    />

                    <Route
                        path="reports"
                        element={<LostFoundReports />}
                    />

                    <Route
                        path="matches"
                        element={<LostFoundMatches />}
                    />

                    <Route
                        path="claims"
                        element={<LostFoundClaims />}
                    />

                    {/* Future pages */}

                    {/*
                    <Route
                        path="notifications"
                        element={<LostFoundNotifications />}
                    />

                    <Route
                        path="profile"
                        element={<LostFoundAdminProfile />}
                    />
                    */}

                </Route>

            </Routes>

        </BrowserRouter>
    );
}

export default App;