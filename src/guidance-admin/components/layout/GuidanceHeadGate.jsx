import { Navigate, Outlet } from "react-router-dom";

import { AccessDenied, ErrorMessage, SkeletonShell } from "../common";
import { useGuidanceHead } from "../../context/guidanceHeadStore";

// Blocks the whole Guidance Administration module until the server confirms
// the signed-in account is an Active Guidance Head (or a platform admin).
export default function GuidanceHeadGate() {
    const { status, error, refresh, logout } = useGuidanceHead();

    if (status === "loading") {
        // Whole layout (sidebar, topbar, content) as a skeleton while /me loads.
        return <SkeletonShell label="Checking your access..." />;
    }

    if (status === "unauthenticated") {
        // One shared login for all of CDM OneServe.
        return <Navigate to="/" replace />;
    }

    if (status === "denied") {
        return (
            <AccessDenied
                fullScreen
                title="Access restricted"
                message={
                    error ||
                    "Only Guidance Head accounts can open the Guidance Administration module."
                }
                actionLabel="Sign out"
                onAction={logout}
            />
        );
    }

    if (status === "error") {
        return (
            <ErrorMessage
                fullScreen
                title="Unable to verify your access"
                message={error}
                onRetry={refresh}
            />
        );
    }

    return <Outlet />;
}
