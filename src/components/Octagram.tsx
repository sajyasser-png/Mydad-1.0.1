import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const Octagram = () => {
  const [isGlowing, setIsGlowing] = useState(false);
  
  const points = [
    { name: "الله جل جلاله", pos: "top" },
    { name: "جبريل عليه السلام", pos: "top-right" },
    { name: "محمد صلى الله عليه وسلم", pos: "top-left" },
    { name: "أبو بكر الصديق", pos: "right" },
    { name: "عمر بن الخطاب", pos: "bottom-right" },
    { name: "عثمان بن عفان", pos: "bottom" },
    { name: "علي بن أبي طالب", pos: "bottom-left" },
    { name: "الحسن والحسين", pos: "left" },
  ];

  return (
    <div className="py-5 px-14 sm:px-16 inline-flex items-center justify-center">
      <motion.div 
        className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center cursor-pointer group"
        onClick={() => setIsGlowing(!isGlowing)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        title="النجمة الثمانية التفاعلية"
      >
        {/* Subtle Interactive Aura */}
        <AnimatePresence>
          {isGlowing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: [0.3, 0.55, 0.3], scale: [1, 1.15, 1] }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-amber-400/35 blur-xl rounded-full -z-10"
            />
          )}
        </AnimatePresence>

        {/* Octagram shape layers */}
        <motion.div 
          animate={isGlowing ? { rotate: 405, scale: 1.05 } : { rotate: 45, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute w-16 h-16 sm:w-20 sm:h-20 border-2 border-amber-600/55 dark:border-amber-400/50 rounded-sm"
        />
        <motion.div 
          animate={isGlowing ? { rotate: 360, scale: 1.05 } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute w-16 h-16 sm:w-20 sm:h-20 border-2 border-amber-600/55 dark:border-amber-400/50 rounded-sm"
        />
        
        {/* Central point */}
        <motion.div 
          animate={isGlowing ? { 
            scale: [1, 1.3, 1],
            backgroundColor: ["#d97706", "#f59e0b", "#d97706"]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-4 h-4 bg-amber-600 dark:bg-amber-400 rounded-full z-10 shadow-sm"
        />

        {points.map((p, i) => (
          <div 
            key={i} 
            className={`absolute text-amber-900/90 dark:text-amber-100/90 text-[10px] font-kufi font-bold whitespace-nowrap z-20 ${getPosClass(p.pos)}`}
          >
            {p.name}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const getPosClass = (pos: string) => {
  switch (pos) {
    case "top": return "-top-5 left-1/2 -translate-x-1/2";
    case "top-right": return "-top-2 -right-12 sm:-right-14";
    case "top-left": return "-top-2 -left-12 sm:-left-14";
    case "right": return "-right-14 sm:-right-16 top-1/2 -translate-y-1/2";
    case "bottom-right": return "-bottom-2 -right-12 sm:-right-14";
    case "bottom": return "-bottom-5 left-1/2 -translate-x-1/2";
    case "bottom-left": return "-bottom-2 -left-12 sm:-left-14";
    case "left": return "-left-14 sm:-left-16 top-1/2 -translate-y-1/2";
    default: return "";
  }
};
