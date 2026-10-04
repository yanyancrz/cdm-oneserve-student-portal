import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const TABS = [
    { key: "overview", label: "Overview", icon: "user" },
    { key: "edit", label: "Edit Profile", icon: "edit" },
    { key: "password", label: "Change Password", icon: "lock" },
    { key: "activity", label: "Activity Log", icon: "activity" },
    { key: "notifications", label: "Notifications", icon: "bell" }
];

const PASSWORD_MIN_LENGTH = 8;
const NAME_MAX_LENGTH = 60;
const PHONE_MAX_LENGTH = 15;
const FONTS_LINK_ID = "admin-profile-fonts";
const FONTS_HREF =
    "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";

const ICON_PATHS = {
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    edit: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
    lock: "M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4",
    activity: "M22 12h-4l-3 9L9 3l-3 9H2",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0",
    mail: "M3 5h18v14H3z M3 7l9 6 9-6",
    phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    calendar: "M3 5h18v16H3z M16 3v4 M8 3v4 M3 11h18",
    briefcase: "M3 7h18v13H3z M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    eyeOff: "M17.9 17.9A10.9 10.9 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.1-5.9 M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2 M1 1l22 22",
    copy: "M9 9h11v11H9z M5 15H4V4h11v1",
    check: "M20 6L9 17l-5-5",
    clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2"
};

