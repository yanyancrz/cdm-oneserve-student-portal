// Appointments can be booked by Students AND Faculty. Both are shown correctly:
//   Student -> ID . Course . Year level
//   Faculty -> ID . Institute . Position
export const isFaculty = (role) => String(role || "").trim().toLowerCase() === "faculty";

export const personDetails = (p) =>
    (isFaculty(p.role)
        ? [p.studentNumber || p.idNumber, p.institute, p.position]
        : [p.studentNumber || p.idNumber, p.course, p.yearLevel]
    )
        .filter(Boolean)
        .join(" \u2022 ");