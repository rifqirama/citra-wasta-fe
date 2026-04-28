import { useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { Save, RefreshCw, Settings as SettingsIcon } from "lucide-react";
import { useWastra } from "../context/WastraContext";

import { Button } from "../components/elements/button";
import { Card } from "../components/elements/card";
import { Skeleton } from "../components/elements/skeleton";
import { settingsService } from "../api/api";

interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string | null;
  updatedBy: string | null;
  updatedAt: string;
  updatedByUser: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

interface SettingsData {
  [category: string]: Setting[];
}

const Settings = () => {
  const { user } = useWastra();
  const [settings, setSettings] = useState<SettingsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  
  // Refs to store current input values
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});


  useEffect(() => {
    // Fetch settings when component mounts or when user changes
    if (user && (user.role === "super_admin" || user.role === "admin")) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsService.getAll() as any;
      if (res.data && res.data.success) {
        const newSettings = res.data.data || {};
        setSettings(newSettings);
        
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string, description?: string) => {
    // Prevent multiple simultaneous saves
    if (saving) {
      toast.error("Please wait for the current save to complete");
      return;
    }
    
    // Get the actual current value from the input field if available
    const inputElement = inputRefs.current[key];
    const currentValue = inputElement?.value || value;
    
    // Don't save if value is empty
    if (!currentValue || !currentValue.trim()) {
      toast.error("Value cannot be empty");
      return;
    }
    
    setSaving(key);
    try {
      // Normalize key to uppercase (backend expects uppercase)
      const normalizedKey = key.toUpperCase().trim();
      
      // Determine category from key
      let category = "general";
      if (normalizedKey.includes("ML_SERVICE") || normalizedKey.includes("TIMEOUT")) {
        category = "ml_service";
      } else if (normalizedKey.includes("RAILWAY")) {
        category = "railway";
      } else if (normalizedKey.includes("VERCEL")) {
        category = "vercel";
      }
      
      // Send category to backend to ensure it's saved correctly
      const response = await settingsService.update(normalizedKey, currentValue.trim(), description || undefined, category) as any;
      
      if (response.data && response.data.success && response.data.data) {
        toast.success(`Settings ${normalizedKey} updated successfully`);
        fetchSettings();
      } else {
        toast.error(`Failed to update ${normalizedKey}: ` + (response.data?.message || "Unknown error"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to update settings");
    } finally {
      setSaving(null);
    }
  };


  const getSettingValue = (category: string, key: string): string => {
    const normalizedKey = key.toUpperCase().trim();
    const categorySettings = settings[category] || [];
    const setting = categorySettings.find((s) => s.key.toUpperCase() === normalizedKey);
    
    if (setting) {
      return setting.value || "";
    }
    
    // Fallback: search in all categories if not found in specified category
    for (const cat in settings) {
      const found = settings[cat]?.find((s) => s.key.toUpperCase() === normalizedKey);
      if (found) {
        return found.value || "";
      }
    }
    
    return "";
  };

  const updateLocalSetting = (category: string, key: string, value: string) => {
    setSettings((prev) => {
      const categorySettings = prev[category] || [];
      const existingIndex = categorySettings.findIndex((s) => s.key === key);
      
      if (existingIndex >= 0) {
        // Update existing setting
        const updated = [...categorySettings];
        updated[existingIndex] = { ...updated[existingIndex], value };
        return {
          ...prev,
          [category]: updated,
        };
      } else {
        // Add new setting
        return {
          ...prev,
          [category]: [
            ...categorySettings,
            {
              id: `temp-${key}`,
              key,
              value,
              category,
              description: null,
              updatedBy: null,
              updatedAt: new Date().toISOString(),
              updatedByUser: null,
            },
          ],
        };
      }
    });
  };

  if (loading && Object.keys(settings).length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 bg-transparent border border-gray-100 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <Skeleton className="w-5 h-5 mr-2" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-4 w-64 mb-6" />
            <div className="space-y-6">
              {[1, 2].map((j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage system configurations and deployment settings
          </p>
        </div>
        <Button onClick={fetchSettings} variant="outline" className="border-gray-200 dark:border-gray-700 w-full sm:w-auto">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* ML Service Settings */}
      <Card className="p-4 sm:p-6 bg-transparent border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <SettingsIcon className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-500" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">ML Service</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Configure Machine Learning model service endpoint and settings
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="ml_service_url" className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              ML Service URL
            </label>
            <input
              id="ml_service_url"
              ref={(el) => {
                inputRefs.current["ML_SERVICE_URL"] = el;
              }}
              type="text"
              value={getSettingValue("ml_service", "ML_SERVICE_URL")}
              onChange={(e) => {
                updateLocalSetting("ml_service", "ML_SERVICE_URL", e.target.value);
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData("text");
                updateLocalSetting("ml_service", "ML_SERVICE_URL", pastedText);
                // Also update the input element directly
                if (inputRefs.current["ML_SERVICE_URL"]) {
                  inputRefs.current["ML_SERVICE_URL"].value = pastedText;
                }
              }}
              placeholder="https://your-ml-service.example.com"
              autoComplete="off"
              className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Button
              onClick={() => {
                // Get value directly from input field
                const inputValue = inputRefs.current["ML_SERVICE_URL"]?.value || getSettingValue("ml_service", "ML_SERVICE_URL");
                handleSave(
                  "ML_SERVICE_URL",
                  inputValue,
                  "Machine Learning service endpoint URL"
                );
              }}
              disabled={saving === "ML_SERVICE_URL"}
              className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {saving === "ML_SERVICE_URL" ? "Saving..." : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>

          <div>
            <label htmlFor="ml_service_timeout" className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              ML Service Timeout (ms)
            </label>
            <input
              id="ml_service_timeout"
              type="number"
              value={getSettingValue("ml_service", "ML_SERVICE_TIMEOUT")}
              onChange={(e) => updateLocalSetting("ml_service", "ML_SERVICE_TIMEOUT", e.target.value)}
              placeholder="120000"
              className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Button
              onClick={() =>
                handleSave(
                  "ML_SERVICE_TIMEOUT",
                  getSettingValue("ml_service", "ML_SERVICE_TIMEOUT"),
                  "Timeout for ML service requests in milliseconds"
                )
              }
              disabled={saving === "ML_SERVICE_TIMEOUT"}
              className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {saving === "ML_SERVICE_TIMEOUT" ? "Saving..." : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Backend Service Settings */}
      <Card className="p-6 bg-transparent border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <SettingsIcon className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Backend Service</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Backend API service endpoint configuration
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="railway_backend_url" className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Backend API URL
            </label>
            <input
              id="railway_backend_url"
              ref={(el) => {
                inputRefs.current["RAILWAY_BACKEND_URL"] = el;
              }}
              type="text"
              value={getSettingValue("railway", "RAILWAY_BACKEND_URL")}
              onChange={(e) => {
                updateLocalSetting("railway", "RAILWAY_BACKEND_URL", e.target.value);
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData("text");
                updateLocalSetting("railway", "RAILWAY_BACKEND_URL", pastedText);
                // Also update the input element directly
                if (inputRefs.current["RAILWAY_BACKEND_URL"]) {
                  inputRefs.current["RAILWAY_BACKEND_URL"].value = pastedText;
                }
              }}
              placeholder="https://your-backend-api.example.com"
              autoComplete="off"
              className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Button
              onClick={() => {
                // Get value directly from input field
                const inputValue = inputRefs.current["RAILWAY_BACKEND_URL"]?.value || getSettingValue("railway", "RAILWAY_BACKEND_URL");
                handleSave(
                  "RAILWAY_BACKEND_URL",
                  inputValue,
                  "Backend API service URL"
                );
              }}
              disabled={saving === "RAILWAY_BACKEND_URL"}
              className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {saving === "RAILWAY_BACKEND_URL" ? "Saving..." : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>

        </div>
      </Card>

      {/* Frontend Service Settings */}
      <Card className="p-4 sm:p-6 bg-transparent border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <SettingsIcon className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-500" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Frontend Service</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Frontend application deployment URL configuration
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="vercel_frontend_url" className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Frontend URL
            </label>
            <input
              id="vercel_frontend_url"
              ref={(el) => {
                inputRefs.current["VERCEL_FRONTEND_URL"] = el;
              }}
              type="text"
              value={getSettingValue("vercel", "VERCEL_FRONTEND_URL")}
              onChange={(e) => {
                updateLocalSetting("vercel", "VERCEL_FRONTEND_URL", e.target.value);
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData("text");
                updateLocalSetting("vercel", "VERCEL_FRONTEND_URL", pastedText);
                // Also update the input element directly
                if (inputRefs.current["VERCEL_FRONTEND_URL"]) {
                  inputRefs.current["VERCEL_FRONTEND_URL"].value = pastedText;
                }
              }}
              placeholder="https://your-frontend-app.example.com"
              autoComplete="off"
              className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Button
              onClick={() => {
                // Get value directly from input field
                const inputValue = inputRefs.current["VERCEL_FRONTEND_URL"]?.value || getSettingValue("vercel", "VERCEL_FRONTEND_URL");
                handleSave(
                  "VERCEL_FRONTEND_URL",
                  inputValue,
                  "Frontend application deployment URL"
                );
              }}
              disabled={saving === "VERCEL_FRONTEND_URL"}
              className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {saving === "VERCEL_FRONTEND_URL" ? "Saving..." : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Performance & System Settings */}
      <Card className="p-4 sm:p-6 bg-transparent border border-gray-100 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <SettingsIcon className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance & System</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          System performance and configuration settings
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="rate_limit_max" className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Rate Limit Max (requests per minute)
            </label>
            <input
              id="rate_limit_max"
              type="number"
              value={getSettingValue("general", "RATE_LIMIT_MAX")}
              onChange={(e) => updateLocalSetting("general", "RATE_LIMIT_MAX", e.target.value)}
              placeholder="100"
              className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Button
              onClick={() =>
                handleSave(
                  "RATE_LIMIT_MAX",
                  getSettingValue("general", "RATE_LIMIT_MAX"),
                  "Maximum number of requests allowed per minute"
                )
              }
              disabled={saving === "RATE_LIMIT_MAX"}
              className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {saving === "RATE_LIMIT_MAX" ? "Saving..." : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>

          <div>
            <label htmlFor="max_file_size" className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Max File Size (bytes)
            </label>
            <input
              id="max_file_size"
              type="number"
              value={getSettingValue("general", "MAX_FILE_SIZE")}
              onChange={(e) => updateLocalSetting("general", "MAX_FILE_SIZE", e.target.value)}
              placeholder="5242880"
              className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Example: 5242880 = 5MB</p>
            <Button
              onClick={() =>
                handleSave(
                  "MAX_FILE_SIZE",
                  getSettingValue("general", "MAX_FILE_SIZE"),
                  "Maximum file size allowed for uploads in bytes"
                )
              }
              disabled={saving === "MAX_FILE_SIZE"}
              className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {saving === "MAX_FILE_SIZE" ? "Saving..." : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>

          <div>
            <label htmlFor="allowed_mime_types" className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Allowed MIME Types (comma-separated)
            </label>
            <input
              id="allowed_mime_types"
              type="text"
              value={getSettingValue("general", "ALLOWED_MIME_TYPES")}
              onChange={(e) => updateLocalSetting("general", "ALLOWED_MIME_TYPES", e.target.value)}
              placeholder="image/jpeg,image/png,image/webp"
              className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Button
              onClick={() =>
                handleSave(
                  "ALLOWED_MIME_TYPES",
                  getSettingValue("general", "ALLOWED_MIME_TYPES"),
                  "Comma-separated list of allowed MIME types for file uploads"
                )
              }
              disabled={saving === "ALLOWED_MIME_TYPES"}
              className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {saving === "ALLOWED_MIME_TYPES" ? "Saving..." : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>

          <div>
            <label htmlFor="log_level" className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Log Level
            </label>
            <select
              id="log_level"
              value={getSettingValue("general", "LOG_LEVEL")}
              onChange={(e) => updateLocalSetting("general", "LOG_LEVEL", e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select log level...</option>
              <option value="debug">debug</option>
              <option value="info">info</option>
              <option value="warn">warn</option>
              <option value="error">error</option>
            </select>
            <Button
              onClick={() =>
                handleSave(
                  "LOG_LEVEL",
                  getSettingValue("general", "LOG_LEVEL"),
                  "Application logging level (debug, info, warn, error)"
                )
              }
              disabled={saving === "LOG_LEVEL"}
              className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {saving === "LOG_LEVEL" ? "Saving..." : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>

          <div>
            <label htmlFor="enable_maintenance" className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Enable Maintenance Mode
            </label>
            <select
              id="enable_maintenance"
              value={getSettingValue("general", "ENABLE_MAINTENANCE")}
              onChange={(e) => updateLocalSetting("general", "ENABLE_MAINTENANCE", e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select option...</option>
              <option value="false">Disabled</option>
              <option value="true">Enabled</option>
            </select>
            <Button
              onClick={() =>
                handleSave(
                  "ENABLE_MAINTENANCE",
                  getSettingValue("general", "ENABLE_MAINTENANCE"),
                  "Enable or disable maintenance mode"
                )
              }
              disabled={saving === "ENABLE_MAINTENANCE"}
              className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {saving === "ENABLE_MAINTENANCE" ? "Saving..." : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;

