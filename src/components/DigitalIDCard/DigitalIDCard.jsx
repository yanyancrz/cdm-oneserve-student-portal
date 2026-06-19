import { useState } from "react";

import DigitalIDFront from "./DigitalIDFront";
import DigitalIDBack from "./DigitalIDBack";

export default function DigitalIDCard(props) {

    const [showBack, setShowBack] = useState(false);

    return (

        <div>

            {/* FLIP CARD CONTAINER */}

            <div
                className="relative w-full"
                style={{
                    perspective: "1200px",
                    minHeight: "580px",
                }}
            >

                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        transformStyle: "preserve-3d",
                        transition: "transform 0.65s cubic-bezier(0.45, 0.05, 0.55, 0.95)",
                        transform: showBack ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                >

                    {/* FRONT */}

                    <div
                        style={{
                            position: "absolute",
                            width: "100%",
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                        }}
                    >
                        <DigitalIDFront {...props} />
                    </div>

                    {/* BACK */}

                    <div
                        style={{
                            position: "absolute",
                            width: "100%",
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                        }}
                    >
                        <DigitalIDBack {...props} />
                    </div>

                </div>

            </div>

            {/* FLIP BUTTON */}

            <button
                onClick={() => setShowBack(!showBack)}
                className="
                    mt-4
                    w-full
                    bg-[#106A2E]
                    hover:bg-[#0D7856]
                    active:scale-95
                    text-white
                    p-3
                    rounded-xl
                    font-semibold
                    transition-all
                    duration-200
                    flex
                    items-center
                    justify-center
                    gap-2
                "
            >

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`
                        w-5 h-5
                        transition-transform
                        duration-500
                        ${showBack ? "rotate-180" : "rotate-0"}
                    `}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                </svg>

                {showBack ? "View Front Side" : "View Back Side"}

            </button>

        </div>

    );

}
