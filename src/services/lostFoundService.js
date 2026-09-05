import { API_URL } from "../config/api";

const LOST_FOUND_API = `${API_URL}/api/lostfound`;

// ==========================================
// CREATE LOST / FOUND REPORT
// POST: /api/lostfound
// ==========================================

export const createReport = async (reportData) => {
    const response = await fetch(LOST_FOUND_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to create report.");
    }

    return await response.json();
};


// ==========================================
// GET ALL REPORTS
// GET: /api/lostfound
// ==========================================

export const getAllReports = async () => {
    const response = await fetch(LOST_FOUND_API);

    if (!response.ok) {
        throw new Error("Failed to fetch Lost & Found reports.");
    }

    return await response.json();
};


// ==========================================
// GET REPORT BY ID
// GET: /api/lostfound/{id}
// ==========================================

export const getReportById = async (id) => {
    const response = await fetch(`${LOST_FOUND_API}/${id}`);

    if (!response.ok) {
        throw new Error("Lost & Found report not found.");
    }

    return await response.json();
};


// ==========================================
// GET USER'S REPORTS
// GET: /api/lostfound/user/{userId}
// ==========================================

export const getUserReports = async (userId) => {
    const response = await fetch(
        `${LOST_FOUND_API}/user/${userId}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch your reports.");
    }

    return await response.json();
};


// ==========================================
// SEARCH / FILTER REPORTS
// GET: /api/lostfound/search
// ==========================================

export const searchReports = async ({
    keyword = "",
    category = "",
    reportType = "",
    status = "",
} = {}) => {
    const params = new URLSearchParams();

    if (keyword) {
        params.append("keyword", keyword);
    }

    if (category) {
        params.append("category", category);
    }

    if (reportType) {
        params.append("reportType", reportType);
    }

    if (status) {
        params.append("status", status);
    }

    const queryString = params.toString();

    const url = queryString
        ? `${LOST_FOUND_API}/search?${queryString}`
        : `${LOST_FOUND_API}/search`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Failed to search Lost & Found reports.");
    }

    return await response.json();
};


// ==========================================
// FIND POTENTIAL MATCHES
// GET: /api/lostfound/{lostItemId}/matches
// ==========================================

export const getPotentialMatches = async (lostItemId) => {
    const response = await fetch(
        `${LOST_FOUND_API}/${lostItemId}/matches`
    );

    if (!response.ok) {
        throw new Error("Failed to find potential matches.");
    }

    return await response.json();
};


// ==========================================
// CONFIRM MATCH
// POST: /api/lostfound/matches/confirm
// ==========================================

export const confirmMatch = async (matchData) => {
    const response = await fetch(
        `${LOST_FOUND_API}/matches/confirm`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(matchData),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to confirm match.");
    }

    return await response.json();
};


// ==========================================
// CREATE CLAIM
// POST: /api/lostfound/claims
// ==========================================

export const createClaim = async (claimData) => {
    const response = await fetch(
        `${LOST_FOUND_API}/claims`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(claimData),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to submit claim.");
    }

    return await response.json();
};


// ==========================================
// GET USER'S CLAIMS
// GET: /api/lostfound/claims/user/{userId}
// ==========================================

export const getUserClaims = async (userId) => {
    const response = await fetch(
        `${LOST_FOUND_API}/claims/user/${userId}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch your claims.");
    }

    return await response.json();
};