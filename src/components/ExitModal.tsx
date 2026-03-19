import React from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { translations } from '../translations';

interface ExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  language: Language;
}

export const ExitModal = ({ isOpen, onClose, onConfirm, language }: ExitModalProps) => {
  const t = translations[language];

  const modalVariants = {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", damping: 25, stiffness: 300 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-sm overflow-hidden rounded-[40px] bg-white p-8 shadow-2xl"
          >
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <AlertTriangle size={40} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-zinc-900">{t.exitApp}</h3>
                <p className="text-sm text-zinc-500">{t.exitConfirm}</p>
              </div>

              <div className="grid w-full grid-cols-2 gap-3">
                <button
                  onClick={onClose}
                  className="rounded-2xl bg-zinc-100 py-4 font-bold text-zinc-600 transition-transform active:scale-95"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={onConfirm}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 py-4 font-bold text-white shadow-lg shadow-rose-100 transition-transform active:scale-95"
                >
                  <LogOut size={20} />
                  {t.exitNow}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
