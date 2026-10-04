import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FileText, Image as ImageIcon, X } from "lucide-react";

import { INSTITUTES, SEMESTERS, YEAR_LEVELS } from "../../config/bookOptions";
import { fileUrl } from "../../services/bookService";

const MAX_COVER = 5 * 1024 * 1024;
const MAX_PDF = 50 * 1024 * 1024;

const EMPTY = {
    title: "", author: "", isbn: "", bookCode: "", publisher: "", category: "",
    institute: "", yearLevel: "", semester: "", ddc: "", callNo: "", publishYear: "",
    edition: "", language: "English", shelfLocation: "", totalCopies: 1, description: "",
};

export function bookToForm(book) {
    if (!book) return EMPTY;

    return Object.fromEntries(
        Object.keys(EMPTY).map((key) => [key, book[key] ?? EMPTY[key]])
    );
}

const inputBase =
    "h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-800 outline-none transition focus:ring-2";

const inputClass = (error) =>
    `${inputBase} ${
        error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
            : "border-black/[0.12] focus:border-[#106A2E] focus:ring-[#106A2E]/15"
    }`;

const textareaClass =
    "w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-[#106A2E] focus:ring-2 focus:ring-[#106A2E]/15";

function formatSize(bytes) {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function Field({ label, required, error, className = "", children }) {
    return (
        <label className={`block ${className}`}>
            <span className="mb-1 block text-xs font-medium text-gray-600">
                {label}
                {required && <span className="text-red-500"> *</span>}
            </span>
            {children}
            {error && <span className="mt-1 block text-[11px] text-red-600">{error}</span>}
        </label>
    );
}

function Section({ title, description, children }) {
    return (
        <section className="space-y-3 border-t border-black/[0.06] pt-5 first:border-t-0 first:pt-0">
            <div>
                <h3 className="text-sm font-semibold text-[#1F1F1F]">{title}</h3>
                {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">{children}</div>
        </section>
    );
}

function FilePicker({ label, hint, accept, file, thumb, icon: Icon, onPick, onClear, note, className = "" }) {
    const inputRef = useRef(null);

    const clear = () => {
        if (inputRef.current) inputRef.current.value = "";
        onClear();
    };

    return (
        <div className={className}>
            <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>

            <div className="flex items-center gap-3 rounded-lg border border-dashed border-black/[0.15] bg-gray-50/60 p-3">
                {thumb ? (
                    <img src={thumb} alt="" className="h-14 w-10 shrink-0 rounded object-cover" />
                ) : (
                    <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-[#E1F0E4] text-[#106A2E]">
                        <Icon size={18} />
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-700">{file ? file.name : "No file chosen"}</p>
                    <p className="text-[11px] text-gray-400">{file ? formatSize(file.size) : hint}</p>
                </div>

                <input ref={inputRef} type="file" accept={accept} onChange={onPick} className="sr-only" tabIndex={-1} />

                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="shrink-0 rounded-lg bg-[#E1F0E4] px-3 py-1.5 text-xs font-medium text-[#106A2E] transition hover:bg-[#d3e8d8]"
                >
                    {file ? "Change" : "Choose file"}
                </button>

                {file && (
                    <button
                        type="button"
                        onClick={clear}
                        aria-label={`Remove ${file.name}`}
                        className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {note && <p className="mt-1 text-[11px] text-gray-400">{note}</p>}
        </div>
    );
}

export default function BookForm({ formId, initial, existingCoverPath, hasPdf, onSubmit }) {
    const [values, setValues] = useState(() => bookToForm(initial));
    const [errors, setErrors] = useState({});
    const [cover, setCover] = useState(null);
    const [pdf, setPdf] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);

    // Preview the newly chosen cover, and free the object URL afterwards.
    useEffect(() => {
        if (!cover) {
            setCoverPreview(null);
            return undefined;
        }

        const url = URL.createObjectURL(cover);
        setCoverPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [cover]);

    const bind = (key) => ({
        value: values[key] ?? "",
        onChange: (e) => {
            const next = e.target.value;
            setValues((prev) => ({ ...prev, [key]: next }));
            setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
        },
    });

    const pickFile = (kind) => (e) => {
        const file = e.target.files?.[0] || null;
        const max = kind === "cover" ? MAX_COVER : MAX_PDF;

        if (file && file.size > max) {
            toast.error(`File is too large. Maximum is ${max / 1024 / 1024} MB.`);
            e.target.value = "";
            return;
        }

        kind === "cover" ? setCover(file) : setPdf(file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const next = {};

        if (!values.title.trim()) next.title = "Enter the title.";
        if (!values.author.trim()) next.author = "Enter the author.";
        if (!String(values.isbn).trim()) next.isbn = "Enter the ISBN.";
        if (!(Number(values.totalCopies) >= 1)) next.totalCopies = "Must be at least 1.";

        setErrors(next);

        if (Object.keys(next).length > 0) {
            toast.error("Check the highlighted fields.");
            return;
        }

        onSubmit(values, { cover, pdf });
    };

    const coverSrc = fileUrl(existingCoverPath);

    return (
        <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
            <Section title="Basic information">
                <Field label="Title" required error={errors.title} className="md:col-span-8">
                    <input className={inputClass(errors.title)} maxLength={255} {...bind("title")} />
                </Field>
                <Field label="ISBN" required error={errors.isbn} className="md:col-span-4">
                    <input className={inputClass(errors.isbn)} maxLength={20} {...bind("isbn")} />
                </Field>

                <Field label="Author" required error={errors.author} className="md:col-span-6">
                    <input className={inputClass(errors.author)} maxLength={255} {...bind("author")} />
                </Field>
                <Field label="Publisher" className="md:col-span-6">
                    <input className={inputClass()} maxLength={255} {...bind("publisher")} />
                </Field>

                <Field label="Description" className="md:col-span-12">
                    <textarea rows={3} className={textareaClass} {...bind("description")} />
                </Field>
            </Section>

            <Section title="Classification" description="Used for filtering and finding the book on the shelf.">
                <Field label="Institute" className="md:col-span-4">
                    <select className={inputClass()} {...bind("institute")}>
                        <option value="">Not set</option>
                        {INSTITUTES.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Year level" className="md:col-span-4">
                    <select className={inputClass()} {...bind("yearLevel")}>
                        <option value="">Not set</option>
                        {YEAR_LEVELS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Semester" className="md:col-span-4">
                    <select className={inputClass()} {...bind("semester")}>
                        <option value="">Not set</option>
                        {SEMESTERS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </Field>

                <Field label="Category / Subject" className="md:col-span-4">
                    <input className={inputClass()} maxLength={100} {...bind("category")} />
                </Field>
                <Field label="DDC" className="md:col-span-4">
                    <input className={inputClass()} maxLength={50} {...bind("ddc")} />
                </Field>
                <Field label="Call number" className="md:col-span-4">
                    <input className={inputClass()} maxLength={100} {...bind("callNo")} />
                </Field>
            </Section>

            <Section title="Publication">
                <Field label="Book code" className="md:col-span-3">
                    <input className={inputClass()} maxLength={50} {...bind("bookCode")} />
                </Field>
                <Field label="Edition" className="md:col-span-3">
                    <input className={inputClass()} maxLength={50} {...bind("edition")} />
                </Field>
                <Field label="Publish year" className="md:col-span-3">
                    <input type="number" inputMode="numeric" className={inputClass()} {...bind("publishYear")} />
                </Field>
                <Field label="Language" className="md:col-span-3">
                    <input className={inputClass()} maxLength={50} {...bind("language")} />
                </Field>
            </Section>

            <Section title="Copies and location">
                <Field label="Shelf location" className="md:col-span-8">
                    <input className={inputClass()} maxLength={100} {...bind("shelfLocation")} />
                </Field>
                <Field label="Total copies" required error={errors.totalCopies} className="md:col-span-4">
                    <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        className={inputClass(errors.totalCopies)}
                        {...bind("totalCopies")}
                    />
                </Field>
            </Section>

            <Section title="Files" description="Both are optional. Students can open and download the PDF from the book page.">
                <FilePicker
                    className="md:col-span-6"
                    label="Cover image"
                    hint="JPG, PNG or WEBP, up to 5 MB"
                    accept="image/jpeg,image/png,image/webp"
                    icon={ImageIcon}
                    file={cover}
                    thumb={coverPreview || coverSrc}
                    onPick={pickFile("cover")}
                    onClear={() => setCover(null)}
                />

                <FilePicker
                    className="md:col-span-6"
                    label="E-book PDF"
                    hint="PDF, up to 50 MB"
                    accept="application/pdf"
                    icon={FileText}
                    file={pdf}
                    note={hasPdf && !pdf ? "A PDF is already attached. Choosing a file replaces it." : undefined}
                    onPick={pickFile("pdf")}
                    onClear={() => setPdf(null)}
                />
            </Section>
        </form>
    );
}