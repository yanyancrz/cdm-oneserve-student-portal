import { useCallback, useEffect, useState } from "react";
import {
    Bell,
    BellOff,
    CalendarCheck2,
    CalendarClock,
    CalendarPlus,
    CalendarX2,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import { guidanceApi } from "../services/guidanceApi";
import { onGuidanceEvent } from "../services/realtime";

const POLL_MS = 45 * 1000;

// =========================================================
// HOOK: the signed-in user's Guidance alerts
//
// Loads once, then updates LIVE whenever the API pushes a
// "Notification" event over SignalR. The 45s poll + tab
// focus refresh is only a safety net for missed pushes.
// =========================================================

export function useGuidanceNotifications() {
    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async (signal) => {
        try {
            const data = await guidanceApi.getNotifications(signal);

            setItems(data?.notifications || []);
            setUnreadCount(data?.unreadCount ?? 0);
            setError(null);
        } catch (err) {
            if (err?.name === "AbortError") return;

            // Keep what is already on screen; only say so if there is nothing to show.
            setError(err?.message || "Unable to load alerts.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        refresh(controller.signal);

        const refreshIfVisible = () => {
            if (!document.hidden) refresh(controller.signal);
        };

        const timer = setInterval(refreshIfVisible, POLL_MS);
        document.addEventListener("visibilitychange", refreshIfVisible);

        // Live push from the API: prepend + toast.
        const offEvent = onGuidanceEvent("Notification", (payload) => {
            if (!payload) return;

            const item = {
                id: payload.id,
                title: payload.title,
                message: payload.message,
                type: payload.type,
                isRead: payload.isRead,
                createdAt: payload.createdAt,
            };

            setItems((prev) =>
                prev.some((n) => n.id === item.id) ? prev : [item, ...prev].slice(0, 30)
            );

            if (!item.isRead) setUnreadCount((count) => count + 1);

            toast(
                () => (
                    <span className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#106A2E]">
                            <Bell size={14} aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold">{item.title}</span>
                            <span className="block max-w-60 truncate text-xs opacity-80">
                                {item.message}
                            </span>
                        </span>
                    </span>
                ),
                { duration: 4000 }
            );
        });

        return () => {
            controller.abort();
            clearInterval(timer);
            document.removeEventListener("visibilitychange", refreshIfVisible);
            offEvent();
        };
    }, [refresh]);

    // Optimistic: the dot clears at once; the refresh afterwards corrects any difference.
    const markRead = useCallback(
        async (id) => {
            setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
            setUnreadCount((count) => Math.max(0, count - 1));

            try {
                await guidanceApi.markNotificationRead(id);
            } catch {
                // The next refresh puts the real state back.
            }

            refresh();
        },
        [refresh]
    );

    const markAllRead = useCallback(async () => {
        setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            await guidanceApi.markAllNotificationsRead();
        } catch {
            // The next refresh puts the real state back.
        }

        refresh();
    }, [refresh]);

    return { items, unreadCount, loading, error, refresh, markRead, markAllRead };
}

// =========================================================
// HELPERS
// =========================================================

const TYPE_ICON = {
    GUIDANCE_APPOINTMENT_REQUEST: CalendarPlus,
    GUIDANCE_APPOINTMENT_CANCELLED: CalendarX2,
    GUIDANCE_APPOINTMENT_REJECTED: CalendarX2,
    GUIDANCE_APPOINTMENT_CONFIRMED: CalendarCheck2,
    GUIDANCE_APPOINTMENT_RESCHEDULED: CalendarClock,
};

const timeAgo = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// =========================================================
// SHEET: opens above the bottom tabs
//
// Props
//  - open / onClose
//  - alerts      : the object returned by useGuidanceNotifications()
//  - onOpenItem  : called after an alert is tapped (the page decides where to go)
// =========================================================

export function AlertsSheet({ open, onClose, alerts, onOpenItem }) {
    if (!open) return null;

    const { items, unreadCount, loading, error, markRead, markAllRead } = alerts;

    const handleItem = (item) => {
        if (!item.isRead) markRead(item.id);

        onClose();
        onOpenItem?.(item);
    };

    return (
        <>
            {/* Backdrop: tap outside to close */}
            <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden="true" />

            <section
                role="dialog"
                aria-label="Alerts"
                className="fixed left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-black/15"
                style={{ bottom: "calc(64px + env(safe-area-inset-bottom))", maxHeight: "70vh" }}
            >
                <div className="sticky top-0 flex items-center justify-between gap-2 border-b border-slate-100 bg-white px-3.5 py-2.5">
                    <span className="text-xs font-semibold text-slate-700">Alerts</span>

                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <>
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#0E3B22]">
                                    {unreadCount} new
                                </span>

                                <button
                                    type="button"
                                    onClick={markAllRead}
                                    className="text-[10px] font-semibold text-slate-400 transition hover:text-[#106A2E]"
                                >
                                    Mark all
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close alerts"
                            className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3 px-3.5 py-4" role="status" aria-busy="true">
                        <span className="sr-only">Loading alerts...</span>

                        {[0, 1, 2].map((n) => (
                            <div key={n} className="flex items-start gap-3">
                                <div className="h-8 w-8 shrink-0 animate-pulse rounded-xl bg-slate-100" />

                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
                                    <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-300">
                            {error ? <BellOff size={16} /> : <Bell size={16} />}
                        </div>

                        <p className="mt-3 text-sm font-medium text-slate-500">
                            {error ? "Can't load alerts" : "No alerts"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            {error || "New appointment requests and cancellations show up here."}
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {items.map((item) => {
                            const Icon = TYPE_ICON[String(item.type).toUpperCase()] || Bell;

                            return (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleItem(item)}
                                        className={`flex w-full items-start gap-3 px-3.5 py-3 text-left transition hover:bg-slate-50 ${
                                            item.isRead ? "bg-white" : "bg-emerald-50/40"
                                        }`}
                                    >
                                        <span
                                            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                                item.isRead ? "bg-slate-200" : "bg-[#106A2E]"
                                            }`}
                                        />

                                        <div
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                                                item.isRead
                                                    ? "border-slate-100 bg-slate-50 text-slate-400"
                                                    : "border-emerald-100 bg-emerald-50 text-[#106A2E]"
                                            }`}
                                        >
                                            <Icon size={14} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p
                                                className={`line-clamp-2 text-xs ${
                                                    item.isRead
                                                        ? "font-medium text-slate-500"
                                                        : "font-semibold text-slate-800"
                                                }`}
                                            >
                                                {item.title}
                                            </p>

                                            {item.message && (
                                                <p className="mt-0.5 line-clamp-3 text-[10px] leading-4 text-slate-400">
                                                    {item.message}
                                                </p>
                                            )}

                                            <p className="mt-1 text-[10px] text-slate-300">
                                                {timeAgo(item.createdAt)}
                                            </p>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </>
    );
}
