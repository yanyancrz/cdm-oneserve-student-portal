import { useEffect, useState } from "react";
import { Eye, Search, Users } from "lucide-react";

import { adminApi } from "../services/marketApi";
import { formatDate, formatPeso } from "../utils/format";
import {
    AdminEmpty,
    AdminNotice,
    AdminPanel,
    AdminSkeleton,
    AdminStat,
    adminSelectClass,
    adminInputClass,
} from "../components/marketAdminUi";
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

            <AdminNotice tone="info" icon={<Eye size={14} />}>
                Read-only view. The marketplace does not manage user accounts - it only
                reads the shared CDM OneServe user. Edit or deactivate an account from
                the OneServe admin, not from here.
            </AdminNotice>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1">
                    <Search
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -trangray-y-1/2 text-gray-400"
                    />
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Name, ID number or email..."
                        className={`${adminInputClass} py-2 pl-8 text-xs`}
                    />
                </div>

                <select
                    value={accountType}
                    onChange={(event) => setAccountType(event.target.value)}
                    className={adminSelectClass}
                >
                    <option value="">All account types</option>
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <AdminStat label="Accounts" value={visible.length} />
                <AdminStat
                    label="Orders"
                    value={visible.reduce((sum, row) => sum + row.orderCount, 0)}
                />
                <AdminStat
                    label="Completed"
                    value={visible.reduce((sum, row) => sum + row.completedOrderCount, 0)}
                />
                <AdminStat label="Purchase total" value={formatPeso(totalSpent)} />
            </div>

            {error && (
                <AdminNotice tone="error" title="Could not load accounts">
                    {error}
                </AdminNotice>
            )}

            {loading ? (
                <AdminPanel>
                    <AdminSkeleton rows={6} />
                </AdminPanel>
            ) : visible.length === 0 ? (
                <AdminPanel>
                    <AdminEmpty
                        icon={<Users size={20} />}
                        title="No accounts"
                        hint="No Student or Faculty account has placed a Marketplace order yet."
                    />
                </AdminPanel>
            ) : (
                <AdminPanel>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-black/[0.05] bg-gray-50/70 text-[9px] uppercase tracking-wider text-gray-400">
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
                            <tbody className="divide-y divide-black/[0.04]">
                                {visible.map((row) => (
                                    <tr key={row.userId} className="transition hover:bg-[#F3F8F4]">
                                        <td className="px-4 py-2.5">
                                            <p className="font-semibold text-gray-800">
                                                {row.fullName}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {row.email}
                                            </p>
                                        </td>
                                        <td className="px-4 py-2.5 text-gray-600">
                                            {row.idNumber}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className="rounded-full border border-[#106A2E]/15 bg-[#E1F0E4] px-2 py-0.5 text-[10px] font-semibold text-[#106A2E]">
                                                {row.accountType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-gray-500">
                                            {row.course || row.institute || "-"}
                                            {row.yearLevel && (
                                                <p className="text-[10px] text-gray-400">
                                                    {row.yearLevel}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-gray-600">
                                            {row.orderCount}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-gray-600">
                                            {row.completedOrderCount}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-[#106A2E]">
                                            {formatPeso(row.totalPurchaseCentavos)}
                                        </td>
                                        <td className="px-4 py-2.5 text-gray-500">
                                            {formatDate(row.lastOrderAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </AdminPanel>
            )}
        </div>
    );
}