import React from "react";
import { useNavigate } from "react-router-dom";
import accuracy from "@/assets/icons/accuracy.png";
import motif from "@/assets/icons/motif.png";
import report from "@/assets/icons/report.png";
import global from "@/assets/icons/global.png";
import batik1 from "@/assets/images/batik-preview1.jpeg";
import batik2 from "@/assets/images/batik-preview2.jpeg";
import batik3 from "@/assets/images/batik-preview3.jpeg";
import batik4 from "@/assets/images/batik-preview4.jpeg";
import { useI18n } from "../../context/I18nContext";

const featuresMeta = [
  {
    icon: accuracy,
    tTitle: "detectIntro.f1.title",
    tDesc: "detectIntro.f1.desc",
  },
  { icon: motif, tTitle: "detectIntro.f2.title", tDesc: "detectIntro.f2.desc" },
  {
    icon: report,
    tTitle: "detectIntro.f3.title",
    tDesc: "detectIntro.f3.desc",
  },
  {
    icon: global,
    tTitle: "detectIntro.f4.title",
    tDesc: "detectIntro.f4.desc",
  },
];

const delayClasses = ["delay-0", "delay-200", "delay-400", "delay-600"];

const DetectionIntro: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = false;
  const { t } = useI18n();

  const handleLetsDetect = () => {
    if (!isLoggedIn) navigate("/login");
    else navigate("/deteksi-motif");
  };

  return (
    <section className="relative bg-white dark:bg-gray-900 py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="animate-slide-in-left flex flex-col items-center md:items-start text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t("detectIntro.title")}
          </h1>
          <p className="mt-6 max-w-md text-body-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            {t("detectIntro.body")}
          </p>
          <button
            onClick={handleLetsDetect}
            className="mt-8 bg-amber-600 dark:bg-amber-700 hover:bg-amber-700 dark:hover:bg-amber-600 text-white px-7 py-3.5 rounded-full font-bold text-sm transition-all shadow-lg active:scale-95"
          >
            {t("detectIntro.cta")}
          </button>
        </div>

        <div className="grid grid-cols-2 grid-rows-2 gap-4">
          {[batik1, batik4, batik3, batik2].map((src, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-xl shadow-md opacity-0 animate-slide-in-up ${delayClasses[i]}`}
            >
              <img
                src={src}
                alt={`Batik pattern ${i + 1}`}
                className="w-full h-40 md:h-48 lg:h-56 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>

    <div className="mt-16 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {featuresMeta.map((f, index) => (
        <div
          key={index}
          className="text-center p-4 md:p-6 hover:shadow-lg transition-shadow rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <img src={f.icon} alt="" className="w-8 h-8 mx-auto" />
          <h3 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2 md:mb-3">
            {t(f.tTitle)}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-[11px] md:text-sm leading-relaxed line-clamp-3 md:line-clamp-none">
            {t(f.tDesc)}
          </p>
        </div>
      ))}
    </div>
    </section>
  );
};

export default DetectionIntro;
