import { useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";

import Modal from "../common/Modal";

export default function TempPasswordModal({ name, password, onClose }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            title="Temporary password"
            size="sm"
            footer={
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg bg-[#106A2E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                    I have saved it
                </button>
            }
        >
            <p className="text-sm text-gray-600">
                New password for <span className="font-semibold text-[#1F1F1F]">{name}</span>:
            </p>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-black/[0.08] bg-gray-50 px-4 py-3">
                <code className="select-all text-base font-semibold tracking-wider text-[#1F1F1F]">{password}</code>

                <button
                    type="button"
                    onClick={copy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.1] bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                    {copied ? <Check size={14} className="text-[#106A2E]" /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>

            <p className="mt-4 flex items-start gap-2 rounded-lg bg-[#FFF9E0] px-3 py-2 text-xs text-[#5C4A00]">
                <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                This is shown only once and cannot be viewed again. Give it to the staff member in person.
            </p>
        </Modal>
    );
}