// ─────────────────────────────────────────────────────────────
// Small helpers (outside the component so they are created once)
// ─────────────────────────────────────────────────────────────
const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`
});

const jsonAuthHeaders = () => ({
    "Content-Type": "application/json",
    ...authHeaders()
});

function Icon({ name, className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d={ICON_PATHS[name]} />
        </svg>
    );
}

function timeAgo(timestamp) {
    if (!timestamp) return "";
    const then = new Date(timestamp).getTime();
    if (Number.isNaN(then)) return "";

    const minutes = Math.floor((Date.now() - then) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function getActivityIcon(action = "") {
    const text = action.toLowerCase();
    if (text.includes("password")) return "lock";
    if (text.includes("login") || text.includes("logged") || text.includes("sign")) return "shield";
    if (text.includes("profile") || text.includes("update") || text.includes("edit")) return "edit";
    if (text.includes("notif")) return "bell";
    return "activity";
}

function getPasswordChecks(password) {
    return [
        { label: `At least ${PASSWORD_MIN_LENGTH} characters`, passed: password.length >= PASSWORD_MIN_LENGTH },
        { label: "Upper and lowercase letters", passed: /[a-z]/.test(password) && /[A-Z]/.test(password) },
        { label: "At least one number", passed: /\d/.test(password) },
        { label: "At least one symbol", passed: /[^A-Za-z0-9]/.test(password) }
    ];
}

function getPasswordStrength(password) {
    if (!password) return { score: 0, label: "", bar: "bg-gray-200", text: "text-gray-400" };

    const passed = getPasswordChecks(password).filter((c) => c.passed).length;

    if (password.length < PASSWORD_MIN_LENGTH || passed <= 1) {
        return { score: 1, label: "Weak", bar: "bg-red-500", text: "text-red-600" };
    }
    if (passed <= 3) {
        return { score: 2, label: "Fair", bar: "bg-amber-500", text: "text-amber-600" };
    }
    return { score: 3, label: "Strong", bar: "bg-[#106A2E]", text: "text-[#106A2E]" };
}

const inputBase =
    "w-full px-4 py-2.5 rounded-xl border bg-gray-50 text-sm outline-none input-transition focus:bg-white focus:border-[#106A2E] focus:ring-2 focus:ring-[#106A2E]/15";

const primaryButton =
    "inline-flex items-center justify-center gap-2 bg-[#106A2E] hover:bg-[#0d5224] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

const secondaryButton =
    "inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/30 disabled:opacity-50 disabled:cursor-not-allowed";

function Toggle({ checked, onChange, label }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={onChange}
            className={`relative w-11 h-6 rounded-full flex-shrink-0 mt-1 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/40 focus-visible:ring-offset-2 ${
                checked ? "bg-[#106A2E]" : "bg-gray-300"
            }`}
        >
            <span
                className={`absolute top-0.5 left-0.5 block w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    checked ? "translate-x-5" : "translate-x-0"
                }`}
            />
        </button>
    );
}

function ProfileSkeleton() {
    return (
        <main className="flex-1 w-full min-w-0 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8 animate-pulse">
            <div className="mb-8 space-y-3">
                <div className="h-3 w-28 bg-gray-200 rounded" />
                <div className="h-9 w-48 bg-gray-200 rounded" />
                <div className="h-3 w-64 bg-gray-100 rounded" />
            </div>
            <div className="bg-white rounded-2xl border border-[#1F1F1F]/[0.05] overflow-hidden mb-6">
                <div className="h-24 bg-gray-200" />
                <div className="p-6 flex items-center gap-5">
                    <div className="w-20 h-20 -mt-12 rounded-full bg-gray-300 ring-4 ring-white" />
                    <div className="space-y-2 flex-1">
                        <div className="h-5 w-40 bg-gray-200 rounded" />
                        <div className="h-3 w-56 bg-gray-100 rounded" />
                    </div>
                </div>
            </div>
            <div className="flex gap-2 mb-6">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-28 bg-gray-100 rounded-xl" />
                ))}
            </div>
            <div className="bg-white rounded-2xl border border-[#1F1F1F]/[0.05] p-6">
                <div className="h-5 w-44 bg-gray-200 rounded mb-5" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-20 bg-gray-50 rounded-xl" />
                    ))}
                </div>
            </div>
        </main>
    );
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function AdminProfile() {
    // State Management
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [copied, setCopied] = useState(false);

    const [profile, setProfile] = useState({
        fullName: "",
        email: "",
        contactNumber: "",
        role: "",
        position: "",
        dateJoined: "",
        photoUrl: ""
    });

    const [editForm, setEditForm] = useState({
        fullName: "",
        contactNumber: ""
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showPasswords, setShowPasswords] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
    });

    const defaultNotifPrefs = {
        emailOnNewRequest: true,
        emailOnThreshold: false,
        thresholdCount: 10
    };
    const [notifPrefs, setNotifPrefs] = useState(defaultNotifPrefs);
    const [savedNotifPrefs, setSavedNotifPrefs] = useState(defaultNotifPrefs);

    const [activityLog, setActivityLog] = useState([]);
    const [isActivityLoading, setIsActivityLoading] = useState(false);

    // Derived values
    const adminEmail = useMemo(() => localStorage.getItem("userEmail"), []);
    const encodedAdminEmail = useMemo(
        () => (adminEmail ? encodeURIComponent(adminEmail) : ""),
        [adminEmail]
    );

    const initials = useCallback((name) => {
        if (!name || !name.trim()) return "AD";
        return name
            .trim()
            .split(/\s+/)
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }, []);

    const isEditDirty = useMemo(
        () =>
            editForm.fullName.trim() !== (profile.fullName || "") ||
            editForm.contactNumber.trim() !== (profile.contactNumber || ""),
        [editForm, profile.fullName, profile.contactNumber]
    );

    const isNotifDirty = useMemo(
        () =>
            notifPrefs.emailOnNewRequest !== savedNotifPrefs.emailOnNewRequest ||
            notifPrefs.emailOnThreshold !== savedNotifPrefs.emailOnThreshold ||
            notifPrefs.thresholdCount !== savedNotifPrefs.thresholdCount,
        [notifPrefs, savedNotifPrefs]
    );

    const passwordStrength = useMemo(
        () => getPasswordStrength(passwordForm.newPassword),
        [passwordForm.newPassword]
    );
    const passwordChecks = useMemo(
        () => getPasswordChecks(passwordForm.newPassword),
        [passwordForm.newPassword]
    );

    // Formatters
    const formatDate = useCallback((date) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    }, []);

    const formatActivityTime = useCallback((timestamp) => {
        if (!timestamp) return "";
        return new Date(timestamp).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    }, []);

    // Validation
    const validateEditForm = useCallback(() => {
        const newErrors = {};
        const name = editForm.fullName.trim();

        if (!name) {
            newErrors.fullName = "Full name is required";
        } else if (name.length < 2) {
            newErrors.fullName = "Full name must be at least 2 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [editForm.fullName]);

    const validatePasswordForm = useCallback(() => {
        const newErrors = {};

        if (!passwordForm.currentPassword) {
            newErrors.currentPassword = "Current password is required";
        }

        if (!passwordForm.newPassword) {
            newErrors.newPassword = "New password is required";
        } else if (passwordForm.newPassword.length < PASSWORD_MIN_LENGTH) {
            newErrors.newPassword = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
        } else if (passwordForm.currentPassword === passwordForm.newPassword) {
            newErrors.newPassword = "New password must be different from current password";
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [passwordForm]);

    // API Calls
    const fetchProfile = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/profile/${encodedAdminEmail}`, {
                headers: authHeaders()
            });
            if (!response.ok) throw new Error("Failed to fetch profile");
            const data = await response.json();

            setProfile(data);
            setEditForm({
                fullName: data.fullName || "",
                contactNumber: data.contactNumber || ""
            });
        } catch (error) {
            console.error("Profile fetch error:", error);
            toast.error("Failed to load profile. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [encodedAdminEmail]);

    const fetchActivityLog = useCallback(async () => {
        setIsActivityLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/activity-log/${encodedAdminEmail}`, {
                headers: authHeaders()
            });
            if (!response.ok) throw new Error("Failed to fetch activity log");
            const data = await response.json();
            setActivityLog(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Activity log fetch error:", error);
        } finally {
            setIsActivityLoading(false);
        }
    }, [encodedAdminEmail]);

    const fetchNotificationPreferences = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/notification-prefs/${encodedAdminEmail}`, {
                headers: authHeaders()
            });
            if (!response.ok) throw new Error("Failed to fetch notification preferences");
            const data = await response.json();

            const prefs = {
                emailOnNewRequest: data.emailOnNewRequest ?? true,
                emailOnThreshold: data.emailOnThreshold ?? false,
                thresholdCount: data.thresholdCount ?? 10
            };

            setNotifPrefs(prefs);
            setSavedNotifPrefs(prefs);
        } catch (error) {
            console.error("Notification preferences fetch error:", error);
        }
    }, [encodedAdminEmail]);

    // Effects
    useEffect(() => {
        // Load fonts once instead of re-injecting @import on every render
        if (document.getElementById(FONTS_LINK_ID)) return;
        const link = document.createElement("link");
        link.id = FONTS_LINK_ID;
        link.rel = "stylesheet";
        link.href = FONTS_HREF;
        document.head.appendChild(link);
    }, []);

    useEffect(() => {
        if (!adminEmail) {
            toast.error("User email not found. Please login again.");
            setLoading(false);
            return;
        }

        const loadData = async () => {
            await fetchProfile();
            await Promise.all([fetchActivityLog(), fetchNotificationPreferences()]);
        };

        loadData();
    }, [adminEmail, fetchProfile, fetchActivityLog, fetchNotificationPreferences]);

    // Handlers
    const handleTabChange = (key) => {
        setActiveTab(key);
        setErrors({});
    };

    const handleCopyEmail = async () => {
        if (!profile.email) return;
        try {
            await navigator.clipboard.writeText(profile.email);
            setCopied(true);
            toast.success("Email copied.");
            setTimeout(() => setCopied(false), 1800);
        } catch {
            toast.error("Unable to copy email.");
        }
    };

    const handleEditReset = () => {
        setEditForm({
            fullName: profile.fullName || "",
            contactNumber: profile.contactNumber || ""
        });
        setErrors({});
    };

    const handleEditSave = async () => {
        if (!validateEditForm()) return;

        const payload = {
            fullName: editForm.fullName.trim(),
            contactNumber: editForm.contactNumber.trim()
        };

        setSaving(true);
        setErrors({});

        try {
            const response = await fetch(`${API_URL}/api/admin/profile/${encodeURIComponent(profile.email)}`, {
                method: "PUT",
                headers: jsonAuthHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                setProfile((prev) => ({ ...prev, ...payload }));
                setEditForm(payload);
                localStorage.setItem("userName", payload.fullName);
                toast.success("Profile updated successfully.");

                await fetchActivityLog();
            } else {
                toast.error(data.message || "Failed to update profile.");
            }
        } catch (error) {
            console.error("Edit save error:", error);
            toast.error("Unable to connect to server. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!validatePasswordForm()) return;

        setSaving(true);
        setErrors({});

        try {
            const response = await fetch(`${API_URL}/api/admin/change-password`, {
                method: "POST",
                headers: jsonAuthHeaders(),
                body: JSON.stringify({
                    email: profile.email,
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Password changed successfully.");
                setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                });
                setShowPasswords({
                    currentPassword: false,
                    newPassword: false,
                    confirmPassword: false
                });

                await fetchActivityLog();
            } else {
                toast.error(data.message || "Failed to change password.");
            }
        } catch (error) {
            console.error("Password change error:", error);
            toast.error("Unable to connect to server. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleNotifSave = async () => {
        setSaving(true);

        try {
            const response = await fetch(`${API_URL}/api/admin/notification-prefs`, {
                method: "PUT",
                headers: jsonAuthHeaders(),
                body: JSON.stringify({
                    email: profile.email,
                    ...notifPrefs
                })
            });

            if (response.ok) {
                setSavedNotifPrefs(notifPrefs);
                toast.success("Notification preferences saved.");
            } else {
                const data = await response.json();
                toast.error(data.message || "Failed to save preferences.");
            }
        } catch (error) {
            console.error("Notification save error:", error);
            toast.error("Unable to connect to server. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const updatePasswordField = (field, value) => {
        setPasswordForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const toggleShowPassword = (field) =>
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

    // Reusable password field
    const renderPasswordField = ({ field, label, placeholder, autoComplete }) => (
        <div>
            <label htmlFor={`pw-${field}`} className="block text-sm font-medium text-gray-700 mb-1.5">
                {label} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
                <input
                    id={`pw-${field}`}
                    type={showPasswords[field] ? "text" : "password"}
                    value={passwordForm[field]}
                    onChange={(e) => updatePasswordField(field, e.target.value)}
                    autoComplete={autoComplete}
                    aria-invalid={Boolean(errors[field])}
                    className={`${inputBase} pr-11 ${errors[field] ? "border-red-500" : "border-gray-200"}`}
                    placeholder={placeholder}
                />
                <button
                    type="button"
                    onClick={() => toggleShowPassword(field)}
                    aria-label={showPasswords[field] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/30"
                >
                    <Icon name={showPasswords[field] ? "eyeOff" : "eye"} className="w-4 h-4" />
                </button>
            </div>
            {errors[field] && (
                <p className="text-red-500 text-xs mt-1" role="alert">
                    {errors[field]}
                </p>
            )}
        </div>
    );

    // Loading State
    if (loading) return <ProfileSkeleton />;

    const overviewItems = [
        { label: "Full Name", value: profile.fullName || "—", icon: "user" },
        { label: "Email", value: profile.email || "—", icon: "mail", copyable: true },
        { label: "Contact Number", value: profile.contactNumber || "—", icon: "phone" },
        { label: "Role", value: profile.role || "Admin", icon: "shield" },
        { label: "Position", value: profile.position || "—", icon: "briefcase" },
        { label: "Date Joined", value: formatDate(profile.dateJoined), icon: "calendar" }
    ];

    // Main Render
    return (
        <>
            <style>{`
                .font-display { font-family: 'Fraunces', serif; }
                .ap-root { font-family: 'Inter', system-ui, sans-serif; }
                .tab-transition,
                .input-transition,
                .card-transition { transition: all 0.2s ease-in-out; }
                .ap-scroll-hide { scrollbar-width: none; }
                .ap-scroll-hide::-webkit-scrollbar { display: none; }
                @media (prefers-reduced-motion: reduce) {
                    .ap-root * { transition: none !important; animation: none !important; }
                }
            `}</style>

            <main className="ap-root flex-1 w-full min-w-0 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
                {/* Header */}
                <div className="mb-8">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#106A2E]/70 font-medium mb-1">
                        Account Settings
                    </p>
                    <h2 className="font-display text-3xl md:text-4xl text-[#1F1F1F]">My Profile</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage your account information and preferences
                    </p>
                </div>

                {/* Profile Header Card */}
                <div
                    className="relative overflow-hidden rounded-2xl mb-6 shadow-sm text-white"
                    style={{ background: "linear-gradient(120deg, #0b4d21 0%, #106A2E 60%, #1a8a3a 100%)" }}
                >
                    <div
                        className="pointer-events-none absolute -right-16 -top-24 w-72 h-72 rounded-full bg-white/[0.06]"
                        aria-hidden="true"
                    />
                    <div
                        className="pointer-events-none absolute right-28 -bottom-28 w-60 h-60 rounded-full bg-white/[0.05]"
                        aria-hidden="true"
                    />

                    <div className="relative p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="w-20 h-20 rounded-full bg-white/15 ring-2 ring-white/40 flex items-center justify-center text-2xl font-display font-medium flex-shrink-0 overflow-hidden">
                            {profile.photoUrl ? (
                                <img
                                    src={profile.photoUrl}
                                    alt={profile.fullName}
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                            ) : (
                                initials(profile.fullName)
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-display text-2xl sm:text-[28px] leading-tight text-white truncate">
                                {profile.fullName}
                            </h3>
                            <p className="text-sm text-white/80 truncate mt-0.5">{profile.email}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white">
                                    {profile.role || "Admin"}
                                </span>
                                {profile.position && (
                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/90">
                                        {profile.position}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/10 text-xs text-white/80 flex-shrink-0">
                            <Icon name="calendar" className="w-4 h-4 text-white" />
                            <div>
                                <p>Member since</p>
                                <p className="font-medium text-white text-sm">{formatDate(profile.dateJoined)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div
                    role="tablist"
                    aria-label="Profile sections"
                    className="ap-scroll-hide flex gap-1.5 mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1"
                >
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => handleTabChange(tab.key)}
                                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-medium tab-transition outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/40 ${
                                    isActive
                                        ? "bg-[#106A2E] text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                }`}
                            >
                                <Icon name={tab.icon} className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div
                    role="tabpanel"
                    className="bg-white rounded-2xl border border-[#1F1F1F]/[0.05] p-6 shadow-sm"
                >
                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                        <div>
                            <h3 className="font-display text-lg text-[#1F1F1F] mb-5">Account Information</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {overviewItems.map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 card-transition"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-[#E1F0E4] text-[#106A2E] flex items-center justify-center flex-shrink-0">
                                            <Icon name={item.icon} className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-gray-400 font-medium mb-0.5">
                                                {item.label}
                                            </p>
                                            <p className="text-sm text-[#1F1F1F] font-medium break-words">
                                                {item.value}
                                            </p>
                                        </div>
                                        {item.copyable && profile.email && (
                                            <button
                                                type="button"
                                                onClick={handleCopyEmail}
                                                aria-label="Copy email"
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-[#106A2E] hover:bg-white outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/30 flex-shrink-0"
                                            >
                                                <Icon name={copied ? "check" : "copy"} className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Edit Profile Tab */}
                    {activeTab === "edit" && (
                        <div>
                            <h3 className="font-display text-lg text-[#1F1F1F] mb-5">Edit Profile</h3>

                            <div className="space-y-5 max-w-md">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label htmlFor="edit-fullName" className="block text-sm font-medium text-gray-700">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <span className="text-xs text-gray-400">
                                            {editForm.fullName.length}/{NAME_MAX_LENGTH}
                                        </span>
                                    </div>
                                    <input
                                        id="edit-fullName"
                                        type="text"
                                        value={editForm.fullName}
                                        maxLength={NAME_MAX_LENGTH}
                                        onChange={(e) => {
                                            setEditForm({ ...editForm, fullName: e.target.value });
                                            if (errors.fullName) setErrors({ ...errors, fullName: "" });
                                        }}
                                        aria-invalid={Boolean(errors.fullName)}
                                        className={`${inputBase} ${errors.fullName ? "border-red-500" : "border-gray-200"}`}
                                        placeholder="Enter your full name"
                                    />
                                    {errors.fullName && (
                                        <p className="text-red-500 text-xs mt-1" role="alert">
                                            {errors.fullName}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="edit-contact" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Contact Number
                                    </label>
                                    <input
                                        id="edit-contact"
                                        type="tel"
                                        inputMode="tel"
                                        value={editForm.contactNumber}
                                        maxLength={PHONE_MAX_LENGTH}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                contactNumber: e.target.value.replace(/[^\d+\-\s]/g, "")
                                            })
                                        }
                                        className={`${inputBase} border-gray-200`}
                                        placeholder="e.g. 0917 123 4567"
                                    />
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        Numbers, spaces, + and - only.
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Email
                                    </label>
                                    <input
                                        id="edit-email"
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-sm text-gray-400 outline-none cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        Contact IT support to change your email address.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        onClick={handleEditSave}
                                        disabled={saving || !isEditDirty}
                                        className={primaryButton}
                                    >
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleEditReset}
                                        disabled={saving || !isEditDirty}
                                        className={secondaryButton}
                                    >
                                        Reset
                                    </button>
                                    {isEditDirty && !saving && (
                                        <span className="text-xs text-amber-600">Unsaved changes</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Change Password Tab */}
                    {activeTab === "password" && (
                        <div>
                            <h3 className="font-display text-lg text-[#1F1F1F] mb-5">Change Password</h3>

                            <div className="space-y-5 max-w-md">
                                {renderPasswordField({
                                    field: "currentPassword",
                                    label: "Current Password",
                                    placeholder: "Enter current password",
                                    autoComplete: "current-password"
                                })}

                                <div>
                                    {renderPasswordField({
                                        field: "newPassword",
                                        label: "New Password",
                                        placeholder: "Enter new password",
                                        autoComplete: "new-password"
                                    })}

                                    {passwordForm.newPassword && (
                                        <div className="mt-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex gap-1.5 flex-1">
                                                    {[1, 2, 3].map((level) => (
                                                        <div
                                                            key={level}
                                                            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                                                                passwordStrength.score >= level
                                                                    ? passwordStrength.bar
                                                                    : "bg-gray-200"
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className={`text-xs font-medium ${passwordStrength.text}`}>
                                                    {passwordStrength.label}
                                                </span>
                                            </div>

                                            <ul className="mt-3 space-y-1.5">
                                                {passwordChecks.map((check) => (
                                                    <li
                                                        key={check.label}
                                                        className={`flex items-center gap-2 text-xs ${
                                                            check.passed ? "text-[#106A2E]" : "text-gray-400"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                                                check.passed ? "bg-[#E1F0E4]" : "bg-gray-100"
                                                            }`}
                                                        >
                                                            {check.passed && <Icon name="check" className="w-3 h-3" />}
                                                        </span>
                                                        {check.label}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {renderPasswordField({
                                    field: "confirmPassword",
                                    label: "Confirm New Password",
                                    placeholder: "Confirm new password",
                                    autoComplete: "new-password"
                                })}

                                <button
                                    onClick={handlePasswordChange}
                                    disabled={saving}
                                    className={primaryButton}
                                >
                                    {saving ? "Updating..." : "Update Password"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Activity Log Tab */}
                    {activeTab === "activity" && (
                        <div>
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-display text-lg text-[#1F1F1F]">Recent Activity</h3>
                                <span className="text-xs text-gray-400">
                                    {activityLog.length} {activityLog.length === 1 ? "entry" : "entries"}
                                </span>
                            </div>

                            {isActivityLoading ? (
                                <div className="flex justify-center py-10">
                                    <div className="w-6 h-6 border-2 border-[#106A2E]/20 border-t-[#106A2E] rounded-full animate-spin" />
                                </div>
                            ) : activityLog.length > 0 ? (
                                <div className="max-h-[420px] overflow-y-auto pl-1 pr-2">
                                    <ol className="relative">
                                        {activityLog.map((log, i) => (
                                            <li
                                                key={log.id ?? `${log.timestamp}-${i}`}
                                                className="relative pl-12 pb-5 last:pb-0"
                                            >
                                                {/* Connector line to the next entry */}
                                                <span
                                                    className="absolute left-4 top-8 bottom-0 w-px bg-gray-200 last:hidden"
                                                    aria-hidden="true"
                                                    style={i === activityLog.length - 1 ? { display: "none" } : undefined}
                                                />
                                                <span className="absolute left-0 top-0 w-8 h-8 rounded-full bg-[#E1F0E4] text-[#106A2E] flex items-center justify-center">
                                                    <Icon name={getActivityIcon(log.action)} className="w-4 h-4" />
                                                </span>
                                                <div className="flex items-start justify-between gap-3 px-3 py-1.5 min-h-[32px] rounded-lg hover:bg-gray-50 card-transition">
                                                    <p className="text-sm text-[#1F1F1F] leading-5 pt-1">{log.action}</p>
                                                    <span
                                                        className="text-xs text-gray-400 flex-shrink-0 pt-1.5"
                                                        title={formatActivityTime(log.timestamp)}
                                                    >
                                                        {timeAgo(log.timestamp)}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                        <Icon name="clock" className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm text-gray-500">No recent activity recorded.</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Your actions will appear here as you use the system.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === "notifications" && (
                        <div>
                            <h3 className="font-display text-lg text-[#1F1F1F] mb-5">
                                Notification Preferences
                            </h3>

                            <div className="space-y-4 max-w-md">
                                <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 card-transition">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-[#1F1F1F]">
                                            New Registration Alerts
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Receive email notifications when a new student or faculty registration is
                                            submitted for verification
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={notifPrefs.emailOnNewRequest}
                                        label="Toggle new request alerts"
                                        onChange={() =>
                                            setNotifPrefs((prev) => ({
                                                ...prev,
                                                emailOnNewRequest: !prev.emailOnNewRequest
                                            }))
                                        }
                                    />
                                </div>

                                <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 card-transition">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-[#1F1F1F]">
                                            Pending Verification Threshold
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Receive notifications when pending registration verifications reach the
                                            selected threshold
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={notifPrefs.emailOnThreshold}
                                        label="Toggle threshold alerts"
                                        onChange={() =>
                                            setNotifPrefs((prev) => ({
                                                ...prev,
                                                emailOnThreshold: !prev.emailOnThreshold
                                            }))
                                        }
                                    />
                                </div>

                                {notifPrefs.emailOnThreshold && (
                                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                        <label htmlFor="threshold-count" className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Threshold Count
                                        </label>
                                        <input
                                            id="threshold-count"
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={notifPrefs.thresholdCount}
                                            onChange={(e) =>
                                                setNotifPrefs({
                                                    ...notifPrefs,
                                                    thresholdCount: Math.min(100, Math.max(1, Number(e.target.value) || 1))
                                                })
                                            }
                                            className="w-32 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none input-transition focus:border-[#106A2E] focus:ring-2 focus:ring-[#106A2E]/15"
                                        />
                                        <p className="text-xs text-gray-400 mt-1.5">
                                            You will be notified when pending verification requests reach this number
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        onClick={handleNotifSave}
                                        disabled={saving || !isNotifDirty}
                                        className={primaryButton}
                                    >
                                        {saving ? "Saving..." : "Save Preferences"}
                                    </button>
                                    {isNotifDirty && !saving && (
                                        <span className="text-xs text-amber-600">Unsaved changes</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}