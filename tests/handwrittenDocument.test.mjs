import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as XLSX from "xlsx";
import { buildHandwrittenDocument } from "../src/modules/guidance/utils/handwrittenDocument.js";

const image = await readFile(new URL("../src/assets/images/install/safari.jpg", import.meta.url));
const data = `data:image/jpeg;base64,${image.toString("base64")}`;
const pages = [
    { data, width: 800, height: 1200 },
    { data, width: 1200, height: 600 },
];

test("handwritten PDF contains one image page per scan and fits portrait and landscape scans", async () => {
    const blob = await buildHandwrittenDocument(pages, "pdf");
    const pdf = await blob.text();
    assert.equal(blob.type, "application/pdf");
    assert.ok(pdf.startsWith("%PDF-"));
    assert.equal((pdf.match(/\/Type \/Page\b/g) || []).length, 2);
    assert.ok(pdf.includes("/Subtype /Image"));
    const transforms = [...pdf.matchAll(/([\d.]+) 0 0 ([\d.]+) ([\d.]+) ([\d.]+) cm/g)];
    assert.equal(transforms.length, 2);
    transforms.forEach(([, width, height, x, y]) => {
        assert.ok(+width > 0 && +height > 0);
        assert.ok(+x >= 0 && +y >= 0);
        assert.ok(+width + +x <= 596 && +height + +y <= 843);
    });
});

test("handwritten Word document embeds scans and separates them into pages", async () => {
    const blob = await buildHandwrittenDocument(pages, "docx");
    const archive = XLSX.default.CFB.read(new Uint8Array(await blob.arrayBuffer()), { type: "array" });
    const document = archive.FileIndex[archive.FullPaths.indexOf("Root Entry/word/document.xml")];
    assert.ok(document);
    const xml = new TextDecoder().decode(document.content);
    assert.equal((xml.match(/<w:drawing>/g) || []).length, 2);
    assert.equal((xml.match(/<w:pageBreakBefore\b/g) || []).length, 1);
    assert.ok(archive.FullPaths.some((path) => path.startsWith("Root Entry/word/media/") && path.endsWith(".jpg")));
});

test("conversion rejects missing pages and unsupported document formats", async () => {
    await assert.rejects(buildHandwrittenDocument([], "pdf"), /at least one/);
    await assert.rejects(buildHandwrittenDocument(pages, "txt"), /PDF or Word/);
});
