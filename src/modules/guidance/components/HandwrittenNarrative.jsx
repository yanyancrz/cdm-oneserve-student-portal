import { useState } from "react";
import { Upload } from "lucide-react";
import { buildHandwrittenDocument } from "../utils/handwrittenDocument";

// Normalize camera orientation and size locally; report images never leave the
// device until the user explicitly saves them through the existing report API.
async function readPage(file) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose JPEG, PNG or WebP images.");
    if (file.size > 10 * 1024 * 1024) throw new Error("Each image must be 10 MB or smaller.");
    const bitmap = await createImageBitmap(file);
    try {
        const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return { name: file.name, data: canvas.toDataURL("image/jpeg", 0.9), width: canvas.width, height: canvas.height };
    } finally {
        bitmap.close();
    }
}

export default function HandwrittenNarrative({ onSave, disabled = false, onBusyChange }) {
    const [pages, setPages] = useState([]);
    const [title, setTitle] = useState("handwritten-narrative-report");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const working = busy || disabled;
    const setWorking = (value) => {
        setBusy(value);
        onBusyChange?.(value);
    };
    const movePage = (index, direction) => {
        setMessage("");
        setPages((previous) => {
            const next = [...previous];
            [next[index], next[index + direction]] = [next[index + direction], next[index]];
            return next;
        });
    };
    const upload = async (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = "";
        if (!files.length) return;
        setMessage("");
        setWorking(true);
        try {
            if (pages.length + files.length > 10) throw new Error("A report can contain up to 10 images.");
            const next = [];
            for (const file of files) next.push(await readPage(file));
            setPages((previous) => [...previous, ...next]);
        } catch (error) { setMessage(error.message || "Could not read the image. Try a JPEG or PNG scan."); }
        finally { setWorking(false); }
    };
    const convert = async (format, save) => {
        setWorking(true);
        setMessage("");
        try {
            const blob = await buildHandwrittenDocument(pages, format);
            const name = `${title.trim().replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 94) || "narrative-report"}.${format}`;
            if (save) {
                if (blob.size > 10 * 1024 * 1024) throw new Error("The converted document exceeds the 10 MB upload limit. Remove some pages or use smaller images, then try again.");
                await onSave(new File([blob], name, { type: blob.type }));
                setMessage("Converted document saved.");
            } else {
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = name;
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
        } catch (error) { setMessage(error.message || "Could not convert the report. Please try again."); }
        finally { setWorking(false); }
    };
    const button = "rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-50";
    return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold text-slate-800">Handwritten narrative report</h2>
        <p className="text-xs text-slate-500">Upload photos or scanned pages in reading order. PDF and Word exports preserve your handwriting as images, without text transcription. Images stay on this device until you save the converted document.</p>
        <label className="block text-xs font-semibold">Document name<input value={title} onChange={(event) => setTitle(event.target.value)} disabled={working} className="mt-1 block w-full rounded-lg border border-slate-200 p-2" /></label>
        <label className="block text-xs font-semibold text-slate-700">
            <span className="block">Add report images (JPEG, PNG, WebP; up to 10 pages, 10 MB each)</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={working} onChange={upload} className="peer sr-only" />
            <span className="mt-2 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-800 bg-[#106A2E] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0D5927] active:translate-y-px active:bg-[#0A4720] active:shadow-none peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600 peer-focus-visible:ring-offset-2 peer-disabled:pointer-events-none peer-disabled:opacity-50 motion-reduce:transition-none sm:w-auto">
                <Upload size={16} aria-hidden="true" />
                Choose Files
            </span>
        </label>
        <ol className="flex flex-wrap gap-3">{pages.map((page, index) => <li key={`${index}-${page.name}`} className="w-32 space-y-1">
            <img src={page.data} alt={`Report page ${index + 1}`} className="h-36 w-32 rounded border object-contain" />
            <p className="truncate text-xs">{index + 1}. {page.name}</p>
            <div className="flex flex-wrap gap-1">
                <button type="button" disabled={working || index === 0} onClick={() => movePage(index, -1)} aria-label={`Move page ${index + 1} earlier`} className={button}>Earlier</button>
                <button type="button" disabled={working || index === pages.length - 1} onClick={() => movePage(index, 1)} aria-label={`Move page ${index + 1} later`} className={button}>Later</button>
            </div>
            <button type="button" disabled={working} onClick={() => setPages((previous) => previous.filter((_, i) => i !== index))} className={button}>Remove page</button>
        </li>)}</ol>
        <div className="flex flex-wrap gap-2">{["pdf", "docx"].map((format) => <span key={format} className="flex flex-wrap gap-2">
            <button type="button" className={button} disabled={working || !pages.length} onClick={() => convert(format, false)}>Export {format === "pdf" ? "PDF" : "Word (.docx)"}</button>
            {onSave && <button type="button" className={button} disabled={working || !pages.length} onClick={() => convert(format, true)}>Save {format.toUpperCase()} to reports</button>}
        </span>)}</div>
        {busy && <p role="status" className="text-xs">Processing report...</p>}
        {message && <p role="status" className="text-xs text-slate-700">{message}</p>}
    </section>;
}
