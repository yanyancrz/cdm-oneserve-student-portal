import { Link } from "react-router-dom";
import { BellRing } from "lucide-react";

export default function ReservationAlert({ count = 0, to }) {
    if (!count) return null;

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F4D35E]/60 bg-[#FFF9E0] px-5 py-3">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4D35E]/60 text-[#6B5400]">
                    <BellRing size={17} />
                </div>

                <p className="text-sm text-[#5C4A00]">
                    <span className="font-semibold">{count}</span>{" "}
                    {count === 1 ? "reservation is" : "reservations are"} waiting for approval.
                </p>
            </div>

            <Link
                to={to}
                className="rounded-lg bg-[#106A2E] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
            >
                Review reservations
            </Link>
        </div>
    );
}