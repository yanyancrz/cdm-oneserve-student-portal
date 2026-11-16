import { useLayoutEffect } from "react";

// =====================================================
// Measure the visible navigation and header so Guidance pages have
// the right padding on both mobile and desktop.
// =====================================================
export function useGuidanceChrome({ rootRef, navWrapRef, headerRef, brandSubtitle }) {
    useLayoutEffect(() => {
        const root = rootRef.current;
        const wrap = navWrapRef.current;
        if (!root || !wrap) return undefined;

        const topEl = wrap.querySelector(`[aria-label="${brandSubtitle} navigation"]`);
        const bottomEl = wrap.querySelector(`[aria-label="${brandSubtitle} mobile navigation"]`);

        const sync = () => {
            // A display:none element reports offsetHeight 0, so reading both
            // and using each directly already does the right thing at the
            // breakpoint: on desktop the pill is hidden (0) and the top bar
            // is visible; on mobile it is the reverse.
            const topH = topEl ? Math.round(topEl.getBoundingClientRect().bottom) : 0;
            const bottomH = bottomEl
                ? Math.max(0, Math.round(window.innerHeight - bottomEl.getBoundingClientRect().top))
                : 0;
            const headerH = headerRef?.current
                ? Math.round(headerRef.current.getBoundingClientRect().height)
                : 0;

            root.style.setProperty("--guidance-nav-h", `${bottomH}px`);
            root.style.setProperty("--guidance-top-h", `${topH}px`);
            root.style.setProperty("--guidance-header-h", `${topH + headerH}px`);
        };

        sync();

        const ro = new ResizeObserver(sync);
        ro.observe(root);
        if (topEl) ro.observe(topEl);
        if (bottomEl) ro.observe(bottomEl);
        if (headerRef?.current) ro.observe(headerRef.current);

        return () => ro.disconnect();
    }, [rootRef, navWrapRef, headerRef, brandSubtitle]);
}