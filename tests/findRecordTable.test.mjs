import assert from "node:assert/strict";
import { test } from "node:test";
import { reportCategories, selectRecords } from "../src/lost-found/components/recordTable.js";

const reports = Array.from({ length: 85 }, (_, index) => {
    const reportId = index + 1;
    return {
        reportId,
        itemName: `Item ${reportId}`,
        reporterName: index % 2 === 0 ? "Student Alpha" : "Student Beta",
        reportType: index % 2 === 0 ? "Found" : "Lost",
        lifecycleStatus: index < 5 ? "Returned" : "Claimed",
    };
});

function select(options = {}) {
    return selectRecords(reports, {
        fields: ["itemName", "reporterName"],
        categories: reportCategories,
        search: "",
        category: "",
        sort: { key: "reportId", desc: false },
        page: 1,
        ...options,
    });
}

test("paginates all 85 records and reverses the complete set before taking a page", () => {
    const first = select();
    assert.deepEqual(first.pagination, { page: 1, pages: 5, total: 85 });
    assert.equal(first.rows.length, 20);
    assert.equal(first.rows.at(-1).reportId, 20);
    assert.equal(select({ page: 2 }).rows[0].reportId, 21);
    assert.equal(select({ page: 5 }).rows.length, 5);
    const reversed = select({ sort: { key: "itemName", desc: true } });
    assert.equal(reversed.rows[0].reportId, 85);
    assert.equal(reversed.rows.at(-1).reportId, 66);
});

test("combines name search with a category and uses the filtered page count", () => {
    const found = select({ search: "ALPHA", category: "Found", page: 9 });
    assert.deepEqual(found.pagination, { page: 3, pages: 3, total: 43 });
    assert.deepEqual(found.rows.map((row) => row.reportId), [81, 83, 85]);
    assert.equal(found.counts.Returned, 3);
    assert.equal(found.counts.Lost, 0);
});

test("searches formatted item IDs exactly and shows an empty page for no matches", () => {
    assert.deepEqual(select({ search: "#005" }).rows.map((row) => row.reportId), [5]);
    assert.deepEqual(select({ search: "#005", category: "Lost" }).pagination, {
        page: 1, pages: 1, total: 0,
    });
});
