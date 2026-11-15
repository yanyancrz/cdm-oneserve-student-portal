function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function createReportBlob({ csv, title, subtitle = "", format, clinicPdf }) {
    if (format === "csv") return new Blob([csv], { type: "text/csv;charset=utf-8" });
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(csv.replace(/^\uFEFF/, ""), { type: "string", raw: true });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: "", raw: true });
    if (format === "xlsx") {
        const output = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet(rows);
        sheet["!cols"] = (rows[0] || []).map(() => ({ wch: 24 }));
        XLSX.utils.book_append_sheet(output, sheet, "Report");
        return new Blob([XLSX.write(output, { bookType: "xlsx", type: "array" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    }
    if (format === "pdf") {
        if (clinicPdf) {
            const { createClinicPdf } = await import("./clinicPdf.js");
            return createClinicPdf(rows, { title, subtitle, individual: clinicPdf === "student" });
        }
        const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
        const doc = new jsPDF({ orientation: rows[0]?.length > 6 ? "landscape" : "portrait" });
        doc.setFontSize(16);
        doc.text(title, 14, 18);
        doc.setFontSize(9);
        const description = doc.splitTextToSize(`CDM OneServe | ${subtitle || "Report"} | Generated ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 28);
        doc.text(description, 14, 25);
        autoTable(doc, {
            head: [rows[0] || []], body: rows.slice(1), startY: 30 + description.length * 4,
            styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
            headStyles: { fillColor: [14, 59, 34] },
            horizontalPageBreak: true,
            margin: { top: 14, bottom: 16 },
            didDrawPage: () => {
                doc.setFontSize(8);
                doc.text(`Page ${doc.getNumberOfPages()}`, 14, doc.internal.pageSize.getHeight() - 8);
            },
        });
        return doc.output("blob");
    }
    if (format === "docx") {
        const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel, PageOrientation } = await import("docx");
        const document = new Document({ sections: [{
            properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
            children: [new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
                new Paragraph(`CDM OneServe | ${subtitle} | Generated ${new Date().toLocaleString()}`),
                new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map((row, index) => new TableRow({
                    tableHeader: index === 0,
                    children: row.map(value => new TableCell({ children: String(value).split(/\r?\n/).map(text => new Paragraph(text)) })),
                })) }),
            ],
        }] });
        return Packer.toBlob(document);
    }
    throw new Error("Unsupported export format.");
}

export async function exportReport(options) {
    const blob = await createReportBlob(options);
    options.signal?.throwIfAborted();
    download(blob, `${options.filename}.${options.format}`);
}
