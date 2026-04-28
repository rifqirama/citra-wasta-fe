import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWastra } from "../../context/WastraContext";
import { useTheme } from "../../context/ThemeContext";
import NavLinks from "../layouts/NavLinks";
import wastralogo from "/logosecond.svg";
import { toast } from "react-hot-toast";
import { useI18n } from "../../context/I18nContext";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const { user, logout } = useWastra();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { lang, setLang, t } = useI18n() as any;
  const navigate = useNavigate();

  useEffect(() => {
    if (showConfirm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showConfirm]);

  const LangSwitcher = () => (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-max">
      <button
        onClick={() => setLang("en")}
        className={`text-xs font-semibold px-1 transition-colors ${
          lang === "en"
            ? "text-amber-600 dark:text-amber-400"
            : "text-gray-600 dark:text-gray-300 hover:text-amber-600"
        }`}
      >
        EN
      </button>
      <span className="text-gray-400">|</span>
      <button
        onClick={() => setLang("id")}
        className={`text-xs font-semibold px-1 transition-colors ${
          lang === "id"
            ? "text-amber-600 dark:text-amber-400"
            : "text-gray-600 dark:text-gray-300 hover:text-amber-600"
        }`}
      >
        ID
      </button>
    </div>
  );

  const UserAvatar = ({
    name,
    profilePicture,
    email,
  }: {
    name?: string | null;
    profilePicture?: string | null;
    email?: string;
  }) => {
    if (profilePicture) {
      return (
        <img
          src={profilePicture}
          alt={name || "User"}
          className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600"
        />
      );
    }
    const initial =
      name?.charAt(0).toUpperCase() || email?.charAt(0).toUpperCase() || "U";
    return (
      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {initial}
        </span>
      </div>
    );
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success("You have been logged out successfully");
      setTimeout(() => navigate("/"), 1000);
    } finally {
      setLoggingOut(false);
      setShowConfirm(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 shadow-md fixed w-full top-0 left-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex-shrink-0">
                <img
                  src={wastralogo}
                  alt="Wastra Logo"
                  className="h-10 w-auto hover:scale-105"
                />
              </Link>
            </div>

            {/* NavLinks */}
            <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-full max-w-[500px] justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <NavLinks mobile={false} userRole={user?.role} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="hidden lg:block">
                <LangSwitcher />
              </div>

              {/* Theme Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {resolvedTheme === "dark" ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  )}
                </button>

                {themeMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setThemeMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 overflow-hidden">
                      <button
                        onClick={() => {
                          setTheme("light");
                          setThemeMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${theme === "light" ? "text-amber-600 font-bold" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        Light
                      </button>
                      <button
                        onClick={() => {
                          setTheme("dark");
                          setThemeMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${theme === "dark" ? "text-amber-600 font-bold" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                          />
                        </svg>
                        Dark
                      </button>
                      <button
                        onClick={() => {
                          setTheme("system");
                          setThemeMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${theme === "system" ? "text-amber-600 font-bold" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        System
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* User Desktop */}
              <div className="hidden md:flex items-center gap-3">
                {user && (user.role === "admin" || user.role === "super_admin") && (
                  <Link
                    to="/admin/dashboard"
                    className="p-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                    title="Dashboard Admin"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                )}
                {user ? (
                  <div className="flex items-center gap-3">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 group px-3 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <UserAvatar
                        name={user.name}
                        profilePicture={user.profilePicture}
                        email={user.email}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-amber-600 transition-colors hidden 2xl:block max-w-[120px] truncate">
                        {user.name}
                      </span>
                    </Link>
                    <button
                      onClick={() => setShowConfirm(true)}
                      className="bg-amber-600 text-white px-5 py-1.5 rounded-full text-sm font-semibold hover:bg-amber-700 transition-colors"
                    >
                      {t("navbar.logout")}
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="bg-amber-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-amber-700 transition-all"
                  >
                    {t("navbar.login")}
                  </Link>
                )}
              </div>

              {/* Mobile Hamburger */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span
                  className={`block h-[2px] w-6 bg-gray-800 dark:bg-gray-200 rounded transition-all duration-300 ${isOpen ? "rotate-45 translate-y-[8px]" : "mb-1.5"}`}
                />
                <span
                  className={`block h-[2px] w-6 bg-gray-800 dark:bg-gray-200 rounded transition-all duration-300 ${isOpen ? "opacity-0" : "mb-1.5"}`}
                />
                <span
                  className={`block h-[2px] w-6 bg-gray-800 dark:bg-gray-200 rounded transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-[8px]" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 md:hidden ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          onClick={() => setIsOpen(false)}
        >
          <div
            className={`absolute right-0 top-0 w-3/4 max-w-xs h-full bg-white dark:bg-gray-900 shadow-xl p-5 transition-transform duration-300 transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Menu
              </p>
              <NavLinks
                mobile
                onClick={() => setIsOpen(false)}
                userRole={user?.role}
              />

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  {t("language") || "Settings"}
                </p>
                <div className="mt-1">
                  <LangSwitcher />
                </div>
              </div>

              <div className="mt-auto">
                {user ? (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl space-y-4">
                    {user && (user.role === "admin" || user.role === "super_admin") && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Dashboard Admin
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3"
                    >
                      <UserAvatar
                        name={user.name}
                        profilePicture={user.profilePicture}
                        email={user.email}
                      />
                      <div className="overflow-hidden min-w-0 flex-1">
                        {" "}
                        
                        <p className="font-bold text-gray-800 dark:text-gray-100 leading-none truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1 truncate">
                          {t("navbar.viewProfile")}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => setShowConfirm(true)}
                      className="w-full bg-amber-600 text-white py-2.5 rounded-full font-medium text-sm"
                    >
                      {t("navbar.logout")}
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full bg-amber-600 text-white py-3 rounded-full text-center font-bold"
                  >
                    {t("navbar.login")}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60] backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-2 dark:text-gray-100">
              {t("navbar.confirmTitle")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {t("navbar.confirmMessage")}
              {user?.name ? `, ${user.name}` : ""}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-6 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleConfirmLogout}
                disabled={loggingOut}
                className="px-6 py-2 rounded-full bg-amber-600 text-white font-medium hover:bg-amber-700 transition-all"
              >
                {loggingOut ? "..." : t("common.logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
