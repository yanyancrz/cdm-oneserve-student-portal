import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ChevronLeft,
    Check,
    Inbox,
    Layers,
    RefreshCw,
    ShieldCheck,
    Trash2,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import { storeApi } from "../services/marketApi";
import {
    APPLICATION_STATUS,
    STORE_PERMISSIONS,
    applicationStatusLabel,
    applicationStatusTone,
    storeKindLabel,
} from "../config/marketVocabulary";
import { formatDateTime } from "../utils/format";
import {
    MarketButton,
    MarketEmpty,
    MarketField,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
} from "../components/marketUi";

/**
 * The store team, and the applications waiting to join it.
 *
 * OWNER ONLY. The server refuses everyone else with a 403, so this screen is not
 * the thing keeping permissions honest - it is only the interface. Ticking a box
 * here sends the WHOLE permission set, because the server replaces it wholesale:
 * that is deliberate, so a permission the owner unticks really stops applying
 * instead of lingering in the database.
 *
 * The owner appears as a locked first row with all five permissions and no
 * controls. They are not a member row in the database at all - ownership implies
 * everything - which is why they cannot be edited out of their own store.
 */
export default function MarketStoreTeamPage() {
    const { storeId } = useParams();
    const navigate = useNavigate();

    const [store, setStore] = useState(null);
    const [team, setTeam] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // The store's own product sections. System categories come back too, but
    // they are read-only here - renaming one would change every other store.
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState("");
    const [renaming, setRenaming] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [savingCategory, setSavingCategory] = useState(false);

    const [adding, setAdding] = useState(false);
    const [newUserId, setNewUserId] = useState("");
    const [newPosition, setNewPosition] = useState("");
    const [newPermissions, setNewPermissions] = useState(["orders"]);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [editing, setEditing] = useState(null);
    const [editPermissions, setEditPermissions] = useState([]);

    const [deciding, setDeciding] = useState(null);
    const [grantPosition, setGrantPosition] = useState("");
    const [grantPermissions, setGrantPermissions] = useState(["orders"]);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            // Three independent reads. Each is owner-gated, so a 403 on any one
            // of them means the same thing: this account does not own the store.
            const [storeResponse, teamResponse, applicationsResponse, categoriesResponse] =
                await Promise.all([
                    storeApi.read(storeId),
                    storeApi.team(storeId),
                    storeApi.applications(storeId).catch(() => ({ data: [] })),
                    storeApi.categories(storeId).catch(() => ({ data: [] })),
                ]);

            setStore(storeResponse.data);
            setTeam(teamResponse.data || []);
            setApplications(applicationsResponse.data || []);
            setCategories(categoriesResponse.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [storeId]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const [storeResponse, teamResponse, applicationsResponse, categoriesResponse] =
                    await Promise.all([
                        storeApi.read(storeId),
                        storeApi.team(storeId),
                        storeApi.applications(storeId).catch(() => ({ data: [] })),
                        storeApi.categories(storeId).catch(() => ({ data: [] })),
                    ]);

                if (cancelled) return;
                setStore(storeResponse.data);
                setTeam(teamResponse.data || []);
                setApplications(applicationsResponse.data || []);
                setCategories(categoriesResponse.data || []);
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [storeId]);

    const toggle = (list, setList, value) => {
        setFormError("");
        setList(
            list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
        );
    };

    const addMember = async (event) => {
        event.preventDefault();

        const userId = Number(newUserId);
        if (!userId || userId < 1) {
            setFormError("Enter the numeric user id of the account to add.");
            return;
        }

        setSaving(true);
        setFormError("");

        try {
            const response = await storeApi.saveMember(storeId, {
                userId,
                position: newPosition.trim() || null,
                permissions: newPermissions,
                isActive: true,
            });

            toast.success("Team member saved.");
            setTeam(response.data || []);
            setAdding(false);
            setNewUserId("");
            setNewPosition("");
            setNewPermissions(["orders"]);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const saveMember = async (member, permissions, position) => {
        setSaving(true);

        try {
            const response = await storeApi.saveMember(storeId, {
                userId: member.userId,
                position: position ?? member.position,
                permissions,
                isActive: true,
            });

            toast.success(`${member.fullName || "Member"} updated.`);
            setTeam(response.data || []);
            setEditing(null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const removeMember = async (member) => {
        setSaving(true);

        try {
            const response = await storeApi.saveMember(storeId, {
                userId: member.userId,
                position: member.position,
                permissions: [],
                isActive: false,
            });

            toast.success(`${member.fullName || "Member"} removed from the team.`);
            setTeam(response.data || []);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const reviewApplication = async (application, approve) => {        if (approve && grantPosition.trim().length < 2) {
            toast.error("Enter the position you are granting.");
            return;
        }

        setSaving(true);

        try {
            const response = await storeApi.reviewApplication(application.applicationId, {
                approve,
                position: approve ? grantPosition.trim() : null,
                notes: null,
                permissions: approve ? grantPermissions : [],
            });

            toast.success(response.message || "Application reviewed.");
            setDeciding(null);
            setGrantPosition("");
            setGrantPermissions(["orders"]);

            // Approval creates a membership, so the team must be re-read too.
            const [teamResponse, applicationsResponse] = await Promise.all([
                storeApi.team(storeId),
                storeApi.applications(storeId).catch(() => ({ data: [] })),
            ]);

            setTeam(teamResponse.data || []);
            setApplications(applicationsResponse.data || []);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const reloadCategories = async () => {
        const response = await storeApi.categories(storeId).catch(() => null);
        if (response) setCategories(response.data || []);
    };

    const addCategory = async (event) => {
        event.preventDefault();

        if (newCategory.trim().length < 2) {
            toast.error("Give the section a name (at least 2 characters).");
            return;
        }

        setSavingCategory(true);

        try {
            const response = await storeApi.saveCategory(storeId, {
                name: newCategory.trim(),
            });

            toast.success(response.message || "Section added.");
            setNewCategory("");
            await reloadCategories();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSavingCategory(false);
        }
    };

    const renameCategory = async (category) => {
        if (renameValue.trim().length < 2) {
            toast.error("Give the section a name (at least 2 characters).");
            return;
        }

        setSavingCategory(true);

        try {
            const response = await storeApi.saveCategory(storeId, {
                categoryId: category.categoryId,
                name: renameValue.trim(),
                sortOrder: category.sortOrder,
            });

            toast.success(response.message || "Section renamed.");
            setRenaming(null);
            setRenameValue("");
            await reloadCategories();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSavingCategory(false);
        }
    };

    if (loading) {
        return (
            <MarketPanel>
                <MarketSkeleton rows={5} />
            </MarketPanel>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => navigate(`/marketplace/stores/${storeId}`)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                >
                    <ChevronLeft size={14} aria-hidden="true" />
                    Back to the storefront
                </button>

                <MarketNotice tone="error" title="Only the store owner can see this">
                    {error}
                </MarketNotice>
            </div>
        );
    }

    const pending = applications.filter((a) => a.status === APPLICATION_STATUS.PENDING);
    const settled = applications.filter((a) => a.status !== APPLICATION_STATUS.PENDING);

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={() => navigate(`/marketplace/stores/${storeId}`)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
            >
                <ChevronLeft size={14} aria-hidden="true" />
                {store?.name || "Storefront"}
            </button>

            <MarketPanel
                title="Team"
                subtitle={
                    store
                        ? `${store.name} · ${storeKindLabel(store.kind)}. You own this storefront.`
                        : undefined
                }
                action={
                    <MarketButton
                        size="sm"
                        variant="secondary"
                        onClick={() => setAdding((current) => !current)}
                    >
                        <UserPlus size={13} />
                        {adding ? "Cancel" : "Add member"}
                    </MarketButton>
                }
            >
                {adding ? (
                    <form onSubmit={addMember} className="space-y-3 border-b border-slate-100 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <MarketField
                                label="User id"
                                hint="The numeric id from Admin > Users."
                            >
                                <input
                                    className={marketInputClass}
                                    type="number"
                                    min="1"
                                    value={newUserId}
                                    onChange={(event) => setNewUserId(event.target.value)}
                                />
                            </MarketField>

                            <MarketField label="Position" hint="Free text, e.g. Cashier.">
                                <input
                                    className={marketInputClass}
                                    value={newPosition}
                                    maxLength={120}
                                    onChange={(event) => setNewPosition(event.target.value)}
                                />
                            </MarketField>
                        </div>

                        <PermissionPicker
                            legend="Permissions"
                            hint="Leave everything unticked and they get Orders only."
                            selected={newPermissions}
                            onToggle={(value) => toggle(newPermissions, setNewPermissions, value)}
                        />

                        {formError ? (
                            <MarketNotice tone="error" title="Could not save">
                                {formError}
                            </MarketNotice>
                        ) : null}

                        <MarketButton type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Add to team"}
                        </MarketButton>
                    </form>
                ) : null}

                {team.length === 0 ? (
                    <MarketEmpty
                        icon={<Users size={20} />}
                        title="Nobody on the team yet"
                        hint="Add a member above, or wait for someone to apply."
                    />
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {team.map((member) => (
                            <MemberRow
                                key={member.userId}
                                member={member}
                                editing={editing === member.userId}
                                editPermissions={editPermissions}
                                saving={saving}
                                onStartEdit={() => {
                                    setEditing(member.userId);
                                    setEditPermissions(member.permissions || []);
                                }}
                                onCancelEdit={() => setEditing(null)}
                                onToggleEdit={(value) =>
                                    toggle(editPermissions, setEditPermissions, value)
                                }
                                onSave={() => saveMember(member, editPermissions)}
                                onRemove={() => removeMember(member)}
                            />
                        ))}
                    </ul>
                )}
            </MarketPanel>

            <MarketPanel
                title="Sections"
                subtitle="The store's own product categories. System categories are shared and cannot be renamed."
                action={
                    <MarketButton size="sm" variant="secondary" onClick={reloadCategories}>
                        <RefreshCw size={13} />
                        Refresh
                    </MarketButton>
                }
            >
                <form onSubmit={addCategory} className="flex flex-wrap items-end gap-2 border-b border-slate-100 p-4">
                    <div className="min-w-[12rem] flex-1">
                        <MarketField label="New section" hint="Shown as a filter on the storefront.">
                            <input
                                className={marketInputClass}
                                value={newCategory}
                                maxLength={80}
                                placeholder="Drinks, Snacks, Uniforms..."
                                onChange={(event) => setNewCategory(event.target.value)}
                            />
                        </MarketField>
                    </div>

                    <MarketButton type="submit" disabled={savingCategory}>
                        {savingCategory ? "Saving..." : "Add section"}
                    </MarketButton>
                </form>

                {categories.length === 0 ? (
                    <MarketEmpty
                        icon={<Layers size={20} />}
                        title="No categories yet"
                        hint="Add the store's own sections above, or use a system category."
                    />
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {categories.map((category) => {
                            const system = category.storeId == null;

                            return (
                                <li
                                    key={category.categoryId}
                                    className="flex items-start justify-between gap-3 px-4 py-3"
                                >
                                    <div className="min-w-0">
                                        {renaming === category.categoryId ? (
                                            <input
                                                className={`${marketInputClass} max-w-xs`}
                                                value={renameValue}
                                                maxLength={80}
                                                onChange={(event) => setRenameValue(event.target.value)}
                                            />
                                        ) : (
                                            <p className="truncate text-xs font-semibold text-slate-800">
                                                {category.name}
                                                {system ? (
                                                    <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                                                        System
                                                    </span>
                                                ) : null}
                                            </p>
                                        )}

                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                            {category.productCount || 0} product
                                            {(category.productCount || 0) === 1 ? "" : "s"}
                                        </p>
                                    </div>

                                    {!system ? (
                                        renaming === category.categoryId ? (
                                            <div className="flex shrink-0 gap-1.5">
                                                <MarketButton
                                                    size="sm"
                                                    onClick={() => renameCategory(category)}
                                                    disabled={savingCategory}
                                                >
                                                    Save
                                                </MarketButton>
                                                <MarketButton
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setRenaming(null);
                                                        setRenameValue("");
                                                    }}
                                                >
                                                    Cancel
                                                </MarketButton>
                                            </div>
                                        ) : (
                                            <MarketButton
                                                size="sm"
                                                variant="secondary"
                                                className="shrink-0"
                                                onClick={() => {
                                                    setRenaming(category.categoryId);
                                                    setRenameValue(category.name);
                                                }}
                                            >
                                                Rename
                                            </MarketButton>
                                        )
                                    ) : null}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </MarketPanel>

            <MarketPanel
                title="Applications"
                subtitle={
                    pending.length > 0
                        ? `${pending.length} waiting for your decision.`
                        : "Nobody is waiting."
                }
                action={
                    <MarketButton size="sm" variant="secondary" onClick={load}>
                        <RefreshCw size={13} />
                        Refresh
                    </MarketButton>
                }
            >
                {applications.length === 0 ? (
                    <MarketEmpty
                        icon={<Inbox size={20} />}
                        title="No applications yet"
                        hint="Student and Faculty accounts can apply to work at this storefront."
                    />
                ) : (
                    <>
                        {pending.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {pending.map((application) => (
                                    <ApplicationRow
                                        key={application.applicationId}
                                        application={application}
                                        deciding={deciding === application.applicationId}
                                        grantPosition={grantPosition}
                                        grantPermissions={grantPermissions}
                                        saving={saving}
                                        onStartDecide={() => {
                                            setDeciding(application.applicationId);
                                            setGrantPosition(application.position);
                                            setGrantPermissions(["orders"]);
                                        }}
                                        onCancelDecide={() => setDeciding(null)}
                                        onGrantPosition={setGrantPosition}
                                        onToggleGrant={(value) =>
                                            toggle(grantPermissions, setGrantPermissions, value)
                                        }
                                        onApprove={() => reviewApplication(application, true)}
                                        onReject={() => reviewApplication(application, false)}
                                    />
                                ))}
                            </ul>
                        ) : null}

                        {settled.length > 0 ? (
                            <>
                                <p className="border-t border-slate-100 px-4 pt-3 text-[9px] font-semibold uppercase tracking-[.14em] text-slate-400">
                                    Settled
                                </p>
                                <ul className="divide-y divide-slate-100">
                                    {settled.map((application) => (
                                        <li
                                            key={application.applicationId}
                                            className="flex items-center justify-between gap-3 px-4 py-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold text-slate-700">
                                                    {application.fullName}
                                                </p>
                                                <p className="mt-0.5 text-[10px] text-slate-400">
                                                    Applied for {application.position} ·{" "}
                                                    {formatDateTime(application.createdAt)}
                                                </p>
                                            </div>

                                            <span
                                                className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${applicationStatusTone(application.status)}`}
                                            >
                                                {applicationStatusLabel(application.status)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : null}
                    </>
                )}
            </MarketPanel>
        </div>
    );
}

/**
 * The five permission ticks.
 *
 * Shared by the add form, the edit row and the approval panel so the three
 * cannot drift apart.
 */
function PermissionPicker({ legend, hint, selected, onToggle }) {
    return (
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                {legend}
            </p>
            {hint ? <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p> : null}

            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {STORE_PERMISSIONS.map((permission) => {
                    const on = selected.includes(permission.value);

                    return (
                        <button
                            key={permission.value}
                            type="button"
                            onClick={() => onToggle(permission.value)}
                            aria-pressed={on}
                            className={`flex items-start gap-2 rounded-xl border p-2.5 text-left transition ${
                                on
                                    ? "border-[#106A2E] bg-[#106A2E]/5"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                        >
                            <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                    on
                                        ? "border-[#106A2E] bg-[#106A2E] text-white"
                                        : "border-slate-300 bg-white"
                                }`}
                            >
                                {on ? <Check size={10} aria-hidden="true" /> : null}
                            </span>

                            <span className="min-w-0">
                                <span className="block text-[11px] font-semibold text-slate-700">
                                    {permission.label}
                                </span>
                                <span className="block text-[9px] leading-4 text-slate-400">
                                    {permission.hint}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/** One team row. The owner has no controls. */
function MemberRow({
    member,
    editing,
    editPermissions,
    saving,
    onStartEdit,
    onCancelEdit,
    onToggleEdit,
    onSave,
    onRemove,
}) {
    if (member.isOwner) {
        return (
            <li className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">
                        {member.fullName}
                        <span className="ml-2 rounded-full bg-[#106A2E]/8 px-1.5 py-0.5 text-[9px] font-semibold text-[#106A2E]">
                            Owner
                        </span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                        {member.email}
                        {member.idNumber ? ` · ${member.idNumber}` : ""}
                    </p>
                </div>

                <span className="shrink-0 text-[9px] text-slate-400">All permissions</span>
            </li>
        );
    }

    return (
        <li className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">
                        {member.fullName || `User ${member.userId}`}
                        {member.position ? (
                            <span className="ml-2 text-[10px] font-normal text-slate-400">
                                {member.position}
                            </span>
                        ) : null}
                        {!member.isActive ? (
                            <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                                Removed
                            </span>
                        ) : null}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{member.email}</p>

                    {!editing ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {(member.permissions || []).length === 0 ? (
                                <span className="text-[10px] text-slate-400">No permissions</span>
                            ) : (
                                member.permissions.map((permission) => (
                                    <span
                                        key={permission}
                                        className="rounded-full bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500"
                                    >
                                        {permission}
                                    </span>
                                ))
                            )}
                        </div>
                    ) : null}
                </div>

                {!editing ? (
                    <div className="flex shrink-0 gap-1.5">
                        <MarketButton size="sm" variant="secondary" onClick={onStartEdit}>
                            Edit
                        </MarketButton>
                        <MarketButton
                            size="sm"
                            variant="danger"
                            onClick={onRemove}
                            disabled={saving}
                        >
                            <Trash2 size={12} />
                            Remove
                        </MarketButton>
                    </div>
                ) : null}
            </div>

            {editing ? (
                <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <PermissionPicker
                        legend="Permissions"
                        hint="Saving replaces the whole set, so unticked permissions stop applying."
                        selected={editPermissions}
                        onToggle={onToggleEdit}
                    />

                    <div className="flex flex-wrap gap-2">
                        <MarketButton size="sm" onClick={onSave} disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                        </MarketButton>
                        <MarketButton size="sm" variant="ghost" onClick={onCancelEdit}>
                            Cancel
                        </MarketButton>
                    </div>
                </div>
            ) : null}
        </li>
    );
}

/** One application, with the owner's approve/reject decision. */
function ApplicationRow({
    application,
    deciding,
    grantPosition,
    grantPermissions,
    saving,
    onStartDecide,
    onCancelDecide,
    onGrantPosition,
    onToggleGrant,
    onApprove,
    onReject,
}) {
    return (
        <li className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">
                        {application.fullName}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                        {application.email}
                        {application.idNumber ? ` · ${application.idNumber}` : ""}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                        Applying for <span className="font-semibold">{application.position}</span> ·{" "}
                        {formatDateTime(application.createdAt)}
                    </p>

                    {application.message ? (
                        <p className="mt-1.5 rounded-lg bg-slate-50 p-2 text-[10px] leading-4 text-slate-600">
                            {application.message}
                        </p>
                    ) : null}
                </div>

                {!deciding ? (
                    <MarketButton size="sm" onClick={onStartDecide}>
                        <ShieldCheck size={12} />
                        Decide
                    </MarketButton>
                ) : null}
            </div>

            {deciding ? (
                <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <MarketField
                        label="Position granted"
                        hint="You may grant a different one from what they applied for."
                    >
                        <input
                            className={marketInputClass}
                            value={grantPosition}
                            maxLength={120}
                            onChange={(event) => onGrantPosition(event.target.value)}
                        />
                    </MarketField>

                    <PermissionPicker
                        legend="Permissions to grant"
                        hint="Approving adds them to the team with exactly these."
                        selected={grantPermissions}
                        onToggle={onToggleGrant}
                    />

                    <div className="flex flex-wrap gap-2">
                        <MarketButton size="sm" onClick={onApprove} disabled={saving}>
                            <Check size={12} />
                            {saving ? "Saving..." : "Approve and add"}
                        </MarketButton>
                        <MarketButton
                            size="sm"
                            variant="danger"
                            onClick={onReject}
                            disabled={saving}
                        >
                            <X size={12} />
                            Reject
                        </MarketButton>
                        <MarketButton size="sm" variant="ghost" onClick={onCancelDecide}>
                            Cancel
                        </MarketButton>
                    </div>
                </div>
            ) : null}
        </li>
    );
}
