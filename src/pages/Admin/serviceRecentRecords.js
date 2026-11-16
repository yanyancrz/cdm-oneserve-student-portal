const column = (key, label, date = false) => ({ key, label, date });
const activityColumns = [column("type", "Activity"), column("title", "Details"), column("actor", "Actor"), column("at", "Time", true)];
const recordColumns = (title, detail, schedule) => [
    column("id", "Reference"), column("title", title), column("detail", detail), column("status", "Status"), column("at", "Last recorded", true),
    ...(schedule ? [column("scheduledFor", schedule, true)] : []),
];

const definitions = {
    library: {
        inventory: { title: "Recently updated books", columns: recordColumns("Book", "Category") },
        circulation: { title: "Recent borrowing and returns", columns: recordColumns("Book", "Borrower", "Due date") },
        reservations: { title: "Recent reservations", columns: recordColumns("Book", "Reserved by", "Expires") },
    },
    guidance: {
        appointments: { title: "Appointment History", columns: [column("studentName", "Student"), column("counselorName", "Counselor"), column("detail", "Schedule"), column("status", "Status"), column("at", "Last recorded", true)] },
        systems: { title: "Recent report updates", columns: recordColumns("Report", "Counselor") },
    },
    "lost-found": {
        claims: { title: "Recent claims", columns: recordColumns("Item", "Category") },
        pickups: { title: "Recent pickups", columns: recordColumns("Item", "Pickup location", "Pickup schedule") },
    },
};

export function getRecentSection(module, view, data) {
    if (module === "guidance" && view === "counselors") return {
        title: "Counselors", limit: null, rows: data?.counselors || [],
        columns: [column("fullName", "Counselor"), column("email", "Email"), column("contact", "Contact"), column("department", "Department"), column("specializations", "Specializations"), column("room", "Office / room"), column("status", "Status")],
    };
    const definition = definitions[module]?.[view];
    if (definition) return { ...definition, rows: data?.recentRecords?.[view] || [], limit: 20 };
    if (module === "lost-found") {
        if (view === "activity") {
            const reports = (data?.recentReports || []).map(x => ({ id: `Report #${x.reportId}`, title: x.itemName, detail: x.reportType, status: x.status, at: x.createdAt }));
            const claims = (data?.recentRecords?.claims || []).map(x => ({ ...x, id: `Claim #${x.id}`, detail: "Claim" }));
            const pickups = (data?.recentRecords?.pickups || []).map(x => ({ ...x, id: `Pickup #${x.id}`, detail: "Pickup" }));
            return { title: "Recent Lost & Found activity", columns: recordColumns("Item", "Record type"),
                rows: [...reports, ...claims, ...pickups].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 20), limit: 20 };
        }
        return { title: "Recent reports", columns: [column("reportId", "Reference"), column("itemName", "Item"), column("category", "Category"), column("reportType", "Type"), column("status", "Status"), column("createdAt", "Reported", true)], rows: data?.recentReports || [], limit: 10 };
    }
    return { title: module === "library" ? "Recent library activity" : "Recent counselor activity", columns: activityColumns, rows: data?.recentActivity || [], limit: 10 };
}

export function filterRecentRecords(rows, columns, search, status) {
    const query = search.trim().toLowerCase();
    return rows.filter(row => (!status || row.status === status) && (!query || columns.some(({ key }) => String(formatServiceStatus(row[key]) ?? "").toLowerCase().includes(query))));
}

export const formatServiceStatus = value => value === "NoShow" ? "No Show" : value;
