// Display only. The backend is the authoritative source of every fine amount.
export function formatPeso(amount) {
    const value = Number(amount) || 0;
    return `₱${value.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}