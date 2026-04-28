import React from "react";
import { motion } from "framer-motion";
import flowImage from "@/assets/images/wastraproses.webp";
import kamera from "@/assets/icons/camera.svg";
import insight from "@/assets/icons/insight.svg";
import lokasi from "@/assets/icons/lokasi.svg";
import catatan from "@/assets/icons/catatan.svg";
import { useI18n } from "../../context/I18nContext";

const prosesMeta = [
  { icon: kamera, label: "kamera", tTitle: "process.s1.title", tDesc: "process.s1.desc" },
  { icon: insight, label: "insight", tTitle: "process.s2.title", tDesc: "process.s2.desc" },
  { icon: lokasi, label: "lokasi", tTitle: "process.s3.title", tDesc: "process.s3.desc" },
  { icon: catatan, label: "budaya", tTitle: "process.s4.title", tDesc: "process.s4.desc" },
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
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const WastraProses: React.FC = () => {
  const { t } = useI18n();
  return (
    <section id="how-it-works" className="bg-white dark:bg-gray-900 py-16 md:py-24 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t("process.title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t("process.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
            className="space-y-6"
          >
            {prosesMeta.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex gap-5 bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-700 hover:border-amber-600 dark:hover:border-amber-600 hover:shadow-md transition-all duration-300"
              >
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center shadow-sm transition-colors">
                    <img 
                      src={item.icon} 
                      alt={item.label} 
                      loading="lazy"
                      decoding="async"
                      width={28}
                      height={28}
                      className="w-7 h-7"
                    />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t(item.tTitle)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t(item.tDesc)}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="flex justify-center items-center"
          >
            <picture>
              <source
                srcSet={flowImage}
                type="image/webp"
              />
              <img
                src={flowImage}
                alt=""
                loading="lazy"
                decoding="async"
                width={600}
                height={400}
                sizes="(min-width: 1024px) 570px, 100vw"
                className="w-full max-w-md rounded-lg"
              />
            </picture>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WastraProses;
