import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Language } from '../types';
import { translations } from '../translations';
import { cn } from '../utils/cn';

interface BulkProductAddProps {
  onClose: () => void;
  onSave: (products: Omit<Product, 'id' | 'userId'>[]) => void;
  language: Language;
}

interface ProductFormData {
  id: string;
  name: string;
  price: string;
  stock: string;
  category: string;
  unit: string;
  stockUnit: string;
  barcode: string;
}

export const BulkProductAdd = ({ onClose, onSave, language }: BulkProductAddProps) => {
  const t = translations[language];
  const [forms, setForms] = useState<ProductFormData[]>([
    { id: Math.random().toString(36).substr(2, 9), name: '', price: '', stock: '', category: 'General', unit: 'packet', stockUnit: 'packet', barcode: '' }
  ]);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const addMore = () => {
    setForms([...forms, { 
      id: Math.random().toString(36).substr(2, 9), 
      name: '', 
      price: '', 
      stock: '', 
      category: 'General', 
      unit: 'packet', 
      stockUnit: 'packet',
      barcode: '' 
    }]);
  };

  const removeForm = (id: string) => {
    if (forms.length > 1) {
      setForms(forms.filter(f => f.id !== id));
    }
  };

  const updateForm = (id: string, data: Partial<ProductFormData>) => {
    setForms(forms.map(f => f.id === id ? { ...f, ...data } : f));
  };

  const handleSave = () => {
    const validProducts = forms
      .filter(f => f.name && f.price && f.stock)
      .map(f => ({
        name: f.name,
        price: Math.round(Number(f.price)),
        stock: Math.round(Number(f.stock)),
        category: f.category,
        unit: f.unit,
        stockUnit: f.stockUnit,
        barcode: f.barcode
      }));

    if (validProducts.length > 0) {
      onSave(validProducts);
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [forms.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col bg-zinc-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">{t.addMultipleProducts}</h2>
          <p className="text-xs text-zinc-500">{forms.length} products in list</p>
        </div>
        <button 
          onClick={onClose}
          className="rounded-full bg-zinc-100 p-2 text-zinc-500 hover:bg-zinc-200"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 pb-48"
      >
        <AnimatePresence initial={false}>
          {forms.map((form, index) => (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative rounded-3xl bg-white p-5 shadow-sm border border-zinc-100"
            >
              <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shadow-lg">
                {index + 1}
              </div>
              
              {forms.length > 1 && (
                <button 
                  onClick={() => removeForm(form.id)}
                  className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500 shadow-sm hover:bg-rose-100"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{t.productName}</label>
                  <input
                    type="text"
                    placeholder="Enter product name"
                    className="w-full rounded-xl border border-zinc-100 bg-zinc-50 py-2.5 px-4 text-sm focus:border-emerald-500 focus:outline-none"
                    value={form.name}
                    onChange={(e) => updateForm(form.id, { name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{t.barcode} (Optional)</label>
                  <input
                    type="text"
                    placeholder="Scan or enter barcode"
                    className="w-full rounded-xl border border-zinc-100 bg-zinc-50 py-2.5 px-4 text-sm focus:border-emerald-500 focus:outline-none"
                    value={form.barcode}
                    onChange={(e) => updateForm(form.id, { barcode: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{t.price} (Rs.)</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full rounded-xl border border-zinc-100 bg-zinc-50 py-2.5 px-4 text-sm focus:border-emerald-500 focus:outline-none"
                      value={form.price}
                      onChange={(e) => updateForm(form.id, { price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{t.stock}</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full rounded-xl border border-zinc-100 bg-zinc-50 py-2.5 px-4 text-sm focus:border-emerald-500 focus:outline-none"
                      value={form.stock}
                      onChange={(e) => updateForm(form.id, { stock: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Stock Unit</label>
                    <select
                      className="w-full rounded-xl border border-zinc-100 bg-zinc-50 py-2.5 px-4 text-sm focus:border-emerald-500 focus:outline-none"
                      value={form.stockUnit}
                      onChange={(e) => updateForm(form.id, { stockUnit: e.target.value })}
                    >
                      <option value="litre">Litre (L)</option>
                      <option value="kg">Kilogram (KG)</option>
                      <option value="gm">Gram (GM)</option>
                      <option value="packet">Packet</option>
                      <option value="box">Box</option>
                      <option value="piece">Piece</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Price Unit</label>
                    <select
                      className="w-full rounded-xl border border-zinc-100 bg-zinc-50 py-2.5 px-4 text-sm focus:border-emerald-500 focus:outline-none"
                      value={form.unit}
                      onChange={(e) => updateForm(form.id, { unit: e.target.value })}
                    >
                      <option value="litre">Litre (L)</option>
                      <option value="kg">Kilogram (KG)</option>
                      <option value="gm">Gram (GM)</option>
                      <option value="packet">Packet</option>
                      <option value="box">Box</option>
                      <option value="piece">Piece</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{t.category}</label>
                  <select
                    className="w-full rounded-xl border border-zinc-100 bg-zinc-50 py-2.5 px-4 text-sm focus:border-emerald-500 focus:outline-none"
                    value={form.category}
                    onChange={(e) => updateForm(form.id, { category: e.target.value })}
                  >
                    <option>General</option>
                    <option>Grocery</option>
                    <option>Electronics</option>
                    <option>Clothing</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={addMore}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 py-4 text-sm font-bold text-zinc-400 transition-colors hover:border-emerald-500 hover:text-emerald-600"
        >
          <Plus size={18} />
          Add More Product
        </button>
      </div>

      {/* Footer */}
      <div className="fixed bottom-16 left-6 right-6 z-[70]">
        <div className="flex gap-4 max-w-lg mx-auto bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-zinc-100">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl bg-zinc-100 py-4 font-bold text-zinc-600 transition-transform active:scale-95"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={forms.every(f => !f.name)}
            className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-100 transition-transform active:scale-95 disabled:opacity-50 disabled:shadow-none"
          >
            <Check size={20} />
            Confirm and Save
          </button>
        </div>
      </div>
    </motion.div>
  );
};
