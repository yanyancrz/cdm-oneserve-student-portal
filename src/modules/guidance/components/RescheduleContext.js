import { createContext, useContext } from "react";

export const RescheduleContext = createContext(null);
export const useRescheduling = () => useContext(RescheduleContext);
export const APPOINTMENTS_UPDATED = "guidance-appointments-updated";
