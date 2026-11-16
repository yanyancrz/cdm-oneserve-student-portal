import test from "node:test";
import assert from "node:assert/strict";
import { filterRecentRecords, formatServiceStatus, getRecentSection } from "../src/pages/Admin/serviceRecentRecords.js";

test("Library activity uses its own heading; every subpage uses the matching record source", () => {
    assert.equal(getRecentSection("library", "activity", {}).title, "Recent library activity");
    const features = { library: ["inventory", "circulation", "reservations"], guidance: ["appointments", "systems"], "lost-found": ["claims", "pickups"] };
    for (const [module, views] of Object.entries(features)) for (const view of views) {
        const row = { id: 1, title: `${module}/${view}` };
        const section = getRecentSection(module, view, { recentActivity: [{ title: "wrong source" }], recentReports: [], recentRecords: { [view]: [row] } });
        assert.deepEqual(section.rows, [row]);
        assert.ok(section.columns.some(column => column.key === "status"));
    }
});

test("Lost and Found activity merges actual reports, claims and pickups in newest order", () => {
    const section = getRecentSection("lost-found", "activity", {
        recentReports: [{ reportId: 1, itemName: "Wallet", reportType: "Lost", createdAt: "2026-11-01T10:00:00Z" }],
        recentRecords: { claims: [{ id: 1, title: "Wallet", at: "2026-11-02T10:00:00Z" }], pickups: [{ id: 1, title: "Wallet", at: "2026-11-03T10:00:00Z" }] },
    });
    assert.deepEqual(section.rows.map(row => row.id), ["Pickup #1", "Claim #1", "Report #1"]);
    assert.equal(getRecentSection("lost-found", "claims", {}).title, "Recent claims");
    assert.deepEqual(getRecentSection("library", "reservations", {}).rows, []);
});

test("Search and status filters combine and clearing filters restores the available records", () => {
    const { columns } = getRecentSection("lost-found", "claims", {});
    const rows = [{ id: 1, title: "Black wallet", detail: "Personal", status: "Approved" }, { id: 2, title: "Black bag", detail: "Personal", status: "Processing" }];
    assert.deepEqual(filterRecentRecords(rows, columns, " BLACK ", "Approved"), [rows[0]]);
    assert.deepEqual(filterRecentRecords(rows, columns, "personal", ""), rows);
    assert.deepEqual(filterRecentRecords(rows, columns, "no match", ""), []);
    assert.deepEqual(filterRecentRecords(rows, columns, "", ""), rows);
});

test("Appointment History displays and searches No Show while retaining the stored status", () => {
    const section = getRecentSection("guidance", "appointments", { recentRecords: { appointments: [{ id: 1, title: "Appointment #1", status: "NoShow" }] } });
    assert.equal(section.title, "Appointment History");
    assert.equal(formatServiceStatus("NoShow"), "No Show");
    assert.equal(formatServiceStatus("Confirmed"), "Confirmed");
    assert.equal(filterRecentRecords(section.rows, section.columns, "no show", "NoShow").length, 1);
    assert.equal(section.rows[0].status, "NoShow");
});

test("Appointment History shows and searches participants instead of appointment references", () => {
    const record = { id: 5, title: "Appointment #5", studentName: "Ana Santos", counselorName: "Marco Reyes", status: "Confirmed" };
    const section = getRecentSection("guidance", "appointments", { recentRecords: { appointments: [record] } });
    assert.deepEqual(section.columns.map(column => column.label), ["Student", "Counselor", "Schedule", "Status", "Last recorded"]);
    assert.deepEqual(filterRecentRecords(section.rows, section.columns, "ana", ""), [record]);
    assert.deepEqual(filterRecentRecords(section.rows, section.columns, "reyes", ""), [record]);
});
