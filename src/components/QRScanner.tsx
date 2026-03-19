import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language } from '../translations';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  language: Language;
}

export const QRScanner = React.memo(({ onScan, onClose, language }: QRScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const t = translations[language];

  useEffect(() => {
    // Prevent body scroll when scanner is open
    document.body.style.overflow = 'hidden';
    
    let isMounted = true;
    
    const playBeep = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.2);
        
        setTimeout(() => audioCtx.close(), 300);
      } catch (err) {
        console.error("Error playing beep:", err);
      }
    };

    const startScanner = async () => {
      try {
        if (!isMounted) return;
        setIsInitializing(true);
        setError(null);
        
        // Ensure container is empty before starting to prevent "double show"
        const container = document.getElementById("qr-reader");
        if (container) container.innerHTML = "";

        const html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 30,
          aspectRatio: 1.0,
          disableFlip: false,
          formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (isMounted) {
              playBeep();
              // Add a tiny delay so the user hears the beep before the scanner closes
              setTimeout(() => {
                if (isMounted) {
                  onScan(decodedText);
                  onClose();
                }
              }, 150);
            }
          },
          (errorMessage) => {
            // Silently handle scan errors
          }
        );
        
        if (isMounted) setIsInitializing(false);
      } catch (err) {
        console.error("Error starting scanner:", err);
        if (isMounted) {
          setError("Failed to access camera. Please ensure permissions are granted and you are using a secure connection (HTTPS).");
          setIsInitializing(false);
        }
      }
    };

    startScanner();

    return () => {
      document.body.style.overflow = 'unset';
      isMounted = false;
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().then(() => {
            html5QrCodeRef.current?.clear();
          }).catch(err => console.error("Failed to stop scanner", err));
        } else {
          html5QrCodeRef.current.clear();
        }
      }
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg overflow-hidden rounded-t-[2.5rem] bg-zinc-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle for bottom sheet */}
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-zinc-700" />

          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500/10 p-2">
                <Camera className="text-emerald-500" size={20} />
              </div>
              <h3 className="font-bold text-white">{t.scanQrCode}</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-6 pb-10">
            <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-3xl bg-black ring-1 ring-white/10">
              <div id="qr-reader" className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
              
              {/* Custom Square Overlay */}
              {!isInitializing && !error && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-[220px] h-[220px] border-2 border-emerald-500/50 rounded-2xl shadow-[0_0_0_100vmax_rgba(0,0,0,0.7)] overflow-hidden">
                    {/* Moving Scanning Line */}
                    <motion.div 
                      animate={{ 
                        top: ["-5%", "105%"] 
                      }}
                      transition={{ 
                        duration: 2.5,
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                      className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)] z-10"
                    />
                    
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
                  </div>
                </div>
              )}
              
              {isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900/90">
                  <Loader2 className="animate-spin text-emerald-500" size={32} />
                  <p className="text-sm font-medium text-zinc-400">Initializing camera...</p>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-rose-950/90 p-6 text-center">
                  <AlertCircle className="text-rose-500" size={32} />
                  <p className="text-sm font-bold text-rose-200">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 text-zinc-400 border border-white/5">
                <AlertCircle size={20} className="mt-0.5 shrink-0 text-emerald-500" />
                <p className="text-sm leading-relaxed">
                  {t.paymentInfo}
                </p>
              </div>
              
              <button
                onClick={onClose}
                className="w-full rounded-2xl bg-zinc-800 py-4 font-bold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
              >
                {t.closeScanner}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
