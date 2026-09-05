import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";

// Constants
const TABS = [
    { key: "overview", label: "Overview" },
    { key: "edit", label: "Edit Profile" },
    { key: "password", label: "Change Password" },
    { key: "activity", label: "Activity Log" },
    { key: "notifications", label: "Notifications" }
];

const PASSWORD_MIN_LENGTH = 8;

export default function AdminProfile() {
    // State Management
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

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

    const [notifPrefs, setNotifPrefs] = useState({
        emailOnNewRequest: true,
        emailOnThreshold: false,
        thresholdCount: 10
    });

    const [activityLog, setActivityLog] = useState([]);
    const [isActivityLoading, setIsActivityLoading] = useState(false);

    // Memoized values
    const initials = useCallback((name) => {
        if (!name) return "AD";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    }, []);

    const adminEmail = useMemo(() => localStorage.getItem("userEmail"), []);

    // Helper Functions
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

    const validateEditForm = useCallback(() => {
        const newErrors = {};
        if (!editForm.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        }
        if (editForm.fullName.length < 2) {
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
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }
        if (passwordForm.newPassword && passwordForm.currentPassword === passwordForm.newPassword) {
            newErrors.newPassword = "New password must be different from current password";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [passwordForm]);

    // API Calls
    const fetchProfile = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/profile/${adminEmail}`);
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
    }, [adminEmail]);

    const fetchActivityLog = useCallback(async () => {
        setIsActivityLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/activity-log/${adminEmail}`);
            if (!response.ok) throw new Error("Failed to fetch activity log");
            const data = await response.json();
            setActivityLog(data);
        } catch (error) {
            console.error("Activity log fetch error:", error);
        } finally {
            setIsActivityLoading(false);
        }
    }, [adminEmail]);

    const fetchNotificationPreferences = useCallback(async () => {

        try {

            const response = await fetch(
                `${API_URL}/api/admin/notification-prefs/${adminEmail}`
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to fetch notification preferences"
                );
            }

            const data = await response.json();

            setNotifPrefs({
                emailOnNewRequest:
                    data.emailOnNewRequest ?? true,

                emailOnThreshold:
                    data.emailOnThreshold ?? false,

                thresholdCount:
                    data.thresholdCount ?? 10
            });

        } catch (error) {

            console.error(
                "Notification preferences fetch error:",
                error
            );
        }

    }, [adminEmail]);

    // Effects
    useEffect(() => {
        if (!adminEmail) {
            toast.error("User email not found. Please login again.");
            setLoading(false);
            return;
        }
        
       const loadData = async () => {

            await fetchProfile();

            await Promise.all([
                fetchActivityLog(),
                fetchNotificationPreferences()
            ]);
        };
        
        loadData();
    }, [adminEmail, fetchProfile, fetchActivityLog, fetchNotificationPreferences]);

    // Handlers
    const handleEditSave = async () => {
        if (!validateEditForm()) return;

        setSaving(true);
        setErrors({});

        try {
            const response = await fetch(`${API_URL}/api/admin/profile/${profile.email}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(editForm)
            });

            const data = await response.json();

            if (response.ok) {
                setProfile((prev) => ({ ...prev, ...editForm }));
                localStorage.setItem("userName", editForm.fullName);
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
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
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
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    email: profile.email,
                    ...notifPrefs
                })
            });

            if (response.ok) {
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

    // Loading State
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#106A2E]/20 border-t-[#106A2E] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Loading profile...</p>
                </div>
            </div>
        );
    }

    // Main Render
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
                .font-display { font-family: 'Fraunces', serif; }
                .tab-transition { transition: all 0.2s ease-in-out; }
                .input-transition { transition: all 0.2s ease-in-out; }
                .card-transition { transition: all 0.2s ease-in-out; }
            `}</style>

            <main className="flex-1 px-6 py-8 max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#106A2E]/70 font-medium mb-1">
                        Account Settings
                    </p>
                    <h2 className="font-display text-3xl md:text-4xl text-[#1F1F1F]">
                        My Profile
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage your account information and preferences
                    </p>
                </div>

                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl border border-[#1F1F1F]/[0.05] p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-sm hover:shadow-md card-transition">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-medium text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #106A2E, #1a8a3a)" }}
                    >
                        {profile.photoUrl ? (
                            <img
                                src={profile.photoUrl}
                                alt={profile.fullName}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        ) : (
                            initials(profile.fullName)
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-display text-xl text-[#1F1F1F] truncate">
                            {profile.fullName}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                            {profile.email}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[#E1F0E4] text-[#106A2E]">
                                {profile.role || "Admin"}
                            </span>
                        </div>
                    </div>

                    <div className="text-right text-xs text-gray-400 flex-shrink-0">
                        <p>Member since</p>
                        <p className="font-medium text-gray-600">{formatDate(profile.dateJoined)}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 flex-wrap border-b border-gray-100 pb-0">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`
                                px-5 py-2.5 rounded-t-lg text-sm font-medium transition-all tab-transition
                                ${activeTab === tab.key
                                    ? "bg-[#106A2E] text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-2xl border border-[#1F1F1F]/[0.05] p-6 shadow-sm">
                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                        <div>
                            <h3 className="font-display text-lg text-[#1F1F1F] mb-5">
                                Account Information
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { label: "Full Name", value: profile.fullName },
                                    { label: "Email", value: profile.email },
                                    { label: "Contact Number", value: profile.contactNumber || "—" },
                                    { label: "Role", value: profile.role },
                                    { 
                                        label: "Date Joined", 
                                        value: formatDate(profile.dateJoined)
                                    }
                                ].map((item) => (
                                    <div 
                                        key={item.label} 
                                        className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 card-transition"
                                    >
                                        <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">
                                            {item.label}
                                        </p>
                                        <p className="text-sm text-[#1F1F1F] font-medium break-words">
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Edit Profile Tab */}
                    {activeTab === "edit" && (
                        <div>
                            <h3 className="font-display text-lg text-[#1F1F1F] mb-5">
                                Edit Profile
                            </h3>

                            <div className="space-y-5 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.fullName}
                                        onChange={(e) => {
                                            setEditForm({ ...editForm, fullName: e.target.value });
                                            if (errors.fullName) setErrors({ ...errors, fullName: "" });
                                        }}
                                        className={`w-full px-4 py-2.5 rounded-xl border ${
                                            errors.fullName ? "border-red-500" : "border-gray-200"
                                        } bg-gray-50 text-sm outline-none focus:border-[#106A2E] focus:bg-white input-transition`}
                                        placeholder="Enter your full name"
                                    />
                                    {errors.fullName && (
                                        <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Contact Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={editForm.contactNumber}
                                        onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#106A2E] focus:bg-white input-transition"
                                        placeholder="Enter your contact number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-sm text-gray-400 outline-none cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        Contact IT support to change your email address.
                                    </p>
                                </div>

                                <button
                                    onClick={handleEditSave}
                                    disabled={saving}
                                    className="bg-[#106A2E] hover:bg-[#0d5224] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Change Password Tab */}
                    {activeTab === "password" && (
                        <div>
                            <h3 className="font-display text-lg text-[#1F1F1F] mb-5">
                                Change Password
                            </h3>

                            <div className="space-y-5 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Current Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => {
                                            setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                                            if (errors.currentPassword) setErrors({ ...errors, currentPassword: "" });
                                        }}
                                        className={`w-full px-4 py-2.5 rounded-xl border ${
                                            errors.currentPassword ? "border-red-500" : "border-gray-200"
                                        } bg-gray-50 text-sm outline-none focus:border-[#106A2E] focus:bg-white input-transition`}
                                        placeholder="Enter current password"
                                    />
                                    {errors.currentPassword && (
                                        <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        New Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => {
                                            setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                                            if (errors.newPassword) setErrors({ ...errors, newPassword: "" });
                                        }}
                                        className={`w-full px-4 py-2.5 rounded-xl border ${
                                            errors.newPassword ? "border-red-500" : "border-gray-200"
                                        } bg-gray-50 text-sm outline-none focus:border-[#106A2E] focus:bg-white input-transition`}
                                        placeholder="Enter new password"
                                    />
                                    {errors.newPassword && (
                                        <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        Password must be at least {PASSWORD_MIN_LENGTH} characters
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Confirm New Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => {
                                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                                        }}
                                        className={`w-full px-4 py-2.5 rounded-xl border ${
                                            errors.confirmPassword ? "border-red-500" : "border-gray-200"
                                        } bg-gray-50 text-sm outline-none focus:border-[#106A2E] focus:bg-white input-transition`}
                                        placeholder="Confirm new password"
                                    />
                                    {errors.confirmPassword && (
                                        <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                                    )}
                                </div>

                                <button
                                    onClick={handlePasswordChange}
                                    disabled={saving}
                                    className="bg-[#106A2E] hover:bg-[#0d5224] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
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
                                <h3 className="font-display text-lg text-[#1F1F1F]">
                                    Recent Activity
                                </h3>
                                <span className="text-xs text-gray-400">
                                    {activityLog.length} {activityLog.length === 1 ? "entry" : "entries"}
                                </span>
                            </div>

                            {isActivityLoading ? (
                                <div className="flex justify-center py-10">
                                    <div className="w-6 h-6 border-2 border-[#106A2E]/20 border-t-[#106A2E] rounded-full animate-spin" />
                                </div>
                            ) : activityLog.length > 0 ? (
                                <div className="divide-y divide-[#1F1F1F]/[0.05] max-h-[400px] overflow-y-auto">
                                    {activityLog.map((log, i) => (
                                        <div 
                                            key={i} 
                                            className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 rounded-lg card-transition"
                                        >
                                            <p className="text-sm text-[#1F1F1F]">
                                                {log.action}
                                            </p>
                                            <span className="text-xs text-gray-400 flex-shrink-0 ml-3">
                                                {formatActivityTime(log.timestamp)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-sm text-gray-400">
                                        No recent activity recorded.
                                    </p>
                                    <p className="text-xs text-gray-300 mt-1">
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
                                            New Request Alerts
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Receive email notifications when a new Digital ID request is submitted
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setNotifPrefs((prev) => ({
                                                ...prev,
                                                emailOnNewRequest: !prev.emailOnNewRequest
                                            }))
                                        }
                                        className={`
                                            relative
                                            w-11
                                            h-6
                                            rounded-full
                                            flex-shrink-0
                                            mt-1
                                            p-0.5
                                            flex
                                            items-center
                                            transition-colors
                                            duration-200
                                            ${
                                                notifPrefs.emailOnNewRequest
                                                    ? "bg-[#106A2E] justify-end"
                                                    : "bg-gray-300 justify-start"
                                            }
                                        `}
                                        aria-label="Toggle new request alerts"
                                        aria-pressed={notifPrefs.emailOnNewRequest}
                                    >
                                        <span
                                            className="
                                                block
                                                w-5
                                                h-5
                                                rounded-full
                                                bg-white
                                                shadow-sm
                                                flex-shrink-0
                                            "
                                        />
                                    </button>
                                </div>

                                <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 card-transition">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-[#1F1F1F]">
                                            Pending Request Threshold
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Receive notifications when pending requests exceed the specified threshold
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setNotifPrefs((prev) => ({
                                                ...prev,
                                                emailOnThreshold: !prev.emailOnThreshold
                                            }))
                                        }
                                        className={`
                                            relative
                                            w-11
                                            h-6
                                            rounded-full
                                            flex-shrink-0
                                            mt-1
                                            p-0.5
                                            flex
                                            items-center
                                            transition-colors
                                            duration-200
                                            ${
                                                notifPrefs.emailOnThreshold
                                                    ? "bg-[#106A2E] justify-end"
                                                    : "bg-gray-300 justify-start"
                                            }
                                        `}
                                        aria-label="Toggle threshold alerts"
                                        aria-pressed={notifPrefs.emailOnThreshold}
                                    >
                                        <span
                                            className="
                                                block
                                                w-5
                                                h-5
                                                rounded-full
                                                bg-white
                                                shadow-sm
                                                flex-shrink-0
                                            "
                                        />
                                    </button>
                                </div>

                                {notifPrefs.emailOnThreshold && (
                                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Threshold Count
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={100}
                                            value={notifPrefs.thresholdCount}
                                            onChange={(e) => setNotifPrefs({ 
                                                ...notifPrefs, 
                                                thresholdCount: Math.max(1, Number(e.target.value)) 
                                            })}
                                            className="w-32 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-[#106A2E] input-transition"
                                        />
                                        <p className="text-xs text-gray-400 mt-1.5">
                                            You will be notified when pending requests reach this number
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleNotifSave}
                                    disabled={saving}
                                    className="bg-[#106A2E] hover:bg-[#0d5224] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {saving ? "Saving..." : "Save Preferences"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}