// Builds a simplified MARC 21 view from a book. Blank indicators show as "#".
export function buildMarcFields(book) {
    const fields = [];

    const control = book.bookCode || `CDM-${String(book.bookId).padStart(6, "0")}`;
    fields.push({ tag: "001", label: "Control Number", indicators: "##", value: control });

    if (book.isbn) {
        fields.push({ tag: "020", label: "ISBN", indicators: "##", value: `$a ${book.isbn}` });
    }

    const dewey = book.ddc || book.callNo;
    if (dewey) {
        fields.push({ tag: "082", label: "Dewey Call Number", indicators: "04", value: `$a ${dewey}` });
    }

    if (book.author) {
        fields.push({ tag: "100", label: "Main Entry - Author", indicators: "1#", value: `$a ${book.author}` });
    }

    const edition = book.edition ? ` $b ${book.edition}` : "";
    fields.push({ tag: "245", label: "Title Statement", indicators: "10", value: `$a ${book.title}${edition}` });

    if (book.publisher || book.publishYear) {
        const parts = [];
        if (book.publisher) parts.push(`$b ${book.publisher}`);
        if (book.publishYear) parts.push(`$c ${book.publishYear}`);
        fields.push({ tag: "260", label: "Publication", indicators: "##", value: parts.join(" ") });
    }

    const copies = Number(book.totalCopies) || 0;
    fields.push({
        tag: "300",
        label: "Physical Details",
        indicators: "##",
        value: `$a ${copies} ${copies === 1 ? "copy" : "copies"}${book.shelfLocation ? ` $c ${book.shelfLocation}` : ""}`,
    });

    if (book.category) {
        fields.push({ tag: "650", label: "Subject", indicators: "#0", value: `$a ${book.category}` });
    }

    return fields;
}

export function marcToText(fields) {
    return fields.map((f) => `${f.tag} ${f.indicators} ${f.value}`).join("\n");
}