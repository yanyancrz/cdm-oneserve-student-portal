import { useLayoutEffect } from "react";

// =====================================================
// Measuring the Guidance chrome so full-height pages (the chat thread)
// can sit exactly on top of whatever navigation is showing, with no
// dead space.
//
// The shared <ModuleBottomNav> renders TWO bars from one component: a
// fixed top bar on desktop (md:block, hidden below) and a floating
// bottom pill on mobile (md:hidden, visible below). Which one is
// showing is decided by the breakpoint, so the heights this layout
// needs are the heights of whichever is actually visible:
//
//   --guidance-nav-h     bottom pill height on mobile, 0 on desktop
//   --guidance-top-h     top bar height on desktop, 0 on mobile
//   --guidance-header-h  top-h + the page header, i.e. everything above
//                        the chat thread - subtracted from 100dvh by the
//                        thread so its composer ends at the right edge.
//
// Measured live (ResizeObserver) rather than hard-coded, because the
// pill's height includes padding and the safe-area, and the header's
// height includes its own padding - guessing them wrong leaves a gap
// or, worse, cuts the composer off. The old nav was a fixed bar at
// bottom:0, so offsetHeight was exact; the new pill sits at bottom-3,
// so the space it really occupies is (viewport bottom - its top edge),
// which is what innerHeight - rect.top gives.
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