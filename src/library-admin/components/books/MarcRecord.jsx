import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

import { buildMarcFields, marcToText } from "../../utils/marcFormatter";

export default function MarcRecord({ book }) {
    const fields = useMemo(() => buildMarcFields(book), [book]);
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(marcToText(fields));
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-gray-500">Simplified MARC 21 record. # means a blank indicator.</p>

                <button
                    type="button"
                    onClick={copy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.1] px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                >
                    {copied ? <Check size={14} className="text-[#106A2E]" /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy MARC Record"}
                </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-black/[0.06]">
                <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-black/[0.05] font-mono text-[13px]">
                        {fields.map((f) => (
                            <tr key={f.tag}>
                                <td className="w-14 px-4 py-2.5 font-semibold text-[#106A2E]">{f.tag}</td>
                                <td className="w-12 px-2 py-2.5 text-gray-400">{f.indicators}</td>
                                <td className="px-3 py-2.5 text-gray-800">{f.value}</td>
                                <td className="hidden px-4 py-2.5 font-sans text-xs text-gray-400 md:table-cell">
                                    {f.label}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}