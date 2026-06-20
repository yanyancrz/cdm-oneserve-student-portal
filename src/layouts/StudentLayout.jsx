import { Outlet } from "react-router-dom";
import BottomNavigation from "../components/BottomNavigation/BottomNavigation";
import BackgroundLayout from "./BackgroundLayout";

export default function StudentLayout() {
    return (
        <BackgroundLayout>

            <Outlet />

            <BottomNavigation />

        </BackgroundLayout>
    );
}