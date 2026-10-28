import { useEffect, useState } from "react";
import {
    CheckCircle2,
    ShieldCheck,
    UserCog,
    UserPlus,
    XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { lfAdminApi } from "../services/lfApi";
import { formatDateTime } from "../config/lfTheme";
import { getConsoleAdmin } from "../session";
import {
    LfButton,
    LfEmpty,
    LfNotice,
    LfPanel,
    LfSkeleton,
    lfInputClass,
    lfTdClass,
    lfThClass,
    lfTrClass,
} from "../components/lfUi";

// =====================================================
// ADMIN MANAGEMENT (SUPER ADMIN ONLY)
//
// Create Sub-Admin accounts, activate or deactivate them. A new account
// starts with a system-generated-style initial password chosen here, is
// required to change it on first sign-in, and is stored only as a BCrypt
// hash. No password is ever shown again after creation.
// =====================================================

export default function LfAdminAdminsPage() {
    const consoleAdmin = getConsoleAdmin();
    const canManage = consoleAdmin.canManageAdmins;

    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
    });

    const load = async () => {
        try {
            const response = await lfAdminApi.admins();
            setAdmins(response.data || []);
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (cancelled) return;

            if (canManage) await load();
            else if (!cancelled) setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [canManage]);

    if (!canManage) {
        return (
            <LfNotice tone="bad">
                <span className="flex items-center gap-2 font-semibold">
                    <ShieldCheck size={16} aria-hidden="true" />
                    Super Admin access required
                </span>
                <span className="mt-1 block">
                    Sub-Admins can process reports, claims and pickups but
                    cannot create or manage administrator accounts.
                </span>
            </LfNotice>
        );
    }

    const createAdmin = async (event) => {
        event.preventDefault();

        if (!form.fullName.trim()) {
            toast.error("Full name is required.");
            return;
        }

        if (!form.email.trim()) {
            toast.error("Official email / username is required.");
            return;
        }

        if (form.password.length < 8) {
            toast.error("The initial password must be at least 8 characters.");
            return;
        }

        setSaving(true);

        try {
            const response = await lfAdminApi.createAdmin({
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                password: form.password,
            });

            toast.success(response.message || "Sub-Admin created.");
            setForm({ fullName: "", email: "", password: "" });
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (admin) => {
        const nextActive = !admin.isActive;

        if (
            !window.confirm(
                `${nextActive ? "Activate" : "Deactivate"} ${admin.fullName}?` +
                    (nextActive
                        ? ""
                        : " Their current sessions will be ended immediately.")
            )
        )
            return;

        setBusyId(admin.id);

        try {
            const response = await lfAdminApi.setAdminStatus(admin.id, nextActive);
            toast.success(response.message || "Administrator updated.");
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-800">
                    Admin Management
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                    Create and control Sub-Admin accounts. Only a Super Admin can
                    see this page.
                </p>
            </div>

            <LfPanel
                title="Create a Sub-Admin"
                subtitle="The account must change this initial password at first sign-in"
            >
                <form onSubmit={createAdmin} className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                                Full name *
                            </span>
                            <input
                                value={form.fullName}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        fullName: event.target.value,
                                    }))
                                }
                                className={lfInputClass}
                                placeholder="Maria Santos"
                                autoComplete="off"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                                Official email / username *
                            </span>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        email: event.target.value,
                                    }))
                                }
                                className={lfInputClass}
                                placeholder="maria.santos@pnm.edu.ph"
                                autoComplete="off"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold text-slate-500">
                                Initial password *
                            </span>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        password: event.target.value,
                                    }))
                                }
                                className={lfInputClass}
                                placeholder="At least 8 characters"
                                autoComplete="new-password"
                            />
                        </label>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-400">
                            Role is fixed to <strong>Sub-Admin</strong>. Passwords
                            are stored with BCrypt and never shown again.
                        </p>
                        <LfButton type="submit" loading={saving}>
                            <UserPlus size={14} aria-hidden="true" />
                            Create Sub-Admin
                        </LfButton>
                    </div>
                </form>
            </LfPanel>

            {loading ? (
                <LfSkeleton rows={4} />
            ) : error ? (
                <LfNotice tone="bad">{error}</LfNotice>
            ) : admins.length === 0 ? (
                <LfEmpty
                    icon={UserCog}
                    title="No administrators yet"
                    message="Create the first Sub-Admin above."
                />
            ) : (
                <LfPanel
                    title="Administrator accounts"
                    subtitle={`${admins.length} account${admins.length === 1 ? "" : "s"}`}
                >
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[900px] text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className={lfThClass}>Name</th>
                                    <th className={lfThClass}>Email / username</th>
                                    <th className={lfThClass}>Role</th>
                                    <th className={lfThClass}>Status</th>
                                    <th className={lfThClass}>Last login</th>
                                    <th className={lfThClass}>Created</th>
                                    <th className={`${lfThClass} text-right`}>
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map((admin) => (
                                    <tr key={admin.id} className={lfTrClass}>
                                        <td className={lfTdClass}>
                                            <span className="block font-semibold text-slate-800">
                                                {admin.fullName}
                                            </span>
                                            {admin.mustChangePassword && (
                                                <span className="mt-0.5 block text-[10px] font-semibold text-amber-600">
                                                    Initial password not changed
                                                </span>
                                            )}
                                        </td>
                                        <td className={lfTdClass}>{admin.email}</td>
                                        <td className={lfTdClass}>
                                            <span className="inline-flex rounded-full bg-[#106A2E]/10 px-2.5 py-1 text-[10px] font-bold text-[#106A2E]">
                                                {admin.roleLabel}
                                            </span>
                                        </td>
                                        <td className={lfTdClass}>
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                                    admin.isActive
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-red-50 text-red-600"
                                                }`}
                                            >
                                                {admin.isActive ? (
                                                    <CheckCircle2 size={11} aria-hidden="true" />
                                                ) : (
                                                    <XCircle size={11} aria-hidden="true" />
                                                )}
                                                {admin.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className={`${lfTdClass} text-slate-500`}>
                                            {admin.lastLoginAt
                                                ? formatDateTime(admin.lastLoginAt)
                                                : "Never signed in"}
                                        </td>
                                        <td className={`${lfTdClass} text-slate-500`}>
                                            {formatDateTime(admin.createdAt)}
                                        </td>
                                        <td className={`${lfTdClass} text-right`}>
                                            {admin.role === "LostFoundSubAdmin" ? (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleStatus(admin)}
                                                    disabled={busyId === admin.id}
                                                    className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition disabled:opacity-50 ${
                                                        admin.isActive
                                                            ? "border-red-200 text-red-600 hover:bg-red-50"
                                                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                    }`}
                                                >
                                                    {busyId === admin.id
                                                        ? "Saving…"
                                                        : admin.isActive
                                                          ? "Deactivate"
                                                          : "Activate"}
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-slate-400">
                                                    Protected
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </LfPanel>
            )}
        </div>
    );
}
