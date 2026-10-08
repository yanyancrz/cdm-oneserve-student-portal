import { createContext, useContext, useMemo, useState } from "react";

// =====================================================
// Cart count
//
// The header has a cart icon but nothing said how many items were in there, so a
// buyer could not tell whether a tap had worked. It also has to stay correct
// across pages without every screen fetching the cart on mount.
//
// This is a small piece of shared state rather than a store library: the pages
// that change the cart (shop, cart, checkout) already know the new total and push
// it in, and the header just displays whatever was last reported.
// =====================================================

const MarketCartContext = createContext({
    count: 0,
    setCount: () => {},
});

export function MarketCartProvider({ children }) {
    const [count, setCount] = useState(0);

    const value = useMemo(() => ({ count, setCount }), [count]);

    return (
        <MarketCartContext.Provider value={value}>
            {children}
        </MarketCartContext.Provider>
    );
}

export function useMarketCart() {
    return useContext(MarketCartContext);
}

/** Sum of quantities, which is what a shopper means by "how many in my cart". */
export function countItems(items) {
    return (items || []).reduce((total, item) => total + (item.quantity || 0), 0);
}