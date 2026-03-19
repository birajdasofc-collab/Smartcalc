import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, Loader2, Keyboard, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { translations, Language } from '../translations';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  language: Language;
}

export const BarcodeScanner = React.memo(({ onScan, onClose, language }: BarcodeScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanCooldown, setScanCooldown] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const t = translations[language];

  const handleManualSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      onClose();
    }
  };

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
        const container = document.getElementById("barcode-reader");
        if (container) container.innerHTML = "";

        const html5QrCode = new Html5Qrcode("barcode-reader");
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 30,
          aspectRatio: 1.0,
          disableFlip: false,
          qrbox: { width: 280, height: 180 },
          formatsToSupport: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
          ],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (isMounted && !scanCooldown) {
              setScanCooldown(true);
              playBeep();
              onScan(decodedText);
              
              // Cooldown to prevent multiple scans of same item
              setTimeout(() => {
                if (isMounted) setScanCooldown(false);
              }, 1200);
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
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-zinc-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/10 p-2">
                <Camera className="text-blue-500" size={20} />
              </div>
              <h3 className="font-bold text-white">Scan Barcode</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-6 pb-10 max-h-[70vh] overflow-y-auto scrollbar-hide">
            <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-3xl bg-black ring-1 ring-white/10 shrink-0">
              <div id="barcode-reader" className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
              
              {/* Custom Square Overlay */}
              {!isInitializing && !error && !isManualEntry && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-[260px] h-[160px] border-2 border-blue-500/50 rounded-2xl shadow-[0_0_0_100vmax_rgba(0,0,0,0.7)] overflow-hidden">
                    {/* Moving Scanning Line */}
                    <motion.div 
                      animate={{ 
                        top: ["-5%", "105%"] 
                      }}
                      transition={{ 
                        duration: 2.0,
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                      className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] z-10"
                    />
                    
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
                  </div>
                </div>
              )}
              
              {isInitializing && !isManualEntry && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900/90">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                  <p className="text-sm font-medium text-zinc-400">Initializing camera...</p>
                </div>
              )}

              {error && !isManualEntry && (
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

              {isManualEntry && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900/95 p-6 text-center">
                  <Keyboard className="text-blue-500" size={48} />
                  <p className="text-sm font-bold text-white">Manual Entry Mode</p>
                  <p className="text-xs text-zinc-500">Enter the barcode number below</p>
                </div>
              )}
            </div>
            
            <div className="mt-8 space-y-4">
              <AnimatePresence mode="wait">
                {isManualEntry ? (
                  <motion.form
                    key="manual-entry"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleManualSubmit}
                    className="space-y-4 rounded-2xl bg-white/5 p-4 border border-white/5"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Enter Barcode Manually
                      </label>
                      <div className="relative">
                        <input
                          autoFocus
                          type="text"
                          value={manualCode}
                          onChange={(e) => setManualCode(e.target.value)}
                          placeholder="e.g. 1234567890"
                          className="w-full rounded-xl bg-zinc-900 px-4 py-3 pr-10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-white/5"
                        />
                        {manualCode && (
                          <button
                            type="button"
                            onClick={() => setManualCode('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsManualEntry(false)}
                        className="flex-1 rounded-xl bg-zinc-800 py-3 text-sm font-bold text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!manualCode.trim()}
                        className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="scanner-info"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 text-zinc-400 border border-white/5"
                  >
                    <AlertCircle size={20} className="mt-0.5 shrink-0 text-blue-500" />
                    <p className="text-sm leading-relaxed">
                      Align the barcode within the frame to scan it automatically.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-800 py-4 font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all"
                >
                  <X size={18} />
                  {t.closeScanner}
                </button>
                <button
                  onClick={() => {
                    onClose();
                    // Dispatch event to open add product form directly
                    window.dispatchEvent(new CustomEvent('open-add-product', { detail: '' }));
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600/10 py-4 font-bold text-emerald-500 transition-colors hover:bg-emerald-600/20"
                >
                  <Plus size={18} />
                  Manual Add
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
