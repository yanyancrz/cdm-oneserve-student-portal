import { Navigate, Outlet } from "react-router-dom";

// Keeps given roles OUT of a route group and sends them to their own home.
// Used so a Counselor can never open the OneServe student dashboard.
// This is only the first line: data endpoints enforce roles on the server.
// Deny-list on purpose, so existing Student / Faculty / Admin behaviour is unchanged.
export default function BlockRoles({ roles, redirectTo, children }) {
    const role = String(
        localStorage.getItem("role") || localStorage.getItem("userRole") || ""
    )
        .trim()
        .toLowerCase();

    const blocked = roles.some((r) => r.toLowerCase() === role);

    if (blocked) return <Navigate to={redirectTo} replace />;

    return children ?? <Outlet />;
}