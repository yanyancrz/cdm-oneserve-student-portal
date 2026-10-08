import { useEffect, useState } from "react";
import { Save, Settings2 } from "lucide-react";
import toast from "react-hot-toast";

import { staffApi } from "../services/marketApi";
import { centavosToPesos, pesosToCentavos } from "../utils/format";
import {
    MarketButton,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
} from "../components/marketUi";
import { StaffPageHeader } from "./MarketStaffLayout";

/**
 * Staff Settings: the pickup location/instructions and the campus delivery fee.
 *
 * The delivery fee is a STAFF SETTING, not a constant in the code or the client.
 * It may legitimately be PHP 0.00 - free campus delivery is a valid choice, not a
 * missing value, and the server treats 0 that way.
 *
 * Toggling delivery off removes Campus Delivery from checkout entirely: buyers
 * then only see Pick Up.
 */
export default function MarketStaffSettingsPage() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        pickupLocation: "",
        pickupInstructions: "",
        deliveryEnabled: true,
        feePesos: "0.00",
    });

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                const response = await staffApi.settings();
                if (cancelled) return;

                const data = response.data;
                setSettings(data);
                setForm({
                    pickupLocation: data?.pickupLocation || "",
                    pickupInstructions: data?.pickupInstructions || "",
                    deliveryEnabled: data?.deliveryEnabled ?? true,
                    feePesos: centavosToPesos(data?.deliveryFeeCentavos || 0),
                });
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const update = (patch) => setForm((current) => ({ ...current, ...patch }));

    const save = async () => {
        setSaving(true);
        setError("");

        try {
            const response = await staffApi.saveSettings({
                pickupLocation: form.pickupLocation.trim(),
                pickupInstructions: form.pickupInstructions.trim(),
                deliveryEnabled: form.deliveryEnabled,
                deliveryFeeCentavos: pesosToCentavos(form.feePesos),
            });

            setSettings(response.data);
            toast.success(response.message || "Settings saved.");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <StaffPageHeader title="Settings" />
                <MarketPanel>
                    <MarketSkeleton rows={5} />
                </MarketPanel>
            </div>
        );
    }

    const feeCentavos = pesosToCentavos(form.feePesos);

    return (
        <div className="space-y-4">
            <StaffPageHeader
                title="Settings"
                subtitle="Pick up details and the campus delivery fee"
            />

            {error && (
                <MarketNotice tone="error" title="Could not save settings">
                    {error}
                </MarketNotice>
            )}

            {/* Pick up */}
            <MarketPanel title="Pick Up">
                <div className="space-y-3 p-4">
                    <label className="block">
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Pickup location
                        </span>
                        <input
                            type="text"
                            value={form.pickupLocation}
                            onChange={(event) => update({ pickupLocation: event.target.value })}
                            placeholder="e.g. Campus Marketplace counter, Main Building"
                            className={marketInputClass}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Pickup instructions
                        </span>
                        <textarea
                            value={form.pickupInstructions}
                            onChange={(event) =>
                                update({ pickupInstructions: event.target.value })
                            }
                            rows={3}
                            placeholder="Shown to buyers after they place an order"
                            className={marketInputClass}
                        />
                    </label>
                </div>
            </MarketPanel>

            {/* Campus delivery */}
            <MarketPanel title="Campus Delivery">
                <div className="space-y-3 p-4">
                    <label className="flex items-start gap-2 text-xs text-slate-600">
                        <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={form.deliveryEnabled}
                            onChange={(event) =>
                                update({ deliveryEnabled: event.target.checked })
                            }
                        />
                        <span>
                            Campus Delivery is available at checkout
                            <span className="block text-[10px] text-slate-400">
                                Turning this off leaves buyers with Pick Up only. Orders
                                already placed as deliveries are unaffected.
                            </span>
                        </span>
                    </label>

                    <label
                        className={`block ${form.deliveryEnabled ? "" : "opacity-50"}`}
                    >
                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                            Delivery fee (PHP)
                        </span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.feePesos}
                            disabled={!form.deliveryEnabled}
                            onChange={(event) => update({ feePesos: event.target.value })}
                            className={marketInputClass}
                        />
                    </label>

                    <MarketNotice tone="info" icon={<Settings2 size={14} />}>
                        The fee is added to Campus Delivery orders only, and is always
                        zero for Pick Up.{" "}
                        {feeCentavos === 0
                            ? "Currently set to FREE."
                            : `Currently PHP ${(feeCentavos / 100).toFixed(2)} per order.`}
                    </MarketNotice>

                    <p className="text-[10px] leading-4 text-slate-400">
                        Campus Delivery destinations are managed on the Campus Locations
                        screen. Buyers choose from that list; home addresses cannot be
                        entered.
                    </p>
                </div>
            </MarketPanel>

            <div className="flex items-center justify-end gap-2">
                {settings?.updatedAt && (
                    <span className="text-[10px] text-slate-400">
                        Last saved {new Date(settings.updatedAt).toLocaleString("en-PH")}
                    </span>
                )}

                <MarketButton onClick={save} disabled={saving}>
                    <Save size={13} />
                    {saving ? "Saving..." : "Save settings"}
                </MarketButton>
            </div>
        </div>
    );
}