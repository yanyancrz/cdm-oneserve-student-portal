import { useEffect, useState } from "react";
import { KeyRound, MapPin, Plus, Store, UserMinus, X } from "lucide-react";
import toast from "react-hot-toast";

import { headApi } from "../services/marketApi";
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
 * Workspaces - the Head's stall world.
 *
 * Three things live here and nowhere else:
 *
 *   1. FoodHub LOCATIONS (e.g. "Main FoodHub — Old Building Lobby").
 *   2. WORKSPACES: one row per stall plus the CDM BusinessHub workspace.
 *      Deactivating a workspace stops it selling but keeps its history.
 *   3. One LOGIN ACCOUNT per workspace. Creating a stall never creates
 *      logins for people - a workspace gets at most ONE account, and the
 *      humans on duty are named per shift on the setup screen.
 */
export default function MarketStaffWorkspacesPage() {
    const [locations, setLocations] = useState([]);
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(null);

    const [showLocation, setShowLocation] = useState(null);
    const [showWorkspace, setShowWorkspace] = useState(null);
    const [showAccount, setShowAccount] = useState(null);
    const [showPassword, setShowPassword] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            setError("");

            const [locRes, wsRes] = await Promise.all([
                headApi.stallLocations(),
                headApi.workspaces(),
            ]);

            setLocations(locRes.data || []);
            setWorkspaces(wsRes.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const locationName = (id) =>
        locations.find((l) => l.stallLocationId === id)?.name ?? "";

    const stalls = workspaces.filter((w) => w.workspaceType === "Stall");
    const hubs = workspaces.filter((w) => w.workspaceType === "BusinessHub");

    const runBusy = async (key, fn) => {
        setBusy(key);
        try {
            const response = await fn();
            toast.success(response.message || "Saved.");
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="space-y-4">
            <StaffPageHeader
                title="Stalls & Workspaces"
                subtitle="FoodHub locations, stalls, the BusinessHub, and one login account each"
            />

            <MarketNotice tone="info" icon={<Store size={14} />}>
                A stall never gets a login per person. Each workspace has at most
                ONE account; whoever is on duty signs in with it and enters
                their name on the setup screen. That name is recorded on every
                stock update they make.
            </MarketNotice>

            {error && (
                <MarketNotice tone="error" title="Could not load workspaces">
                    {error}
                </MarketNotice>
            )}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={5} />
                </MarketPanel>
            ) : (
                <>
                    <MarketPanel
                        title="FoodHub locations"
                        subtitle="Stalls are grouped under these"
                        action={
                            <MarketButton onClick={() => setShowLocation({})}>
                                <Plus size={13} />
                                Add location
                            </MarketButton>
                        }
                    >
                        {locations.length === 0 ? (
                            <MarketEmpty
                                icon={<MapPin size={20} />}
                                title="No FoodHub locations yet"
                                hint="Create one (e.g. Main FoodHub), then add its stalls below."
                            />
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {locations.map((location) => (
                                    <li
                                        key={location.stallLocationId}
                                        className="flex items-center gap-3 py-2.5"
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-xs font-bold text-slate-800">
                                                {location.name}
                                                {!location.isActive && (
                                                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                                        Hidden
                                                    </span>
                                                )}
                                            </span>
                                            {location.description && (
                                                <span className="block truncate text-[11px] text-slate-500">
                                                    {location.description}
                                                </span>
                                            )}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShowLocation(location)}
                                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                                        >
                                            Edit
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </MarketPanel>

                    <MarketPanel
                        title="CDM BusinessHub"
                        subtitle="Uniforms and merchandise workspace"
                        action={
                            hubs.length === 0 && (
                                <MarketButton onClick={() => setShowWorkspace({ workspaceType: "BusinessHub" })}>
                                    <Plus size={13} />
                                    Add workspace
                                </MarketButton>
                            )
                        }
                    >
                        {hubs.length === 0 ? (
                            <MarketEmpty
                                icon={<Store size={20} />}
                                title="No BusinessHub workspace"
                                hint="Create it once; uniforms and merchandise live here."
                            />
                        ) : (
                            hubs.map((workspace) => (
                                <WorkspaceCard
                                    key={workspace.workspaceId}
                                    workspace={workspace}
                                    locationLabel=""
                                    busy={busy}
                                    onEdit={() => setShowWorkspace(workspace)}
                                    onAccount={() => setShowAccount(workspace)}
                                    onPassword={() => setShowPassword(workspace)}
                                    onDeactivate={() =>
                                        runBusy(`deact-${workspace.workspaceId}`, () =>
                                            headApi.deactivateStallAccount(workspace.workspaceId)
                                        )
                                    }
                                    runBusy={runBusy}
                                />
                            ))
                        )}
                    </MarketPanel>

                    <MarketPanel
                        title="Food stalls"
                        subtitle="One login account each"
                        action={
                            <MarketButton onClick={() => setShowWorkspace({ workspaceType: "Stall" })}>
                                <Plus size={13} />
                                Add stall
                            </MarketButton>
                        }
                    >
                        {stalls.length === 0 ? (
                            <MarketEmpty
                                icon={<Store size={20} />}
                                title="No stalls yet"
                                hint="Add Stall 1, Stall 2 and the rest under their FoodHub location."
                            />
                        ) : (
                            <div className="space-y-3">
                                {stalls.map((workspace) => (
                                    <WorkspaceCard
                                        key={workspace.workspaceId}
                                        workspace={workspace}
                                        locationLabel={locationName(workspace.stallLocationId)}
                                        busy={busy}
                                        onEdit={() => setShowWorkspace(workspace)}
                                        onAccount={() => setShowAccount(workspace)}
                                        onPassword={() => setShowPassword(workspace)}
                                        onDeactivate={() =>
                                            runBusy(`deact-${workspace.workspaceId}`, () =>
                                                headApi.deactivateStallAccount(workspace.workspaceId)
                                            )
                                        }
                                        runBusy={runBusy}
                                    />
                                ))}
                            </div>
                        )}
                    </MarketPanel>
                </>
            )}

            {showLocation !== null && (
                <LocationModal
                    initial={showLocation}
                    onClose={() => setShowLocation(null)}
                    onSaved={() => {
                        setShowLocation(null);
                        load();
                    }}
                />
            )}

            {showWorkspace !== null && (
                <WorkspaceModal
                    initial={showWorkspace}
                    locations={locations}
                    onClose={() => setShowWorkspace(null)}
                    onSaved={() => {
                        setShowWorkspace(null);
                        load();
                    }}
                />
            )}

            {showAccount !== null && (
                <AccountModal
                    workspace={showAccount}
                    onClose={() => setShowAccount(null)}
                    onSaved={() => {
                        setShowAccount(null);
                        load();
                    }}
                />
            )}

            {showPassword !== null && (
                <PasswordModal
                    workspace={showPassword}
                    onClose={() => setShowPassword(null)}
                    onSaved={() => setShowPassword(null)}
                />
            )}
        </div>
    );
}

function WorkspaceCard({
    workspace,
    locationLabel,
    busy,
    onEdit,
    onAccount,
    onPassword,
    onDeactivate,
}) {
    const deactivating = busy === `deact-${workspace.workspaceId}`;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800">
                        {workspace.name}
                        {!workspace.isActive && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                Hidden
                            </span>
                        )}
                    </p>
                    {locationLabel && (
                        <p className="mt-0.5 text-[11px] text-slate-500">{locationLabel}</p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-500">
                        {workspace.hasAccount ? (
                            <>
                                Login:{" "}
                                <span className="font-semibold text-[#106A2E]">
                                    {workspace.accountEmail}
                                </span>
                            </>
                        ) : (
                            <span className="font-semibold text-amber-600">
                                No login account yet
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        Edit
                    </button>
                    {workspace.hasAccount ? (
                        <>
                            <button
                                type="button"
                                onClick={onPassword}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                <KeyRound size={12} />
                                Password
                            </button>
                            <button
                                type="button"
                                onClick={onDeactivate}
                                disabled={deactivating}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                            >
                                <UserMinus size={12} />
                                {deactivating ? "Removing..." : "Remove login"}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={onAccount}
                            className="rounded-lg bg-[#106A2E] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#0E3B22]"
                        >
                            Create login
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function ModalShell({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                    >
                        <X size={16} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

const fieldLabel = "mb-1 block text-xs font-semibold text-slate-600";

function LocationModal({ initial, onClose, onSaved }) {
    const [name, setName] = useState(initial.name || "");
    const [description, setDescription] = useState(initial.description || "");
    const [isActive, setIsActive] = useState(initial.isActive ?? true);
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const body = {
                ...(initial.stallLocationId ? { stallLocationId: initial.stallLocationId } : {}),
                name: name.trim(),
                description: description.trim(),
                isActive,
            };
            const response = await headApi.saveStallLocation(body);
            toast.success(response.message || "Saved.");
            onSaved();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell title={initial.stallLocationId ? "Edit location" : "Add FoodHub location"} onClose={onClose}>
            <label className={fieldLabel}>Location name</label>
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Main FoodHub — Old Building Lobby"
                maxLength={120}
                className={marketInputClass}
            />

            <label className={`${fieldLabel} mt-3`}>Description</label>
            <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Where on campus is this food hall?"
                maxLength={500}
                className={marketInputClass}
            />

            <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                />
                Visible to buyers
            </label>

            <MarketButton
                onClick={save}
                disabled={saving || name.trim().length < 2}
                className="mt-4 w-full justify-center"
            >
                {saving ? "Saving..." : "Save location"}
            </MarketButton>
        </ModalShell>
    );
}

function WorkspaceModal({ initial, locations, onClose, onSaved }) {
    const [name, setName] = useState(initial.name || "");
    const [workspaceType] = useState(initial.workspaceType || "Stall");
    const [stallLocationId, setStallLocationId] = useState(
        initial.stallLocationId ? String(initial.stallLocationId) : ""
    );
    const [isActive, setIsActive] = useState(initial.isActive ?? true);
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const response = await headApi.saveWorkspace({
                ...(initial.workspaceId ? { workspaceId: initial.workspaceId } : {}),
                workspaceType,
                name: name.trim(),
                stallLocationId: workspaceType === "Stall" && stallLocationId ? Number(stallLocationId) : null,
                isActive,
            });
            toast.success(response.message || "Saved.");
            onSaved();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const canSave =
        name.trim().length >= 2 &&
        (workspaceType === "BusinessHub" || stallLocationId !== "") &&
        !saving;

    return (
        <ModalShell
            title={
                initial.workspaceId
                    ? "Edit workspace"
                    : workspaceType === "BusinessHub"
                      ? "Add BusinessHub workspace"
                      : "Add food stall"
            }
            onClose={onClose}
        >
            <label className={fieldLabel}>
                {workspaceType === "BusinessHub" ? "Workspace name" : "Stall name"}
            </label>
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={workspaceType === "BusinessHub" ? "CDM BusinessHub" : "Stall 2"}
                maxLength={120}
                className={marketInputClass}
            />

            {workspaceType === "Stall" && (
                <>
                    <label className={`${fieldLabel} mt-3`}>FoodHub location</label>
                    <select
                        value={stallLocationId}
                        onChange={(e) => setStallLocationId(e.target.value)}
                        className={marketSelectClass}
                    >
                        <option value="">Choose a location</option>
                        {locations
                            .filter((l) => l.isActive)
                            .map((l) => (
                                <option key={l.stallLocationId} value={l.stallLocationId}>
                                    {l.name}
                                </option>
                            ))}
                    </select>
                </>
            )}

            <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                />
                Open for orders
            </label>

            <MarketButton onClick={save} disabled={!canSave} className="mt-4 w-full justify-center">
                {saving ? "Saving..." : "Save workspace"}
            </MarketButton>
        </ModalShell>
    );
}

function AccountModal({ workspace, onClose, onSaved }) {
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState(`${workspace.name} Account`);
    const [password, setPassword] = useState("");
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const response = await headApi.createStallAccount(workspace.workspaceId, {
                email: email.trim(),
                fullName: fullName.trim(),
                password,
            });
            toast.success(response.message || "Login created.");
            onSaved();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell title={`Login for ${workspace.name}`} onClose={onClose}>
            <p className="mb-3 text-xs leading-5 text-slate-500">
                One account for the whole stall. Whoever is on duty signs in
                with it and enters their own name - share these credentials
                with the operators, nobody else.
            </p>

            <label className={fieldLabel}>Account name</label>
            <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={120}
                className={marketInputClass}
            />

            <label className={`${fieldLabel} mt-3`}>Email</label>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="stall2@cdm-oneserve.local"
                maxLength={190}
                className={marketInputClass}
            />

            <label className={`${fieldLabel} mt-3`}>Password (min. 8 characters)</label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={marketInputClass}
            />

            <MarketButton
                onClick={save}
                disabled={saving || password.length < 8 || fullName.trim().length < 2}
                className="mt-4 w-full justify-center"
            >
                {saving ? "Creating..." : "Create login"}
            </MarketButton>
        </ModalShell>
    );
}

function PasswordModal({ workspace, onClose, onSaved }) {
    const [password, setPassword] = useState("");
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const response = await headApi.resetStallAccountPassword(
                workspace.workspaceId,
                password
            );
            toast.success(response.message || "Password updated.");
            onSaved();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell title={`New password for ${workspace.name}`} onClose={onClose}>
            <label className={fieldLabel}>Password (min. 8 characters)</label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={marketInputClass}
            />

            <MarketButton
                onClick={save}
                disabled={saving || password.length < 8}
                className="mt-4 w-full justify-center"
            >
                {saving ? "Saving..." : "Set password"}
            </MarketButton>
        </ModalShell>
    );
}
