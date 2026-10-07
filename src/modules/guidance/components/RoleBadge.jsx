import { isFaculty } from "../utils/people";

// Small "Student" / "Faculty" tag so a counselor can tell who they are meeting.
export default function RoleBadge({ role }) {
    const faculty = isFaculty(role);
    return (
        <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                faculty ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"
            }`}
        >
            {faculty ? "Faculty" : "Student"}
        </span>
    );
}