const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
// Ensure API_BASE_URL ends with /api or add it
const BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export const API_URL = `${BASE_URL}/motifs`;
export const UPLOAD_URL = `${BASE_URL}/upload`;
export const WILAYAH_API_URL = `${BASE_URL}/wilayah`;
