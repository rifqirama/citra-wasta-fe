import type React from "react";
import { NavLink } from "react-router-dom";
import { useI18n } from "../../context/I18nContext";

interface NavLinksProps {
  onClick?: () => void;
  mobile?: boolean;
  userRole?: string;
}

const NavLinks: React.FC<NavLinksProps> = ({ onClick, mobile = false }) => {
  const { t } = useI18n();

  const navItems = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.detection"), path: "/detection-page" },
    { name: t("nav.gallery"), path: "/gallery-page" },
    { name: t("nav.maps"), path: "/maps" },
    { name: t("nav.about"), path: "/about" },
  ];

  const baseClass = "transition duration-200 ease-in-out";

  const activeClass = "bg-amber-600/10 text-amber-600 font-semibold";

  const inactiveClass =
    "text-gray-700 dark:text-gray-300 hover:text-[#92400E] hover:bg-[#92400E]/5";

  // ---------- MOBILE NAV ----------
  if (mobile) {
    return (
      <nav className="flex flex-col gap-0.5">
        {" "}
        {/* Dikurangi dari gap-1 */}
        {navItems.map(({ name, path }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onClick}
            className={({ isActive }) =>
              `${baseClass} block px-4 py-2.5 rounded-lg text-sm ${
                // py-2.5 atau py-2 agar pas
                isActive ? activeClass : inactiveClass
              }`
            }
          >
            {name}
          </NavLink>
        ))}
      </nav>
    );
  }
  // ---------- DESKTOP NAV ----------
  return (
    <nav className="flex items-center justify-center gap-3">
      {navItems.map(({ name, path }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `${baseClass} px-3 py-1.5 rounded-full ${
              isActive ? activeClass : inactiveClass
            }`
          }
        >
          {name}
        </NavLink>
      ))}
    </nav>
  );
};

export default NavLinks;
