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
            toastOptions={{
                duration: 3000,
                style: {
                    borderRadius: "12px",
                    padding: "12px 16px",
                    fontSize: "14px",
                    maxWidth: "90vw",
                },
            }}
        />
        <App />
    </React.StrictMode>
);