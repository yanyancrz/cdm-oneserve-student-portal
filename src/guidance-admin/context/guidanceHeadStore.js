import { createContext, useContext } from "react";

// The context object lives here (with the hook that reads it) rather than in
// GuidanceHeadContext.jsx, so that file exports only a component and stays
// friendly to fast refresh.
export const GuidanceHeadContext = createContext(null);

export function useGuidanceHead() {
    const context = useContext(GuidanceHeadContext);

    if (!context) {
        throw new Error("useGuidanceHead must be used inside <GuidanceHeadProvider>.");
    }

    return context;
}
