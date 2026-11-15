import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { createReportBlob } from "../src/pages/Admin/reportExport.js";
import { medicalRecordsCsv, studentVisitsCsv } from "../src/pages/Admin/clinicRecordExport.js";

const csv = '\uFEFF"Student number","Name","Notes"\r\n"00123","Cruz, Ana","Line one\nLine two"';
const options = { csv, title: "Clinic records", subtitle: "2026-11-01 to 2026-11-15" };

test("Clinic student slip uses portrait pages and signatories without losing long notes", async () => {
    const records = [
        { medicalRecordId: 1, visitDate: "2026-11-14", clinicalNotes: "Follow-up notes. ".repeat(800) + "FINAL CLINICAL NOTE" },
        { medicalRecordId: 2, visitDate: "2026-11-15", clinicalNotes: "SECOND CONSULTATION" },
    ];
    const blob = await createReportBlob({ ...options, csv: medicalRecordsCsv({ fullName: "Ana Cruz", idNumber: "00123" }, records), format: "pdf", clinicPdf: "student" });
    const pdf = await blob.text();
    assert.ok(pdf.includes("FINAL CLINICAL NOTE"));
    assert.ok(pdf.includes("SECOND CONSULTATION"));
    assert.ok(pdf.includes("Ana Cruz"));
    assert.equal((pdf.match(/\(Prepared by\)/g) || []).length, 2);
    assert.equal((pdf.match(/\(Reviewed by\)/g) || []).length, 2);
    const boxes = [...pdf.matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)];
    assert.ok(boxes.length >= 2);
    boxes.forEach(([, width, height]) => assert.ok(Number(width) < Number(height)));
});

test("Clinic visit report remains portrait with date range and signatories", async () => {
    const report = studentVisitsCsv([{ student: { fullName: "Ana Cruz", idNumber: "00123" }, records: [{ medicalRecordId: 1, visitDate: "2026-11-14" }] }]);
    const blob = await createReportBlob({ ...options, csv: report.csv, format: "pdf", clinicPdf: "visits" });
    const pdf = await blob.text();
    for (const text of ["Prepared by", "Reviewed by", "Ana Cruz", "2026-11-01 to 2026-11-15"]) assert.ok(pdf.includes(text));
    const [, width, height] = pdf.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
    assert.ok(Number(width) < Number(height));
});

test("CSV export preserves original rows", async () => {
    const blob = await createReportBlob({ ...options, format: "csv" });
    assert.equal(await blob.text(), csv.slice(1));
});

test("Excel export is a real workbook and preserves student numbers and multiline notes", async () => {
    const blob = await createReportBlob({ ...options, format: "xlsx" });
    const workbook = XLSX.read(await blob.arrayBuffer(), { type: "array" });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Report, { header: 1 });
    assert.deepEqual(rows[1], ["00123", "Cruz, Ana", "Line one\nLine two"]);
});

test("PDF export creates multiple pages with title, filter range and all records", async () => {
    const manyRows = '"Number","Visit"\r\n' + Array.from({ length: 180 }, (_, index) => `"${index}","Visit ${index}"`).join("\r\n");
    const blob = await createReportBlob({ ...options, csv: manyRows, format: "pdf" });
    const contents = await blob.text();
    assert.ok(contents.startsWith("%PDF-"));
    assert.ok(contents.includes("Clinic records"));
    assert.ok(contents.includes("2026-11-01 to 2026-11-15"));
    assert.ok(contents.includes("Visit 179"));
    assert.ok((contents.match(/\/Type \/Page\b/g) || []).length > 1);
});

test("Word export is a document archive with report title and record contents", async () => {
    const blob = await createReportBlob({ ...options, format: "docx" });
    const archive = XLSX.default.CFB.read(new Uint8Array(await blob.arrayBuffer()), { type: "array" });
    const file = archive.FileIndex[archive.FullPaths.indexOf("Root Entry/word/document.xml")];
    assert.ok(file);
    const xml = new TextDecoder().decode(file.content);
    for (const text of ["Clinic records", "00123", "Cruz, Ana", "Line one", "Line two", "2026-11-01 to 2026-11-15"]) assert.ok(xml.includes(text));
});
