import { Outlet } from "react-router-dom";
import BottomNavigation from "../components/BottomNavigation/BottomNavigation";

export default function StudentLayout() {
    return (
        <div className="min-h-screen bg-slate-100 pb-24">
            <Outlet />
            <BottomNavigation />
        </div>
    );
}