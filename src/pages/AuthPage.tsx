import React, { useState, useEffect } from "react";
import { useWastra } from "../context/WastraContext";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import wastralogo from "/logosecond.svg";
import { useI18n } from "../context/I18nContext";

declare global {
  interface Window {
    google?: any;
  }
}

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    user,
    loading: userLoading,
    login,
    register,
    loginWithGoogle,
  } = useWastra();
  const navigate = useNavigate();

  const { t } = useI18n();

  // Redirect if already logged in
  useEffect(() => {
    if (!userLoading && user) {
      if (user.role === "admin" || user.role === "super_admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, userLoading, navigate]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(
          formData.name,
          formData.email,
          formData.password,
        );
      }

      if (result.success) {
        // Get user from localStorage to check role
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            // Redirect admin/super_admin to admin dashboard
            if (
              parsedUser.role === "admin" ||
              parsedUser.role === "super_admin"
            ) {
              navigate("/admin/dashboard");
            } else {
              navigate("/");
            }
          } catch {
            navigate("/");
          }
        } else {
          navigate("/");
        }
      } else {
        setError(result.message || t("errorAuthFailed"));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#B45309] via-[#6b3309] to-[#92400E] transition-colors">
      {/* Left Section - Logo */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
        {/* Tambahkan onClick dan cursor-pointer di sini */}
        <div
          className="text-center animate-slide-in-up cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => navigate("/")}
        >
          <img
            src={wastralogo}
            alt="Citra Wastra Logo"
            className="h-48 w-auto mx-auto brightness-0 invert drop-shadow-xl"
          />

          <p className="text-amber-100/80 text-lg font-light max-w-md mx-auto leading-relaxed">
       {t("tagline")}
      </p>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-xl animate-slide-in-up delay-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              {isLogin ? t("signInTitle") : t("signUpTitle")}
            </h2>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-md text-sm">
                  {error}
                </div>
              )}

              {!isLogin && (
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t("nameLabel")}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-400 
                             outline-none transition"
                    placeholder={t("namePlaceholder")}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t("emailLabel")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-400 
                           outline-none transition"
                  placeholder={t("emailPlaceholder")}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t("passwordLabel")}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-400 
                             outline-none transition pr-10"
                    placeholder={t("passwordPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#B45309] to-[#92400E] hover:from-[#92400E] hover:to-[#78350F]
                         text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 
                         disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? t("loading") : isLogin ? t("signInTitle") : t("signUpTitle")}
              </button>
            </form>

            {/* Google Sign-In */}
            {googleClientId && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      {t("orContinueWith")}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setError("");
                    setLoading(true);
                    try {
                      const result = await loginWithGoogle();
                      if (result.success) {
                        // Get user from localStorage to check role
                        const savedUser = localStorage.getItem("user");
                        if (savedUser) {
                          try {
                            const parsedUser = JSON.parse(savedUser);
                            // Redirect admin/super_admin to admin dashboard
                            if (
                              parsedUser.role === "admin" ||
                              parsedUser.role === "super_admin"
                            ) {
                              navigate("/admin/dashboard");
                            } else {
                              navigate("/");
                            }
                          } catch {
                            navigate("/");
                          }
                        } else {
                          navigate("/");
                        }
                      } else {
                        setError(
                          result.message || "Google authentication failed",
                        );
                      }
                    } catch (err: unknown) {
                      setError(
                        err instanceof Error ? err.message : "Unexpected error",
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t("continueWithGoogle")}
                </button>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? (
                <>
                  {t("noAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-amber-600 hover:text-amber-700 font-medium underline-offset-4 hover:underline transition-colors"
                  >
                    {t("register")}
                  </button>
                </>
              ) : (
                <>
                  {t("haveAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-amber-600 hover:text-amber-700 font-medium underline-offset-4 hover:underline transition-colors"
                  >
                    {t("login")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
