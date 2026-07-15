import { useState, useEffect, useRef } from "react";
import DigitalIDFront from "./DigitalIDFront";
import DigitalIDBack from "./DigitalIDBack";
import QRCode from "react-qr-code";

export default function DigitalIDCard(props) {

    console.log("DigitalIDCard Props:", props);

    const [showBack, setShowBack] = useState(false);
    const [showFullId, setShowFullId] = useState(false);
    const [showQr, setShowQr] = useState(false);
    const [showFullBack, setShowFullBack] = useState(false);
    const [scale, setScale] = useState(1);
    const scaleWrapRef = useRef(null);

    // Native fullscreen design size of DigitalIDFront/Back (the isFullscreen=true dimensions)
    const CARD_W = 650;
    const CARD_H = 410;

    useEffect(() => {
        if (!showFullId) return;

        // Rough estimate immediately, so it never flashes at full 650px size
        const roughWidth = window.innerWidth - 32;
        setScale(Math.min(roughWidth / CARD_W, 1));

        const computeScale = () => {
            const padding = 40;

            const availableWidth = window.innerWidth - padding;
            const availableHeight = window.innerHeight - 180;

            const scaleByWidth = availableWidth / CARD_W;
            const scaleByHeight = availableHeight / CARD_H;

            setScale(Math.min(scaleByWidth, scaleByHeight, 1));
        };

        const raf = requestAnimationFrame(computeScale);
        const timeout = setTimeout(computeScale, 100);
        window.addEventListener("resize", computeScale);

        let resizeObserver;
        if (typeof ResizeObserver !== "undefined" && scaleWrapRef.current) {
            resizeObserver = new ResizeObserver(computeScale);
            resizeObserver.observe(scaleWrapRef.current);
        }

        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(timeout);
            window.removeEventListener("resize", computeScale);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [showFullId]);

    return (
        <div>

            {/* FLIP CARD CONTAINER — tap to flip */}
            <div
                className="relative w-full flex justify-center cursor-pointer"
                style={{ perspective: "1200px", height: "240px" }}
                onClick={() => setShowBack(!showBack)}
            >
                <div
                    style={{
                        position: "relative",
                        width: "380px",
                        height: "240px",
                        transformStyle: "preserve-3d",
                        transition: "transform 0.65s cubic-bezier(0.45, 0.05, 0.55, 0.95)",
                        transform: showBack ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                >
                    {/* FRONT */}
                    <div
                        style={{
                            position: "absolute",
                            width: "380px",
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
                            width: "380px",
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                        }}
                    >
                        <DigitalIDBack {...props} />
                    </div>
                </div>
            </div>

            {/* TAP HINT */}
            <p className="text-center text-gray-400 text-[11px] mt-2 tracking-wide">
                Tap the card to flip
            </p>

            {/* BUTTONS */}
            <div className="mt-3 space-y-2">
                <button
                    onClick={() => {
                        setShowFullBack(showBack);
                        setShowFullId(true);
                    }}
                    className="
                        w-full bg-[#106A2E] hover:bg-[#0D7856]
                        text-white p-3 rounded-xl font-semibold
                        transition-all
                    "
                >
                    Enlarge ID
                </button>

                <button
                    onClick={() => setShowQr(true)}
                    className="
                        w-full bg-white border border-[#106A2E]
                        text-[#106A2E] p-3 rounded-xl font-semibold
                    "
                >
                    Enlarge QR Code
                </button>
            </div>

            {/* FULLSCREEN ID MODAL */}
{showFullId && (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">

        {/* Close */}
        <button
            onClick={() => setShowFullId(false)}
            className="absolute top-5 right-5 text-white text-4xl z-50"
        >
            ×
        </button>

        {/* SCALE WRAPPER */}
        <div
            ref={scaleWrapRef}
            className="w-full flex justify-center items-center"
        >
            <div
                style={{
                    width: CARD_W * scale,
                    height: CARD_H * scale,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >

                {/* SCALE */}
                <div
                    style={{
                        width: CARD_W,
                        height: CARD_H,
                        transform: `scale(${scale})`,
                        transformOrigin: "center",
                    }}
                >

                    {/* FLIP */}
                    <div
                        onClick={() => setShowFullBack(!showFullBack)}
                        style={{
                            width: CARD_W,
                            height: CARD_H,
                            position: "relative",
                            transformStyle: "preserve-3d",
                            transition: "transform .7s ease",
                            transform: showFullBack
                                ? "rotateY(180deg)"
                                : "rotateY(0deg)",
                            cursor: "pointer",
                        }}
                    >

                        {/* FRONT */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                            }}
                        >
                            <DigitalIDFront
                                {...props}
                                isFullscreen={true}
                            />
                        </div>

                        {/* BACK */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                transform: "rotateY(180deg)",
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                            }}
                        >
                            <DigitalIDBack
                                {...props}
                                isFullscreen={true}
                            />
                        </div>

                    </div>

                </div>

            </div>
        </div>

        <p className="absolute bottom-10 text-white text-sm">
            Tap the card to flip
        </p>

    </div>
)}

            {/* FULLSCREEN QR MODAL */}
            {showQr && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">

                    <button
                        onClick={() => setShowQr(false)}
                        className="absolute top-5 right-5 text-white text-3xl leading-none"
                    >
                        ×
                    </button>

                    <div className="bg-white p-5 rounded-3xl max-w-[85vw]">
                        <QRCode value={props.qrCode || ""} size={280} style={{ width: "100%", height: "auto", maxWidth: "280px" }} />
                    </div>

                    <p className="text-white mt-4 font-medium">
                        Scan to Verify
                    </p>
                </div>
            )}

        </div>
    );
}