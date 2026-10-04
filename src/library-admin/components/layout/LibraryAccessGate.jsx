import { Navigate, Outlet } from "react-router-dom";

import AccessDenied from "../common/AccessDenied";
import ErrorMessage from "../common/ErrorMessage";
import LoadingSpinner from "../common/LoadingSpinner";
import { useLibrary } from "../../context/LibraryContext";

// Blocks the whole Library module until the server confirms the signed-in
// account is an Active Library Head / Library Staff.
export default function LibraryAccessGate() {
    const { status, error, refresh, logout } = useLibrary();

    if (status === "loading") {
        return <LoadingSpinner fullScreen label="Checking your access..." />;
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
                    "Only Library Head and Library Staff accounts can open the Library Administration module."
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