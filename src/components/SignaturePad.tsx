import React, { useRef, useState, useEffect } from 'react';
import { Undo, Redo, Trash2, Check, X } from 'lucide-react';
import { motion } from 'motion/react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClose: () => void;
  initialSignature?: string;
}

export const SignaturePad = ({ onSave, onClose, initialSignature }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on parent
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = 200;
        
        // If we have an initial signature, draw it
        if (initialSignature && history.length === 0) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            saveToHistory();
          };
          img.src = initialSignature;
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newIndex];
    } else if (historyIndex === 0) {
      // Clear if undoing the first stroke
      setHistoryIndex(-1);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newIndex];
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL());
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200 bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="touch-none cursor-crosshair"
        />
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            onClick={undo}
            disabled={historyIndex < 0}
            className="rounded-full bg-zinc-100 p-2 text-zinc-600 hover:bg-zinc-200 disabled:opacity-50"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="rounded-full bg-zinc-100 p-2 text-zinc-600 hover:bg-zinc-200 disabled:opacity-50"
          >
            <Redo size={18} />
          </button>
          <button
            onClick={clear}
            className="rounded-full bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-2xl bg-zinc-100 py-4 font-bold text-zinc-600 transition-transform active:scale-95"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-100 transition-transform active:scale-95"
        >
          Confirm & Save
        </button>
      </div>
    </div>
  );
};
