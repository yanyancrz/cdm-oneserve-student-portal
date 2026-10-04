import { Outlet } from "react-router-dom";

import AccessDenied from "../common/AccessDenied";
import { useLibrary } from "../../context/LibraryContext";
import { LIBRARY_HOME_ROUTE } from "../../utils/session";

// Route-level permission check. Use as a layout route (renders <Outlet />)
// or wrap an element. This only controls what the UI shows; the API
// endpoints enforce the same rule on the server.
export default function RequirePermission({ permission, children }) {
    const { permissions } = useLibrary();

    if (!permissions?.[permission]) {
        return (
            <AccessDenied
                title="You don't have access to this page"
                message="This section is only available to the Library Head."
                actionLabel="Back to dashboard"
                to={LIBRARY_HOME_ROUTE}
            />
        );
    }

    return children ?? <Outlet />;
}