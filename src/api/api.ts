import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Create axios instance
const api: any = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Navigation callback for auth redirects
let authRedirectCallback: ((path: string) => void) | null = null;

export function setAuthRedirectCallback(callback: (path: string) => void) {
  authRedirectCallback = callback;
}

// Response interceptor to handle auth errors and maintenance mode
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    // Handle maintenance mode (503)
    if (error.response?.status === 503 && error.response?.data?.maintenance) {
      // Don't redirect for maintenance mode, just show the error message
      // The error will be handled by the component
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (!error.config?.url?.includes("/auth/login")) {
        if (authRedirectCallback) {
          authRedirectCallback("/login");
        }
      }
    }
    return Promise.reject(error);
  }
);

const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 10000,
  onRetry?: (attempt: number, delay: number) => void
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if it's maintenance mode (503 with maintenance flag)
      if (error.response?.status === 503 && error.response?.data?.maintenance === true) {
        throw error;
      }
      
      const shouldRetry = 
        error.response?.status === 503 ||
        error.response?.status === 504 ||
        error.code === "ECONNREFUSED" ||
        error.code === "ETIMEDOUT" ||
        error.code === "ECONNABORTED" ||
        error.message?.includes("Network Error") ||
        error.message?.includes("timeout");
      
      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay + (attempt * 5000);
      console.log(`Service sedang memulai (attempt ${attempt + 1}/${maxRetries + 1}), menunggu ${delay/1000} detik...`);
      
      if (onRetry) {
        onRetry(attempt + 1, delay);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Prediction services
export const predictionService = {
  predict: async (formData: FormData, retries: number = 3, onRetry?: (attempt: number, delay: number) => void) => {
    return retryRequest(
      () => api.post("/api/predict", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000,
      }),
      retries,
      10000,
      onRetry
    );
  },

  getHistory: () => {
    return api.get("/api/predict/history");
  },

  warmUp: async () => {
    try {
      await api.get("/api/predict/history", {
        timeout: 5000,
      });
    } catch (error) {
      console.log("Warm-up request completed (errors are expected)");
    }
  },
};

// Auth services
export const authService = {
  login: (email: string, password: string) => {
    return api.post("/api/auth/login", { email, password });
  },

  register: (name: string, email: string, password: string) => {
    return api.post("/api/auth/register", { name, email, password });
  },

  googleAuth: (idToken: string, name: string, email: string, photoURL?: string) => {
    return api.post("/api/auth/google", { idToken, name, email, photoURL });
  },

  logout: () => {
    return api.post("/api/auth/logout");
  },
};

export const galleryService = {
  getAll: () => {
    return api.get("/api/gallery");
  },
};

export const ttsService = {
  synthesize: (text: string) => {
    return api.post("/api/tts/synthesize", { text }, {
      responseType: 'blob'
    });
  },
};

export const uploadService = {
  upload: (formData: FormData) => {
    return api.post("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 seconds timeout for upload
    });
  },
};

export const motifService = {
  getAll: (params?: string) => {
    const url = params ? `/api/motifs?${params}` : "/api/motifs";
    return api.get(url);
  },

  create: (data: any) => {
    return api.post("/api/motifs", data);
  },

  update: (id: string, data: any) => {
    return api.put(`/api/motifs/${id}`, data);
  },

  delete: (id: string) => {
    return api.delete(`/api/motifs/${id}`);
  },
};

export const userService = {
  getAll: (params?: string) => {
    const url = params ? `/api/users?${params}` : "/api/users";
    return api.get(url);
  },

  create: (name: string, email: string, password: string, role: string) => {
    return api.post("/api/users", { name, email, password, role });
  },

  updateRole: (id: string, role: string) => {
    return api.patch(`/api/users/${id}/role`, { role });
  },

  delete: (id: string) => {
    return api.delete(`/api/users/${id}`);
  },

  updatePassword: (id: string, password: string) => {
    return api.patch(`/api/users/${id}/password`, { password });
  },

  // User profile endpoints
  getProfile: () => {
    return api.get("/api/users/me");
  },

  changePassword: (currentPassword: string | undefined, newPassword: string) => {
    return api.patch("/api/users/me/password", { currentPassword, newPassword });
  },

  updateProfilePicture: (profilePicture: string) => {
    return api.post("/api/users/me/profile-picture", { profilePicture });
  },

  updateProfile: (name?: string) => {
    return api.patch("/api/users/me", { name });
  },
};

