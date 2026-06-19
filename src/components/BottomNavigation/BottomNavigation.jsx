import { useNavigate, useLocation } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
    faHouse,
    faIdCard,
    faUser
} from "@fortawesome/free-solid-svg-icons";

export default function BottomNavigation() {

    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        {
            label: "Home",
            icon: faHouse,
            path: "/dashboard",
        },
        {
            label: "ID",
            icon: faIdCard,
            path: "/view-digital-id",
        },
        {
            label: "Profile",
            icon: faUser,
            path: "/profile",
        },
    ];

    return (

        <div
            className="
                fixed
                bottom-4
                left-4
                right-4
                z-50
                bg-white
                rounded-2xl
                shadow-xl
                shadow-[#106A2E]/10
                border border-gray-100
                flex
                justify-around
                p-2
                max-w-md
                mx-auto
            "
        >

            {
                tabs.map((tab) => {

                    const isActive = location.pathname === tab.path;

                    return (

                        <button
                            key={tab.path}
                            onClick={() => navigate(tab.path)}
                            className="
                                relative
                                flex
                                flex-col
                                items-center
                                justify-center
                                flex-1
                                py-2.5
                                rounded-xl
                                transition-colors
                            "
                        >

                            {
                                isActive && (
                                    <span className="absolute inset-1 rounded-xl bg-[#106A2E]/[0.08]" />
                                )
                            }

                            <FontAwesomeIcon
                                icon={tab.icon}
                                className={`
                                    relative
                                    text-base
                                    transition-colors
                                    ${isActive ? "text-[#106A2E]" : "text-gray-400"}
                                `}
                            />

                            <span
                                className={`
                                    relative
                                    text-[11px]
                                    mt-1
                                    font-medium
                                    transition-colors
                                    ${isActive ? "text-[#106A2E]" : "text-gray-400"}
                                `}
                            >
                                {tab.label}
                            </span>

                            {
                                isActive && (
                                    <span className="absolute -top-0.5 w-1 h-1 rounded-full bg-[#106A2E]" />
                                )
                            }

                        </button>

                    );

                })
            }

        </div>

    );
}
