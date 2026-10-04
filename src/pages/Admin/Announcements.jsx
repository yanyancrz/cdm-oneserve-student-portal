import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
    Megaphone,
    Plus,
    Pencil,
    Trash2,
    EyeOff,
    RefreshCw,
    X,
    Check,
    Clock3,
    Radio,
    Search,
} from "lucide-react";
import { API_URL } from "../../config/api";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const DEFAULT_ACCENT = "#F4D35E";
const TITLE_MAX = 200;
const MESSAGE_MAX = 500;
const TAG_MAX = 80;
const COLLAPSE_AT = 140;

// Same fonts and link id as AdminProfile, so they are only loaded once
const FONTS_LINK_ID = "admin-profile-fonts";
const FONTS_HREF =
    "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";

const EMPTY_FORM = {
    title: "",
    message: "",
    tag: "CAMPUS",
    accent: DEFAULT_ACCENT,
    isActive: true,
};

const TAG_PRESETS = ["CAMPUS", "ACADEMIC", "EVENT", "URGENT", "REMINDER"];

const ACCENT_PRESETS = [
    { name: "Gold", value: "#F4D35E" },
    { name: "Green", value: "#8FD0A0" },
    { name: "Sky", value: "#8EC5F0" },
    { name: "Coral", value: "#F59E8B" },
    { name: "Lavender", value: "#C5B3F0" },
    { name: "Forest", value: "#106A2E" },
];

