import { useCallback, useEffect, useRef, useState } from "react";

// Polls `fetcher` every `interval` ms, refreshes when the window regains focus,
// and pauses while the tab is hidden. Only the data is refreshed, never the page.
// A failed background poll keeps the last good data and only sets `error`.
export function usePolling(fetcher, { interval = 3000, enabled = true } = {}) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true); // true only until the first result

    const fetcherRef = useRef(fetcher);
    const inFlight = useRef(false);
    const mounted = useRef(true);
    const controllerRef = useRef(null);

    useEffect(() => {
        fetcherRef.current = fetcher;
    }, [fetcher]);

    const run = useCallback(async () => {
        if (inFlight.current) return; // never stack requests

        inFlight.current = true;
        const controller = new AbortController();
        controllerRef.current = controller;

        try {
            const result = await fetcherRef.current(controller.signal);
            if (!mounted.current) return;
            setData(result);
            setError(null);
        } catch (err) {
            if (err?.name === "AbortError" || !mounted.current) return;
            setError(err?.message || "Unable to load data.");
        } finally {
            inFlight.current = false;
            if (mounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        if (!enabled) return undefined;

        run();

        const timer = setInterval(() => {
            if (!document.hidden) run();
        }, interval);

        const handleFocus = () => run();
        const handleVisibility = () => {
            if (!document.hidden) run();
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            mounted.current = false;
            clearInterval(timer);
            controllerRef.current?.abort();
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [enabled, interval, run]);

    return { data, error, loading, refresh: run };
}