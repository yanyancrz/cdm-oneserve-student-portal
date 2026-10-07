import { Route } from "react-router-dom";

import PWAInstallGuard from "../../../components/PWAInstallGuard/PWAInstallGuard";
import DeviceRestriction from "../../../components/DeviceRestriction/DeviceRestriction";

import GuidanceGate from "../components/GuidanceGate";
import GuidanceStudentLayout from "../student/GuidanceStudentLayout";
import GuidanceStudentHome from "../student/GuidanceStudentHome";
import CounselorsPage from "../student/CounselorsPage";
import BookAppointmentPage from "../student/BookAppointmentPage";
import MyAppointmentsPage from "../student/MyAppointmentsPage";
import ChatListPage from "../chat/ChatListPage";
import ChatThreadPage from "../chat/ChatThreadPage";
import CounselorLayout from "../counselor/CounselorLayout";
import CounselorDashboard from "../counselor/CounselorDashboard";
import CounselorAppointmentsPage from "../counselor/CounselorAppointmentsPage";
import CounselorProfilePage from "../counselor/CounselorProfilePage";
import ManageAvailabilityPage from "../counselor/ManageAvailabilityPage";
import RecordsPage from "../counselor/RecordsPage";
import ReportsPage from "../counselor/ReportsPage";

// There is intentionally NO /guidance/login. The shared "/" login is used.

// Student / Faculty pages. Put this INSIDE the existing StudentLayout route group
// (so they already have the PWA + mobile guards). Reached from the OneServe dashboard.
export const guidanceStudentRoutes = (
    <Route path="/guidance" element={<GuidanceGate audience="student" />}>
        <Route element={<GuidanceStudentLayout />}>
            <Route index element={<GuidanceStudentHome />} />
            <Route path="counselors" element={<CounselorsPage />} />
            <Route path="book" element={<BookAppointmentPage />} />
            <Route path="appointments" element={<MyAppointmentsPage />} />
            <Route path="chat" element={<ChatListPage audience="student" accent="pink" />} />
            <Route path="chat/:conversationId" element={<ChatThreadPage audience="student" />} />
        </Route>
    </Route>
);

// Counselor pages. Top-level group: PWA guard -> mobile -> server role check.
// Counselors are redirected here straight from the login page.
export const guidanceCounselorRoutes = (
    <Route
        element={
            <PWAInstallGuard>
                <DeviceRestriction type="mobile">
                    <GuidanceGate audience="counselor" />
                </DeviceRestriction>
            </PWAInstallGuard>
        }
    >
        <Route path="/guidance/counselor" element={<CounselorLayout />}>
            <Route index element={<CounselorDashboard />} />
            <Route path="appointments" element={<CounselorAppointmentsPage />} />
            <Route path="availability" element={<ManageAvailabilityPage />} />
            <Route path="records" element={<RecordsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="profile" element={<CounselorProfilePage />} />
            <Route path="chat" element={<ChatListPage audience="counselor" />} />
            <Route path="chat/:conversationId" element={<ChatThreadPage audience="counselor" />} />
        </Route>
    </Route>
);