export const predictionHistoryService = {
  getAll: (params?: string, signal?: AbortSignal) => {
    const url = params ? `/api/predict/admin/history?${params}` : "/api/predict/admin/history";
    return api.get(url, { signal });
  },

  getImageUrl: (id: string) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
    const token = localStorage.getItem("token");
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
    return `${API_BASE_URL}/api/predict/admin/history/${id}/image${tokenParam}`;
  },

  delete: (id: string) => {
    return api.delete(`/api/predict/admin/history/${id}`);
  },

  bulkDelete: (ids: string[]) => {
    return api.delete("/api/predict/admin/history", { data: { ids } });
  },

  export: async (format: "json" | "csv") => {
    const response = await api.get(`/api/predict/admin/history/export?format=${format}`, {
      responseType: format === "csv" ? "blob" : "json",
    });
    
    if (format === "csv") {
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const contentDisposition = response.headers["content-disposition"];
      let filename = `prediction-history-${Date.now()}.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } else {
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `prediction-history-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
    
    return response;
  },
};

export const predictionReviewService = {
  getForReview: (params?: string) => {
    const url = params ? `/api/predict/review?${params}` : "/api/predict/review";
    return api.get(url);
  },

  review: (id: string, status: "approved" | "rejected", reviewNotes?: string) => {
    return api.patch(`/api/predict/${id}/review`, { status, reviewNotes });
  },

  batchReview: (ids: string[], status: "approved" | "rejected", reviewNotes?: string) => {
    return api.patch("/api/predict/batch/review", { ids, status, reviewNotes });
  },
};

export const statsService = {
  getAdminStats: () => {
    return api.get("/api/stats/admin");
  },

  getSystemStats: () => {
    return api.get("/api/stats/system");
  },
};

export const exportService = {
  exportMotifs: (format: "csv" | "json" = "csv") => {
    return api.get(`/api/export/motifs?format=${format}`, { responseType: "blob" });
  },

  exportPredictions: (format: "csv" | "json" = "csv", filters?: { status?: string; startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams({ format });
    if (filters?.status) params.append("status", filters.status);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    return api.get(`/api/export/predictions?${params.toString()}`, { responseType: "blob" });
  },
};

export const activityLogsService = {
  getAll: (params?: string) => {
    const url = params ? `/api/logs?${params}` : "/api/logs";
    return api.get(url);
  },

  clear: (olderThanDays?: number) => {
    const url = olderThanDays ? `/api/logs/clear?olderThanDays=${olderThanDays}` : "/api/logs/clear";
    return api.delete(url);
  },
};

export const settingsService = {
  getAll: (category?: string) => {
    const url = category ? `/api/settings?category=${category}` : "/api/settings";
    return api.get(url);
  },

  getByKey: (key: string) => {
    return api.get(`/api/settings/${key}`);
  },

  update: (key: string, value: string, description?: string, category?: string) => {
    return api.put(`/api/settings/${key}`, { value, description, category });
  },

  batchUpdate: (settings: Array<{ key: string; value: string; category?: string; description?: string }>) => {
    return api.put("/api/settings", { settings });
  },

  delete: (key: string) => {
    return api.delete(`/api/settings/${key}`);
  },
};

export const wilayahService = {
  getProvinces: () => {
    return api.get("/api/wilayah/provinces");
  },

  getRegencies: (provinceId: string) => {
    return api.get(`/api/wilayah/regencies/${provinceId}`);
  },

  getDistricts: (regencyId: string) => {
    return api.get(`/api/wilayah/districts/${regencyId}`);
  },

  getVillages: (districtId: string) => {
    return api.get(`/api/wilayah/villages/${districtId}`);
  },
};

export default api;