import { useEffect, useState, type ReactNode } from "react";
import { WastraContext, type User } from "./WastraContext";
import { authService, userService } from "../api/api";
import axios from "axios";

interface WastraContextProviderProps {
  children: ReactNode;
}

interface AuthResponse {
  success: boolean;
  message?: string;
}

export const WastraContextProvider = ({ children }: WastraContextProviderProps) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (!parsed.role) parsed.role = "user";
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Verify session and sync role with server
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem("token");
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await userService.getProfile() as any;
        if (response.data && response.data.success && response.data.data?.user) {
          const serverUser = response.data.data.user;
          const userWithRole = { ...serverUser, role: serverUser.role ?? "user" };
          
          // Update state and storage if role changed or data is out of sync
          const savedUserStr = localStorage.getItem("user");
          const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
          
          if (!savedUser || savedUser.role !== userWithRole.role || savedUser.email !== userWithRole.email || savedUser.name !== userWithRole.name || savedUser.profilePicture !== userWithRole.profilePicture) {
            localStorage.setItem("user", JSON.stringify(userWithRole));
            setUser(userWithRole);
          }
        }
      } catch (error: any) {
        // If 401/403, session is invalid
        if ((axios as any).isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem("user");
      const savedToken = localStorage.getItem("token");
      setToken(savedToken);
      if (savedToken && savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await authService.login(email, password) as any;
      const { token: newToken, user } = response.data;

      if (newToken && user) {
        const userWithRole = { ...user, role: user.role ?? "user" };
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userWithRole));

        setToken(newToken);
        setUser(userWithRole);
        return { success: true };
      }
      return { success: false, message: "Login failed: no token received" };
    } catch (error: unknown) {
      if ((axios as any).isAxiosError(error)) {
        // Handle maintenance mode (503)
        if ((error as any).response?.status === 503 && (error as any).response?.data?.maintenance) {
          return {
            success: false,
            message: (error as any).response?.data?.message || "Sistem sedang dalam tahap maintenance. Silakan coba lagi nanti.",
          };
        }
        
        // Handle rate limit error (429)
        if ((error as any).response?.status === 429) {
          return {
            success: false,
            message: "Too many login attempts. Please wait a few minutes before trying again.",
          };
        }
        
        // Handle other errors
        const errorMessage = (error as any).response?.data?.message || 
                            (error as any).response?.data?.error ||
                            (error as any).message ||
                            "Login failed";
        
        return {
          success: false,
          message: errorMessage,
        };
      }
      return { success: false, message: "Login failed: Network error or server unavailable" };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await authService.register(name, email, password) as any;
      const { token: newToken, user } = response.data;

      if (newToken && user) {
        const userWithRole = { ...user, role: user.role ?? "user" };
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userWithRole));

        setToken(newToken);
        setUser(userWithRole);
        return { success: true };
      }
      return { success: false, message: "Registration failed: no token received" };
    } catch (error: unknown) {
      if ((axios as any).isAxiosError(error)) {
        if ((error as any).response?.status === 429) {
          return { success: false, message: "Too many requests, please wait a moment" };
        }
        const data = (error as any).response?.data as any;
        const detailedMessage = Array.isArray(data?.errors)
          ? (data.errors as { message: string }[]).map((e) => e.message).join(", ")
          : data?.message;

        return { success: false, message: detailedMessage || "Registration failed" };
      }
      return { success: false, message: "Registration failed" };
    }
  };

  const loginWithGoogle = async (): Promise<AuthResponse> => {
    return new Promise((resolve) => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        resolve({ success: false, message: "Google Client ID not configured" });
        return;
      }

      // Initialize Google OAuth client
      const initializeGoogleAuth = () => {
        if (window.google) {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'email profile',
            callback: async (tokenResponse: any) => {
              try {
                if (!tokenResponse?.access_token) {
                  resolve({ success: false, message: "Failed to get access token from Google" });
                  return;
                }

                const userInfoResponse = await fetch(
                  `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`
                );
                
                if (!userInfoResponse.ok) {
                  resolve({ 
                    success: false, 
                    message: `Failed to get user info from Google: ${userInfoResponse.status}` 
                  });
                  return;
                }
                
                const userInfo = await userInfoResponse.json();
                
                if (!userInfo.email) {
                  resolve({ success: false, message: "Email not provided by Google" });
                  return;
                }
                
                const apiResponse = await authService.googleAuth(
                  tokenResponse.access_token,
                  userInfo.name || "",
                  userInfo.email || "",
                  userInfo.picture || undefined
                ) as any;
                
                const { token: newToken, user: backendUser } = apiResponse.data;

                if (newToken && backendUser) {
                  const userWithRole = { ...backendUser, role: backendUser.role ?? "user" };
                  localStorage.setItem("token", newToken);
                  localStorage.setItem("user", JSON.stringify(userWithRole));

                  setToken(newToken);
                  setUser(userWithRole);
                  resolve({ success: true });
                } else {
                  resolve({ success: false, message: "Google login failed: no token received" });
                }
              } catch (error: unknown) {
                if ((axios as any).isAxiosError(error)) {
                  resolve({
                    success: false,
                    message: (error as any).response?.data?.message || (error as any).message || "Google login failed",
                  });
                } else if (error instanceof Error) {
                  resolve({ success: false, message: error.message });
                } else {
                  resolve({ success: false, message: "Google login failed" });
                }
              }
            },
          });
          
          try {
            client.requestAccessToken();
          } catch (error: any) {
            resolve({ success: false, message: `Failed to request access token: ${error.message}` });
          }
        } else {
          resolve({ success: false, message: "Failed to load Google Sign-In library" });
        }
      };

      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript && window.google) {
        // Script already loaded, initialize directly
        initializeGoogleAuth();
        return;
      }

      // Load Google Identity Services script
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        initializeGoogleAuth();
      };
      
      script.onerror = () => {
        resolve({ success: false, message: "Failed to load Google Sign-In script. Check your internet connection." });
      };
      
      document.head.appendChild(script);
    });
  };

  const logout = async () => {
    try {
      // Call logout API to log the activity
      await authService.logout();
    } catch (error) {
      // Even if API call fails, still proceed with logout
      console.error("Logout API call failed:", error);
    } finally {
      // Clear all localStorage items
      localStorage.clear();
      sessionStorage.clear();
      setToken(null);
      setUser(null);
    }
  };

  return (
    <WastraContext.Provider value={{ user, loading, token, setUser, login, register, loginWithGoogle, logout }}>
      {children}
    </WastraContext.Provider>
  );
};
