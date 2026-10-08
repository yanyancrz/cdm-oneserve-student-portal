import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faHouse,
    faUser,
    faBookOpen,
    faStethoscope,
    faMagnifyingGlass,
    faCommentDots,
    faBell,
    faTableCellsLarge,
    faChevronDown,
    faCircleCheck,
    faTriangleExclamation,
    faCircleInfo,
    faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";

import { API_URL } from "../../config/api";

// How often the alerts refresh in the background (only while the tab is visible).
const NOTIFICATION_POLL_MS = 30 * 1000;

// =========================================================
// WHICH MODULE A NOTIFICATION IS FROM
//
// Decided by the first word of its Type, e.g. GUIDANCE_APPOINTMENT_REQUEST
// is Guidance. Every module should start its notification Types with its
// own name (GUIDANCE_, LIBRARY_, CLINIC_, LOSTFOUND_, MARKETPLACE_).
// "match" also lists the older Library names (reservation-created, ...).
// =========================================================

const NOTIFICATION_MODULES = [
    {
        key: "guidance",
        label: "Guidance",
        icon: faCommentDots,
        chip: "bg-pink-50 text-[#B13C70]",
        match: ["GUIDANCE"],
    },
    {
        key: "library",
        label: "Library",
        icon: faBookOpen,
        chip: "bg-emerald-50 text-emerald-700",
        match: ["LIBRARY", "RESERVATION", "BORROW", "BOOK"],
    },
    {
        key: "clinic",
        label: "Clinic",
        icon: faStethoscope,
        chip: "bg-sky-50 text-sky-700",
        match: ["CLINIC"],
    },
    {
        key: "lost-found",
        label: "Lost & Found",
        icon: faMagnifyingGlass,
        chip: "bg-violet-50 text-violet-700",
        match: ["LOST", "LOSTFOUND", "FOUND"],
    },
];

// Shown for notices that belong to no module (INFO, SUCCESS, ...).
const GENERAL_MODULE = {
    key: "general",
    label: "OneServe",
    icon: faCircleInfo,
    chip: "bg-slate-100 text-slate-500",
};

const getNotificationModule = (type) => {
    // "reservation-created" and "RESERVATION_CREATED" both give "RESERVATION".
    const firstWord = String(type || "")
        .toUpperCase()
        .split(/[^A-Z]+/)[0];

    return (
        NOTIFICATION_MODULES.find((module) =>
            module.match.includes(firstWord)
        ) || GENERAL_MODULE
    );
};

