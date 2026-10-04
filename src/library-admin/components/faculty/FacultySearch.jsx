import { Search } from "lucide-react";

export default function FacultySearch({ value, onChange }) {
    return (
        <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search by name, employee ID, or email"
                className="w-full rounded-lg border border-black/[0.08] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#106A2E]"
            />
        </div>
    );
}