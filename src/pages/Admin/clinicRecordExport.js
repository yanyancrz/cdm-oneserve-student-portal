export const NO_MEDICAL_RECORDS = "No medical records found. The student hasn't been in clinic.";

function csvCell(value) {
    let text = value === null || value === undefined ? "" : String(value);
    // Treat spreadsheet formulas in record text as plain text.
    if (/^\s*[=+\-@]/u.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
}

function csv(headers, rows) {
    return "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
}

export function medicalRecordsCsv(student, records) {
    return csv([
        "Student number", "Student name", "Medical record ID", "Visit date",
        "Chief complaint", "Pain scale", "Diagnosis", "Medications", "Allergies",
        "Clinical notes", "Created", "Last updated",
    ], records.map(record => [
        student.idNumber, student.fullName, record.medicalRecordId, record.visitDate,
        record.chiefComplaint, record.painScale, record.diagnosis, record.medications,
        record.allergies, record.clinicalNotes, record.createdAt, record.updatedAt,
    ]));
}

export function studentVisitsCsv(results) {
    const rows = results.flatMap(({ student, records }) => records.map(record => [
        student.idNumber, student.fullName, student.course, student.yearLevel,
        record.medicalRecordId, record.visitDate,
    ]));
    return {
        visitCount: rows.length,
        csv: csv(["Student number", "Student name", "Course", "Year level", "Medical record ID", "Visit date"], rows),
    };
}

export function downloadClinicCsv(contents, filename) {
    const blob = new Blob([contents], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function validateMedicalRecords(data) {
    if (!Array.isArray(data.records) || data.records.some(record => !record || typeof record !== "object" || Array.isArray(record))) {
        throw new Error("Invalid Clinic records response.");
    }
    return data.records;
}

// Fetch every student page, then check records through the protected API.
// An unsuccessful request fails the export instead of producing a partial report.
export async function collectClinicVisits(load, { signal, onProgress = () => {} } = {}) {
    const students = [];
    let page = 1;
    let hasMore;
    do {
        signal?.throwIfAborted();
        const data = await load(`/students?page=${page}`, signal);
        if (!Array.isArray(data.items)) throw new Error("Invalid student list response.");
        students.push(...data.items);
        hasMore = data.hasMore;
        if (hasMore && !data.items.length) throw new Error("The student list could not be completed. Please retry.");
        page += 1;
    } while (hasMore);

    const results = new Array(students.length);
    let next = 0;
    let checked = 0;
    let failed = false;
    onProgress({ checked, total: students.length });
    await Promise.all(Array.from({ length: Math.min(4, students.length) }, async () => {
        while (!failed && next < students.length) {
            signal?.throwIfAborted();
            const index = next++;
            const student = students[index];
            try {
                const data = await load(`/${student.id}`, signal);
                results[index] = { student, records: validateMedicalRecords(data) };
                checked += 1;
                if (!failed && !signal?.aborted) onProgress({ checked, total: students.length });
            } catch (error) {
                failed = true;
                throw error;
            }
        }
    }));
    return results;
}
