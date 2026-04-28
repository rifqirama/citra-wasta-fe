import React from "react";
import { Link, useNavigate  } from "react-router-dom";
import { useWastra } from "../../context/WastraContext";
import { useI18n } from "../../context/I18nContext";

const Footer: React.FC = () => {
  const { user } = useWastra();
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleLaunchApp = () => {
    if (user) {
      navigate("/detection-page"); 
    } else {
      navigate("/login"); 
    }
  };
  return (
    <footer className="bg-white dark:bg-gray-900 py-12 md:py-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Citra Wastra</h3>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 max-w-sm">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              {t("footer.nav")}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors inline-block"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  {t("footer.home")}
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors inline-block"
                >
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleLaunchApp} 
                  className="text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors inline-block"
                >
                  {t("footer.tryApp")}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              {t("footer.contact")}
            </h4>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                {t("footer.email")}{" "}
                <a
                  href="mailto:info@citrawastra.com"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                >
                  info@citrawastra.com
                </a>
              </li>
              <li>
                {t("footer.phone")}{" "}
                <a
                  href="tel:+621234567890"
                  className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                >
                  +62 812-2724-5907
                </a>
              </li>
              <li>{t("footer.location")} {t("footer.locationValue")}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 text-center text-sm text-gray-500 dark:text-gray-500">
          © {new Date().getFullYear()} Citra Wastra. {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
