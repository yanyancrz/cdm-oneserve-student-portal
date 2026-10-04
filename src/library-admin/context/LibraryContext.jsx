import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { UNAUTHORIZED_EVENT } from "../services/apiClient";
import libraryAccessService from "../services/libraryAccessService";
import { clearSession, getToken } from "../utils/session";

const LibraryContext = createContext(null);

const UNAUTHENTICATED = {
    status: "unauthenticated",
    user: null,
    permissions: {},
    error: null,
};

const createInitialState = () =>
    getToken()
        ? { status: "loading", user: null, permissions: {}, error: null }
        : UNAUTHENTICATED;

export function LibraryProvider({ children }) {
    const [state, setState] = useState(createInitialState);

    const load = useCallback(async (signal) => {
        if (!getToken()) {
            setState(UNAUTHENTICATED);
            return;
        }

        try {
            const access = await libraryAccessService.getMe({ signal });

            setState({
                status: "ready",
                user: access,
                permissions: access?.permissions || {},
                error: null,
            });
        } catch (error) {
            if (error?.name === "AbortError") return;

            if (error?.status === 401) {
                setState(UNAUTHENTICATED);
                return;
            }

            if (error?.status === 403) {
                setState({
                    status: "denied",
                    user: null,
                    permissions: {},
                    error: error.message,
                });
                return;
            }

            setState({
                status: "error",
                user: null,
                permissions: {},
                error: error?.message || "Unable to verify your access.",
            });
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        load(controller.signal);

        return () => controller.abort();
    }, [load]);

    // Any API call that returns 401 later on sends the user back to login.
    useEffect(() => {
        const handleUnauthorized = () => setState(UNAUTHENTICATED);

        window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
        return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    }, []);

    const refresh = useCallback(() => {
        setState((prev) => ({ ...prev, status: "loading", error: null }));
        return load();
    }, [load]);

    const logout = useCallback(() => {
        clearSession();
        setState(UNAUTHENTICATED);
    }, []);

    const value = useMemo(
        () => ({ ...state, refresh, logout }),
        [state, refresh, logout]
    );

    return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
    const context = useContext(LibraryContext);

    if (!context) {
        throw new Error("useLibrary must be used inside <LibraryProvider>.");
    }

    return context;
}