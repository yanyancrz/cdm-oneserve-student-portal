import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, HandHelping } from "lucide-react";
import toast from "react-hot-toast";

import { lfApi } from "../services/lfApi";
import { LOST_FOUND_HOME_ROUTE } from "../session";
import { formatDateTime } from "../config/lfTheme";
import {
    LfButton,
    LfEmpty,
    LfNotice,
    LfSkeleton,
} from "../components/lfUi";

// =====================================================
// The caller's Lost & Found notifications - claim
// submitted, claimed, rejected; pickup selected;
// handover completed.
// =====================================================

const TYPE_LABELS = {
    General: "Update",
    ClaimSubmitted: "New claim",
    ClaimApproved: "Ready for pickup",
    ClaimRejected: "Claim rejected",
    ClaimUpdate: "Claim update",
    ClaimInfoRequested: "More information needed",
    MatchFound: "Item found",
    RecoveryReady: "Recovery",
    RecoveryCompleted: "Handover",
};

export default function LfNotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [markingAll, setMarkingAll] = useState(false);

    const load = async () => {
        try {
            const response = await lfApi.notifications();
            setNotifications(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!cancelled) await load();
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const onMarkRead = async (notification) => {
        try {
            await lfApi.markNotificationRead(notification.notificationId);
            setNotifications((current) =>
                current.map((item) =>
                    item.notificationId === notification.notificationId
                        ? { ...item, isRead: true }
                        : item
                )
            );
        } catch (err) {
            toast.error(err.message);
        }
    };

    const onMarkAllRead = async () => {
        setMarkingAll(true);

        try {
            await lfApi.markAllNotificationsRead();
            toast.success("All notifications marked as read.");
            setNotifications((current) =>
                current.map((item) => ({ ...item, isRead: true }))
            );
        } catch (err) {
            toast.error(err.message);
        } finally {
            setMarkingAll(false);
        }
    };

    const unread = notifications.filter((item) => !item.isRead).length;

    if (loading) return <LfSkeleton rows={4} />;

    if (error) return <LfNotice tone="bad">{error}</LfNotice>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                    {unread > 0
                        ? `${unread} unread`
                        : "All caught up"}
                </p>
                {unread > 0 && (
                    <LfButton
                        variant="secondary"
                        onClick={onMarkAllRead}
                        loading={markingAll}
                    >
                        <CheckCheck size={14} aria-hidden="true" />
                        Mark all read
                    </LfButton>
                )}
            </div>

            {notifications.length === 0 ? (
                <LfEmpty
                    icon={Bell}
                    title="No notifications"
                    message="Claim updates, pickup confirmations and handover news appear here."
                />
            ) : (
                <ul className="space-y-2">
                    {notifications.map((notification) => (
                        <li
                            key={notification.notificationId}
                            className={`rounded-2xl border p-4 transition ${
                                notification.isRead
                                    ? "border-slate-200 bg-white"
                                    : "border-[#106A2E]/30 bg-[#106A2E]/5"
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => onMarkRead(notification)}
                                className="w-full text-left"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <span className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-[#106A2E]">
                                                {TYPE_LABELS[notification.notificationType] ||
                                                    "Update"}
                                            </span>
                                            {!notification.isRead && (
                                                <span className="h-2 w-2 rounded-full bg-[#106A2E]" aria-label="Unread" />
                                            )}
                                        </span>
                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                            {notification.title}
                                        </p>
                                        <p className="mt-0.5 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                                            {notification.message}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[10px] text-slate-400">
                                        {formatDateTime(notification.createdAt)}
                                    </span>
                                </div>
                            </button>

                            {notification.reportId && (
                                <div className="mt-2 flex flex-wrap gap-3">
                                    <Link
                                        to={`${LOST_FOUND_HOME_ROUTE}/report/${notification.reportId}`}
                                        className="inline-block text-[11px] font-semibold text-[#0D7856] hover:underline"
                                    >
                                        View the report →
                                    </Link>
                                    {notification.notificationType === "MatchFound" && (
                                        <Link
                                            to={`${LOST_FOUND_HOME_ROUTE}/report/${notification.reportId}/claim`}
                                            className="inline-flex items-center gap-1 rounded-full bg-[#106A2E] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#0E3B22]"
                                        >
                                            <HandHelping size={12} aria-hidden="true" />
                                            Submit Claim
                                        </Link>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
