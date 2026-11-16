export async function buildHandwrittenDocument(pages, format) {
    if (!pages.length) throw new Error("Upload at least one report image.");
    if (!["pdf", "docx"].includes(format)) throw new Error("Choose PDF or Word format.");
    if (format === "pdf") {
        const { jsPDF } = await import("jspdf");
        const document = new jsPDF();
        pages.forEach((page, index) => {
            if (index) document.addPage();
            const scale = Math.min(180 / page.width, 267 / page.height);
            const width = page.width * scale;
            const height = page.height * scale;
            document.addImage(page.data, "JPEG", (210 - width) / 2, 15, width, height);
        });
        return document.output("blob");
    }
    const { Document, Packer, Paragraph, ImageRun } = await import("docx");
    return Packer.toBlob(new Document({ sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 850, bottom: 850, left: 850, right: 850 } } },
        children: pages.map((page, index) => {
            const scale = Math.min(660 / page.width, 940 / page.height);
            const bytes = Uint8Array.from(atob(page.data.split(",")[1]), (char) => char.charCodeAt(0));
            return new Paragraph({ pageBreakBefore: index > 0, children: [new ImageRun({ type: "jpg", data: bytes, transformation: { width: Math.round(page.width * scale), height: Math.round(page.height * scale) } })] });
        }),
    }] }));
}
