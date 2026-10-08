import { useEffect, useState } from "react";
import { Eye, Search, Users } from "lucide-react";

import { adminApi } from "../services/marketApi";
import { formatDate, formatPeso } from "../utils/format";
import {
    MarketEmpty,
    MarketNotice,
    MarketPanel,
    MarketSkeleton,
    marketInputClass,
} from "../components/marketUi";
import { AdminPageHeader } from "./MarketAdminLayout";

/**
 * Buyer accounts, as the Admin sees them.
 *
 * READ-ONLY, and that is enforced by absence rather than by a disabled button:
 * the marketplace API has no endpoint that edits or deletes a Student/Faculty
 * account, so there is nothing to hide. Account management stays in the OneServe
 * admin, which already owns it.
 *
 * Only accounts that have actually placed a Marketplace order appear. This is a
 * marketplace view, not a copy of the student registry.
 */
export default function MarketAdminAccounts() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [accountType, setAccountType] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await adminApi.accounts({ accountType });
                if (cancelled) return;

                setRows(response.data || []);
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
    }, [accountType]);

    const visible = search
        ? rows.filter((row) =>
              `${row.fullName} ${row.idNumber} ${row.email}`
                  .toLowerCase()
                  .includes(search.toLowerCase())
          )
        : rows;

    const totalSpent = visible.reduce(
        (sum, row) => sum + row.totalPurchaseCentavos,
        0
    );

    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Buyer Accounts"
                subtitle="Marketplace activity per Student and Faculty account"
            />

            <MarketNotice tone="info" icon={<Eye size={14} />}>
                Read-only view. The marketplace does not manage user accounts - it only
                reads the shared CDM OneServe user. Edit or deactivate an account from
                the OneServe admin, not from here.
            </MarketNotice>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1">
                    <Search
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Name, ID number or email..."
                        className={`${marketInputClass} py-2 pl-8 text-xs`}
                    />
                </div>

                <select
                    value={accountType}
                    onChange={(event) => setAccountType(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                >
                    <option value="">All account types</option>
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MarketStatCard label="Accounts" value={visible.length} />
                <MarketStatCard
                    label="Orders"
                    value={visible.reduce((sum, row) => sum + row.orderCount, 0)}
                />
                <MarketStatCard
                    label="Completed"
                    value={visible.reduce((sum, row) => sum + row.completedOrderCount, 0)}
                />
                <MarketStatCard label="Purchase total" value={formatPeso(totalSpent)} />
            </div>

            {error && (
                <MarketNotice tone="error" title="Could not load accounts">
                    {error}
                </MarketNotice>
            )}

            {loading ? (
                <MarketPanel>
                    <MarketSkeleton rows={6} />
                </MarketPanel>
            ) : visible.length === 0 ? (
                <MarketPanel>
                    <MarketEmpty
                        icon={<Users size={20} />}
                        title="No accounts"
                        hint="No Student or Faculty account has placed a Marketplace order yet."
                    />
                </MarketPanel>
            ) : (
                <MarketPanel>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-[9px] uppercase tracking-wider text-slate-400">
                                    <th className="px-4 py-2.5 font-semibold">Name</th>
                                    <th className="px-4 py-2.5 font-semibold">ID number</th>
                                    <th className="px-4 py-2.5 font-semibold">Type</th>
                                    <th className="px-4 py-2.5 font-semibold">Program</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Orders</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Completed</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Total purchase</th>
                                    <th className="px-4 py-2.5 font-semibold">Last order</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {visible.map((row) => (
                                    <tr key={row.userId} className="transition hover:bg-slate-50">
                                        <td className="px-4 py-2.5">
                                            <p className="font-semibold text-slate-800">
                                                {row.fullName}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {row.email}
                                            </p>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-600">
                                            {row.idNumber}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                                {row.accountType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">
                                            {row.course || row.institute || "-"}
                                            {row.yearLevel && (
                                                <p className="text-[10px] text-slate-400">
                                                    {row.yearLevel}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-slate-600">
                                            {row.orderCount}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-slate-600">
                                            {row.completedOrderCount}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-[#106A2E]">
                                            {formatPeso(row.totalPurchaseCentavos)}
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500">
                                            {formatDate(row.lastOrderAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </MarketPanel>
            )}
        </div>
    );
}

function MarketStatCard({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-3">
            <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-slate-400">
                {label}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-800">{value}</p>
        </div>
    );
}