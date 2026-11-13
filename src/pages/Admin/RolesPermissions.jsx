import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, RefreshCw, Save, ShieldCheck, UserRoundCog } from "lucide-react";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api";

const BASE = `${API_URL}/api/admin/roles-permissions`;
const LEVELS = ["none", "view", "manage", "full_control"];
const token = () => localStorage.getItem("token") || localStorage.getItem("authToken");
async function api(path, options = {}) {
    const response = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
        },
    });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || "Permission request failed.");
    return data;
}

export default function RolesPermissions() {
    const [overview, setOverview] = useState(null);
    const [role, setRole] = useState("Admin");
    const [matrix, setMatrix] = useState([]);
    const [members, setMembers] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [overrides, setOverrides] = useState([]);
    const [drafts, setDrafts] = useState({});
    const [reason, setReason] = useState("");
    const [tab, setTab] = useState("roles");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const loadOverview = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [data, userRows] = await Promise.all([
                api(""),
                fetch(`${API_URL}/api/auth/users`, { headers: { Authorization: `Bearer ${token()}` } })
                    .then(async r => { const body = await r.json().catch(() => []); if (!r.ok) throw new Error(body?.message || "Users unavailable"); return body; }),
            ]);
            setOverview(data);
            setUsers(Array.isArray(userRows) ? userRows.filter(u => u.status !== "Deleted") : []);
            const firstRole = data.roles?.some(r => r.role === role) ? role : (data.roles?.[0]?.role || "Admin");
            setRole(firstRole);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, [role]);

    const loadRole = useCallback(async () => {
        if (!role) return;
        try {
            const data = await api(`/roles/${encodeURIComponent(role)}`);
            setMatrix(data.permissions || []);
            setMembers(data.users || []);
            setDrafts({});
        } catch (e) { setError(e.message); }
    }, [role]);

    const loadOverrides = useCallback(async () => {
        if (!selectedUser) { setOverrides([]); return; }
        try {
            const data = await api(`/users/${selectedUser}/overrides`);
            setOverrides(data.overrides || []);
        } catch (e) { setError(e.message); }
    }, [selectedUser]);

    useEffect(() => { loadOverview(); }, [loadOverview]);
    useEffect(() => { loadRole(); }, [loadRole]);
    useEffect(() => { loadOverrides(); }, [loadOverrides]);

    const groups = useMemo(() => matrix.reduce((all, item) => {
        (all[item.category] ||= []).push(item);
        return all;
    }, {}), [matrix]);

    const saveRolePermission = async (item) => {
        const level = drafts[item.key];
        if (!level || !reason.trim()) { toast.error("Add a reason before saving permission changes."); return; }
        setBusy(true);
        try {
            await api(`/roles/${encodeURIComponent(role)}`, { method: "PUT", body: JSON.stringify({ key: item.key, level, reason: reason.trim() }) });
            toast.success("Role permission updated.");
            setReason("");
            await loadRole();
        } catch (e) { toast.error(e.message); }
        finally { setBusy(false); }
    };

    const saveOverride = async (event) => {
        event.preventDefault();
        const targetForm = event.currentTarget;
        const form = new FormData(targetForm);
        if (!selectedUser || !String(form.get("reason") || "").trim()) { toast.error("Select a user and provide a reason."); return; }
        setBusy(true);
        try {
            await api(`/users/${selectedUser}/overrides`, { method: "PUT", body: JSON.stringify({ key: form.get("key"), level: form.get("level"), reason: form.get("reason") }) });
            toast.success("Individual permission saved.");
            targetForm.reset();
            await loadOverrides();
        } catch (e) { toast.error(e.message); }
        finally { setBusy(false); }
    };

    const removeOverride = async (item) => {
        const why = window.prompt("Reason for removing this permission override:");
        if (!why?.trim()) return;
        setBusy(true);
        try {
            await api(`/users/${selectedUser}/overrides/${encodeURIComponent(item.permissionKey)}?reason=${encodeURIComponent(why.trim())}`, { method: "DELETE" });
            toast.success("Individual permission removed.");
            await loadOverrides();
        } catch (e) { toast.error(e.message); }
        finally { setBusy(false); }
    };

    if (loading) return <div className="mx-auto max-w-6xl p-8 text-sm text-gray-500"><RefreshCw className="mr-2 inline animate-spin" size={16} />Loading permissions…</div>;
    if (error && !overview) return <div className="mx-auto max-w-4xl p-8"><p className="text-red-700">{error}</p><button onClick={loadOverview} className="mt-3 rounded-lg border px-3 py-2 text-sm">Retry</button></div>;

    return <main className="mx-auto max-w-6xl space-y-5 p-4 sm:p-7">
        <header className="flex flex-wrap items-end justify-between gap-3">
            <div><h1 className="text-3xl font-semibold text-[#1F1F1F]">Roles & Permissions</h1><p className="mt-1 text-sm text-gray-500">Database-enforced access across the OneServe admin console.</p></div>
            <button onClick={() => { loadOverview(); loadRole(); }} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm"><RefreshCw size={15} />Refresh</button>
        </header>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex gap-2 border-b">
            {[['roles', 'Role permissions', ShieldCheck], ['users', 'Individual overrides', UserRoundCog]].map(([key, label, Icon]) => <button key={key} onClick={() => setTab(key)} className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm ${tab === key ? 'border-[#0E3B22] font-semibold text-[#0E3B22]' : 'border-transparent text-gray-500'}`}><Icon size={16} />{label}</button>)}
        </div>
        {tab === "roles" ? <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-4"><label className="text-sm font-medium">Role</label><select value={role} onChange={e => setRole(e.target.value)} className="min-w-56 rounded-lg border px-3 py-2">{(overview?.roles || []).map(r => <option key={r.role} value={r.role}>{r.role} · {r.userCount} users</option>)}</select><p className="text-xs text-gray-500">Users assigned to this role: {members.length}</p></div>
            <div className="rounded-2xl border bg-amber-50 p-4"><label className="block text-xs font-semibold text-amber-900">Reason required for role permission changes</label><input value={reason} onChange={e => setReason(e.target.value)} maxLength={500} className="mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm" placeholder="Example: limit service settings to current operating needs" /></div>
            {Object.entries(groups).map(([category, items]) => <section key={category} className="overflow-hidden rounded-2xl border bg-white"><h2 className="border-b bg-gray-50 px-4 py-3 text-sm font-semibold">{category}</h2>{items.map(item => <div key={item.key} className="grid gap-3 border-b p-4 last:border-0 md:grid-cols-[1fr_170px_auto] md:items-center"><div><p className="text-sm font-semibold">{item.label}</p><p className="mt-1 text-xs text-gray-500">{item.description} <span className="block font-mono text-[10px]">{item.key}{item.superAdminOnly ? " · restricted" : ""}</span></p></div><select value={drafts[item.key] ?? item.level} onChange={e => setDrafts(old => ({ ...old, [item.key]: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm">{LEVELS.map(level => <option key={level} value={level}>{level.replace("_", " ")}</option>)}</select><button disabled={busy || drafts[item.key] === undefined || drafts[item.key] === item.level} onClick={() => saveRolePermission(item)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0E3B22] px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"><Save size={14} />Save</button></div>)}</section>)}
            <section className="rounded-2xl border bg-white p-4"><h2 className="font-semibold">Assigned users</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{members.map(user => <div key={user.id} className="rounded-lg bg-gray-50 p-3 text-sm"><p className="font-medium">{user.fullName}</p><p className="text-xs text-gray-500">{user.email} · {user.accountStatus}{user.adminModule ? ` · ${user.adminModule}` : ""}</p></div>)}{!members.length && <p className="text-sm text-gray-500">No active accounts currently use this role.</p>}</div></section>
        </section> : <section className="space-y-4 rounded-2xl border bg-white p-4">
            <label className="block text-sm font-semibold">User account<select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="mt-2 block w-full max-w-xl rounded-lg border px-3 py-2 font-normal"><option value="">Choose a user</option>{users.map(user => <option key={user.id} value={user.id}>{user.fullName} · {user.email} · {user.role}</option>)}</select></label>
            {selectedUser && <><form onSubmit={saveOverride} className="grid gap-3 rounded-xl bg-gray-50 p-4 md:grid-cols-[1fr_150px_1fr_auto] md:items-end"><label className="text-xs font-semibold">Permission<select name="key" required className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm">{(overview?.permissionCatalog || []).map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label><label className="text-xs font-semibold">Level<select name="level" className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm">{LEVELS.map(level => <option key={level} value={level}>{level}</option>)}</select></label><label className="text-xs font-semibold">Reason<input name="reason" required maxLength={500} className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm" /></label><button disabled={busy} className="rounded-lg bg-[#0E3B22] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Assign</button></form><div className="space-y-2">{overrides.map(item => <div key={item.permissionKey} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="text-sm font-semibold">{overview.permissionCatalog.find(p => p.key === item.permissionKey)?.label || item.permissionKey} · {item.level}{item.isExpired ? " · expired" : ""}</p><p className="text-xs text-gray-500">{item.reason || "No reason provided"}{item.expiresAt ? ` · Expires ${new Date(item.expiresAt).toLocaleString()}` : " · No expiry"}</p></div><button disabled={busy} onClick={() => removeOverride(item)} className="text-xs font-semibold text-red-700 hover:underline">Remove override</button></div>)}{!overrides.length && <p className="text-sm text-gray-500">No individual overrides for this account.</p>}</div></>}
        </section>}
    </main>;
}
