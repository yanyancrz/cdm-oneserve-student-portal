import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

// Clinic exports use a portrait form rather than a wide spreadsheet table.
export function createClinicPdf(rows, { title, subtitle, individual = false }) {
    const doc = new jsPDF({ orientation: "portrait", format: "a4" });
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const margin = 18;
    const header = () => {
        doc.setTextColor(14, 59, 34);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("CDM ONESERVE | CLINIC", width / 2, 17, { align: "center" });
        doc.setFontSize(15);
        doc.text(title, width / 2, 25, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(70);
        const lines = doc.splitTextToSize(subtitle || "Patient medical records", width - margin * 2);
        doc.text(lines, margin, 34);
        doc.setDrawColor(14, 59, 34);
        doc.line(margin, 37 + (lines.length - 1) * 4, width - margin, 37 + (lines.length - 1) * 4);
        return 43 + (lines.length - 1) * 4;
    };
    const signatories = y => {
        if (y + 44 > height - 20) {
            doc.addPage();
            y = header();
        }
        doc.setTextColor(45);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const span = (width - margin * 2 - 18) / 2;
        [[margin, "Prepared by", "Name and signature"], [margin + span + 18, "Reviewed by", "Clinic authorized signatory"]].forEach(([x, label, role]) => {
            doc.text(label, x, y + 7);
            doc.setDrawColor(100);
            doc.line(x, y + 23, x + span, y + 23);
            doc.setFontSize(8);
            doc.text(role, x, y + 28);
            doc.text("Date: ____________________", x, y + 36);
            doc.setFontSize(9);
        });
    };
    const start = header();
    const common = {
        theme: "grid", styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak", lineColor: [220, 225, 220] },
        headStyles: { fillColor: [14, 59, 34] }, margin: { top: start, bottom: 20, left: margin, right: margin },
        willDrawPage: () => header(),
    };
    if (individual) {
        rows.slice(1).forEach((record, index) => {
            if (index > 0) doc.addPage();
            const y = header();
            doc.setFontSize(9);
            doc.text(`Medical record ${index + 1} of ${rows.length - 1}`, margin, y + 2);
            autoTable(doc, {
                ...common, startY: y + 6, head: [["Student / consultation details", ""]],
                body: rows[0].map((label, column) => [label, record[column] || "Not recorded"]),
                columnStyles: { 0: { cellWidth: 43, fontStyle: "bold", fillColor: [246, 248, 246] } },
            });
            signatories(doc.lastAutoTable.finalY + 5);
        });
    } else {
        autoTable(doc, { ...common, startY: start, head: [rows[0]], body: rows.slice(1), styles: { ...common.styles, fontSize: 8, cellPadding: 2 } });
        signatories(doc.lastAutoTable.finalY + 5);
    }
    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page++) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100);
        doc.text("Confidential | For authorized use only", margin, height - 10);
        doc.text(`Page ${page} of ${pages}`, width - margin, height - 10, { align: "right" });
    }
    return doc.output("blob");
}
