import test from "node:test";
import assert from "node:assert/strict";
import {
    collectClinicVisits, medicalRecordsCsv, studentVisitsCsv, validateMedicalRecords,
} from "../src/pages/Admin/clinicRecordExport.js";

test("student export includes the full medical record and preserves zero, quotes and multiline text", () => {
    const csv = medicalRecordsCsv({ idNumber: "00123", fullName: "Cruz, Alhianne" }, [{
        medicalRecordId: 7, visitDate: "2026-11-14T09:30:00", chiefComplaint: 'Pain, "mild"',
        painScale: 0, diagnosis: "Assessment", medications: "Line one\nLine two",
        allergies: "None", clinicalNotes: "Follow-up: ñ", createdAt: "2026-11-14T09:31:00",
    }]);
    assert.ok(csv.startsWith("\uFEFF"));
    assert.ok(csv.includes('"00123","Cruz, Alhianne","7","2026-11-14T09:30:00"'));
    assert.ok(csv.includes('"Pain, ""mild""","0","Assessment","Line one\nLine two"'));
    assert.ok(csv.includes('"None","Follow-up: ñ","2026-11-14T09:31:00",""'));
});

test("visit export includes each visit, omits students without records and keeps missing dates empty", () => {
    const report = studentVisitsCsv([
        { student: { idNumber: "A", fullName: "Student A" }, records: [
            { medicalRecordId: 1, visitDate: "2026-11-10" },
            { medicalRecordId: 2, visitDate: "2026-11-14" },
            { medicalRecordId: 3, createdAt: "2026-11-15" },
        ] },
        { student: { idNumber: "B", fullName: "Student B" }, records: [] },
    ]);
    assert.equal(report.visitCount, 3);
    assert.ok(report.csv.includes('"1","2026-11-10"'));
    assert.ok(report.csv.includes('"2","2026-11-14"'));
    assert.ok(report.csv.endsWith('"3",""'));
    assert.ok(!report.csv.includes("Student B"));
    assert.ok(!report.csv.includes("2026-11-15"));
    assert.equal(studentVisitsCsv([]).visitCount, 0);
});

test("spreadsheet formula text is exported as plain text", () => {
    const csv = medicalRecordsCsv({ fullName: "=HYPERLINK(1)", idNumber: "  +123" }, [{
        chiefComplaint: "@formula", clinicalNotes: '-dangerous "text"',
    }]);
    assert.ok(csv.includes('"\'=HYPERLINK(1)"'));
    assert.ok(csv.includes('"\'  +123"'));
    assert.ok(csv.includes('"\'@formula"'));
    assert.ok(csv.includes('"\'-dangerous ""text"""'));
});

test("bulk export fetches all student pages and limits concurrent record requests", async () => {
    const students = Array.from({ length: 23 }, (_, i) => ({ id: i + 1, fullName: `Student ${i + 1}` }));
    let active = 0;
    let peak = 0;
    const calls = [];
    const progress = [];
    const results = await collectClinicVisits(async path => {
        calls.push(path);
        if (path === "/students?page=1") return { items: students.slice(0, 20), hasMore: true };
        if (path === "/students?page=2") return { items: students.slice(20), hasMore: false };
        active++;
        peak = Math.max(peak, active);
        await new Promise(resolve => setTimeout(resolve, 2));
        active--;
        const id = Number(path.slice(1));
        return { records: id % 2 ? [{ medicalRecordId: id, visitDate: "2026-11-14" }] : [] };
    }, { onProgress: value => progress.push(value) });
    assert.equal(results.length, 23);
    assert.equal(calls.filter(path => !path.startsWith("/students")).length, 23);
    assert.equal(peak, 4);
    assert.deepEqual(results.map(result => result.student.id), students.map(student => student.id));
    assert.equal(studentVisitsCsv(results).visitCount, 12);
    assert.deepEqual(progress.at(-1), { checked: 23, total: 23 });
});

test("failed, malformed or cancelled requests never produce a partial export", async () => {
    await assert.rejects(collectClinicVisits(async path => {
        if (path.startsWith("/students")) return { items: [{ id: 1 }, { id: 2 }], hasMore: false };
        if (path === "/2") throw new Error("CMS unavailable");
        return { records: [] };
    }), /CMS unavailable/);
    await assert.rejects(collectClinicVisits(async () => ({ items: [], hasMore: true })), /could not be completed/);
    assert.throws(() => validateMedicalRecords({ records: [null] }), /Invalid/);
    assert.throws(() => validateMedicalRecords({ records: {} }), /Invalid/);
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(collectClinicVisits(async () => { throw new Error("Unexpected request"); }, { signal: controller.signal }), { name: "AbortError" });
});
