import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import hero1 from "@/assets/images/hero1.webp";
import hero2 from "@/assets/images/hero2.webp";
import { useWastra } from "../../context/WastraContext";
import { useI18n } from "../../context/I18nContext";

const images = [
  { src: hero1, alt: "Batik Pattern 1" },
  { src: hero2, alt: "Batik Pattern 2" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useWastra();
  const { t } = useI18n();

  // --- TARUH DI SINI ---
  const statsData = [
    { val: "109", labelKey: "hero.stats_motifs" },
    { val: "108k+", labelKey: "hero.stats_curated" },
    { val: "99.46%", labelKey: "hero.stats_accuracy" },
    { val: "AI Powered", labelKey: "hero.stats_ar" }
  ];

  const handleHowItWorks = () => {
    const section = document.getElementById("how-it-works");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLaunchApp = () => {
    if (user) {
      navigate("/detection-page");
    } else {
      navigate("/login");
    }
  };

  return (
    <section className="relative overflow-hidden bg-white dark:bg-gray-900 transition-colors grid-hero-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 md:pt-20 md:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-4 md:space-y-5 flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            <div className="space-y-3 md:space-y-4">
              <motion.h1
                variants={itemVariants}
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.1]"
              >
                {t("hero.title")}{" "}
                <span className="text-amber-600 dark:text-amber-500">
                  Citra Wastra
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-md"
              >
                {t("hero.subtitle")}
              </motion.p>
            </div>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-3 items-center"
            >
              <button
                onClick={handleLaunchApp}
                className="bg-amber-600 hover:bg-amber-700 text-white px-7 py-3.5 rounded-full font-bold text-sm transition-all shadow-lg"
              >
                {t("hero.cta")}
              </button>

              <button
                onClick={handleHowItWorks}
                className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-amber-600 dark:border-gray-700 px-7 py-3.5 rounded-full font-bold text-sm transition-all"
              >
                {t("process.title")}
              </button>
            </motion.div>

            {/* Stats Row - Menggunakan statsData dan t() */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center lg:justify-start flex-wrap gap-x-4 md:gap-x-6 gap-y-2 pt-3 mt-1 border-t border-gray-100 dark:border-gray-800"
            >
              {statsData.map((stat, idx) => (
                <div key={idx} className="flex items-center">
                  {idx !== 0 && (
                    <div className="hidden sm:block h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mr-4 md:mr-6" />
                  )}
                  <div className="flex flex-col">
                    {/* Angka diperkecil: text-base (HP) & text-lg (Desktop) */}
                    <p className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 leading-none">
                      {stat.val}
                    </p>
                    {/* Label diperkecil: text-[6px] (HP) & text-[8px] (Desktop) */}
                    <p className="text-[6px] md:text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight mt-1 leading-none">
                      {t(stat.labelKey)}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

<motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full mt-10 lg:mt-0 flex flex-col items-center justify-center"
          >
            {/* 1. Tampilan Mobile: Hanya muncul di HP (lg:hidden), hanya 1 gambar */}
            <div className="lg:hidden w-full max-w-sm">
              <motion.div
                variants={itemVariants}
                className="relative overflow-hidden rounded-[2rem] shadow-lg group border-2 border-amber-100/50"
              >
                <div className="relative w-full h-[140px]">
                  <img
                    src={hero1} 
                    alt="Batik Pattern Mobile"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-amber-900/5"></div>
                </div>
              </motion.div>
            </div>

            {/* 2. Tampilan Desktop: Hanya muncul di layar besar (hidden lg:flex), tampil semua (2 gambar) */}
            <div className="hidden lg:flex flex-col gap-4 w-full">
              {images.map((img, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="relative overflow-hidden rounded-[2rem] shadow-lg group"
                >
                  <div className="relative w-full h-[180px]">
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-amber-900/5 group-hover:bg-transparent transition-colors duration-500"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;