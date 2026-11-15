export default function ExportFormatSelect({ value, onChange, disabled, label = "Export format" }) {
    return <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
        {label}
        <select value={value} onChange={event => onChange(event.target.value)} disabled={disabled} className="rounded-xl border bg-white px-3 py-2 text-sm text-gray-800">
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV</option>
            <option value="docx">Word (.docx)</option>
        </select>
    </label>;
}
