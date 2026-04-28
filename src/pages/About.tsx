import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Cpu,
  Database,
  Palette,
  Target,
  AlertTriangle,
  Play,
  Glasses,
  Brain,
  Wrench,
} from "lucide-react";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import profileangga from "@/assets/images/profile.png";
import profilerifqi from "@/assets/images/rifqi.jpg";
import profileyovis from "@/assets/images/yovis.jpg";
import { useI18n } from "../context/I18nContext";
import Footer from "../components/fragments/Footer";

const About: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleCTAClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/detection-page");
    } else {
      navigate("/login");
    }
  };

  const objectives = [
    t("about.objective1"),
    t("about.objective2"),
    t("about.objective3"),
    t("about.objective4"),
    t("about.objective5"),
    t("about.objective6"),
  ].map((text) => {
    const [title, ...rest] = text.split("\n");
    return {
      title: title?.trim() ?? "",
      description: rest.join(" ").trim(),
    };
  });

  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="relative bg-white dark:bg-gray-900 py-20 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="grid-hero-bg">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-amber-700 dark:text-amber-500">
                {t("about.title1")}
              </h1>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-amber-700 dark:text-amber-500">
                {t("about.title2")}
              </h2>
              <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 mb-6 max-w-3xl mx-auto">
                {t("about.subtitle")}
              </p>
            </motion.div>
          </div>

          {/* Why Built Section */}
          <motion.div
            className="mb-20 relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div
              className="absolute inset-0 bg-white dark:bg-gray-900 rounded-2xl"
              style={{ zIndex: -1 }}
            />
            <h2 className="text-3xl font-bold text-center text-amber-700 dark:text-amber-500 mb-8 relative z-10">
              {t("about.whyTitle")}
            </h2>
            <div className="bg-gradient-to-br bg-amber-600/5 hover:bg-amber-600/10 rounded-2xl p-8 shadow-lg relative z-10">
              <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 mb-6 italic">
                {t("about.whyQuote")}
              </p>
              <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 mb-6">
                {t("about.whyP1")}
              </p>
              <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 mb-6">
                {t("about.whyP2")}
              </p>
              <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 mb-6">
                {t("about.whyP3")}
              </p>
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, staggerChildren: 0.1 }}
            viewport={{ once: true }}
          >
            {[
              { val: "109", label: t("about.stat1") },
              { val: "108k+", label: t("about.stat2") },
              { val: "99.46%", label: t("about.stat3") },
              { val: "AI Powered", label: t("about.stat4") },
            ].map((stat, i) => (
              <div
                key={i}
                className="text-center bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
              >
                <div className="text-3xl font-bold text-amber-600 mb-2">
                  {stat.val}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Features Section */}
          <motion.div
            className="mb-20 relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div
              className="absolute inset-0 bg-white dark:bg-gray-900 rounded-2xl"
              style={{ zIndex: -1 }}
            />
            <h2 className="text-3xl font-bold text-center text-amber-700 dark:text-amber-500 mb-8 relative z-10">
              {t("about.featuresTitle")}
            </h2>
            <p className="text-center text-lg text-gray-600 dark:text-gray-400 mb-10 relative z-10">
              {t("about.featuresSubtitle")}
            </p>
            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              {[
                {
                  icon: <Glasses size={36} />,
                  title: t("about.feature1Title"),
                  desc: t("about.feature1Desc"),
                },
                {
                  icon: <Palette size={36} />,
                  title: t("about.feature2Title"),
                  desc: t("about.feature2Desc"),
                },
                {
                  icon: <Brain size={36} />,
                  title: t("about.feature3Title"),
                  desc: t("about.feature3Desc"),
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                >
                  <div className="text-amber-600 mb-4">{f.icon}</div>
                  <h3 className="text-xl font-semibold text-amber-600 mb-3">
                    {f.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">{f.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tech Stack Section */}
          <motion.div
            className="mb-20 relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div
              className="absolute inset-0 bg-white dark:bg-gray-900 rounded-2xl"
              style={{ zIndex: -1 }}
            />
            <h2 className="text-3xl font-bold text-center text-amber-700 dark:text-amber-500 mb-8 relative z-10 flex items-center justify-center gap-2">
              <Wrench size={26} />
              {t("about.techTitle")}
            </h2>
            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              {/* Backend */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <Cpu className="text-amber-600 mr-3" size={24} />
                  <h3 className="text-xl font-semibold text-amber-600">
                    {t("about.backendTitle")}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Node.js", "TypeScript", "Prisma", "PostgreSQL"].map(
                    (tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 rounded-full bg-amber-600/10 text-amber-600 text-sm font-medium"
                      >
                        {tech}
                      </span>
                    ),
                  )}
                </div>
              </div>
              {/* ML */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <Database className="text-amber-600 mr-3" size={24} />
                  <h3 className="text-xl font-semibold text-amber-600">
                    {t("about.mlTitle")}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "TensorFlow",
                    "Keras",
                    "EfficientNetV2B0",
                    "SavedModel Format",
                  ].map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 rounded-full bg-amber-600/10 text-amber-600 text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              {/* Frontend */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <Palette className="text-amber-600 mr-3" size={24} />
                  <h3 className="text-xl font-semibold text-amber-600">
                    {t("about.frontendTitle")}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "React 19",
                    "Tailwind CSS",
                    "Framer Motion",
                    "Lucide React",
                  ].map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 rounded-full bg-amber-600/10 text-amber-600 text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Objectives Section */}
          <motion.div
            className="mb-20 relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-center text-amber-700 dark:text-amber-500 mb-8 relative z-10 flex items-center justify-center gap-2">
              <Target size={26} />
              {t("about.objectivesTitle")}
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg relative z-10">
              <div className="space-y-4">
                {objectives.map((obj, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggle(idx)}
                    className="cursor-pointer border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-amber-600/10 transition"
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between font-semibold text-gray-900 dark:text-gray-100">
                          {obj.title}
                          <span className="text-lg text-amber-600">
                            {openIndex === idx ? "−" : "+"}
                          </span>
                        </div>
                        {openIndex === idx && obj.description && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-2 text-sm text-gray-600 dark:text-gray-300"
                          >
                            {obj.description}
                          </motion.p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Developers Section */}
          <motion.div
            className="mb-20 relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-center text-amber-700 dark:text-amber-500 mb-8 relative z-10">
              {t("about.developersTitle")}
            </h2>
            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              {/* Data Developer */}
              {[
                {
                  name: "Angga Kurniawan",
                  image: profileangga,
                  linkedin: "https://linkedin.com/in/anggakrnwn",
                  github: "https://github.com/anggakrnwn",
                  delay: 0,
                },
                {
                  name: "Rifqi Falih Ramadhan",
                  image: profilerifqi,
                  linkedin: "https://www.linkedin.com/in/rifqifalihramadhan/",
                  github: "https://github.com/rifqirama",
                  delay: 0.1,
                },
                {
                  name: "Yovis Yudo Karsodo",
                  image: profileyovis,
                  linkedin: "#",
                  github: "https://github.com/Yovisyudo",
                  delay: 0.2,
                },
              ].map((dev, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: dev.delay, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg text-center border border-transparent hover:border-amber-500/20 transition-all group"
                >
                  <img
                    src={dev.image}
                    alt={dev.name}
                    className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-amber-600 mb-6 group-hover:scale-105 transition-transform duration-300"
                  />

                  <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4">
                    {dev.name}
                  </h4>
                  <div className="flex justify-center gap-4">
                    <a
                      href={dev.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:opacity-70 transition-opacity"
                    >
                      <FaLinkedin size={24} />
                    </a>
                    <a
                      href={dev.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:opacity-70 transition-opacity"
                    >
                      <FaGithub size={24} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Disclaimer Section */}
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-amber-600/10 backdrop-blur-md border border-amber-600/30 rounded-xl p-8">
              <div className="flex items-center mb-4">
                <AlertTriangle className="text-amber-600 mr-3" size={24} />
                <h2 className="text-2xl font-bold text-amber-600">
                  {t("about.disclaimerTitle")}
                </h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                {t("about.disclaimerText")}
              </p>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div className="text-center">
            <h2 className="text-3xl font-bold text-amber-700 dark:text-amber-500 mb-4">
              {t("about.ctaTitle")}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              {t("about.ctaSubtitle")}
            </p>
            <button
              onClick={handleCTAClick}
              className="inline-flex items-center px-8 py-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition shadow-lg"
            >
              <Play className="mr-2" size={20} />
              {t("about.ctaButton")}
            </button>
          </motion.div>
        </div>
      </div>
      <Footer />
    </section>
  );
};

export default About;
