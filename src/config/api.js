// API origin can be overridden per local environment with VITE_API_URL.
// Development defaults to the API project's HTTPS launch URL; production
// keeps the deployed Azure API origin unless explicitly overridden.
const LOCAL_API_URL = "https://localhost:7013";
const PRODUCTION_API_URL = "https://cdm-oneserve-api-capstone-h0g9cpg8dhd3e4a2.koreacentral-01.azurewebsites.net";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = (
    configuredApiUrl ||
    (import.meta.env.DEV ? LOCAL_API_URL : PRODUCTION_API_URL)
).replace(/\/$/, "");