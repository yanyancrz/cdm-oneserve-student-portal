import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";

import BackgroundImage from "../../../assets/images/admin-bg.png";
import GuidanceHeadSidebar from "./GuidanceHeadSidebar";
import GuidanceHeadTopbar from "./GuidanceHeadTopbar";

// Same fonts (and same <link> id) as the Library administration shell,
// so they are only ever loaded once across the desktop admin modules.
const FONTS_LINK_ID = "admin-profile-fonts";
const FONTS_HREF =
    "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap";

export default function GuidanceHeadLayout() {
    const { pathname } = useLocation();
    const mainRef = useRef(null);

    useEffect(() => {
        if (document.getElementById(FONTS_LINK_ID)) return;

        const link = document.createElement("link");
        link.id = FONTS_LINK_ID;
        link.rel = "stylesheet";
        link.href = FONTS_HREF;
        document.head.appendChild(link);
    }, []);

    // The page scrolls inside <main>, so reset it when the route changes.
    useEffect(() => {
        mainRef.current?.scrollTo({ top: 0 });
    }, [pathname]);

    return (
        <div className="guidance-head-root min-h-screen bg-[#F7F5EF]">
            <style>{`
                .font-display { font-family: 'Fraunces', serif; }
                .guidance-head-root { font-family: 'Inter', system-ui, sans-serif; }
                @media (prefers-reduced-motion: reduce) {
                    .guidance-head-root * { transition: none !important; animation: none !important; }
                }
            `}</style>

            <GuidanceHeadSidebar />

            <div className="min-h-screen pl-20 lg:pl-64">
                <GuidanceHeadTopbar />

                <main
                    ref={mainRef}
                    className="relative h-[calc(100vh-72px)] overflow-auto bg-[#F7F5EF]"
                >
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            backgroundImage: `url(${BackgroundImage})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundAttachment: "local",
                            opacity: 0.12,
                        }}
                    />

                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(180deg, rgba(247,245,239,0.92) 0%, rgba(247,245,239,0.96) 100%)",
                        }}
                    />

                    {/* Pages render here and don't need their own outer padding. */}
                    <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
