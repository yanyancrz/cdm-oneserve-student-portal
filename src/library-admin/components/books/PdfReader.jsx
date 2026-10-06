import { useEffect, useState } from "react";
import { ExternalLink, FileX2 } from "lucide-react";

import { API_URL } from "../../../config/api";
import { SkeletonPdf } from "../common/Skeleton";

// Turns the stored relative path (e.g. "library/ebooks/abc.pdf" or
// "/library/ebooks/abc.pdf") into a full URL on the API server.
// Safe whether or not API_URL ends with a slash.
function resolvePdfUrl(value) {
    if (!value || typeof value !== "string") return null;

    const path = value.trim();
    if (!path) return null;

    if (/^https?:\/\//i.test(path)) return path;

    const base = String(API_URL || "").replace(/\/+$/, "");

    return `${base}/${path.replace(/^\/+/, "")}`;
}

// Phones and browsers with the built-in PDF viewer turned off cannot show a
// PDF inside an <iframe>. They get an "Open PDF" button instead of a blank box.
function canEmbedPdf() {
    if (typeof navigator === "undefined") return true;

    if (navigator.pdfViewerEnabled === false) return false;

    return !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
}

function describeHttpError(status) {
    if (status === 404) {
        return "The PDF file was not found on the server. Re-upload it in Edit Book.";
    }

    if (status === 401 || status === 403) {
        return "The server refused to serve this file.";
    }

    return `The server returned HTTP ${status} for this file.`;
}

// Embedded PDF viewer for the "Digital Reader" tab.
// Accepts the file path under any of: src, url, pdfUrl, pdfFile, path.
export default function PdfReader({
    src,
    url,
    pdfUrl,
    pdfFile,
    path,
    title = "E-book",
    className = "h-[70vh]",
}) {
    const fileUrl = resolvePdfUrl(src ?? url ?? pdfUrl ?? pdfFile ?? path);

    // Both results are tied to the URL they belong to, so switching books
    // never shows the previous book's state.
    const [check, setCheck] = useState({ url: null, ok: true, message: "" });
    const [loadedUrl, setLoadedUrl] = useState(null);

    // Ask the server if the file exists BEFORE embedding it. A missing file
    // otherwise shows a blank frame, because the 404 page also fires onLoad.
    useEffect(() => {
        if (!fileUrl) return undefined;

        const controller = new AbortController();

        fetch(fileUrl, { method: "HEAD", signal: controller.signal })
            .then((response) => {
                setCheck({
                    url: fileUrl,
                    ok: response.ok,
                    message: response.ok ? "" : describeHttpError(response.status),
                });
            })
            .catch((error) => {
                if (error?.name === "AbortError") return;

                // Network or CORS problem on the HEAD request only: do not block.
                // Let the iframe try; it can still work.
                setCheck({ url: fileUrl, ok: true, message: "" });
            });

        return () => controller.abort();
    }, [fileUrl]);

    // ---------------------------------------------------------
    // NO FILE
    // ---------------------------------------------------------

    if (!fileUrl) {
        return (
            <div
                className={`flex flex-col items-center justify-center rounded-2xl bg-[#F7F5EF] px-6 text-center ${className}`}
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm">
                    <FileX2 size={20} />
                </div>

                <p className="mt-4 text-sm font-medium text-gray-600">No e-book uploaded</p>
                <p className="mt-1 text-xs text-gray-400">
                    Upload a PDF in Edit Book to enable the digital reader.
                </p>
            </div>
        );
    }

    const checking = check.url !== fileUrl;

    // ---------------------------------------------------------
    // CHECKING
    // ---------------------------------------------------------

    if (checking) {
        return <SkeletonPdf className={className} label="Checking e-book..." />;
    }

    // ---------------------------------------------------------
    // FILE PROBLEM (shows the real reason instead of a blank box)
    // ---------------------------------------------------------

    if (!check.ok) {
        return (
            <div
                className={`flex flex-col items-center justify-center rounded-2xl bg-[#FDF2F2] px-6 text-center ${className}`}
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-300 shadow-sm">
                    <FileX2 size={20} />
                </div>

                <p className="mt-4 text-sm font-medium text-red-700">Can't load the e-book</p>
                <p className="mt-1 max-w-sm text-xs text-red-600/80">{check.message}</p>
                <p className="mt-3 max-w-full break-all text-[10px] text-gray-400">{fileUrl}</p>
            </div>
        );
    }

    // ---------------------------------------------------------
    // CANNOT SHOW INLINE (phones, PDF viewer disabled)
    // ---------------------------------------------------------

    if (!canEmbedPdf()) {
        return (
            <div
                className={`flex flex-col items-center justify-center rounded-2xl bg-[#F7F5EF] px-6 text-center ${className}`}
            >
                <p className="text-sm font-medium text-gray-600">
                    This browser can't show PDFs inside the page.
                </p>

                <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#106A2E] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0d5927]"
                >
                    <ExternalLink size={14} />
                    Open PDF
                </a>
            </div>
        );
    }

    // ---------------------------------------------------------
    // VIEWER
    // ---------------------------------------------------------

    const loaded = loadedUrl === fileUrl;

    return (
        <div className="space-y-2">
            <div className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 ${className}`}>
                {!loaded && (
                    <div className="absolute inset-0 z-10">
                        <SkeletonPdf bare className="h-full w-full" label="Loading e-book..." />
                    </div>
                )}

                <iframe
                    key={fileUrl}
                    src={`${fileUrl}#toolbar=1&navpanes=0`}
                    title={title}
                    onLoad={() => setLoadedUrl(fileUrl)}
                    className="h-full w-full"
                />
            </div>

            <div className="flex justify-end">
                <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded text-xs font-medium text-[#106A2E] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#106A2E]/40"
                >
                    <ExternalLink size={13} />
                    Open in new tab
                </a>
            </div>
        </div>
    );
}