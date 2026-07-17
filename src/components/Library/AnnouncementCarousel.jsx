import { useState } from "react";

const SWIPE_THRESHOLD = 40; // px, minimum horizontal drag to count as a swipe

export default function AnnouncementCarousel({ announcements }) {

    const [activeIndex, setActiveIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState(null);

    if (!announcements || announcements.length === 0) {
        return null;
    }

    const current = announcements[activeIndex];

    const goToPrevious = () => {
        setActiveIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
    };

    const goToNext = () => {
        setActiveIndex((prev) => (prev + 1) % announcements.length);
    };

    const handleTouchStart = (e) => {
        setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e) => {
        if (touchStartX === null) return;

        const deltaX = e.changedTouches[0].clientX - touchStartX;

        if (deltaX > SWIPE_THRESHOLD) {
            goToPrevious();
        } else if (deltaX < -SWIPE_THRESHOLD) {
            goToNext();
        }

        setTouchStartX(null);
    };

    return (

        <div
            className="bg-[#F4D35E] rounded-[24px] p-5 relative overflow-hidden shadow-md shadow-[#F4D35E]/30 select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >

            {/* decorative circle */}
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/15 pointer-events-none" />

            <div className="flex items-center justify-between mb-3 relative z-10">

                <span className="text-[11px] font-medium uppercase tracking-widest text-[#1F1F1F]/60">
                    Announcements
                </span>

                <div className="flex items-center gap-1.5">
                    {announcements.map((item, index) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveIndex(index)}
                            aria-label={`Go to announcement ${index + 1}`}
                            className={`
                                rounded-full transition-all duration-200
                                ${index === activeIndex ? "w-4 h-1.5 bg-[#1F1F1F]" : "w-1.5 h-1.5 bg-[#1F1F1F]/25"}
                            `}
                        />
                    ))}
                </div>

            </div>

            <div className="flex items-center gap-3 relative z-10">

                <button
                    onClick={goToPrevious}
                    aria-label="Previous announcement"
                    className="
                        w-9 h-9 rounded-full bg-white/40 text-[#1F1F1F]
                        flex items-center justify-center flex-shrink-0
                        hover:bg-white/60 active:scale-95 transition-all
                    "
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>

                <div className="w-10 h-10 rounded-xl bg-white/40 text-[#1F1F1F] flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                </div>

                <div className="flex-1 min-w-0">
                    {current.isNew && (
                        <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-[#106A2E] bg-white/50 px-1.5 py-0.5 rounded mb-1">
                            New
                        </span>
                    )}
                    <h2 className="text-[#1F1F1F] text-base font-semibold leading-snug">
                        {current.title}
                    </h2>
                    <p className="text-[#1F1F1F]/70 text-xs leading-relaxed mt-0.5">
                        {current.message}
                    </p>
                </div>

                <button
                    onClick={goToNext}
                    aria-label="Next announcement"
                    className="
                        w-9 h-9 rounded-full bg-white/40 text-[#1F1F1F]
                        flex items-center justify-center flex-shrink-0
                        hover:bg-white/60 active:scale-95 transition-all
                    "
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                </button>

            </div>

        </div>

    );

}