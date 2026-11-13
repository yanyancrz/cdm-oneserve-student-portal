import { API_URL } from "../config/api";

const BASE = `${API_URL}/api/admin/services/clinic/medical-records`;

export async function loadClinicRecords(path, signal) {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    const response = await fetch(`${BASE}${path}`, {
        signal,
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Unable to load Clinic records.");
    return data;
}

