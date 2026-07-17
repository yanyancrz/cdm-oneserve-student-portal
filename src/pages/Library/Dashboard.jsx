import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";

// Library-module components (each in its own file under components/Library/)
import WelcomeCard from "../../components/Library/WelcomeCard";
import QuickActions from "../../components/Library/QuickActions";
import AnnouncementCarousel from "../../components/Library/AnnouncementCarousel";
import RecentlyAddedBooks from "../../components/Library/RecentlyAddedBooks";
import RecommendedBooks from "../../components/Library/RecommendedBooks";
import ActivityCard from "../../components/Library/ActivityCard";
import NotificationCard from "../../components/Library/NotificationCard";

import {
    mockStudentLibraryStatus,
    mockAnnouncements,
    mockBooks,
    mockRecommendedBookIds,
    mockRecentActivity,
    mockNotifications,
} from "../../data/mockLibraryData";

export default function Dashboard() {

    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [digitalIdStatus, setDigitalIdStatus] = useState(null);
    const [isLoadingAccess, setIsLoadingAccess] = useState(true);

    useEffect(() => {

        const email = localStorage.getItem("userEmail");

        Promise.all([
            fetch(`${API_URL}/api/profile/${email}`).then((res) => res.json()),
            fetch(`${API_URL}/api/digitalid/${email}`).then((res) => res.json()),
        ])
            .then(([profileData, idData]) => {
                setUser(profileData);
                setDigitalIdStatus(idData);
            })
            .catch(console.error)
            .finally(() => setIsLoadingAccess(false));

    }, []);

    const hasDigitalId = digitalIdStatus?.hasDigitalId ?? false;

    // NOTE: confirm the actual field name for the ID number against the
    // /api/digitalid/:email response — falling back gracefully until then.
    const digitalIdNumber =
        digitalIdStatus?.idNumber ||
        digitalIdStatus?.digitalIdNumber ||
        digitalIdStatus?.studentNumber ||
        "—";

    const studentName = user?.fullName || localStorage.getItem("userName") || "Student";

    const todayLabel = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    // Recently added: newest additions first, top 6
    const recentlyAddedBooks = [...mockBooks]
        .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
        .slice(0, 6);

    // Recommended: resolved from the mock recommendation ID list
    const recommendedBooks = mockRecommendedBookIds
        .map((id) => mockBooks.find((book) => book.id === id))
        .filter(Boolean);

    // Only the latest few notifications preview on the dashboard;
    // the full list lives on /library/notifications
    const notificationPreview = mockNotifications.slice(0, 3);

    if (isLoadingAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7FAF8]">
                <p className="text-sm text-gray-400">Loading your library access...</p>
            </div>
        );
    }

    if (!hasDigitalId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7FAF8] p-6">
                <div className="max-w-sm w-full bg-white rounded-[24px] shadow-sm p-7 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#106A2E]/10 text-[#106A2E] flex items-center justify-center mx-auto mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="16" rx="2" />
                            <circle cx="9" cy="10" r="2" />
                            <path d="M15 8h2M15 12h2M7 16h10" />
                        </svg>
                    </div>
                    <h1 className="text-lg font-semibold text-[#1F1F1F] mb-2">
                        Digital ID required
                    </h1>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        You need an approved Digital Student ID to access the Library Module.
                    </p>
                    <button
                        onClick={() => navigate("/request-digital-id")}
                        className="w-full bg-[#106A2E] text-white p-3.5 rounded-xl font-semibold text-sm hover:brightness-105 active:scale-[0.99] transition-all"
                    >
                        Request Digital ID
                    </button>
                </div>
            </div>
        );
    }

    return (

        <div
            className="min-h-screen p-4 sm:p-6 pb-24"
            style={{
                background: "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)"
            }}
        >

            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <div className="max-w-md sm:max-w-2xl lg:max-w-5xl mx-auto">

                {/* PAGE TITLE */}

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1F1F1F] tracking-tight">
                            Library
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            CDM: OneServe
                        </p>
                        <button
                            onClick={() => navigate("/library/books")}
                        >
                            Browse Books
                        </button>
                    </div>
                    <Link
                        to="/library/notifications"
                        aria-label="Notifications"
                        className="relative w-11 h-11 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-[#1F1F1F] hover:bg-white transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                        </svg>
                        {mockNotifications.some((n) => !n.read) && (
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#F4D35E] border border-white" />
                        )}
                    </Link>
                </div>

                {/* WELCOME CARD */}

                <div className="mb-7">
                    <WelcomeCard
                        studentName={studentName}
                        digitalId={digitalIdNumber}
                        libraryStatus={mockStudentLibraryStatus.libraryStatus}
                        dateLabel={todayLabel}
                    />
                </div>

                {/* QUICK ACTIONS */}

                <div className="mb-7">
                    <h2 className="font-semibold text-base text-[#1F1F1F] mb-3.5">
                        Quick Actions
                    </h2>
                    <QuickActions />
                </div>

                {/* STATISTICS */}

                <div className="mb-7">
                    <h2 className="font-semibold text-base text-[#1F1F1F] mb-3.5">
                        Your Library at a Glance
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                        <Link
                            to="/library/borrow-history"
                            className="bg-white/80 rounded-2xl shadow-sm p-4 flex flex-col gap-2 hover:bg-white hover:shadow-md active:scale-[0.98] transition-all"
                        >
                            <div className="w-9 h-9 rounded-xl bg-[#E1F5EE] text-[#106A2E] flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                                </svg>
                            </div>
                            <p className="text-xl font-semibold text-[#1F1F1F]">{mockStudentLibraryStatus.currentLoans}</p>
                            <p className="text-xs text-gray-500">Borrowed</p>
                        </Link>

                        <Link
                            to="/library/reserve"
                            className="bg-white/80 rounded-2xl shadow-sm p-4 flex flex-col gap-2 hover:bg-white hover:shadow-md active:scale-[0.98] transition-all"
                        >
                            <div className="w-9 h-9 rounded-xl bg-[#FAEEDA] text-[#633806] flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 7v5l3 3" />
                                </svg>
                            </div>
                            <p className="text-xl font-semibold text-[#1F1F1F]">{mockStudentLibraryStatus.reservationsCount}</p>
                            <p className="text-xs text-gray-500">Reservations</p>
                        </Link>

                        <Link
                            to="/library/favorites"
                            className="bg-white/80 rounded-2xl shadow-sm p-4 flex flex-col gap-2 hover:bg-white hover:shadow-md active:scale-[0.98] transition-all"
                        >
                            <div className="w-9 h-9 rounded-xl bg-[#FAECE7] text-[#712B13] flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 21s-6.7-4.35-9.33-8.2C.86 10.28 1.4 6.86 4.1 5.1 6.02 3.86 8.42 4.3 10 6.1c.36.4.68.86.94 1.3.26-.44.58-.9.94-1.3 1.58-1.8 3.98-2.24 5.9-1 2.7 1.76 3.24 5.18 1.43 7.7C18.7 16.65 12 21 12 21Z" />
                                </svg>
                            </div>
                            <p className="text-xl font-semibold text-[#1F1F1F]">{mockStudentLibraryStatus.favoritesCount}</p>
                            <p className="text-xs text-gray-500">Favorites</p>
                        </Link>

                        <Link
                            to="/library/renew"
                            className="bg-white/80 rounded-2xl shadow-sm p-4 flex flex-col gap-2 hover:bg-white hover:shadow-md active:scale-[0.98] transition-all"
                        >
                            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 8v5M12 16h.01" />
                                </svg>
                            </div>
                            <p className="text-xl font-semibold text-[#1F1F1F]">{mockStudentLibraryStatus.overdueCount}</p>
                            <p className="text-xs text-gray-500">Overdue</p>
                        </Link>

                    </div>
                </div>

                {/* ANNOUNCEMENTS */}

                <div className="mb-7">
                    <AnnouncementCarousel announcements={mockAnnouncements} />
                </div>

                {/* RECENTLY ADDED BOOKS */}

                <div className="mb-7">
                    <div className="flex items-center justify-between mb-3.5">
                        <h2 className="font-semibold text-base text-[#1F1F1F]">
                            Recently Added
                        </h2>
                        <Link to="/library/books" className="text-xs font-medium text-[#106A2E] hover:underline">
                            See all
                        </Link>
                    </div>
                    <RecentlyAddedBooks books={recentlyAddedBooks} />
                </div>

                {/* RECOMMENDED BOOKS */}

                <div className="mb-7">
                    <div className="flex items-center justify-between mb-3.5">
                        <h2 className="font-semibold text-base text-[#1F1F1F]">
                            Recommended for You
                        </h2>
                        <Link to="/library/books" className="text-xs font-medium text-[#106A2E] hover:underline">
                            See all
                        </Link>
                    </div>
                    <RecommendedBooks books={recommendedBooks} />
                </div>

                {/* RECENT ACTIVITY */}

                <div className="mb-7">
                    <div className="flex items-center justify-between mb-3.5">
                        <h2 className="font-semibold text-base text-[#1F1F1F]">
                            Recent Activity
                        </h2>
                        <Link to="/library/history" className="text-xs font-medium text-[#106A2E] hover:underline">
                            View all
                        </Link>
                    </div>
                    <div className="bg-white/80 rounded-2xl shadow-sm p-2">
                        {mockRecentActivity.map((activity) => (
                            <ActivityCard key={activity.id} activity={activity} />
                        ))}
                    </div>
                </div>

                {/* NOTIFICATIONS PREVIEW */}

                <div>
                    <div className="flex items-center justify-between mb-3.5">
                        <h2 className="font-semibold text-base text-[#1F1F1F]">
                            Notifications
                        </h2>
                        <Link to="/library/notifications" className="text-xs font-medium text-[#106A2E] hover:underline">
                            View all
                        </Link>
                    </div>
                    <div className="space-y-2.5">
                        {notificationPreview.map((notification) => (
                            <NotificationCard key={notification.id} notification={notification} />
                        ))}
                    </div>
                </div>

            </div>

        </div>

    );

}