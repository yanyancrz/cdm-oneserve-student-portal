const LOCAL_API_URL = "http://localhost:5212";
const PRODUCTION_API_URL = "https://cdm-oneserve-api-capstone-h0g9cpg8dhd3e4a2.koreacentral-01.azurewebsites.net";

export const API_URL =
    import.meta.env.DEV ? LOCAL_API_URL : PRODUCTION_API_URL;