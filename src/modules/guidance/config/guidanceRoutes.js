// One place for every Guidance path and for "where does this role land?".
export const GUIDANCE_STUDENT_HOME = "/guidance";
export const GUIDANCE_COUNSELOR_HOME = "/guidance/counselor";
export const ONESERVE_STUDENT_HOME = "/dashboard";

const norm = (role) => String(role || "").trim().toLowerCase();

export const isCounselorRole = (role) => norm(role) === "counselor";

// Where a signed-in user belongs. Counselors never get the OneServe dashboard.
export function homeRouteForRole(role) {
    return isCounselorRole(role) ? GUIDANCE_COUNSELOR_HOME : ONESERVE_STUDENT_HOME;
}