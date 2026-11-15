import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { createReportBlob } from "../src/pages/Admin/reportExport.js";

const csv = '\uFEFF"Student number","Name","Notes"\r\n"00123","Cruz, Ana","Line one\nLine two"';
const options = { csv, title: "Clinic records", subtitle: "2026-11-01 to 2026-11-15" };

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
