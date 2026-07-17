import { useState } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../../components/Library/PageHeader";
import EmptyState from "../../components/Library/EmptyState";
import NotificationCard from "../../components/Library/NotificationCard";

import { mockNotifications } from "../../data/mockLibraryData";

export default function Notifications() {

    const [notifications, setNotifications] = useState(mockNotifications || []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const handleMarkAllRead = () => {
        // Placeholder only — no backend call yet. Wire this to a real
        // notifications endpoint once libraryService.js has one.
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const handleMarkRead = (notificationId) => {
        setNotifications((prev) =>
            prev.map((n) =>
                n.id === notificationId ? { ...n, read: true } : n
            )
        );
    };

    return (

        <div
            className="min-h-screen pb-24"
            style={{
                background: "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)",
            }}
        >

            <div className="max-w-md sm:max-w-2xl lg:max-w-3xl mx-auto p-4 sm:p-6">

                <div className="flex items-start justify-between gap-3 mb-1">
                    <PageHeader
                        title="Notifications"
                        subtitle={
                            unreadCount > 0
                                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                                : "You're all caught up"
                        }
                    />
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-semibold text-[#106A2E] hover:underline whitespace-nowrap mt-1"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <EmptyState
                        title="No notifications"
                        message="You'll see updates about due dates, reservations, and library announcements here."
                    />
                ) : (
                    <div className="space-y-2.5">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleMarkRead(notification.id)}
                                className="cursor-pointer"
                            >
                                <NotificationCard notification={notification} />
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 text-center">
                    <Link
                        to="/library"
                        className="text-sm font-semibold text-[#106A2E] hover:underline"
                    >
                        Back to Library
                    </Link>
                </div>

            </div>

        </div>

    );

}