import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useAnimation, useInView } from "framer-motion";
import { useRef } from "react";
import { useWastra } from "../../context/WastraContext";
import { useI18n } from "../../context/I18nContext";

const statsCards = [
  { title: "Accuracy", value: "99.46%", subtitle: "accuracy" },
  { title: "Speed", value: "< 1.2s", subtitle: "per detection" },
  { title: "Total Class", value: "109%", subtitle: "Batik Patterns" },
  { title: "This Month", value: "50+", subtitle: "predictions" },
];

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  delay: number;
  floatDelay: number;
  direction: 'left' | 'right';
  rotate: number;
  xOffset: number;
  yOffset: number;
  zIndex: number;
}

const FloatingStatCard: React.FC<StatCardProps> = ({ 
  title, value, subtitle, delay, floatDelay, direction, rotate, xOffset, yOffset, zIndex 
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start({
        opacity: 1,
        x: xOffset,
        y: yOffset,
        rotate: rotate,
        transition: { duration: 0.5, delay }
      }).then(() => {
        controls.start({
          y: [yOffset, yOffset - 8, yOffset],
          transition: {
            duration: 3,
            repeat: Infinity,
            delay: floatDelay,
            ease: "easeInOut",
          }
        });
      });
    }
  }, [isInView, controls, delay, floatDelay, rotate, xOffset, yOffset]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: direction === 'left' ? -20 + xOffset : 20 + xOffset, y: 10 + yOffset, rotate: 0 }}
      animate={controls}
      style={{ zIndex }}
      className={`absolute bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl p-3 shadow-lg w-36 border border-white/20 ${zIndex === 1 ? 'blur-[0.5px] opacity-60 scale-90' : ''}`}
    >
      <div className="text-amber-700 dark:text-amber-500 text-center">
        <div className="text-[9px] uppercase tracking-wider font-bold opacity-60 mb-0.5">{title}</div>
        <div className="text-xl font-black">{value}</div>
        <div className="text-[9px] text-gray-500 dark:text-gray-400 font-medium leading-tight">{subtitle}</div>
      </div>
    </motion.div>
  );
};

const CallToAction: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useWastra();
  const { t } = useI18n();
  
  const handleLaunchApp = () => {
    if (user) {
      navigate("/detection-page"); 
    } else {
      navigate("/login"); 
    }
  };

  return (
    <section className="relative bg-amber-600 dark:bg-amber-700 py-12 md:py-16 overflow-hidden transition-colors mx-4 md:mx-12 mb-8 rounded-[2.5rem] md:rounded-[3rem] shadow-xl">
      
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem] md:rounded-[3rem]">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-500/40 blur-2xl opacity-70" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-amber-400/30 blur-2xl opacity-50" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-white flex flex-col items-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight max-w-2xl">
            {t("cta.title")}
          </h2>
          
          <p className="text-base md:text-lg mb-8 max-w-xl mx-auto text-amber-50/90 leading-relaxed font-medium">
            {t("cta.subtitle")}
          </p>
          
          <div className="relative flex items-center justify-center min-h-[100px] w-full">
            
            {/* Floating Cards (Desktop XL) */}
            <div className="absolute inset-0 pointer-events-none hidden xl:flex items-center justify-between w-full h-full">
              <div className="absolute left-4 top-[-60px]" style={{ width: '150px' }}>
                <FloatingStatCard {...statsCards[0]} delay={0.3} floatDelay={0.5} direction="left" rotate={-8} xOffset={20} yOffset={20} zIndex={2} />
                <FloatingStatCard {...statsCards[1]} delay={0.5} floatDelay={0.8} direction="left" rotate={-4} xOffset={-30} yOffset={-80} zIndex={1} />
              </div>

              <div className="absolute right-4 top-[-60px]" style={{ width: '150px' }}>
                <FloatingStatCard {...statsCards[2]} delay={0.4} floatDelay={0.3} direction="right" rotate={8} xOffset={-20} yOffset={20} zIndex={2} />
                <FloatingStatCard {...statsCards[3]} delay={0.6} floatDelay={1} direction="right" rotate={4} xOffset={30} yOffset={-80} zIndex={1} />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLaunchApp}
              className="relative z-20 bg-white text-amber-700 px-10 py-3.5 rounded-full font-bold text-lg transition-all shadow-xl group"
            >
              <span>{t("cta.button")}</span>
              <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">→</span>
            </motion.button>
          </div>
          
          {/* Grid (Mobile/Tablet) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 w-full max-w-3xl xl:hidden">
            {statsCards.map((stat, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <div className="text-white text-center">
                        <div className="text-[8px] uppercase font-bold opacity-70">{stat.title}</div>
                        <div className="text-lg font-black">{stat.value}</div>
                    </div>
                </div>
            ))}
          </div>

        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;