import { useCallback, useEffect, useState } from "react";

// Loads a clinic collection for the authenticated user.
// fetcher must be a stable (module-level) function: ({signal}) => Promise
export default function useClinicResource(fetcher) {

    const [state, setState] = useState({ status: "loading", data: null, error: null });
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                const data = await fetcher({ signal: controller.signal });
                setState({ status: "success", data, error: null });
            } catch (error) {
                if (controller.signal.aborted) return;
                setState({ status: "error", data: null, error });
            }
        })();

        return () => controller.abort();
    }, [fetcher, tick]);

    const reload = useCallback(() => {
        setState((prev) => ({ ...prev, status: "loading", error: null }));
        setTick((t) => t + 1);
    }, []);

    return { ...state, reload };
}
