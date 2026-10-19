import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(
    document.getElementById("root")
).render(
    <React.StrictMode>
        <Toaster
            position="top-center"
            gutter={10}
            // Clear the status bar / notch on a phone. Without this the first
            // toast sits under the system clock.
            containerStyle={{ top: "calc(env(safe-area-inset-top, 0px) + 10px)" }}
            toastOptions={{
                duration: 3200,
                style: {
                    borderRadius: "14px",
                    padding: "12px 16px",
                    fontSize: "14px",
                    maxWidth: "min(92vw, 420px)",
                    color: "#0f172a",
                    boxShadow: "0 18px 40px -18px rgba(15, 23, 42, 0.45)",
                },
                // Success and error read as the same message by default;
                // give them a colour so the outcome is obvious at a glance.
                success: {
                    iconTheme: { primary: "#106A2E", secondary: "#ffffff" },
                    style: {
                        border: "1px solid #bbf7d0",
                        background: "#f0fdf4",
                        color: "#14532d",
                    },
                },
                error: {
                    // Errors stick around longer - they usually carry a reason.
                    duration: 4200,
                    iconTheme: { primary: "#dc2626", secondary: "#ffffff" },
                    style: {
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#7f1d1d",
                    },
                },
                loading: {
                    iconTheme: { primary: "#106A2E", secondary: "#ffffff" },
                },
            }}
        />
        <App />
    </React.StrictMode>
);