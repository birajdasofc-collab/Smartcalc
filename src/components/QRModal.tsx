import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { translations } from '../translations';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  upiId: string;
  shopName: string;
  onPaymentDone: () => void;
  language: Language;
}

export const QRModal = React.memo(({ isOpen, onClose, amount, upiId, shopName, onPaymentDone, language }: QRModalProps) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const t = translations[language];

  // Reset processing state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
    }
  }, [isOpen]);

  // UPI URL format: upi://pay?pa=upiid@bank&pn=ShopName&am=100&cu=INR
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${amount}&cu=INR`;

  const handlePaymentDone = () => {
    if (isProcessing || !isOpen) return;
    setIsProcessing(true);
    onPaymentDone();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
          >
            <div className="max-h-[90vh] overflow-y-auto p-6 sm:p-8 scrollbar-hide">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-6 top-6 z-10 rounded-full bg-white/80 p-2 text-zinc-400 backdrop-blur-sm hover:bg-zinc-100"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-semibold text-zinc-900">{shopName}</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-600">₹{Math.floor(amount).toLocaleString()}</p>
                </div>

                <div className="rounded-2xl border-4 border-emerald-50 bg-white p-3 sm:p-4 shadow-inner">
                  <QRCodeSVG value={upiUrl} size={180} />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-zinc-400">{t.scanToPay}</p>
                  <p className="text-xs sm:text-sm font-mono text-zinc-500 break-all px-4">{upiId}</p>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePaymentDone();
                  }}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 sm:py-4 font-semibold text-white shadow-lg transition-all active:scale-95 ${
                    isProcessing 
                      ? 'bg-emerald-400 cursor-not-allowed' 
                      : 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700 cursor-pointer'
                  }`}
                >
                  {isProcessing ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                  {t.paymentReceived}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
