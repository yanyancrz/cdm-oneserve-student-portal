import { Outlet } from "react-router-dom";

import { AccessDenied } from "../common";
import { useGuidanceHead } from "../../context/guidanceHeadStore";
import { GUIDANCE_HEAD_HOME_ROUTE } from "../../utils/session";

// Route-level permission check. Use as a layout route (renders <Outlet />)
// or wrap an element. This only controls what the UI shows; the API
// endpoints enforce the same rule on the server.
export default function RequireGuidancePermission({ permission, children }) {
    const { permissions } = useGuidanceHead();

    if (!permissions?.[permission]) {
        return (
            <AccessDenied
                title="You don't have access to this page"
                message="This section is only available to the Guidance Head."
                actionLabel="Back to dashboard"
                to={GUIDANCE_HEAD_HOME_ROUTE}
            />
        );
    }

    return children ?? <Outlet />;
}
