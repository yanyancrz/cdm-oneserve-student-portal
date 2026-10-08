import { useEffect, useState } from "react";
import { Plus, RotateCcw, UserMinus, Users, X } from "lucide-react";
import toast from "react-hot-toast";

import { headApi } from "../services/marketApi";
import { formatDate } from "../utils/format";
import {
    MarketButton,
    MarketEmpty,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
    marketSelectClass,
} from "../components/marketUi";
import { StaffPageHeader } from "./MarketStaffLayout";

/**
 * Staff Accounts - the Marketplace Head's screen.
 *
 * This is how operator accounts come into existence. There is no marketplace
 * signup: the OneServe Admin creates the HEAD, and the Head creates the operators
 * here. That is the same arrangement as the Library Head and Guidance Head.
 *
 * WHAT "RETIRE" DOES, PRECISELY
 * It withdraws marketplace operating access and NOTHING else. The person's
 * OneServe account is not suspended, edited or deleted - they keep signing in
 * as a Student or Faculty in the rest of OneServe. Past orders and chat messages
 * stay attributed to them, because the record points at a real person.
 *
 * Reactivation is deliberate rather than automatic: an account that was retired
 * stays retired until somebody decides it should be back.
 */
export default function MarketStaffAccountsPage() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState(null);
    const [showCreate, setShowCreate] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await headApi.staff();
            setRows(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const active = rows.filter((row) => row.isActive);
    const retired = rows.filter((row) => !row.isActive);

    const setActiveFlag = async (row, nextActive) => {
        setBusyId(row.userId);

        try {
            const response = nextActive
                ? await headApi.reactivateStaff(row.userId)
                : await headApi.deactivateStaff(row.userId);

            toast.success(response.message || "Updated.");
            load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-4">
            <StaffPageHeader
                title="Staff Accounts"
                subtitle="Marketplace operator accounts you manage"
                action={
                    <MarketButton onClick={() => setShowCreate(true)}>
                        <Plus size={13} />
                        Add operator
                    </MarketButton>
                }
            />

            <MarketNotice tone="info" icon={<Users size={14} />}>
                An operator signs in with the normal CDM OneServe login and lands
                straight in the staff portal, on any device. Retiring an account
                removes only their marketplace access - their OneServe account,
                orders and chat history are left untouched.
            </MarketNotice>

            {error && (
                <MarketNotice tone="error" title="Could not load staff accounts">
                    {error}
                </MarketNotice>
            )}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={4} />
                </MarketPanel>
            ) : rows.length === 0 ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<Users size={20} />}
                        title="No operator accounts yet"
                        hint="Add the person who will run the counter. They can use any device."
                        action={
                            <MarketButton onClick={() => setShowCreate(true)}>
                                <Plus size={13} />
                                Add operator
                            </MarketButton>
                        }
                    />
                </MarketPanel>
            ) : (
                <div className="space-y-4">
                    <MarketPanel
                        title="Active"
                        subtitle={`${active.length} operator${active.length === 1 ? "" : "s"}`}
                    >
                        <ul className="divide-y divide-slate-100">
                            {active.map((row) => (
                                <StaffRow
                                    key={row.userId}
                                    row={row}
                                    busy={busyId === row.userId}
                                    onToggle={() => setActiveFlag(row, false)}
                                    action={<UserMinus size={11} />}
                                    actionLabel="Retire access"
                                />
                            ))}
                        </ul>
                    </MarketPanel>

                    {retired.length > 0 && (
                        <MarketPanel
                            title="Retired"
                            subtitle="Kept so past orders and messages stay attributed"
                        >
                            <ul className="divide-y divide-slate-100">
                                {retired.map((row) => (
                                    <StaffRow
                                        key={row.userId}
                                        row={row}
                                        retired
                                        busy={busyId === row.userId}
                                        onToggle={() => setActiveFlag(row, true)}
                                        action={<RotateCcw size={11} />}
                                        actionLabel="Restore access"
                                    />
                                ))}
                            </ul>
                        </MarketPanel>
                    )}
                </div>
            )}

            {showCreate && (
                <CreateStaffModal
                    onClose={() => setShowCreate(false)}
                    onSaved={() => {
                        setShowCreate(false);
                        load();
                    }}
                />
            )}
        </div>
    );
}

