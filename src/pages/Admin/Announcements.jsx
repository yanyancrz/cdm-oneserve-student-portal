import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
    Megaphone,
    Plus,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    RefreshCw,
    X,
    Check,
    Clock3,
    Radio,
} from "lucide-react";
import { API_URL } from "../../config/api";

const EMPTY_FORM = {
    title: "",
    message: "",
    tag: "CAMPUS",
    accent: "#F4D35E",
    isActive: true,
};

export default function Announcements() {
    const adminEmail = localStorage.getItem("userEmail") || "";
    const adminName =
        localStorage.getItem("adminName") ||
        localStorage.getItem("userName") ||
        "Admin";

    const role =
        localStorage.getItem("role") ||
        localStorage.getItem("userRole") ||
        "";

    const isAdmin = role.toLowerCase() === "admin";

    const [announcements, setAnnouncements] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);

    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(true);

    // =========================================================
    // LOAD ANNOUNCEMENTS
    // =========================================================

    const loadAnnouncements = async () => {
        if (!adminEmail || !isAdmin) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/api/admin/announcements?adminEmail=${encodeURIComponent(
                    adminEmail
                )}`
            );

            if (response.status === 403) {
                throw new Error(
                    "Only the Admin account can manage announcements."
                );
            }

            if (!response.ok) {
                throw new Error(
                    "Failed to load announcements."
                );
            }

            const data = await response.json();

            setAnnouncements(
                Array.isArray(data) ? data : []
            );
        } catch (error) {
            console.error(
                "Load announcements error:",
                error
            );

            toast.error(
                error.message ||
                    "Unable to load announcements."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!adminEmail) {
            toast.error(
                "Admin email not found. Please login again."
            );
            setLoading(false);
            return;
        }

        if (!isAdmin) {
            setLoading(false);
            return;
        }

        loadAnnouncements();
    }, [adminEmail, isAdmin]);

    // =========================================================
    // FILTER
    // =========================================================

    const filteredAnnouncements = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return announcements;
        }

        return announcements.filter((item) => {
            return (
                item.title
                    ?.toLowerCase()
                    .includes(query) ||
                item.message
                    ?.toLowerCase()
                    .includes(query) ||
                item.tag
                    ?.toLowerCase()
                    .includes(query)
            );
        });
    }, [announcements, search]);

    // =========================================================
    // COUNTS
    // =========================================================

    const activeCount = announcements.filter(
        (item) => item.isActive
    ).length;

    const hiddenCount = announcements.filter(
        (item) => !item.isActive
    ).length;

    // =========================================================
    // FORM HELPERS
    // =========================================================

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(false);
    };

    const openCreateForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(true);
    };

    const openEditForm = (announcement) => {
        setEditingId(announcement.id);

        setForm({
            title: announcement.title || "",
            message: announcement.message || "",
            tag: announcement.tag || "CAMPUS",
            accent: announcement.accent || "#F4D35E",
            isActive: announcement.isActive ?? true,
        });

        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // =========================================================
    // CREATE / UPDATE
    // =========================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        const title = form.title.trim();
        const message = form.message.trim();
        const tag = form.tag.trim();

        if (!title) {
            toast.error("Announcement title is required.");
            return;
        }

        if (!message) {
            toast.error("Announcement message is required.");
            return;
        }

        if (!tag) {
            toast.error("Announcement tag is required.");
            return;
        }

        try {
            setSaving(true);

            const url = editingId
                ? `${API_URL}/api/admin/announcements/${editingId}`
                : `${API_URL}/api/admin/announcements`;

            const response = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    adminEmail,
                    title,
                    message,
                    tag,
                    accent: form.accent,
                    isActive: form.isActive,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to save announcement."
                );
            }

            toast.success(
                editingId
                    ? "Announcement updated successfully."
                    : "Announcement published successfully."
            );

            setForm(EMPTY_FORM);
            setEditingId(null);
            setShowForm(false);

            await loadAnnouncements();
        } catch (error) {
            console.error(
                "Save announcement error:",
                error
            );

            toast.error(
                error.message ||
                    "Unable to save announcement."
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // DELETE
    // =========================================================

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this announcement?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/admin/announcements/${id}?adminEmail=${encodeURIComponent(
                    adminEmail
                )}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to delete announcement."
                );
            }

            toast.success(
                "Announcement deleted successfully."
            );

            if (editingId === id) {
                setForm(EMPTY_FORM);
                setEditingId(null);
                setShowForm(false);
            }

            await loadAnnouncements();
        } catch (error) {
            console.error(
                "Delete announcement error:",
                error
            );

            toast.error(
                error.message ||
                    "Unable to delete announcement."
            );
        }
    };

    // =========================================================
    // PUBLISH / HIDE
    // =========================================================

    const toggleActive = async (announcement) => {
        try {
            const response = await fetch(
                `${API_URL}/api/admin/announcements/${announcement.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        adminEmail,
                        title: announcement.title,
                        message: announcement.message,
                        tag: announcement.tag,
                        accent:
                            announcement.accent ||
                            "#F4D35E",
                        isActive:
                            !announcement.isActive,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to update announcement."
                );
            }

            toast.success(
                announcement.isActive
                    ? "Announcement hidden from users."
                    : "Announcement published to users."
            );

            await loadAnnouncements();
        } catch (error) {
            console.error(
                "Toggle announcement error:",
                error
            );

            toast.error(
                error.message ||
                    "Unable to update announcement."
            );
        }
    };

    // =========================================================
    // ACCESS GUARD
    // =========================================================

    if (!isAdmin) {
        return (
            <main className="min-h-[calc(100vh-72px)] bg-[#F7F5EF] px-4 py-10 sm:px-6 lg:px-10">
                <div className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                        <X size={24} />
                    </div>

                    <h1 className="mt-5 text-xl font-semibold text-gray-900">
                        Access Restricted
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                        Only the main Admin account can
                        manage CDM OneServe announcements.
                    </p>
                </div>
            </main>
        );
    }

    // =========================================================
    // MAIN
    // =========================================================

    return (
        <main className="min-h-[calc(100vh-72px)] bg-[#F7F5EF] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <div className="mx-auto w-full max-w-[1250px]">

                {/* =====================================================
                    HEADER
                ===================================================== */}

                <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E1F0E4] px-3 py-1.5">
                            <Megaphone
                                size={13}
                                className="text-[#106A2E]"
                            />

                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#106A2E]">
                                Admin Broadcast
                            </span>
                        </div>

                        <h1 className="font-display text-3xl text-[#1F1F1F] sm:text-4xl">
                            Announcements
                        </h1>

                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Create and manage announcements
                            that appear on the Student and
                            Faculty dashboard.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={loadAnnouncements}
                            disabled={loading}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
                        >
                            <RefreshCw
                                size={15}
                                className={
                                    loading
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#106A2E] px-4 text-sm font-semibold text-white transition hover:bg-[#0d5224]"
                        >
                            <Plus size={16} />
                            New Announcement
                        </button>
                    </div>
                </div>

                {/* =====================================================
                    STATS
                ===================================================== */}

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

                    {/* Total */}
                    <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                                    Total
                                </p>

                                <p className="mt-2 font-display text-3xl text-[#1F1F1F]">
                                    {announcements.length}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    All announcements
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECE9E2] text-[#1F1F1F]">
                                <Megaphone size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Active */}
                    <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                                    Active
                                </p>

                                <p className="mt-2 font-display text-3xl text-[#106A2E]">
                                    {activeCount}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    Visible to users
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E1F0E4] text-[#106A2E]">
                                <Radio size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Hidden */}
                    <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                                    Hidden
                                </p>

                                <p className="mt-2 font-display text-3xl text-gray-500">
                                    {hiddenCount}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    Not visible to users
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                                <EyeOff size={18} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    CREATE / EDIT FORM
                ===================================================== */}

                {showForm && (
                    <section className="mb-6 overflow-hidden rounded-3xl border border-black/[0.05] bg-white shadow-sm">

                        <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#106A2E]/60">
                                        {editingId
                                            ? "Edit Broadcast"
                                            : "Create Broadcast"}
                                    </p>

                                    <h2 className="mt-1 font-display text-xl text-[#1F1F1F]">
                                        {editingId
                                            ? "Edit Announcement"
                                            : "New Announcement"}
                                    </h2>

                                    <p className="mt-1 text-xs text-gray-500">
                                        This announcement will
                                        appear on the user dashboard
                                        when published.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                        setForm(
                                            EMPTY_FORM
                                        );
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
                                    aria-label="Close form"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="p-5 sm:p-6"
                        >
                            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

                                {/* FORM */}
                                <div className="space-y-5">

                                    {/* Title */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Title
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                form.title
                                            }
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    title: e
                                                        .target
                                                        .value,
                                                })
                                            }
                                            maxLength={200}
                                            placeholder="Enter announcement title"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#106A2E] focus:bg-white"
                                        />
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Message
                                            </label>

                                            <span className="text-[10px] text-gray-400">
                                                {form.message.length}
                                            </span>
                                        </div>

                                        <textarea
                                            value={
                                                form.message
                                            }
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    message:
                                                        e
                                                            .target
                                                            .value,
                                                })
                                            }
                                            rows={6}
                                            placeholder="Write your announcement here..."
                                            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#106A2E] focus:bg-white"
                                        />
                                    </div>

                                    {/* Tag + Color */}
                                    <div className="grid gap-4 sm:grid-cols-2">

                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                                Tag
                                            </label>

                                            <input
                                                type="text"
                                                value={form.tag}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        tag: e
                                                            .target
                                                            .value
                                                            .toUpperCase(),
                                                    })
                                                }
                                                maxLength={80}
                                                placeholder="CAMPUS"
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm uppercase text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#106A2E] focus:bg-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                                Accent Color
                                            </label>

                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={
                                                        form.accent
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        setForm({
                                                            ...form,
                                                            accent:
                                                                e
                                                                    .target
                                                                    .value,
                                                        })
                                                    }
                                                    className="h-[46px] w-14 cursor-pointer rounded-xl border border-gray-200 bg-white p-1"
                                                />

                                                <input
                                                    type="text"
                                                    value={
                                                        form.accent
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        setForm({
                                                            ...form,
                                                            accent:
                                                                e
                                                                    .target
                                                                    .value,
                                                        })
                                                    }
                                                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm uppercase text-gray-800 outline-none focus:border-[#106A2E] focus:bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Publish toggle */}
                                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-100 bg-[#F7F5EF] p-4">
                                        <input
                                            type="checkbox"
                                            checked={
                                                form.isActive
                                            }
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    isActive:
                                                        e.target
                                                            .checked,
                                                })
                                            }
                                            className="mt-0.5 h-4 w-4 accent-[#106A2E]"
                                        />

                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                Publish announcement
                                                immediately
                                            </p>

                                            <p className="mt-0.5 text-xs leading-5 text-gray-500">
                                                When enabled, the
                                                announcement will
                                                appear on the Student
                                                and Faculty dashboard.
                                            </p>
                                        </div>
                                    </label>

                                    {/* Buttons */}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#106A2E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d5224] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {saving ? (
                                                <>
                                                    <RefreshCw
                                                        size={15}
                                                        className="animate-spin"
                                                    />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Check
                                                        size={15}
                                                    />
                                                    {editingId
                                                        ? "Update Announcement"
                                                        : "Publish Announcement"}
                                                </>
                                            )}
                                        </button>

                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingId(
                                                        null
                                                    );
                                                    setForm(
                                                        EMPTY_FORM
                                                    );
                                                }}
                                                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                                            >
                                                Cancel Edit
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* PREVIEW */}
                                <div>
                                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
                                        Live Preview
                                    </p>

                                    <div
                                        className="relative overflow-hidden rounded-[24px] p-5 shadow-lg"
                                        style={{
                                            background: `linear-gradient(135deg, ${
                                                form.accent ||
                                                "#F4D35E"
                                            }, #FFEAB0)`,
                                        }}
                                    >
                                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.5),transparent_35%)]" />

                                        <div className="relative z-10">
                                            <div className="mb-4 flex items-center justify-between gap-3">
                                                <div>
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#173026]/60">
                                                        Campus Broadcast
                                                    </span>

                                                    <div className="mt-1.5 inline-flex rounded-full bg-white/45 px-2 py-1 text-[9px] font-bold text-[#173026]/70">
                                                        {form.tag ||
                                                            "CAMPUS"}
                                                    </div>
                                                </div>

                                                <Megaphone
                                                    size={18}
                                                    className="text-[#173026]/60"
                                                />
                                            </div>

                                            <h3 className="text-xl font-bold leading-tight text-[#10231B]">
                                                {form.title ||
                                                    "Announcement title"}
                                            </h3>

                                            <p className="mt-2 text-xs leading-5 text-[#10231B]/70">
                                                {form.message ||
                                                    "Your announcement message will appear here."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                        <div className="flex items-center gap-2">
                                            {form.isActive ? (
                                                <Radio
                                                    size={15}
                                                    className="text-[#106A2E]"
                                                />
                                            ) : (
                                                <EyeOff
                                                    size={15}
                                                    className="text-gray-400"
                                                />
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

                {/* =====================================================
                    LIST
                ===================================================== */}

                <section className="overflow-hidden rounded-3xl border border-black/[0.05] bg-white shadow-sm">

                    <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#106A2E]/50">
                                    Broadcast Library
                                </p>

                                <h2 className="mt-1 font-display text-xl text-[#1F1F1F]">
                                    Manage Announcements
                                </h2>

                                <p className="mt-1 text-xs text-gray-500">
                                    Existing announcements are listed
                                    below.
                                </p>
                            </div>

                            <div className="w-full lg:w-[320px]">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Search announcements..."
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#106A2E] focus:bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6">

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#106A2E]/20 border-t-[#106A2E] animate-spin" />

                                <p className="text-sm text-gray-400">
                                    Loading announcements...
                                </p>
                            </div>
                        ) : filteredAnnouncements.length === 0 ? (
                            <div className="rounded-2xl bg-[#F7F5EF] px-5 py-16 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm">
                                    <Megaphone size={20} />
                                </div>

                                <p className="mt-4 text-sm font-medium text-gray-500">
                                    {search
                                        ? "No matching announcements."
                                        : "No announcements yet."}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    {search
                                        ? "Try a different search term."
                                        : "Create your first campus announcement."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredAnnouncements.map(
                                    (announcement) => (
                                        <div
                                            key={
                                                announcement.id
                                            }
                                            className="rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-gray-200 hover:shadow-sm"
                                        >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                                                {/* CONTENT */}
                                                <div className="min-w-0 flex-1">

                                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                                        <span
                                                            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                                                            style={{
                                                                background: `${
                                                                    announcement.accent ||
                                                                    "#F4D35E"
                                                                }22`,
                                                                color:
                                                                    announcement.accent ||
                                                                    "#F4D35E",
                                                            }}
                                                        >
                                                            {
                                                                announcement.tag
                                                            }
                                                        </span>

                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                                                announcement.isActive
                                                                    ? "bg-emerald-50 text-emerald-700"
                                                                    : "bg-gray-100 text-gray-500"
                                                            }`}
                                                        >
                                                            {announcement.isActive
                                                                ? "Published"
                                                                : "Hidden"}
                                                        </span>
                                                    </div>

                                                    <h3 className="text-base font-semibold text-gray-800">
                                                        {
                                                            announcement.title
                                                        }
                                                    </h3>

                                                    <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">
                                                        {
                                                            announcement.message
                                                        }
                                                    </p>

                                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400">
                                                        <span className="inline-flex items-center gap-1">
                                                            <Clock3
                                                                size={
                                                                    11
                                                                }
                                                            />
                                                            {announcement.createdAt
                                                                ? new Date(
                                                                      announcement.createdAt
                                                                  ).toLocaleString(
                                                                      "en-US",
                                                                      {
                                                                          month: "short",
                                                                          day: "numeric",
                                                                          year: "numeric",
                                                                          hour: "numeric",
                                                                          minute: "2-digit",
                                                                      }
                                                                  )
                                                                : "—"}
                                                        </span>

                                                        {announcement.updatedAt &&
                                                            announcement.updatedAt !==
                                                                announcement.createdAt && (
                                                                <span>
                                                                    Updated{" "}
                                                                    {new Date(
                                                                        announcement.updatedAt
                                                                    ).toLocaleString(
                                                                        "en-US",
                                                                        {
                                                                            month: "short",
                                                                            day: "numeric",
                                                                            year: "numeric",
                                                                            hour: "numeric",
                                                                            minute: "2-digit",
                                                                        }
                                                                    )}
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>

                                                {/* ACTIONS */}
                                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditForm(
                                                                announcement
                                                            )
                                                        }
                                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-100 px-3.5 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-200"
                                                    >
                                                        <Pencil
                                                            size={
                                                                13
                                                            }
                                                        />
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleActive(
                                                                announcement
                                                            )
                                                        }
                                                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                                                            announcement.isActive
                                                                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                        }`}
                                                    >
                                                        {announcement.isActive ? (
                                                            <>
                                                                <EyeOff
                                                                    size={
                                                                        13
                                                                    }
                                                                />
                                                                Hide
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye
                                                                    size={
                                                                        13
                                                                    }
                                                                />
                                                                Publish
                                                            </>
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                announcement.id
                                                            )
                                                        }
                                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3.5 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100"
                                                    >
                                                        <Trash2
                                                            size={
                                                                13
                                                            }
                                                        />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* =====================================================
                    FOOTER NOTE
                ===================================================== */}

                <div className="py-8 text-center">
                    <p className="text-xs text-gray-400">
                        CDM OneServe • Admin Announcement Management
                    </p>
                </div>

                {/* =====================================================
                    ADMIN INFO
                ===================================================== */}

                <div className="hidden">
                    {adminName}
                </div>
            </div>
        </main>
    );
}