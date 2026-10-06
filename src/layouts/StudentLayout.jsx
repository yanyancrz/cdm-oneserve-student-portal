import { Outlet, useLocation } from "react-router-dom";
import BottomNavigation from "../components/BottomNavigation/BottomNavigation";
import BackgroundLayout from "./BackgroundLayout";

export default function StudentLayout() {
    const location = useLocation();

    // Hide the main OneServe bottom navigation
    // whenever the user is inside the Library subsystem.
    const isLibraryPage =
        location.pathname.startsWith("/library") ||
        location.pathname.startsWith("/guidance");

    return (
        <BackgroundLayout>

            <Outlet />

            {!isLibraryPage && <BottomNavigation />}

        </BackgroundLayout>
    );
}