function StaffRow({ row, retired, busy, onToggle, action, actionLabel }) {
    return (
        <li className={`flex flex-wrap items-center gap-3 p-3.5 ${retired ? "opacity-70" : ""}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#106A2E]/8 text-xs font-semibold text-[#106A2E]/60">
                {row.accountType === "Faculty" ? "F" : "S"}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-xs font-semibold text-slate-800">
                        {row.fullName}
                    </p>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                        {row.accountType}
                    </span>
                </div>

                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                    {row.email}
                    {row.idNumber ? ` · ${row.idNumber}` : ""}
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                    Since {formatDate(row.assignedAt)}
                    {row.assignedByName ? ` \u00b7 assigned by ${row.assignedByName}` : ""}
                    {row.ordersHandled > 0
                        ? ` \u00b7 ${row.ordersHandled} order${row.ordersHandled === 1 ? "" : "s"} handled`
                        : ""}
                </p>
            </div>

            <MarketButton
                variant={retired ? "secondary" : "ghost"}
                size="sm"
                onClick={onToggle}
                disabled={busy}
                aria-label={actionLabel}
            >
                {action}
                {retired ? "Restore" : "Retire"}
            </MarketButton>
        </li>
    );
}

/**
 * Creates an operator: a normal OneServe user plus the marketplace operator role.
 *
 * Account type is limited to Student or Faculty on purpose. A Head must not be
 * able to mint an Admin or another Head through this screen - role escalation
 * belongs to the OneServe Admin, not to a module.
 */
function CreateStaffModal({ onClose, onSaved }) {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        accountType: "Student",
        idNumber: "",
        course: "",
        institute: "",
        contactNumber: "",
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const update = (patch) => setForm((current) => ({ ...current, ...patch }));

    const submit = async () => {
        setSaving(true);
        setError("");

        try {
            const response = await headApi.createStaff({
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                password: form.password,
                accountType: form.accountType,
                idNumber: form.idNumber.trim() || null,
                course: form.course.trim() || null,
                institute: form.institute.trim() || null,
                contactNumber: form.contactNumber.trim() || null,
            });

            toast.success(response.message || "Operator account created.");
            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
            <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl">
                <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-800">
                        Add marketplace operator
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                    >
                        <X size={15} />
                    </button>
                </header>

                <div className="space-y-3 p-4">
                    {error && (
                        <MarketNotice tone="error" title="Could not create the account">
                            {error}
                        </MarketNotice>
                    )}

                    <label className="block">
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Full name
                        </span>
                        <input
                            type="text"
                            value={form.fullName}
                            onChange={(event) => update({ fullName: event.target.value })}
                            className={marketInputClass}
                        />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                Email
                            </span>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(event) => update({ email: event.target.value })}
                                className={marketInputClass}
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                Account type
                            </span>
                            <select
                                value={form.accountType}
                                onChange={(event) => update({ accountType: event.target.value })}
                                className={marketSelectClass}
                            >
                                <option value="Student">Student</option>
                                <option value="Faculty">Faculty</option>
                            </select>
                        </label>
                    </div>

                    <label className="block">
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Temporary password
                        </span>
                        <input
                            type="text"
                            value={form.password}
                            onChange={(event) => update({ password: event.target.value })}
                            placeholder="At least 8 characters. Share it with them."
                            className={marketInputClass}
                        />
                        <span className="mt-1 block text-[10px] text-slate-400">
                            They sign in with the regular OneServe login using this.
                        </span>
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                ID number
                            </span>
                            <input
                                type="text"
                                value={form.idNumber}
                                onChange={(event) => update({ idNumber: event.target.value })}
                                className={marketInputClass}
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                                Contact number
                            </span>
                            <input
                                type="tel"
                                value={form.contactNumber}
                                onChange={(event) => update({ contactNumber: event.target.value })}
                                className={marketInputClass}
                            />
                        </label>
                    </div>

                    <label className="block">
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Program / Institute
                        </span>
                        <input
                            type="text"
                            value={form.institute}
                            onChange={(event) => update({ institute: event.target.value })}
                            placeholder="Optional"
                            className={marketInputClass}
                        />
                    </label>
                </div>

                <footer className="flex gap-2 border-t border-slate-100 px-4 py-3">
                    <MarketButton
                        variant="secondary"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Cancel
                    </MarketButton>
                    <MarketButton
                        className="flex-1"
                        onClick={submit}
                        disabled={saving}
                    >
                        {saving ? "Creating..." : "Create operator"}
                    </MarketButton>
                </footer>
            </div>
        </div>
    );
}