import { useEffect, useState } from "react";

const DAY = 86_400_000;
const PH_OFFSET = 8 * 3_600_000;

function currentDay() {
    return Math.floor((Date.now() + PH_OFFSET) / DAY);
}

export function usePhilippineDay() {
    const [day, setDay] = useState(currentDay);

    useEffect(() => {
        let timer;
        function refresh() {
            clearTimeout(timer);
            setDay(currentDay());
            timer = setTimeout(refresh, DAY - (Date.now() + PH_OFFSET) % DAY + 100);
        }
        refresh();
        window.addEventListener("focus", refresh);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("focus", refresh);
        };
    }, []);

    return day;
}
