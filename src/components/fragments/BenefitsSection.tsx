import React from "react";
import { motion } from "framer-motion";
import kaca from "@/assets/icons/kaca.svg";
import jam from "@/assets/icons/jam.svg";
import bumi from "@/assets/icons/bumi.svg";
import budaya from "@/assets/icons/budaya.svg";
import { useI18n } from "../../context/I18nContext";

const benefitsMeta = [
  { icon: kaca, tTitle: "benefits.b1.title", tDesc: "benefits.b1.desc" },
  { icon: jam, tTitle: "benefits.b2.title", tDesc: "benefits.b2.desc" },
  { icon: bumi, tTitle: "benefits.b3.title", tDesc: "benefits.b3.desc" },
  { icon: budaya, tTitle: "benefits.b4.title", tDesc: "benefits.b4.desc" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const BenefitsSection: React.FC = () => {
  const { t } = useI18n();
  return (
    <section className="bg-white dark:bg-gray-900 py-16 md:py-24 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t("benefits.title")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t("benefits.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {benefitsMeta.map((item, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-700 hover:border-amber-600 dark:hover:border-amber-600 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-amber-600/10 text-amber-600 flex items-center justify-center transition-colors">
                  <img
                    src={item.icon}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t(item.tTitle)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t(item.tDesc)}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default BenefitsSection;
