import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Check, X, AlertCircle, Package, ShoppingCart, ArrowUpCircle, Wallet, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language } from '../translations';
import { Product } from '../types';

export type VoiceAction = 'sale' | 'expense' | 'restock' | 'cashIn';

export interface ParsedVoiceEntry {
  type: VoiceAction;
  amount?: number;
  quantity: number;
  productName?: string;
  productId?: string;
  note: string;
}

interface VoiceInputProps {
  language: Language;
  products: Product[];
  initialTranscript?: string;
  onConfirm: (entries: ParsedVoiceEntry[]) => void;
  onClose: () => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ language, products, initialTranscript = '', onConfirm, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(initialTranscript);
  const [parsedEntries, setParsedEntries] = useState<ParsedVoiceEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const t = translations[language];
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (initialTranscript) {
      parseTranscript(initialTranscript);
    }
  }, [initialTranscript]);

  const playBeep = (frequency: number, duration: number) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error('Audio feedback failed', e);
    }
  };

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      playBeep(880, 0.1); // High beep for start
    };

    recognition.onresult = (event: any) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
      parseTranscript(currentTranscript);
      playBeep(660, 0.1); // Confirmation beep
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setError(t.voiceError || 'Voice recognition failed');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [language, t]);

  const parseTranscript = (text: string) => {
    const entries: ParsedVoiceEntry[] = [];
    const lowercaseText = text.toLowerCase();
    
    const keywords = {
      sale: ['sale', 'sell', 'becha', 'bikri', 'बिक्री', 'बेचा', 'বিক্রি', 'বেচা', 'વેચાણ', 'વેચ્યું', 'विक्री', 'विकले', 'বিক্ৰী', 'বেচিল', 'sold'],
      restock: ['add', 'restock', 'stock', 'stock add', 'jama', 'stock badhao', 'बढ़ाओ', 'स्टॉक', 'স্টক', 'khareeda', 'bought', 'purchase'],
      expense: ['expense', 'kharcha', 'kharch', 'खर्च', 'खर्चा', 'খরচ', 'ખર્ચ', 'ખર્ચો', 'খরচ', 'bill pay'],
      cashIn: ['cash in', 'jama', 'aaya', 'कैश इन', 'जमा', 'आया', 'জমা', 'এলো', 'જમા', 'આવ્યા', 'जमा', 'आले', 'জমা', 'আহিল', 'received'],
      quantity: ['piece', 'kg', 'gram', 'packet', 'nag', 'pc', 'pcs', 'पीस', 'नग', 'পিস', 'প্যাকেট', 'kilo', 'gm', 'pouch', 'bottle', 'box']
    };

    const parts = lowercaseText.split(/[,]|and|aur|और|এবং|ebong|અને|ane|आणि|ani|আৰু|aru/);

    parts.forEach(part => {
      let type: VoiceAction = 'sale';
      let quantity = 1;
      let amount: number | undefined;
      let productName = '';
      let productId = '';

      // Detect Type
      if (keywords.expense.some(k => part.includes(k))) type = 'expense';
      else if (keywords.restock.some(k => part.includes(k))) type = 'restock';
      else if (keywords.cashIn.some(k => part.includes(k))) type = 'cashIn';
      else if (keywords.sale.some(k => part.includes(k))) type = 'sale';

      // Extract Numbers and Units
      const numbers = part.match(/\d+/g);
      if (numbers) {
        if (type === 'expense' || type === 'cashIn') {
          amount = parseInt(numbers[0]);
        } else {
          // Check for quantity with unit (e.g., "5 kg")
          const unitMatch = part.match(/(\d+)\s*(piece|kg|gram|packet|nag|pc|pcs|पीस|नग|পিস|প্যাকেট|kilo|gm|pouch|bottle|box)/i);
          if (unitMatch) {
            quantity = parseInt(unitMatch[1]);
            // If there's another number, it might be amount
            const otherNumbers = numbers.filter(n => n !== unitMatch[1]);
            if (otherNumbers.length > 0) amount = parseInt(otherNumbers[0]);
          } else {
            quantity = parseInt(numbers[0]);
            if (numbers.length > 1) amount = parseInt(numbers[1]);
          }
        }
      }

      // Extract Product Name (everything that isn't a keyword or number or unit)
      const words = part.split(/\s+/);
      const nameParts = words.filter(word => {
        const isKeyword = Object.values(keywords).flat().some(k => word.includes(k));
        const isNumber = /\d+/.test(word);
        const isUnit = keywords.quantity.some(u => word.includes(u));
        return !isKeyword && !isNumber && !isUnit && word.length > 1;
      });
      productName = nameParts.join(' ').trim();

      // Match with existing products (Fuzzy matching)
      if (productName) {
        const matchedProduct = products.find(p => {
          const pName = p.name.toLowerCase();
          const vName = productName.toLowerCase();
          return pName === vName || pName.includes(vName) || vName.includes(pName);
        });
        
        if (matchedProduct) {
          productId = matchedProduct.id;
          productName = matchedProduct.name;
          if (!amount) amount = Math.round(matchedProduct.price * quantity);
        }
      }

      if (amount || productName) {
        entries.push({ type, amount, quantity, productName, productId, note: part.trim() });
      }
    });

    setParsedEntries(entries);
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
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-2">
                <Mic className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-xl font-black tracking-tight text-zinc-900">{t.voiceEntry}</h3>
            </div>
            <button 
              onClick={onClose} 
              className="rounded-full bg-zinc-100 p-2 text-zinc-400 hover:bg-zinc-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center py-10">
            <div className="relative">
              <button
                onClick={isListening ? undefined : startListening}
                className={`relative z-10 flex h-28 w-28 items-center justify-center rounded-[2.5rem] transition-all duration-500 ${
                  isListening 
                    ? 'bg-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)] scale-110' 
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100'
                }`}
              >
                {isListening ? (
                  <Mic className="text-white" size={40} />
                ) : (
                  <MicOff className="text-white" size={40} />
                )}
              </button>
              
              {isListening && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeOut"
                      }}
                      className="absolute h-28 w-28 rounded-[2.5rem] border-2 border-rose-500"
                    />
                  ))}
                </div>
              )}
            </div>
            
            <p className={`mt-8 font-bold tracking-wide uppercase text-xs ${isListening ? 'text-rose-500' : 'text-zinc-400'}`}>
              {isListening ? t.listening : 'Tap to speak'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600"
            >
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {transcript && (
            <div className="mb-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block">Transcript</label>
              <div className="p-4 bg-zinc-50 rounded-2xl text-zinc-800 italic border border-zinc-100 text-base leading-relaxed">
                "{transcript}"
              </div>
            </div>
          )}

          <AnimatePresence>
            {parsedEntries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-8"
              >
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block">Parsed Preview</label>
                <div className="space-y-3">
                  {parsedEntries.map((entry, idx) => (
                    <div key={idx} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {entry.type === 'sale' && <ShoppingCart size={16} className="text-emerald-600" />}
                          {entry.type === 'restock' && <ArrowUpCircle size={16} className="text-blue-600" />}
                          {entry.type === 'expense' && <Wallet size={16} className="text-rose-600" />}
                          {entry.type === 'cashIn' && <Banknote size={16} className="text-indigo-600" />}
                          <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
                            {entry.type}
                          </span>
                        </div>
                        {entry.amount && (
                          <span className="font-black text-zinc-900">₹{entry.amount}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-white border border-zinc-100 flex items-center justify-center">
                            <Package size={16} className="text-zinc-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900">
                              {entry.productName || (entry.type === 'expense' ? 'Expense' : 'Cash Entry')}
                            </p>
                            {entry.productId ? (
                              <p className="text-[10px] text-emerald-600 font-bold">Matched Product</p>
                            ) : entry.productName ? (
                              <p className="text-[10px] text-rose-500 font-bold">New Product (Redirecting...)</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-zinc-900">Qty: {entry.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 px-6 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              disabled={parsedEntries.length === 0}
              onClick={() => onConfirm(parsedEntries)}
              className="flex-[2] py-4 px-6 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 active:scale-95"
            >
              <Check size={20} />
              {t.confirm || 'Confirm'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