const FILTERS = [
    { key: "all", label: "All announcements", hint: "Total" },
    { key: "active", label: "Published", hint: "Visible to users" },
    { key: "hidden", label: "Hidden", hint: "Not visible to users" },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const jsonAuthHeaders = () => ({
    "Content-Type": "application/json",
    ...authHeaders(),
});

const isValidHex = (value) => /^#[0-9A-Fa-f]{6}$/.test(value || "");

const safeAccent = (value) => (isValidHex(value) ? value : DEFAULT_ACCENT);

// Picks a dark or light text color that stays readable on the accent
function getReadableText(hex) {
    const color = safeAccent(hex).slice(1);
    const [r, g, b] = [0, 2, 4].map((i) => {
        const channel = parseInt(color.slice(i, i + 2), 16) / 255;
        return channel <= 0.03928
            ? channel / 12.92
            : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.4 ? "#10231B" : "#FFFFFF";
}

function formatDateTime(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function timeAgo(value) {
    if (!value) return "—";
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return "—";

    const minutes = Math.floor((Date.now() - then) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

const inputBase =
    "w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#106A2E] focus:bg-white focus:ring-2 focus:ring-[#106A2E]/15";

const focusRing =
    "outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/40 focus-visible:ring-offset-2";

// ─────────────────────────────────────────────────────────────
// Small components
// ─────────────────────────────────────────────────────────────
function Switch({ checked, onChange, disabled, label }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={onChange}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing} ${
                checked ? "bg-[#106A2E]" : "bg-gray-300"
            }`}
        >
            <span
                className={`absolute left-0.5 top-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    checked ? "translate-x-5" : "translate-x-0"
                }`}
            />
        </button>
    );
}

function ConfirmDialog({ title, description, confirmLabel, busy, onConfirm, onCancel }) {
    const cancelRef = useRef(null);

    useEffect(() => {
        cancelRef.current?.focus();
    }, []);

    useEffect(() => {
        const onKey = (event) => {
            if (event.key === "Escape" && !busy) onCancel();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [busy, onCancel]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onCancel();
            }}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby="confirm-desc"
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
                    <Trash2 size={20} />
                </div>

                <h2 id="confirm-title" className="mt-4 text-base font-semibold text-gray-900">
                    {title}
                </h2>
                <p id="confirm-desc" className="mt-1.5 text-sm leading-6 text-gray-500">
                    {description}
                </p>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        ref={cancelRef}
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className={`rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 ${focusRing}`}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className={`inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60 ${focusRing}`}
                    >
                        {busy && <RefreshCw size={14} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ListSkeleton() {
    return (
        <div className="space-y-3 animate-pulse" aria-hidden="true">
            {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-gray-100 p-4">
                    <div className="flex gap-2">
                        <div className="h-5 w-16 rounded-full bg-gray-200" />
                        <div className="h-5 w-20 rounded-full bg-gray-100" />
                    </div>
                    <div className="mt-3 h-4 w-1/3 rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-4/5 rounded bg-gray-100" />
                    <div className="mt-1.5 h-3 w-3/5 rounded bg-gray-100" />
                </div>
            ))}
        </div>
    );
}

function AnnouncementCard({ announcement, pending, onEdit, onToggle, onDelete }) {
    const [expanded, setExpanded] = useState(false);

    const accent = safeAccent(announcement.accent);
    const message = announcement.message || "";
    const isLong = message.length > COLLAPSE_AT || message.includes("\n");
    const wasUpdated =
        announcement.updatedAt && announcement.updatedAt !== announcement.createdAt;

    return (
        <article
            className={`relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 pl-5 transition hover:border-gray-200 hover:shadow-sm ${
                announcement.isActive ? "" : "bg-gray-50/60"
            }`}
        >
            <span
                className="absolute inset-y-0 left-0 w-1.5"
                style={{ background: accent }}
                aria-hidden="true"
            />

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                {/* Content */}
                <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-gray-700"
                            style={{ background: `${accent}33` }}
                        >
                            <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: accent }}
                                aria-hidden="true"
                            />
                            {announcement.tag}
                        </span>

                        <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                announcement.isActive
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-gray-100 text-gray-500"
                            }`}
                        >
                            {announcement.isActive ? "Published" : "Hidden"}
                        </span>
                    </div>

                    <h3 className="text-base font-semibold text-gray-800">{announcement.title}</h3>

                    <p
                        className="mt-1 max-w-3xl whitespace-pre-line text-sm leading-6 text-gray-500"
                        style={
                            expanded
                                ? undefined
                                : {
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                  }
                        }
                    >
                        {message}
                    </p>

                    {isLong && (
                        <button
                            type="button"
                            onClick={() => setExpanded((prev) => !prev)}
                            aria-expanded={expanded}
                            className={`mt-1 rounded text-xs font-medium text-[#106A2E] hover:underline ${focusRing}`}
                        >
                            {expanded ? "Show less" : "Show more"}
                        </button>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
                        <span
                            className="inline-flex items-center gap-1"
                            title={formatDateTime(announcement.createdAt)}
                        >
                            <Clock3 size={12} />
                            {timeAgo(announcement.createdAt)}
                        </span>

                        {wasUpdated && (
                            <span title={formatDateTime(announcement.updatedAt)}>
                                Updated {timeAgo(announcement.updatedAt)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2 lg:gap-3">
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={Boolean(announcement.isActive)}
                            onChange={() => onToggle(announcement)}
                            disabled={pending}
                            label={
                                announcement.isActive
                                    ? `Hide ${announcement.title}`
                                    : `Publish ${announcement.title}`
                            }
                        />
                        <span className="w-[62px] text-xs font-medium text-gray-500">
                            {announcement.isActive ? "Published" : "Hidden"}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => onEdit(announcement)}
                        disabled={pending}
                        aria-label={`Edit ${announcement.title}`}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-200 disabled:opacity-50 ${focusRing}`}
                    >
                        <Pencil size={14} />
                        <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onDelete(announcement)}
                        disabled={pending}
                        aria-label={`Delete ${announcement.title}`}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50 ${focusRing}`}
                    >
                        <Trash2 size={14} />
                        <span className="hidden sm:inline">Delete</span>
                    </button>
                </div>
            </div>
        </article>
    );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function Announcements() {
    const adminEmail = localStorage.getItem("userEmail") || "";
    const role = localStorage.getItem("role") || localStorage.getItem("userRole") || "";
    const isAdmin = role.toLowerCase() === "admin";

    const formRef = useRef(null);

    const [announcements, setAnnouncements] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formBaseline, setFormBaseline] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pendingIds, setPendingIds] = useState({});
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [showForm, setShowForm] = useState(false);

    // ── Load ────────────────────────────────────────────────
    const loadAnnouncements = useCallback(
        async ({ silent = false } = {}) => {
            if (!adminEmail || !isAdmin) {
                setLoading(false);
                return;
            }

            try {
                if (!silent) setLoading(true);

                const response = await fetch(
                    `${API_URL}/api/admin/announcements?adminEmail=${encodeURIComponent(adminEmail)}`,
                    { headers: authHeaders() }
                );

                if (response.status === 403) {
                    throw new Error("Only the Admin account can manage announcements.");
                }
                if (!response.ok) {
                    throw new Error("Failed to load announcements.");
                }

                const data = await response.json();
                setAnnouncements(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Load announcements error:", error);
                toast.error(error.message || "Unable to load announcements.");
            } finally {
                setLoading(false);
            }
        },
        [adminEmail, isAdmin]
    );

    useEffect(() => {
        if (document.getElementById(FONTS_LINK_ID)) return;
        const link = document.createElement("link");
        link.id = FONTS_LINK_ID;
        link.rel = "stylesheet";
        link.href = FONTS_HREF;
        document.head.appendChild(link);
    }, []);

    useEffect(() => {
        if (!adminEmail) {
            toast.error("Admin email not found. Please login again.");
            setLoading(false);
            return;
        }
        if (!isAdmin) {
            setLoading(false);
            return;
        }
        loadAnnouncements();
    }, [adminEmail, isAdmin, loadAnnouncements]);

    // ── Derived ─────────────────────────────────────────────
    const activeCount = useMemo(
        () => announcements.filter((item) => item.isActive).length,
        [announcements]
    );
    const hiddenCount = announcements.length - activeCount;

    const counts = { all: announcements.length, active: activeCount, hidden: hiddenCount };

    const filteredAnnouncements = useMemo(() => {
        const query = search.trim().toLowerCase();

        return announcements.filter((item) => {
            if (filter === "active" && !item.isActive) return false;
            if (filter === "hidden" && item.isActive) return false;
            if (!query) return true;

            return (
                item.title?.toLowerCase().includes(query) ||
                item.message?.toLowerCase().includes(query) ||
                item.tag?.toLowerCase().includes(query)
            );
        });
    }, [announcements, search, filter]);

    const isDirty = useMemo(
        () =>
            form.title !== formBaseline.title ||
            form.message !== formBaseline.message ||
            form.tag !== formBaseline.tag ||
            form.accent !== formBaseline.accent ||
            form.isActive !== formBaseline.isActive,
        [form, formBaseline]
    );

    const previewAccent = safeAccent(form.accent);
    const previewText = getReadableText(previewAccent);

    // ── Form helpers ────────────────────────────────────────
    const scrollToForm = () => {
        requestAnimationFrame(() => {
            formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    const closeForm = useCallback(() => {
        setForm(EMPTY_FORM);
        setFormBaseline(EMPTY_FORM);
        setEditingId(null);
        setErrors({});
        setShowForm(false);
    }, []);

    const openCreateForm = () => {
        setForm(EMPTY_FORM);
        setFormBaseline(EMPTY_FORM);
        setEditingId(null);
        setErrors({});
        setShowForm(true);
        scrollToForm();
    };

    const openEditForm = (announcement) => {
        const next = {
            title: announcement.title || "",
            message: announcement.message || "",
            tag: announcement.tag || "CAMPUS",
            accent: announcement.accent || DEFAULT_ACCENT,
            isActive: announcement.isActive ?? true,
        };

        setEditingId(announcement.id);
        setForm(next);
        setFormBaseline(next);
        setErrors({});
        setShowForm(true);
        scrollToForm();
    };

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const handleAccentText = (raw) => {
        let value = raw.trim().toUpperCase();
        if (value && !value.startsWith("#")) value = `#${value}`;
        updateField("accent", value.slice(0, 7));
    };

    const validate = () => {
        const next = {};

        if (!form.title.trim()) next.title = "Announcement title is required.";
        if (!form.message.trim()) next.message = "Announcement message is required.";
        else if (form.message.length > MESSAGE_MAX)
            next.message = `Message must be ${MESSAGE_MAX} characters or fewer.`;
        if (!form.tag.trim()) next.tag = "Announcement tag is required.";
        if (!isValidHex(form.accent)) next.accent = "Use a valid hex color, e.g. #F4D35E.";

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const setPending = (id, value) =>
        setPendingIds((prev) => {
            const next = { ...prev };
            if (value) next[id] = true;
            else delete next[id];
            return next;
        });

    // ── Create / update ─────────────────────────────────────
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validate()) return;

        try {
            setSaving(true);

            const url = editingId
                ? `${API_URL}/api/admin/announcements/${editingId}`
                : `${API_URL}/api/admin/announcements`;

            const response = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: jsonAuthHeaders(),
                body: JSON.stringify({
                    adminEmail,
                    title: form.title.trim(),
                    message: form.message.trim(),
                    tag: form.tag.trim(),
                    accent: form.accent,
                    isActive: form.isActive,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Unable to save announcement.");
            }

            toast.success(
                editingId
                    ? "Announcement updated successfully."
                    : form.isActive
                    ? "Announcement published successfully."
                    : "Announcement saved as hidden."
            );

            closeForm();
            await loadAnnouncements({ silent: true });
        } catch (error) {
            console.error("Save announcement error:", error);
            toast.error(error.message || "Unable to save announcement.");
        } finally {
            setSaving(false);
        }
    };

    // ── Publish / hide (optimistic) ─────────────────────────
    const toggleActive = async (announcement) => {
        if (pendingIds[announcement.id]) return;

        const nextActive = !announcement.isActive;

        setPending(announcement.id, true);
        setAnnouncements((prev) =>
            prev.map((item) =>
                item.id === announcement.id ? { ...item, isActive: nextActive } : item
            )
        );

        try {
            const response = await fetch(`${API_URL}/api/admin/announcements/${announcement.id}`, {
                method: "PUT",
                headers: jsonAuthHeaders(),
                body: JSON.stringify({
                    adminEmail,
                    title: announcement.title,
                    message: announcement.message,
                    tag: announcement.tag,
                    accent: announcement.accent || DEFAULT_ACCENT,
                    isActive: nextActive,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Unable to update announcement.");
            }

            toast.success(
                nextActive ? "Announcement published to users." : "Announcement hidden from users."
            );

            await loadAnnouncements({ silent: true });
        } catch (error) {
            console.error("Toggle announcement error:", error);

            // Roll back the optimistic update
            setAnnouncements((prev) =>
                prev.map((item) =>
                    item.id === announcement.id ? { ...item, isActive: announcement.isActive } : item
                )
            );
            toast.error(error.message || "Unable to update announcement.");
        } finally {
            setPending(announcement.id, false);
        }
    };

    // ── Delete ──────────────────────────────────────────────
    const cancelDelete = useCallback(() => setDeleteTarget(null), []);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const { id } = deleteTarget;

        setPending(id, true);

        try {
            const response = await fetch(
                `${API_URL}/api/admin/announcements/${id}?adminEmail=${encodeURIComponent(adminEmail)}`,
                { method: "DELETE", headers: authHeaders() }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Unable to delete announcement.");
            }

            toast.success("Announcement deleted successfully.");

            if (editingId === id) closeForm();
            setAnnouncements((prev) => prev.filter((item) => item.id !== id));
            setDeleteTarget(null);

            await loadAnnouncements({ silent: true });
        } catch (error) {
            console.error("Delete announcement error:", error);
            toast.error(error.message || "Unable to delete announcement.");
        } finally {
            setPending(id, false);
        }
    };

    // ── Access guard ────────────────────────────────────────
    if (!isAdmin) {
        return (
            <main className="min-h-[calc(100vh-72px)] bg-[#F7F5EF] px-4 py-10 sm:px-6 lg:px-10">
                <div className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                        <X size={24} />
                    </div>

                    <h1 className="mt-5 text-xl font-semibold text-gray-900">Access Restricted</h1>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                        Only the main Admin account can manage CDM OneServe announcements.
                    </p>
                </div>
            </main>
        );
    }

    const hasFilters = Boolean(search.trim()) || filter !== "all";
    const messageOver = form.message.length >= MESSAGE_MAX;

    // ── Main ────────────────────────────────────────────────
    return (
        <main className="ann-root min-h-[calc(100vh-72px)] bg-[#F7F5EF] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <style>{`
                .font-display { font-family: 'Fraunces', serif; }
                .ann-root { font-family: 'Inter', system-ui, sans-serif; }
                @media (prefers-reduced-motion: reduce) {
                    .ann-root * { transition: none !important; animation: none !important; }
                }
            `}</style>

            <div className="mx-auto w-full max-w-[1250px]">
                {/* Header */}
                <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="font-display text-3xl text-[#1F1F1F] sm:text-4xl">
                            Announcements
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Create and manage announcements that appear on the Student and Faculty
                            dashboard.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => loadAnnouncements()}
                            disabled={loading}
                            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 ${focusRing}`}
                        >
                            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={openCreateForm}
                            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#106A2E] px-4 text-sm font-semibold text-white transition hover:bg-[#0d5224] ${focusRing}`}
                        >
                            <Plus size={16} />
                            New Announcement
                        </button>
                    </div>
                </div>

                {/* Stats (also act as filters) */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {FILTERS.map((item) => {
                        const selected = filter === item.key;
                        const Icon =
                            item.key === "all" ? Megaphone : item.key === "active" ? Radio : EyeOff;
                        const iconStyle =
                            item.key === "active"
                                ? "bg-[#E1F0E4] text-[#106A2E]"
                                : item.key === "hidden"
                                ? "bg-gray-100 text-gray-500"
                                : "bg-[#ECE9E2] text-[#1F1F1F]";
                        const numberStyle =
                            item.key === "active"
                                ? "text-[#106A2E]"
                                : item.key === "hidden"
                                ? "text-gray-500"
                                : "text-[#1F1F1F]";

                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setFilter(item.key)}
                                aria-pressed={selected}
                                className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${focusRing} ${
                                    selected
                                        ? "border-[#106A2E]/40 ring-2 ring-[#106A2E]/20"
                                        : "border-black/[0.05] hover:border-gray-200"
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">
                                            {item.key === "all" ? "Total" : item.label}
                                        </p>

                                        {loading ? (
                                            <div className="mt-2 h-9 w-12 animate-pulse rounded bg-gray-200" />
                                        ) : (
                                            <p className={`mt-1 font-display text-3xl ${numberStyle}`}>
                                                {counts[item.key]}
                                            </p>
                                        )}

                                        <p className="mt-1 text-xs text-gray-400">
                                            {item.key === "all" ? "All announcements" : item.hint}
                                        </p>
                                    </div>

                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconStyle}`}
                                    >
                                        <Icon size={18} />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Create / edit form */}
                {showForm && (
                    <section
                        ref={formRef}
                        className="mb-6 scroll-mt-6 overflow-hidden rounded-3xl border border-black/[0.05] bg-white shadow-sm"
                    >
                        <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="font-display text-xl text-[#1F1F1F]">
                                        {editingId ? "Edit Announcement" : "New Announcement"}
                                    </h2>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {form.isActive
                                            ? "This will appear on the user dashboard once saved."
                                            : "This will be saved as hidden and won't show to users."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 ${focusRing}`}
                                    aria-label="Close form"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-6">
                            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                                {/* Fields */}
                                <div className="space-y-5">
                                    {/* Title */}
                                    <div>
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <label
                                                htmlFor="ann-title"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Title
                                            </label>
                                            <span className="text-xs text-gray-400">
                                                {form.title.length}/{TITLE_MAX}
                                            </span>
                                        </div>
                                        <input
                                            id="ann-title"
                                            type="text"
                                            value={form.title}
                                            onChange={(e) => updateField("title", e.target.value)}
                                            maxLength={TITLE_MAX}
                                            aria-invalid={Boolean(errors.title)}
                                            placeholder="Enter announcement title"
                                            className={`${inputBase} ${
                                                errors.title ? "border-red-500" : "border-gray-200"
                                            }`}
                                        />
                                        {errors.title && (
                                            <p className="mt-1 text-xs text-red-500" role="alert">
                                                {errors.title}
                                            </p>
                                        )}
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <label
                                                htmlFor="ann-message"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Message
                                            </label>
                                            <span
                                                className={`text-xs ${
                                                    messageOver ? "text-red-500" : "text-gray-400"
                                                }`}
                                            >
                                                {form.message.length}/{MESSAGE_MAX}
                                            </span>
                                        </div>
                                        <textarea
                                            id="ann-message"
                                            value={form.message}
                                            onChange={(e) => updateField("message", e.target.value)}
                                            maxLength={MESSAGE_MAX}
                                            rows={6}
                                            aria-invalid={Boolean(errors.message)}
                                            placeholder="Write your announcement here..."
                                            className={`${inputBase} resize-none leading-6 ${
                                                errors.message ? "border-red-500" : "border-gray-200"
                                            }`}
                                        />
                                        {errors.message && (
                                            <p className="mt-1 text-xs text-red-500" role="alert">
                                                {errors.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Tag */}
                                    <div>
                                        <label
                                            htmlFor="ann-tag"
                                            className="mb-1.5 block text-sm font-medium text-gray-700"
                                        >
                                            Tag
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-2">
                                            {TAG_PRESETS.map((tag) => {
                                                const selected = form.tag === tag;
                                                return (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => updateField("tag", tag)}
                                                        aria-pressed={selected}
                                                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${focusRing} ${
                                                            selected
                                                                ? "border-[#106A2E] bg-[#E1F0E4] text-[#106A2E]"
                                                                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        {tag.charAt(0) + tag.slice(1).toLowerCase()}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <input
                                            id="ann-tag"
                                            type="text"
                                            value={form.tag}
                                            onChange={(e) =>
                                                updateField("tag", e.target.value.toUpperCase())
                                            }
                                            maxLength={TAG_MAX}
                                            aria-invalid={Boolean(errors.tag)}
                                            placeholder="Or type a custom tag"
                                            className={`${inputBase} uppercase ${
                                                errors.tag ? "border-red-500" : "border-gray-200"
                                            }`}
                                        />
                                        {errors.tag && (
                                            <p className="mt-1 text-xs text-red-500" role="alert">
                                                {errors.tag}
                                            </p>
                                        )}
                                    </div>

                                    {/* Accent */}
                                    <div>
                                        <label
                                            htmlFor="ann-accent"
                                            className="mb-1.5 block text-sm font-medium text-gray-700"
                                        >
                                            Accent color
                                        </label>

                                        <div className="mb-2 flex flex-wrap gap-2">
                                            {ACCENT_PRESETS.map((preset) => {
                                                const selected =
                                                    form.accent.toUpperCase() ===
                                                    preset.value.toUpperCase();
                                                return (
                                                    <button
                                                        key={preset.value}
                                                        type="button"
                                                        onClick={() => updateField("accent", preset.value)}
                                                        aria-label={`${preset.name} accent`}
                                                        aria-pressed={selected}
                                                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${focusRing} ${
                                                            selected
                                                                ? "border-[#1F1F1F]"
                                                                : "border-white ring-1 ring-gray-200"
                                                        }`}
                                                        style={{ background: preset.value }}
                                                    >
                                                        {selected && (
                                                            <Check
                                                                size={14}
                                                                style={{
                                                                    color: getReadableText(preset.value),
                                                                }}
                                                            />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={previewAccent}
                                                onChange={(e) =>
                                                    updateField("accent", e.target.value.toUpperCase())
                                                }
                                                aria-label="Pick a custom accent color"
                                                className="h-[46px] w-14 cursor-pointer rounded-xl border border-gray-200 bg-white p-1"
                                            />
                                            <input
                                                id="ann-accent"
                                                type="text"
                                                value={form.accent}
                                                onChange={(e) => handleAccentText(e.target.value)}
                                                aria-invalid={Boolean(errors.accent)}
                                                placeholder="#F4D35E"
                                                className={`${inputBase} min-w-0 flex-1 uppercase ${
                                                    errors.accent ? "border-red-500" : "border-gray-200"
                                                }`}
                                            />
                                        </div>
                                        {errors.accent && (
                                            <p className="mt-1 text-xs text-red-500" role="alert">
                                                {errors.accent}
                                            </p>
                                        )}
                                    </div>

                                    {/* Publish toggle */}
                                    <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-[#F7F5EF] p-4">
                                        <div>
                                            <p
                                                id="ann-publish-label"
                                                className="text-sm font-medium text-gray-800"
                                            >
                                                Publish immediately
                                            </p>
                                            <p className="mt-0.5 text-xs leading-5 text-gray-500">
                                                When on, the announcement appears on the Student and
                                                Faculty dashboard.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={form.isActive}
                                            onChange={() => updateField("isActive", !form.isActive)}
                                            label="Publish immediately"
                                        />
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex flex-wrap items-center gap-3 pt-1">
                                        <button
                                            type="submit"
                                            disabled={saving || (Boolean(editingId) && !isDirty)}
                                            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#106A2E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d5224] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                                        >
                                            {saving ? (
                                                <>
                                                    <RefreshCw size={15} className="animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Check size={15} />
                                                    {editingId
                                                        ? "Update Announcement"
                                                        : form.isActive
                                                        ? "Publish Announcement"
                                                        : "Save as Hidden"}
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={closeForm}
                                            disabled={saving}
                                            className={`rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 ${focusRing}`}
                                        >
                                            {editingId ? "Cancel Edit" : "Cancel"}
                                        </button>

                                        {isDirty && !saving && (
                                            <span className="text-xs text-amber-600">
                                                Unsaved changes
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Preview */}
                                <div>
                                    <div className="lg:sticky lg:top-6">
                                        <p className="mb-2 text-sm font-medium text-gray-500">
                                            Live preview
                                        </p>

                                        <div
                                            className="relative overflow-hidden rounded-[24px] p-5 shadow-lg"
                                            style={{ background: previewAccent, color: previewText }}
                                        >
                                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.35),transparent_40%)]" />

                                            <div className="relative z-10">
                                                <div className="mb-4 flex items-center justify-between gap-3">
                                                    <div>
                                                        <span className="text-xs font-semibold opacity-70">
                                                            Campus Broadcast
                                                        </span>

                                                        <div
                                                            className="mt-1.5 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold"
                                                            style={{
                                                                background:
                                                                    previewText === "#FFFFFF"
                                                                        ? "rgba(255,255,255,.2)"
                                                                        : "rgba(255,255,255,.5)",
                                                            }}
                                                        >
                                                            {form.tag || "CAMPUS"}
                                                        </div>
                                                    </div>

                                                    <Megaphone size={18} className="opacity-70" />
                                                </div>

                                                <h3 className="break-words text-xl font-bold leading-tight">
                                                    {form.title || "Announcement title"}
                                                </h3>

                                                <p className="mt-2 whitespace-pre-line break-words text-xs leading-5 opacity-80">
                                                    {form.message ||
                                                        "Your announcement message will appear here."}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                            {form.isActive ? (
                                                <Radio size={15} className="text-[#106A2E]" />
                                            ) : (
                                                <EyeOff size={15} className="text-gray-400" />
                                            )}
                                            <span className="text-xs font-medium text-gray-700">
                                                {form.isActive
                                                    ? "Published to users"
                                                    : "Hidden from users"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </section>
                )}

                {/* List */}
                <section className="overflow-hidden rounded-3xl border border-black/[0.05] bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="font-display text-xl text-[#1F1F1F]">
                                    Manage Announcements
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">
                                    {loading
                                        ? "Loading..."
                                        : `Showing ${filteredAnnouncements.length} of ${announcements.length}`}
                                </p>
                            </div>

                            <div className="relative w-full lg:w-[320px]">
                                <Search
                                    size={15}
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search announcements..."
                                    aria-label="Search announcements"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#106A2E] focus:bg-white focus:ring-2 focus:ring-[#106A2E]/15"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6">
                        {loading ? (
                            <ListSkeleton />
                        ) : filteredAnnouncements.length === 0 ? (
                            <div className="rounded-2xl bg-[#F7F5EF] px-5 py-14 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm">
                                    <Megaphone size={20} />
                                </div>

                                <p className="mt-4 text-sm font-medium text-gray-600">
                                    {hasFilters
                                        ? "No matching announcements."
                                        : "No announcements yet."}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    {hasFilters
                                        ? "Try a different search term or filter."
                                        : "Create your first campus announcement."}
                                </p>

                                {hasFilters ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch("");
                                            setFilter("all");
                                        }}
                                        className={`mt-5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 ${focusRing}`}
                                    >
                                        Clear filters
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={openCreateForm}
                                        className={`mt-5 inline-flex items-center gap-2 rounded-xl bg-[#106A2E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d5224] ${focusRing}`}
                                    >
                                        <Plus size={16} />
                                        Create announcement
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredAnnouncements.map((announcement) => (
                                    <AnnouncementCard
                                        key={announcement.id}
                                        announcement={announcement}
                                        pending={Boolean(pendingIds[announcement.id])}
                                        onEdit={openEditForm}
                                        onToggle={toggleActive}
                                        onDelete={setDeleteTarget}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {deleteTarget && (
                <ConfirmDialog
                    title="Delete announcement?"
                    description={`"${deleteTarget.title}" will be permanently removed and users will no longer see it. This can't be undone.`}
                    confirmLabel="Delete"
                    busy={Boolean(pendingIds[deleteTarget.id])}
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </main>
    );
}