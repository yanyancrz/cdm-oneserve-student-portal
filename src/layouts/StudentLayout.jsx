import { Outlet, useLocation } from "react-router-dom";
import BottomNavigation from "../components/BottomNavigation/BottomNavigation";
import BackgroundLayout from "./BackgroundLayout";

export default function StudentLayout() {
    const location = useLocation();

    // Hide the main OneServe bottom navigation whenever the user is inside a
    // subsystem that brings its own navigation (Library, Guidance, CampusMarket).
    const isLibraryPage =
        location.pathname.startsWith("/library") ||
        location.pathname.startsWith("/guidance") ||
        location.pathname.startsWith("/marketplace");

    return (
        <BackgroundLayout>

            <Outlet />

            {!isLibraryPage && <BottomNavigation />}

        </BackgroundLayout>
    );
}