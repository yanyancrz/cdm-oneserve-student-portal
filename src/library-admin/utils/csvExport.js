// Cells that start with these characters can run as formulas when the CSV is
// opened in Excel. A leading apostrophe makes them plain text.
const FORMULA_START = /^[=+\-@\t\r]/;

function escapeCell(value) {
    let text = value == null ? "" : String(value);

    if (FORMULA_START.test(text)) text = `'${text}`;

    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(columns, rows) {
    const lines = [columns, ...rows].map((row) => row.map(escapeCell).join(","));
    return lines.join("\r\n");
}

export function downloadCsv(fileName, columns, rows) {
    // The BOM makes Excel read the file as UTF-8 (so "ñ" and similar stay correct).
    const blob = new Blob(["\uFEFF", toCsv(columns, rows)], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}