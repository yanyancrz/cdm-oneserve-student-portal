import { API_URL } from "../config/api";

const LOST_FOUND_ADMIN_API = `${API_URL}/api/lostfound/admin`;

// =====================================================
// GET ADMIN DASHBOARD
// GET: /api/lostfound/admin/dashboard
// =====================================================

export const getAdminDashboard = async () => {
    const response = await fetch(
        `${LOST_FOUND_ADMIN_API}/dashboard`
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            error || "Failed to fetch Lost & Found dashboard."
        );
    }

    return await response.json();
};


// =====================================================
// GET ALL REPORTS
// GET: /api/lostfound/admin/reports
// =====================================================

export const getAdminReports = async ({
    keyword = "",
    category = "",
    reportType = "",
    status = "",
    verificationStatus = "",
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

    if (verificationStatus) {
        params.append(
            "verificationStatus",
            verificationStatus
        );
    }

    const queryString = params.toString();

    const url = queryString
        ? `${LOST_FOUND_ADMIN_API}/reports?${queryString}`
        : `${LOST_FOUND_ADMIN_API}/reports`;

    const response = await fetch(url);

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            error || "Failed to fetch Lost & Found reports."
        );
    }

    return await response.json();
};


// =====================================================
// GET REPORT BY ID
// GET: /api/lostfound/admin/reports/{id}
// =====================================================

export const getAdminReportById = async (id) => {
    const response = await fetch(
        `${LOST_FOUND_ADMIN_API}/reports/${id}`
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            error || "Lost & Found report not found."
        );
    }

    return await response.json();
};


// =====================================================
// VERIFY REPORT
// PUT: /api/lostfound/admin/reports/{id}/verify
// =====================================================

export const verifyReport = async (
    id,
    adminUserId
) => {

    const url = adminUserId
        ? `${LOST_FOUND_ADMIN_API}/reports/${id}/verify?adminUserId=${encodeURIComponent(
              adminUserId
          )}`
        : `${LOST_FOUND_ADMIN_API}/reports/${id}/verify`;

    const response = await fetch(url, {
        method: "PUT",
    });

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            error || "Failed to verify report."
        );
    }

    return await response.json();
};


// =====================================================
// REJECT REPORT
// PUT: /api/lostfound/admin/reports/{id}/reject
// =====================================================

export const rejectReport = async (
    id,
    adminUserId,
    reason = ""
) => {

    const params = new URLSearchParams();

    if (adminUserId) {
        params.append("adminUserId", adminUserId);
    }

    if (reason) {
        params.append("reason", reason);
    }

    const queryString = params.toString();

    const url = queryString
        ? `${LOST_FOUND_ADMIN_API}/reports/${id}/reject?${queryString}`
        : `${LOST_FOUND_ADMIN_API}/reports/${id}/reject`;

    const response = await fetch(url, {
        method: "PUT",
    });

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            error || "Failed to reject report."
        );
    }

    return await response.json();
};


// =====================================================
// GET MATCHES
// GET: /api/lostfound/admin/matches
// =====================================================

export const getAdminMatches = async () => {
    const response = await fetch(
        `${LOST_FOUND_ADMIN_API}/matches`
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            error || "Failed to fetch Lost & Found matches."
        );
    }

    return await response.json();
};


// =====================================================
// CONFIRM MATCH
// PUT: /api/lostfound/admin/matches/{id}/confirm
// =====================================================

export const confirmAdminMatch = async (
    id,
    adminUserId
) => {

    const url = adminUserId
        ? `${LOST_FOUND_ADMIN_API}/matches/${id}/confirm?adminUserId=${encodeURIComponent(
              adminUserId
          )}`
        : `${LOST_FOUND_ADMIN_API}/matches/${id}/confirm`;

    const response = await fetch(url, {
        method: "PUT",
    });

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            error || "Failed to confirm match."
        );
    }

    return await response.json();
};


// =====================================================
// REJECT MATCH
// PUT: /api/lostfound/admin/matches/{id}/reject
// =====================================================

export const rejectAdminMatch = async (
    id,
    adminUserId
) => {

    const url = adminUserId
        ? `${LOST_FOUND_ADMIN_API}/matches/${id}/reject?adminUserId=${encodeURIComponent(
              adminUserId
          )}`
        : `${LOST_FOUND_ADMIN_API}/matches/${id}/reject`;

    const response = await fetch(url, {
        method: "PUT",
    });

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            error || "Failed to reject match."
        );
    }

    return await response.json();
};


// =====================================================
// GET CLAIMS
// GET: /api/lostfound/admin/claims
// =====================================================

export const getAdminClaims = async ({
    status = "",
} = {}) => {

    const params = new URLSearchParams();

    if (status) {
        params.append("status", status);
    }

    const queryString = params.toString();

    const url = queryString
        ? `${LOST_FOUND_ADMIN_API}/claims?${queryString}`
        : `${LOST_FOUND_ADMIN_API}/claims`;

    const response = await fetch(url);

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            error || "Failed to fetch Lost & Found claims."
        );
    }

    return await response.json();
};


// =====================================================
// GET CLAIM BY ID
// GET: /api/lostfound/admin/claims/{id}
// =====================================================

export const getAdminClaimById = async (id) => {
    const response = await fetch(
        `${LOST_FOUND_ADMIN_API}/claims/${id}`
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            error || "Lost & Found claim not found."
        );
    }

    return await response.json();
};


// =====================================================
// APPROVE CLAIM
// PUT: /api/lostfound/admin/claims/{id}/approve
// =====================================================

export const approveAdminClaim = async (
    id,
    adminUserId
) => {

    if (!adminUserId) {
        throw new Error(
            "Librarian user ID is required."
        );
    }

    const response = await fetch(
        `${LOST_FOUND_ADMIN_API}/claims/${id}/approve?adminUserId=${encodeURIComponent(
            adminUserId
        )}`,
        {
            method: "PUT",
        }
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            error || "Failed to approve claim."
        );
    }

    return await response.json();
};


// =====================================================
// REJECT CLAIM
// PUT: /api/lostfound/admin/claims/{id}/reject
// =====================================================

export const rejectAdminClaim = async (
    id,
    adminUserId
) => {

    if (!adminUserId) {
        throw new Error(
            "Librarian user ID is required."
        );
    }

    const response = await fetch(
        `${LOST_FOUND_ADMIN_API}/claims/${id}/reject?adminUserId=${encodeURIComponent(
            adminUserId
        )}`,
        {
            method: "PUT",
        }
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            error || "Failed to reject claim."
        );
    }

    return await response.json();
};


// =====================================================
// GET ADMIN NOTIFICATIONS
// GET: /api/lostfound/admin/notifications/{adminUserId}
// =====================================================

export const getAdminNotifications = async (
    adminUserId
) => {

    if (!adminUserId) {
        throw new Error(
            "Librarian user ID is required."
        );
    }

    const response = await fetch(
        `${LOST_FOUND_ADMIN_API}/notifications/${encodeURIComponent(
            adminUserId
        )}`
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            error ||
                "Failed to fetch Lost & Found notifications."
        );
    }

    return await response.json();
};


// =====================================================
// MARK NOTIFICATION AS READ
// PUT: /api/lostfound/admin/notifications/{id}/read
// =====================================================

export const markNotificationAsRead = async (
    id
) => {

    const response = await fetch(
        `${LOST_FOUND_ADMIN_API}/notifications/${id}/read`,
        {
            method: "PUT",
        }
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            error ||
                "Failed to mark notification as read."
        );
    }

    return await response.json();
};