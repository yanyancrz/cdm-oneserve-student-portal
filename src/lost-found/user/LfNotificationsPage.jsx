import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";

import { lfApi } from "../services/lfApi";
import { formatDateTime } from "../config/lfTheme";
import {
    LfButton,
    LfEmpty,
    LfNotice,
    LfSkeleton,
} from "../components/lfUi";

// =====================================================
// The caller's Lost & Found notifications - claim
// submitted, approved, rejected; pickup selected;
// handover completed.
// =====================================================

const TYPE_LABELS = {
    General: "Update",
    ClaimSubmitted: "New claim",
    ClaimApproved: "Claim approved",
    ClaimRejected: "Claim rejected",
    MatchFound: "Item found",
    RecoveryReady: "Recovery",
    RecoveryCompleted: "Handover",
    ClaimUpdate: "Pickup",
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
                        <li key={notification.notificationId}>
                            <button
                                type="button"
                                onClick={() => onMarkRead(notification)}
                                className={`w-full rounded-2xl border p-4 text-left transition ${
                                    notification.isRead
                                        ? "border-slate-200 bg-white"
                                        : "border-[#106A2E]/30 bg-[#106A2E]/5"
                                }`}
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

                                {notification.reportId && (
                                    <span className="mt-2 inline-block text-[11px] font-semibold text-[#0D7856]">
                                        View the report →
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
