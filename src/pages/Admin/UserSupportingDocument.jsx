import { useEffect, useState } from "react";
import { API_BASE, authHeaders, formatDate, outlineButton } from "./userAdminUtils";

export default function UserSupportingDocument({ userId }) {
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [preview, setPreview] = useState(null);
    const [opening, setOpening] = useState(false);
    const endpoint = `${API_BASE}/${userId}/supporting-document`;

    useEffect(() => {
        const controller = new AbortController();
        fetch(endpoint, { headers: authHeaders(), signal: controller.signal })
            .then(async (response) => {
                if (response.status === 404) return null;
                if (!response.ok) throw new Error("Unable to load supporting document.");
                return response.json();
            })
            .then((data) => { if (!controller.signal.aborted) setDocument(data); })
            .catch((err) => { if (!controller.signal.aborted) setError(err.message); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [endpoint]);

    useEffect(() => {
        const controller = new AbortController();
        let objectUrl;
        if (opening) {
            fetch(`${endpoint}/content`, { headers: authHeaders(), signal: controller.signal })
                .then(async (response) => {
                    if (!response.ok) throw new Error("Unable to open supporting document. Please try again.");
                    return response.blob();
                })
                .then((blob) => {
                    if (controller.signal.aborted) return;
                    objectUrl = URL.createObjectURL(blob);
                    setPreview(objectUrl);
                })
                .catch((err) => { if (!controller.signal.aborted) { setError(err.message); setOpening(false); } });
        }
        return () => {
            controller.abort();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [endpoint, opening]);

    return (
        <section className="mt-4 rounded-xl border border-gray-200 p-3" aria-label="Supporting document">
            <h3 className="text-sm font-semibold text-gray-700">Supporting document</h3>
            {loading ? <p className="mt-2 text-xs text-gray-500">Loading document...</p>
                : !document && !error ? <p className="mt-2 text-xs text-gray-500">No supporting document uploaded.</p>
                : document && <>
                    <p className="mt-2 break-all text-sm text-gray-700">{document.fileName}</p>
                    <p className="mt-1 text-xs text-gray-500">Uploaded {formatDate(document.uploadedAtUtc)} · {(document.size / 1024 / 1024).toFixed(2)} MB</p>
                    {!preview && <button type="button" disabled={opening} className={`${outlineButton} mt-3`} onClick={() => { setError(""); setOpening(true); }}>
                        {opening ? "Opening..." : "View document"}
                    </button>}
                    {preview && <div className="mt-3 space-y-3">
                        {document.contentType === "application/pdf"
                            ? <iframe title="Supporting document preview" src={preview} className="h-96 w-full rounded-lg border border-gray-200" />
                            : <img src={preview} alt="Uploaded supporting document" className="max-h-96 w-full rounded-lg object-contain" />}
                        <a href={preview} download={document.fileName} className="inline-block text-xs font-semibold text-[#0E3B22] underline">Download document</a>
                    </div>}
                </>}
            {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
        </section>
    );
}