export default function BottomNavigation() {
    const navigate = useNavigate();
    const location = useLocation();

    const [openMenu, setOpenMenu] = useState(null);

    // =========================================================
    // NOTIFICATIONS
    // =========================================================

    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] =
        useState(true);

    // =========================================================
    // DATA
    // =========================================================

    const services = [
        {
            key: "library",
            label: "Library",
            icon: faBookOpen,
            path: "/library",
        },

        {
            key: "clinic",
            label: "Clinic",
            icon: faStethoscope,
            url: "https://clinic.cdmoneserve.vercel.app",
        },

        {
            key: "lost-found",
            label: "Lost & Found",
            icon: faMagnifyingGlass,
            path: "/lost-found",
        },

        {
            key: "guidance",
            label: "Guidance",
            icon: faCommentDots,
            path: "/guidance",
        },

    ];

    const coreTabs = [
        {
            key: "home",
            label: "Home",
            icon: faHouse,
            path: "/dashboard",
        },

        {
            key: "profile",
            label: "Profile",
            icon: faUser,
            path: "/profile",
        },
    ];

    // =========================================================
    // LOAD NOTIFICATIONS
    // =========================================================

    useEffect(() => {
        const email =
            localStorage.getItem("userEmail");

        if (!email) {
            setNotifications([]);
            setNotificationsLoading(false);
            return;
        }

        let cancelled = false;

        // silent = background refresh: no skeleton, and a failed refresh keeps
        // the notifications that are already on screen.
        const loadNotifications = async (silent = false) => {
            try {
                if (!silent) {
                    setNotificationsLoading(true);
                }

                const response = await fetch(
                    `${API_URL}/api/notifications/${encodeURIComponent(
                        email
                    )}`
                );

                if (!response.ok) {
                    throw new Error(
                        "Failed to load notifications."
                    );
                }

                const data =
                    await response.json();

                if (!cancelled) {
                    setNotifications(
                        Array.isArray(data)
                            ? data
                            : []
                    );
                }
            } catch (error) {
                console.error(
                    "Notification loading error:",
                    error
                );

                if (!cancelled && !silent) {
                    setNotifications([]);
                }
            } finally {
                if (!cancelled && !silent) {
                    setNotificationsLoading(false);
                }
            }
        };

        loadNotifications();

        // New alerts (an appointment confirmed or rescheduled, for example) show up
        // without the user having to change page.
        const refreshIfVisible = () => {
            if (!document.hidden) {
                loadNotifications(true);
            }
        };

        const timer = setInterval(
            refreshIfVisible,
            NOTIFICATION_POLL_MS
        );

        document.addEventListener(
            "visibilitychange",
            refreshIfVisible
        );

        return () => {
            cancelled = true;

            clearInterval(timer);

            document.removeEventListener(
                "visibilitychange",
                refreshIfVisible
            );
        };
    }, [location.pathname]);

    // =========================================================
    // UNREAD COUNT
    // =========================================================

    const unreadCount =
        notifications.filter(
            (item) => !item.isRead
        ).length;

    // =========================================================
    // HELPERS
    // =========================================================

    const isTabActive = (tab) =>
        Boolean(tab.path) &&
        location.pathname === tab.path;

    const closeMenu = () =>
        setOpenMenu(null);

    const toggleMenu = (name) =>
        setOpenMenu((prev) =>
            prev === name ? null : name
        );

    const goToItem = (item) => {
        closeMenu();

        if (item.path) {
            navigate(item.path);
            return;
        }

        if (item.url) {
            window.open(
                item.url,
                "_blank",
                "noopener,noreferrer"
            );
        }
    };

    // =========================================================
    // FORMAT NOTIFICATION TIME
    // =========================================================

    const formatRelativeTime = (
        dateValue
    ) => {
        if (!dateValue) {
            return "";
        }

        const date =
            new Date(dateValue);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }

        const now = new Date();

        const difference =
            now.getTime() -
            date.getTime();

        const seconds =
            Math.floor(
                difference / 1000
            );

        if (seconds < 60) {
            return "Just now";
        }

        const minutes =
            Math.floor(
                seconds / 60
            );

        if (minutes < 60) {
            return `${minutes}m ago`;
        }

        const hours =
            Math.floor(
                minutes / 60
            );

        if (hours < 24) {
            return `${hours}h ago`;
        }

        const days =
            Math.floor(
                hours / 24
            );

        if (days < 7) {
            return `${days}d ago`;
        }

        return date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
            }
        );
    };

    // =========================================================
    // NOTIFICATION TYPE ICON
    // =========================================================

    const getNotificationIcon = (
        type
    ) => {
        const normalized =
            String(
                type || "INFO"
            ).toUpperCase();

        // Guidance notifications use the Guidance icon
        if (normalized.startsWith("GUIDANCE_")) {
            return faCommentDots;
        }

        switch (normalized) {
            case "SUCCESS":
                return faCircleCheck;

            case "WARNING":
                return faTriangleExclamation;

            case "ERROR":
                return faCircleXmark;

            case "INFO":
            default:
                return faCircleInfo;
        }
    };

    // =========================================================
    // NOTIFICATION COLORS
    // =========================================================

    const getNotificationStyle = (
        type,
        isRead
    ) => {
        if (isRead) {
            return {
                wrapper:
                    "bg-white",
                icon:
                    "bg-slate-50 text-slate-400 border-slate-100",
                dot:
                    "bg-slate-200",
            };
        }

        const normalized =
            String(
                type || "INFO"
            ).toUpperCase();

        // Guidance notifications are pink, like the Guidance module
        if (normalized.startsWith("GUIDANCE_")) {
            return {
                wrapper:
                    "bg-pink-50/40",
                icon:
                    "bg-pink-50 text-[#D9578F] border-pink-100",
                dot:
                    "bg-[#D9578F]",
            };
        }

        switch (normalized) {
            case "SUCCESS":
                return {
                    wrapper:
                        "bg-emerald-50/40",
                    icon:
                        "bg-emerald-50 text-emerald-600 border-emerald-100",
                    dot:
                        "bg-emerald-500",
                };

            case "WARNING":
                return {
                    wrapper:
                        "bg-amber-50/40",
                    icon:
                        "bg-amber-50 text-amber-600 border-amber-100",
                    dot:
                        "bg-amber-500",
                };

            case "ERROR":
                return {
                    wrapper:
                        "bg-red-50/40",
                    icon:
                        "bg-red-50 text-red-600 border-red-100",
                    dot:
                        "bg-red-500",
                };

            case "INFO":
            default:
                return {
                    wrapper:
                        "bg-emerald-50/30",
                    icon:
                        "bg-emerald-50 text-emerald-600 border-emerald-100",
                    dot:
                        "bg-emerald-500",
                };
        }
    };

    // =========================================================
    // MARK ONE NOTIFICATION AS READ
    // =========================================================

    const handleNotificationClick =
        async (notification) => {
            // Guidance notification: open the Guidance appointments page of this
            // user's side (a counselor and a student have different pages).
            if (
                String(notification.type || "")
                    .toUpperCase()
                    .startsWith("GUIDANCE_")
            ) {
                const role = String(
                    localStorage.getItem("role") ||
                        localStorage.getItem("userRole") ||
                        ""
                )
                    .trim()
                    .toLowerCase();

                closeMenu();

                navigate(
                    role === "counselor"
                        ? "/guidance/counselor/appointments"
                        : "/guidance/appointments"
                );
            }

            if (notification.isRead) {
                return;
            }

            const email =
                localStorage.getItem(
                    "userEmail"
                );

            if (!email) {
                return;
            }

            try {
                const response =
                    await fetch(
                        `${API_URL}/api/notifications/${notification.id}/read?email=${encodeURIComponent(
                            email
                        )}`,
                        {
                            method: "PUT",
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        "Failed to mark notification as read."
                    );
                }

                setNotifications(
                    (previous) =>
                        previous.map(
                            (item) =>
                                item.id ===
                                notification.id
                                    ? {
                                          ...item,
                                          isRead:
                                              true,
                                      }
                                    : item
                        )
                );
            } catch (error) {
                console.error(
                    "Mark notification read error:",
                    error
                );
            }
        };

    // =========================================================
    // MARK ALL AS READ
    // =========================================================

    const handleMarkAllAsRead =
        async () => {
            if (unreadCount === 0) {
                return;
            }

            const email =
                localStorage.getItem(
                    "userEmail"
                );

            if (!email) {
                return;
            }

            try {
                const response =
                    await fetch(
                        `${API_URL}/api/notifications/mark-all-read?email=${encodeURIComponent(
                            email
                        )}`,
                        {
                            method: "PUT",
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        "Failed to mark all notifications as read."
                    );
                }

                setNotifications(
                    (previous) =>
                        previous.map(
                            (item) => ({
                                ...item,
                                isRead:
                                    true,
                            })
                        )
                );
            } catch (error) {
                console.error(
                    "Mark all notifications error:",
                    error
                );
            }
        };

    // =========================================================
    // SERVICES LIST
    // =========================================================

    const ServicesList = () => (
        <div className="py-1.5">

            {services.map((service) => (
                <button
                    key={service.key}
                    type="button"
                    onClick={() =>
                        goToItem(service)
                    }
                    className="
                        flex
                        w-full
                        items-center
                        gap-3
                        px-3.5
                        py-2.5
                        text-left
                        text-sm
                        font-medium
                        text-slate-600
                        transition
                        hover:bg-slate-50
                        hover:text-slate-900
                    "
                >

                    <FontAwesomeIcon
                        icon={service.icon}
                        className="w-4 text-[#106A2E]"
                    />

                    {service.label}

                </button>
            ))}

        </div>
    );

    // =========================================================
    // NOTIFICATIONS LIST
    // =========================================================

    const NotificationsList = () => {

        if (notificationsLoading) {
            return (
                <div className="px-3.5 py-4">

                    {Array.from({
                        length: 4,
                    }).map(
                        (_, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 py-3"
                            >

                                <div className="h-2 w-2 animate-pulse rounded-full bg-slate-200" />

                                <div className="min-w-0 flex-1">

                                    <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />

                                    <div className="mt-1.5 h-2.5 w-1/3 animate-pulse rounded bg-slate-100" />

                                </div>

                            </div>
                        )
                    )}

                </div>
            );
        }

        if (
            notifications.length ===
            0
        ) {
            return (
                <div className="px-4 py-8 text-center">

                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-300">

                        <FontAwesomeIcon
                            icon={faBell}
                            className="text-sm"
                        />

                    </div>

                    <p className="mt-3 text-sm font-medium text-slate-500">
                        No notifications
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        You're all caught up.
                    </p>

                </div>
            );
        }

        return (
            <div className="divide-y divide-slate-100">

                {notifications.map(
                    (item) => {
                        const styles =
                            getNotificationStyle(
                                item.type,
                                item.isRead
                            );

                        const moduleInfo =
                            getNotificationModule(
                                item.type
                            );

                        return (
                            <button
                                key={
                                    item.id
                                }
                                type="button"
                                onClick={() =>
                                    handleNotificationClick(
                                        item
                                    )
                                }
                                className={`
                                    flex
                                    w-full
                                    items-start
                                    gap-3
                                    px-3.5
                                    py-3
                                    text-left
                                    transition
                                    hover:bg-slate-50
                                    ${styles.wrapper}
                                `}
                            >

                                <span
                                    className={`
                                        mt-1.5
                                        h-1.5
                                        w-1.5
                                        shrink-0
                                        rounded-full
                                        ${styles.dot}
                                    `}
                                />


                                <div
                                    className={`
                                        flex
                                        h-8
                                        w-8
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-xl
                                        border
                                        ${styles.icon}
                                    `}
                                >
                                    <FontAwesomeIcon
                                        icon={getNotificationIcon(
                                            item.type
                                        )}
                                        className="text-xs"
                                    />
                                </div>


                                <div className="min-w-0 flex-1">

                                    <span
                                        className={`
                                            mb-1
                                            inline-flex
                                            items-center
                                            gap-1
                                            rounded-full
                                            px-1.5
                                            py-0.5
                                            text-[9px]
                                            font-semibold
                                            uppercase
                                            tracking-wide
                                            ${moduleInfo.chip}
                                            ${
                                                item.isRead
                                                    ? "opacity-60"
                                                    : ""
                                            }
                                        `}
                                    >
                                        <FontAwesomeIcon
                                            icon={
                                                moduleInfo.icon
                                            }
                                            className="text-[8px]"
                                        />

                                        {
                                            moduleInfo.label
                                        }
                                    </span>


                                    <p
                                        className={`
                                            line-clamp-2
                                            text-xs
                                            ${
                                                item.isRead
                                                    ? "font-medium text-slate-500"
                                                    : "font-semibold text-slate-800"
                                            }
                                        `}
                                    >
                                        {
                                            item.title
                                        }
                                    </p>


                                    {item.message && (
                                        <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-400">
                                            {
                                                item.message
                                            }
                                        </p>
                                    )}


                                    <p className="mt-1 text-[10px] text-slate-300">
                                        {formatRelativeTime(
                                            item.createdAt
                                        )}
                                    </p>

                                </div>

                            </button>
                        );
                    }
                )}

            </div>
        );
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <>
            {/* =====================================================
                CLICK-OUTSIDE BACKDROP
            ===================================================== */}

            {openMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={closeMenu}
                    aria-hidden="true"
                />
            )}


            {/* =====================================================
                DESKTOP — FIXED TOP NAV
            ===================================================== */}

            <nav
                className="
                    fixed
                    top-0
                    inset-x-0
                    z-50
                    hidden
                    border-b
                    border-slate-200
                    bg-white/90
                    backdrop-blur-xl
                    md:block
                "
                aria-label="Main navigation"
            >

                <div
                    className="
                        mx-auto
                        flex
                        w-full
                        max-w-[1500px]
                        items-center
                        justify-between
                        gap-4
                        px-6
                        py-3
                        lg:px-8
                    "
                >

                    {/* BRAND */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                        className="flex items-center gap-3"
                    >

                        <div
                            className="
                                flex
                                h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-2xl
                                border
                                border-emerald-600/15
                                bg-emerald-50
                            "
                        >

                            <span className="text-xs font-black text-[#106A2E]">
                                CDM
                            </span>

                        </div>


                        <div className="text-left">

                            <p className="text-[10px] uppercase tracking-[.22em] text-[#106A2E]/70">
                                CDM OneServe
                            </p>

                            <p className="text-sm text-slate-500">
                                Central Campus Portal
                            </p>

                        </div>

                    </button>


                    <div className="flex items-center gap-1.5">

                        {/* HOME */}

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                            aria-current={
                                isTabActive(
                                    coreTabs[0]
                                )
                                    ? "page"
                                    : undefined
                            }
                            className={`
                                flex
                                items-center
                                gap-2
                                rounded-xl
                                px-3.5
                                py-2
                                text-xs
                                font-semibold
                                transition
                                ${
                                    isTabActive(
                                        coreTabs[0]
                                    )
                                        ? "bg-emerald-50 text-[#106A2E]"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                }
                            `}
                        >

                            <FontAwesomeIcon
                                icon={
                                    faHouse
                                }
                                className="text-[13px]"
                            />

                            Home

                        </button>


                        {/* SERVICES */}

                        <div className="relative">

                            <button
                                type="button"
                                onClick={() =>
                                    toggleMenu(
                                        "services"
                                    )
                                }
                                className={`
                                    flex
                                    items-center
                                    gap-2
                                    rounded-xl
                                    px-3.5
                                    py-2
                                    text-xs
                                    font-semibold
                                    transition
                                    ${
                                        openMenu ===
                                        "services"
                                            ? "bg-emerald-50 text-[#106A2E]"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                    }
                                `}
                            >

                                <FontAwesomeIcon
                                    icon={
                                        faTableCellsLarge
                                    }
                                    className="text-[13px]"
                                />

                                Services

                                <FontAwesomeIcon
                                    icon={
                                        faChevronDown
                                    }
                                    className={`text-[9px] transition-transform ${
                                        openMenu ===
                                        "services"
                                            ? "rotate-180"
                                            : ""
                                    }`}
                                />

                            </button>


                            {openMenu ===
                                "services" && (
                                <div
                                    className="
                                        absolute
                                        right-0
                                        top-[calc(100%+8px)]
                                        z-50
                                        w-56
                                        overflow-hidden
                                        rounded-2xl
                                        border
                                        border-slate-200
                                        bg-white
                                        shadow-xl
                                        shadow-black/10
                                    "
                                >
                                    <ServicesList />
                                </div>
                            )}

                        </div>


                        {/* NOTIFICATIONS */}

                        <div className="relative">

                            <button
                                type="button"
                                onClick={() =>
                                    toggleMenu(
                                        "notifications"
                                    )
                                }
                                className={`
                                    relative
                                    flex
                                    h-9
                                    w-9
                                    items-center
                                    justify-center
                                    rounded-xl
                                    transition
                                    ${
                                        openMenu ===
                                        "notifications"
                                            ? "bg-emerald-50 text-[#106A2E]"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                    }
                                `}
                                aria-label="Notifications"
                                aria-expanded={
                                    openMenu ===
                                    "notifications"
                                }
                            >

                                <FontAwesomeIcon
                                    icon={faBell}
                                    className="text-[15px]"
                                />


                                {unreadCount >
                                    0 && (
                                    <span
                                        className="
                                            absolute
                                            right-1.5
                                            top-1.5
                                            flex
                                            h-2
                                            w-2
                                            items-center
                                            justify-center
                                            rounded-full
                                            bg-emerald-500
                                            ring-2
                                            ring-white
                                        "
                                    />
                                )}

                            </button>


                            {openMenu ===
                                "notifications" && (
                                <div
                                    className="
                                        absolute
                                        right-0
                                        top-[calc(100%+8px)]
                                        z-50
                                        w-80
                                        overflow-hidden
                                        rounded-2xl
                                        border
                                        border-slate-200
                                        bg-white
                                        shadow-xl
                                        shadow-black/10
                                    "
                                >

                                    <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5">

                                        <span className="text-xs font-semibold text-slate-700">
                                            Notifications
                                        </span>


                                        <div className="flex items-center gap-2">

                                            {unreadCount >
                                                0 && (
                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                    {
                                                        unreadCount
                                                    }{" "}
                                                    new
                                                </span>
                                            )}


                                            {unreadCount >
                                                0 && (
                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleMarkAllAsRead
                                                    }
                                                    className="text-[10px] font-semibold text-slate-400 transition hover:text-[#106A2E]"
                                                >
                                                    Mark all
                                                </button>
                                            )}

                                        </div>

                                    </div>


                                    <NotificationsList />

                                </div>
                            )}

                        </div>


                        {/* PROFILE */}

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/profile"
                                )
                            }
                            aria-current={
                                isTabActive(
                                    coreTabs[1]
                                )
                                    ? "page"
                                    : undefined
                            }
                            className={`
                                flex
                                items-center
                                gap-2
                                rounded-xl
                                px-3.5
                                py-2
                                text-xs
                                font-semibold
                                transition
                                ${
                                    isTabActive(
                                        coreTabs[1]
                                    )
                                        ? "bg-emerald-50 text-[#106A2E]"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                }
                            `}
                        >

                            <FontAwesomeIcon
                                icon={
                                    faUser
                                }
                                className="text-[13px]"
                            />

                            Profile

                        </button>

                    </div>

                </div>

            </nav>


            {/* =====================================================
                MOBILE — FLOATING BOTTOM NAV
            ===================================================== */}

            <nav
                className="
                    fixed
                    bottom-3
                    left-3
                    right-3
                    z-50
                    md:hidden
                "
                aria-label="Mobile navigation"
            >

                <div
                    className="
                        relative
                        mx-auto
                        flex
                        w-full
                        max-w-md
                        items-center
                        justify-around
                        gap-1
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white/95
                        p-1.5
                        shadow-2xl
                        shadow-black/10
                        backdrop-blur-2xl
                    "
                >

                    {/* HOME */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                        aria-current={
                            isTabActive(
                                coreTabs[0]
                            )
                                ? "page"
                                : undefined
                        }
                        className={`
                            relative
                            flex
                            min-h-[58px]
                            flex-1
                            flex-col
                            items-center
                            justify-center
                            gap-1
                            rounded-xl
                            py-2.5
                            transition-all
                            duration-200
                            active:scale-95
                            ${
                                isTabActive(
                                    coreTabs[0]
                                )
                                    ? "bg-emerald-50 text-[#106A2E]"
                                    : "text-slate-400"
                            }
                        `}
                    >

                        <FontAwesomeIcon
                            icon={faHouse}
                            className="text-[17px]"
                        />

                        <span className="text-[10px] font-semibold">
                            Home
                        </span>


                        {isTabActive(
                            coreTabs[0]
                        ) && (
                            <span className="absolute top-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,106,46,.5)]" />
                        )}

                    </button>


                    {/* SERVICES */}

                    <div className="relative flex-1">

                        <button
                            type="button"
                            onClick={() =>
                                toggleMenu(
                                    "services"
                                )
                            }
                            className={`
                                flex
                                min-h-[58px]
                                w-full
                                flex-col
                                items-center
                                justify-center
                                gap-1
                                rounded-xl
                                py-2.5
                                transition-all
                                duration-200
                                active:scale-95
                                ${
                                    openMenu ===
                                    "services"
                                        ? "bg-emerald-50 text-[#106A2E]"
                                        : "text-slate-400"
                                }
                            `}
                        >

                            <FontAwesomeIcon
                                icon={
                                    faTableCellsLarge
                                }
                                className="text-[17px]"
                            />

                            <span className="text-[10px] font-semibold">
                                Services
                            </span>

                        </button>


                        {openMenu ===
                            "services" && (
                            <div
                                className="
                                    absolute
                                    bottom-[calc(100%+10px)]
                                    left-1/2
                                    z-50
                                    w-56
                                    -translate-x-1/2
                                    overflow-hidden
                                    rounded-2xl
                                    border
                                    border-slate-200
                                    bg-white
                                    shadow-2xl
                                    shadow-black/15
                                "
                            >

                                <ServicesList />

                            </div>
                        )}

                    </div>


                    {/* NOTIFICATIONS */}

                    <div className="flex-1">

                        <button
                            type="button"
                            onClick={() =>
                                toggleMenu(
                                    "notifications"
                                )
                            }
                            className={`
                                relative
                                flex
                                min-h-[58px]
                                w-full
                                flex-col
                                items-center
                                justify-center
                                gap-1
                                rounded-xl
                                py-2.5
                                transition-all
                                duration-200
                                active:scale-95
                                ${
                                    openMenu ===
                                    "notifications"
                                        ? "bg-emerald-50 text-[#106A2E]"
                                        : "text-slate-400"
                                }
                            `}
                        >

                            <FontAwesomeIcon
                                icon={faBell}
                                className="text-[17px]"
                            />

                            <span className="text-[10px] font-semibold">
                                Alerts
                            </span>


                            {unreadCount >
                                0 && (
                                <span className="absolute right-3.5 top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                            )}

                        </button>


                        {openMenu ===
                            "notifications" && (
                            <div
                                className="
                                    absolute
                                    bottom-[calc(100%+10px)]
                                    inset-x-0
                                    z-50
                                    max-h-[70vh]
                                    overflow-y-auto
                                    rounded-2xl
                                    border
                                    border-slate-200
                                    bg-white
                                    shadow-2xl
                                    shadow-black/15
                                "
                            >

                                <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5">

                                    <span className="text-xs font-semibold text-slate-700">
                                        Notifications
                                    </span>


                                    <div className="flex items-center gap-2">

                                        {unreadCount >
                                            0 && (
                                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                {
                                                    unreadCount
                                                }{" "}
                                                new
                                            </span>
                                        )}


                                        {unreadCount >
                                            0 && (
                                            <button
                                                type="button"
                                                onClick={
                                                    handleMarkAllAsRead
                                                }
                                                className="text-[10px] font-semibold text-slate-400 transition hover:text-[#106A2E]"
                                            >
                                                Mark all
                                            </button>
                                        )}

                                    </div>

                                </div>


                                <NotificationsList />

                            </div>
                        )}

                    </div>


                    {/* PROFILE */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/profile"
                            )
                        }
                        aria-current={
                            isTabActive(
                                coreTabs[1]
                            )
                                ? "page"
                                : undefined
                        }
                        className={`
                            relative
                            flex
                            min-h-[58px]
                            flex-1
                            flex-col
                            items-center
                            justify-center
                            gap-1
                            rounded-xl
                            py-2.5
                            transition-all
                            duration-200
                            active:scale-95
                            ${
                                isTabActive(
                                    coreTabs[1]
                                )
                                    ? "bg-emerald-50 text-[#106A2E]"
                                    : "text-slate-400"
                            }
                        `}
                    >

                        <FontAwesomeIcon
                            icon={faUser}
                            className="text-[17px]"
                        />

                        <span className="text-[10px] font-semibold">
                            Profile
                        </span>


                        {isTabActive(
                            coreTabs[1]
                        ) && (
                            <span className="absolute top-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,106,46,.5)]" />
                        )}

                    </button>

                </div>

            </nav>
        </>
    );
}