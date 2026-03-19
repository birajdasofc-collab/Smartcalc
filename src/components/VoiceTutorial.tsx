import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, ChevronRight, X, CheckCircle2, MessageSquare, Save } from 'lucide-react';
import { translations, Language } from '../translations';

interface VoiceTutorialProps {
  language: Language;
  onClose: () => void;
  onFinish: () => void;
}

export const VoiceTutorial = ({ language, onClose, onFinish }: VoiceTutorialProps) => {
  const [step, setStep] = useState(1);
  const t = translations[language];

  const steps = [
    {
      title: t.voiceTutorialTitle,
      description: t.voiceTutorialStep1,
      icon: <Mic className="text-emerald-500" size={48} />,
      color: 'bg-emerald-50'
    },
    {
      title: t.voiceTutorialTitle,
      description: t.voiceTutorialStep2,
      icon: <MessageSquare className="text-blue-500" size={48} />,
      color: 'bg-blue-50'
    },
    {
      title: t.voiceTutorialTitle,
      description: t.voiceTutorialStep3,
      icon: <Save className="text-indigo-500" size={48} />,
      color: 'bg-indigo-50'
    }
  ];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 flex h-1.5 gap-1 p-1">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-full flex-1 rounded-full transition-all duration-500 ${
                i + 1 <= step ? 'bg-emerald-500' : 'bg-zinc-100'
              }`} 
            />
          ))}
        </div>

        <button 
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full bg-zinc-100 p-2 text-zinc-400 hover:bg-zinc-200"
        >
          <X size={20} />
        </button>

        <div className="p-10 pt-16 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className={`mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] ${steps[step-1].color}`}>
                {steps[step-1].icon}
              </div>
              
              <h2 className="mb-4 text-2xl font-black tracking-tight text-zinc-900">
                {steps[step-1].title}
              </h2>
              
              <p className="mb-10 text-lg leading-relaxed text-zinc-500">
                {steps[step-1].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleNext}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-5 text-lg font-bold text-white shadow-xl shadow-emerald-100 transition-all active:scale-95"
            >
              {step === steps.length ? t.voiceTutorialFinish : t.voiceTutorialNext}
              {step < steps.length && <ChevronRight size={20} />}
              {step === steps.length && <CheckCircle2 size={20} />}
            </button>
            
            {step < steps.length && (
              <button
                onClick={onFinish}
                className="py-2 text-sm font-bold text-zinc-400 hover:text-zinc-600"
              >
                {t.voiceTutorialSkip}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
