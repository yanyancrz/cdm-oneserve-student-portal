// CMS Clinic module — display helpers (presentation only).
// Normal/Warning/Critical is decided by the backend; no thresholds here.

export const display = (value, suffix = "") =>
    value === null || value === undefined || value === ""
        ? "—"
        : `${value}${suffix}`;

// CMS timestamps have no timezone, so they are read as local time.
const toDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDate = (value) => {
    const d = toDate(value);
    return d
        ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : "—";
};

export const formatDateTime = (value) => {
    const d = toDate(value);
    return d
        ? d.toLocaleString("en-US", {
              year: "numeric", month: "short", day: "numeric",
              hour: "numeric", minute: "2-digit",
          })
        : "—";
};

export const formatBloodPressure = (systolic, diastolic) =>
    systolic == null || diastolic == null ? "—" : `${systolic}/${diastolic} mmHg`;

const STATUS_STYLES = {
    normal: { bg: "#E1F5EE", color: "#106A2E" },
    warning: { bg: "#FAEEDA", color: "#633806" },
    critical: { bg: "#FEE2E2", color: "#B91C1C" },
};

export const statusStyle = (status) =>
    STATUS_STYLES[String(status || "").trim().toLowerCase()] ||
    { bg: "#F3F4F6", color: "#4B5563" };
