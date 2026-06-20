import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import OTPVerification from "./pages/OTPVerification/OTPVerification";
import Dashboard from "./pages/Dashboard/Dashboard";
import RequestDigitalID from "./pages/RequestDigitalID/RequestDigitalID";
import ViewDigitalID from "./pages/ViewDigitalID/ViewDigitalID";
import Profile from "./pages/Profile/Profile";
import StudentLayout from "./layouts/StudentLayout";
import SetupProfile from "./pages/Profile/SetupProfile";
import EditProfile from "./pages/Profile/EditProfile";
import VerifyEmailChange from "./pages/Profile/VerifyEmailChange";
import ProtectedRoute from "./pages/ProtectedRoute";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";

function App() {
    return (
        <BrowserRouter>

                <Routes>

                    {/* Public Pages */}

                    <Route path="/" element={<Login />} />

                    <Route path="/register" element={<Register />} />

                    <Route path="/otp" element={<OTPVerification />} />

                    <Route path="/setup-profile" element={<SetupProfile />}  />

                    <Route  path="/forgot-password"  element={<ForgotPassword />}  />

                    <Route  path="/reset-password"  element={<ResetPassword />} />                  

                    {/* Student Pages */}

                    <Route element={<StudentLayout />}>

                        <Route
                            path="/dashboard"
                            element={<Dashboard />}
                        />

                        <Route
                            path="/profile"
                            element={<Profile />}
                        />

                        <Route
                            path="/view-digital-id"
                            element={<ViewDigitalID />}
                        />

                        <Route
                            path="/request-digital-id"
                            element={<RequestDigitalID />}
                        />

                        <Route
                            path="/setup-profile"
                            element={<SetupProfile />}
                        />

                        <Route
                            path="/edit-profile"
                            element={<EditProfile />}
                        />

                        <Route
                            path="/verify-email-change"
                            element={<VerifyEmailChange />}                             
                         />

                         <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />

                      

                    </Route>

                </Routes>

        </BrowserRouter>
    );
}

export default App;