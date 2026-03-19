import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store } from 'lucide-react';

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onFinish, 400); // Wait for exit animation
    }, 1500); // Reduced from 2500ms
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-emerald-600 text-white motion-gpu"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white/20 backdrop-blur-md shadow-2xl motion-gpu"
          >
            <Store size={48} />
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              delay: 0.3,
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            className="text-center motion-gpu"
          >
            <h1 className="text-4xl font-bold tracking-tight">Smart Dukaan</h1>
            <p className="mt-2 text-emerald-100 font-medium opacity-80">Your Shop, Smarter.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-12 flex flex-col items-center gap-2 motion-gpu"
          >
            <div className="h-1 w-32 overflow-hidden rounded-full bg-white/20">
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="h-full w-1/2 bg-white motion-gpu"
              />
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] opacity-60">Initializing Shop</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
