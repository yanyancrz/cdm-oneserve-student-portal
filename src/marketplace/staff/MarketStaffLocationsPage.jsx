import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

import { staffApi } from "../services/marketApi";
import {
    MarketButton,
    MarketEmpty,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
} from "../components/marketUi";
import { StaffPageHeader } from "./MarketStaffLayout";

/**
 * Staff campus locations.
 *
 * This list IS the mechanism that keeps Campus Delivery on campus: a buyer picks
 * a destination from it and cannot type an address anywhere. So it is staff-managed,
 * and that is stated on the screen rather than left implicit.
 *
 * Locations are retired rather than deleted, because an existing delivery order
 * still points at the one it was placed against.
 */
export default function MarketStaffLocationsPage() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await staffApi.locations();
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

    const archive = async (location) => {
        try {
            const response = await staffApi.archiveLocation(location.locationId);
            toast.success(response.message || "Location retired.");
            load();
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="space-y-4">
            <StaffPageHeader
                title="Campus Locations"
                subtitle="The approved destinations for Campus Delivery"
                action={
                    <MarketButton onClick={() => setEditing({ locationId: null })}>
                        <Plus size={13} />
                        Add location
                    </MarketButton>
                }
            />

            <MarketNotice tone="info" title="Why this list matters" icon={<MapPin size={14} />}>
                Campus Delivery is strictly within the CDM campus. Buyers choose a
                location from this list, so a home address or an address outside campus
                cannot be entered at all.
            </MarketNotice>

            {error && (
                <MarketNotice tone="error" title="Could not load locations">
                    {error}
                </MarketNotice>
            )}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={5} />
                </MarketPanel>
            ) : rows.length === 0 ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<MapPin size={20} />}
                        title="No campus locations"
                        hint="Add the buildings Marketplace Staff can deliver to."
                        action={
                            <MarketButton
                                onClick={() => setEditing({ locationId: null })}
                            >
                                <Plus size={13} />
                                Add location
                            </MarketButton>
                        }
                    />
                </MarketPanel>
            ) : (
                <MarketPanel>
                    <ul className="divide-y divide-slate-100">
                        {rows.map((location) => (
                            <li
                                key={location.locationId}
                                className="flex items-center gap-3 p-3.5"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate text-xs font-semibold text-slate-800">
                                            {location.locationName}
                                        </p>

                                        {!location.allowsDetails && (
                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-400">
                                                No specific area
                                            </span>
                                        )}
                                    </div>

                                    {location.description && (
                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                            {location.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                    {location.isActive ? (
                                        <>
                                            <MarketButton
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setEditing(location)}
                                            >
                                                Edit
                                            </MarketButton>
                                            <MarketButton
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => archive(location)}
                                                aria-label="Retire location"
                                            >
                                                <Trash2 size={11} />
                                            </MarketButton>
                                        </>
                                    ) : (
                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-400">
                                            Retired
                                        </span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>

                    <p className="border-t border-slate-100 px-4 py-2.5 text-[10px] text-slate-400">
                        A retired location stays on orders already placed against it.
                    </p>
                </MarketPanel>
            )}

            {editing && (
                <LocationModal
                    initial={editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null);
                        load();
                    }}
                />
            )}
        </div>
    );
}

function LocationModal({ initial, onClose, onSaved }) {
    const [form, setForm] = useState({
        locationId: initial.locationId ?? undefined,
        locationName: initial.locationName || "",
        description: initial.description || "",
        allowsDetails: initial.allowsDetails ?? true,
        sortOrder: initial.sortOrder ?? 0,
        isActive: initial.isActive ?? true,
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const update = (patch) => setForm((current) => ({ ...current, ...patch }));

    const submit = async () => {
        setSaving(true);
        setError("");

        try {
            const response = await staffApi.saveLocation({
                locationId: form.locationId,
                locationName: form.locationName.trim(),
                description: form.description.trim(),
                allowsDetails: form.allowsDetails,
                sortOrder: Number(form.sortOrder) || 0,
                isActive: form.isActive,
            });

            toast.success(response.message || "Location saved.");
            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
            <div className="w-full max-w-md rounded-t-2xl bg-white sm:rounded-2xl">
                <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-800">
                        {form.locationId ? "Edit location" : "Add location"}
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
                        <MarketNotice tone="error" title="Could not save">
                            {error}
                        </MarketNotice>
                    )}

                    <label className="block">
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Location name
                        </span>
                        <input
                            type="text"
                            value={form.locationName}
                            onChange={(event) => update({ locationName: event.target.value })}
                            placeholder="e.g. Main Building"
                            className={marketInputClass}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Description
                        </span>
                        <input
                            type="text"
                            value={form.description}
                            onChange={(event) => update({ description: event.target.value })}
                            placeholder="Optional guidance for buyers"
                            className={marketInputClass}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Sort order
                        </span>
                        <input
                            type="number"
                            min="0"
                            value={form.sortOrder}
                            onChange={(event) => update({ sortOrder: event.target.value })}
                            className={marketInputClass}
                        />
                    </label>

                    <label className="flex items-start gap-2 text-xs text-slate-600">
                        <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={form.allowsDetails}
                            onChange={(event) => update({ allowsDetails: event.target.checked })}
                        />
                        <span>
                            Buyer may add a room, office or area
                            <span className="block text-[10px] text-slate-400">
                                Turn this off for whole-building destinations such as the
                                Library or the Registrar.
                            </span>
                        </span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(event) => update({ isActive: event.target.checked })}
                        />
                        Available to buyers at checkout
                    </label>
                </div>

                <footer className="flex gap-2 border-t border-slate-100 px-4 py-3">
                    <MarketButton variant="secondary" className="flex-1" onClick={onClose}>
                        Cancel
                    </MarketButton>
                    <MarketButton className="flex-1" onClick={submit} disabled={saving}>
                        {saving ? "Saving..." : "Save location"}
                    </MarketButton>
                </footer>
            </div>
        </div>
    );
}
