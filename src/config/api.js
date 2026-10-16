const LOCAL_API_URL = "http://localhost:5212";
const PRODUCTION_API_URL = "https://api.cdmconnect.online";

export const API_URL =
    import.meta.env.DEV ? LOCAL_API_URL : PRODUCTION_API_URL;