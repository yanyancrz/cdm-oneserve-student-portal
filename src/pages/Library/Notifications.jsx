import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import PageHeader from "../../components/Library/PageHeader";
import EmptyState from "../../components/Library/EmptyState";
import NotificationCard from "../../components/Library/NotificationCard";

import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearLibraryNotifications,
} from "../../services/libraryService";

export default function Notifications() {

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);

    useEffect(() => {

        const loadNotifications = async () => {

            const userId = Number(localStorage.getItem("userId"));

            if (!userId) {
                setLoading(false);
                return;
            }

            try {

                const data = await getNotifications(userId);

                setNotifications(
                    data.data ?? data
                );

            } catch (error) {

                console.error(
                    "Failed to load notifications:",
                    error
                );

            } finally {

                setLoading(false);

            }

        };

        loadNotifications();

    }, []);

    const unreadCount =
        notifications.filter((n) => !n.read).length;


    const handleMarkAllRead = async () => {

        const userId =
            Number(localStorage.getItem("userId"));

        if (!userId) {
            return;
        }

        try {

            await markAllNotificationsRead(userId);

            setNotifications((prev) =>
                prev.map((notification) => ({
                    ...notification,
                    read: true,
                }))
            );

        } catch (error) {

            console.error(
                "Failed to mark all notifications as read:",
                error
            );

        }

    };

    const handleClearNotifications = async () => {

        const userId = Number(
            localStorage.getItem("userId")
        );

        if (!userId || clearing) {
            return;
        }

        const confirmed = window.confirm(
            "Clear all notifications? This action cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        try {

            setClearing(true);

            const response =
                await clearLibraryNotifications(userId);

            console.log(
                "CLEAR NOTIFICATIONS RESPONSE:",
                response
            );

            setNotifications([]);

            toast.success(
                response.message ||
                "Notifications cleared successfully."
            );

        } catch (error) {

            console.error(
                "CLEAR NOTIFICATIONS ERROR:",
                error
            );

            toast.error(
                error.message ||
                "Failed to clear notifications."
            );

        } finally {

            setClearing(false);

        }
    };


    const handleMarkRead = async (notificationId) => {

        const notification =
            notifications.find(
                (n) => n.id === notificationId
            );

        // Don't call API again if already read
        if (!notification || notification.read) {
            return;
        }

        try {

            await markNotificationRead(notificationId);

            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId
                        ? {
                            ...n,
                            read: true,
                        }
                        : n
                )
            );

        } catch (error) {

            console.error(
                "Failed to mark notification as read:",
                error
            );

        }

    };


    return (

        <div
            className="min-h-screen pb-24"
            style={{
                background:
                    "linear-gradient(160deg, #d7ead9 0%, #cfe9de 45%, #fcf0c8 100%)",
            }}
        >

            <div className="max-w-md sm:max-w-2xl lg:max-w-3xl mx-auto p-4 sm:p-6">

                <div className="flex items-start justify-between gap-3 mb-4">

                    <PageHeader
                        title="Notifications"
                        subtitle={
                            unreadCount > 0
                                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                                : "You're all caught up"
                        }
                    />

                    {notifications.length > 0 && (

                        <div className="flex items-center gap-2 mt-1">

                            {/* MARK ALL READ */}
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="
                                        text-xs
                                        font-semibold
                                        text-[#106A2E]
                                        hover:underline
                                        whitespace-nowrap
                                    "
                                >
                                    Mark all as read
                                </button>
                            )}

                            {/* CLEAR NOTIFICATIONS */}
                            <button
                                onClick={handleClearNotifications}
                                disabled={clearing}
                                title="Clear notifications"
                                className="
                                    w-9
                                    h-9
                                    rounded-xl
                                    flex
                                    items-center
                                    justify-center
                                    bg-white/80
                                    text-gray-500
                                    hover:bg-red-50
                                    hover:text-red-600
                                    disabled:opacity-50
                                    transition-all
                                "
                            >
                                <svg
                                    width="17"
                                    height="17"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M3 6h18" />
                                    <path d="M8 6V4h8v2" />
                                    <path d="M19 6l-1 14H6L5 6" />
                                    <path d="M10 11v5" />
                                    <path d="M14 11v5" />
                                </svg>
                            </button>

                        </div>

                    )}

                </div>


                {loading ? (

                    <div className="py-12 text-center">

                        <p className="text-sm text-gray-500">
                            Loading notifications...
                        </p>

                    </div>

                ) : notifications.length === 0 ? (

                    <EmptyState
                        title="No notifications"
                        message="You'll see updates about due dates, reservations, and library announcements here."
                    />

                ) : (

                    <div className="space-y-2.5">

                        {notifications.map(
                            (notification) => (

                                <div
                                    key={notification.id}
                                    onClick={() =>
                                        handleMarkRead(
                                            notification.id
                                        )
                                    }
                                    className={
                                        notification.read
                                            ? ""
                                            : "cursor-pointer"
                                    }
                                >

                                    <NotificationCard
                                        notification={
                                            notification
                                        }
                                    />

                                </div>

                            )
                        )}

                    </div>

                )}


                <div className="mt-6 text-center">

                    <Link
                        to="/library"
                        className="
                            text-sm
                            font-semibold
                            text-[#106A2E]
                            hover:underline
                        "
                    >
                        Back to Library
                    </Link>

                </div>

            </div>

        </div>

    );

}