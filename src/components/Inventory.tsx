import React, { useState, useRef, useMemo } from 'react';
import { Package, Plus, Search, Trash2, Edit2, X, Barcode as BarcodeIcon, Download, Loader2, Layers, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import JsBarcode from 'jsbarcode';
import { Product, Language } from '../types';
import { translations } from '../translations';
import { cn } from '../utils/cn';
import { BulkProductAdd } from './BulkProductAdd';

interface InventoryProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'userId'>) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProduct: (product: Product) => void;
  onBarcodeScan: () => void;
  language: Language;
  showAddMenu?: boolean;
  onCloseAddMenu?: () => void;
  setToast?: (toast: { message: string; type: 'success' | 'error' }) => void;
}

export const Inventory = React.memo(({ products, onAddProduct, onDeleteProduct, onUpdateProduct, onBarcodeScan, language, showAddMenu, onCloseAddMenu, setToast }: InventoryProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    costPrice: '',
    stock: '',
    category: 'General',
    unit: 'packet',
    stockUnit: 'packet',
    barcode: ''
  });
  const nameInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [products]);

  const productsRef = useRef(products);
  productsRef.current = products;

  React.useEffect(() => {
    const handleOpenBulkAdd = () => {
      setIsBulkAdding(true);
      onCloseAddMenu?.();
    };
    window.addEventListener('open-bulk-add', handleOpenBulkAdd);
    return () => {
      window.removeEventListener('open-bulk-add', handleOpenBulkAdd);
    };
  }, [onCloseAddMenu]);

  React.useEffect(() => {
    if (isAdding) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isAdding]);

  const t = translations[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: formData.name,
        price: Math.round(Number(formData.price)),
        costPrice: formData.costPrice ? Math.round(Number(formData.costPrice)) : undefined,
        stock: Math.round(Number(formData.stock)),
        category: formData.category,
        unit: formData.unit,
        stockUnit: formData.stockUnit,
        barcode: formData.barcode
      });
      setEditingProduct(null);
    } else {
      onAddProduct({
        name: formData.name,
        price: Math.round(Number(formData.price)),
        costPrice: formData.costPrice ? Math.round(Number(formData.costPrice)) : undefined,
        stock: Math.round(Number(formData.stock)),
        category: formData.category,
        unit: formData.unit,
        stockUnit: formData.stockUnit,
        barcode: formData.barcode
      });
    }
    setFormData({ name: '', price: '', costPrice: '', stock: '', category: 'General', unit: 'packet', stockUnit: 'packet', barcode: '' });
    setIsAdding(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      costPrice: product.costPrice?.toString() || '',
      stock: product.stock.toString(),
      category: product.category,
      unit: product.unit || 'packet',
      stockUnit: product.stockUnit || product.unit || 'packet',
      barcode: product.barcode || ''
    });
    setIsAdding(true);
  };

  const downloadBarcode = (product: Product) => {
    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, product.id, {
        format: "CODE128",
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        background: "#ffffff"
      });

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${product.name}_Barcode.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Barcode generation failed:", err);
      alert("Failed to generate barcode.");
    }
  };

  const BarcodePreview = ({ product, onClose }: { product: Product, onClose: () => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
      if (canvasRef.current) {
        JsBarcode(canvasRef.current, product.id, {
          format: "CODE128",
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 14,
          margin: 10,
          background: "#ffffff"
        });
      }
    }, [product]);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-sm rounded-[2.5rem] bg-white p-8 shadow-2xl flex flex-col"
        >
          <div className="mb-6 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold">Barcode Preview</h2>
            <button onClick={onClose} className="rounded-full bg-zinc-100 p-2 text-zinc-400">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-6 overflow-y-auto scrollbar-hide">
            <div className="rounded-2xl border border-zinc-100 p-4 bg-white overflow-hidden w-full flex justify-center">
              <canvas ref={canvasRef} className="max-w-full h-auto" />
            </div>
            
            <button
              onClick={() => {
                downloadBarcode(product);
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-100 transition-transform active:scale-95 shrink-0"
            >
              <Download size={20} />
              Download Barcode
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const handleBulkSave = (newProducts: Omit<Product, 'id'>[]) => {
    newProducts.forEach(p => onAddProduct(p));
    setIsBulkAdding(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{t.inventory}</h1>
          <p className="text-sm text-zinc-500">{t.manageProducts}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
        <input
          type="text"
          placeholder={t.searchProducts}
          className="w-full rounded-2xl border border-zinc-200 bg-white py-4 pl-12 pr-4 focus:border-emerald-500 focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all",
              selectedCategory === cat
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-100"
                : "bg-white text-zinc-500 shadow-sm hover:bg-zinc-50"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredProducts.map((product) => (
          <motion.div
            layout
            key={product.id}
            className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
                <Package size={24} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900">{product.name}</h3>
                <div className="flex gap-3 text-xs text-zinc-500">
                  <span>Rs. {product.price.toLocaleString()} / {product.unit || 'unit'}</span>
                  <span>•</span>
                  <span className={product.stock < 10 ? "text-rose-500 font-medium" : ""}>
                    {t.stock}: {product.stock} {product.stockUnit || product.unit || 'units'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBarcodeModal(product)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600"
                title={t.generateBarcode}
              >
                <BarcodeIcon size={18} />
              </button>
              <button
                onClick={() => handleEdit(product)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => onDeleteProduct(product.id)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAddMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
              onClick={() => onCloseAddMenu?.()}
            />
            <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 flex flex-col items-center gap-3">
              <motion.button
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                onClick={() => {
                  setIsBulkAdding(true);
                  onCloseAddMenu?.();
                }}
                className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 font-bold text-zinc-900 shadow-xl ring-1 ring-black/5 active:scale-95"
              >
                <Layers className="text-indigo-600" size={20} />
                {t.addMultipleProducts}
              </motion.button>
              
              <motion.button
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                onClick={() => {
                  setIsAdding(true);
                  setEditingProduct(null);
                  setFormData({ name: '', price: '', costPrice: '', stock: '', category: 'General', unit: 'packet', stockUnit: 'packet', barcode: '' });
                  onCloseAddMenu?.();
                }}
                className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 font-bold text-zinc-900 shadow-xl ring-1 ring-black/5 active:scale-95"
              >
                <Plus className="text-blue-600" size={20} />
                {t.addProduct}
              </motion.button>
            </div>
          </>
        )}

        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAdding(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl flex flex-col"
            >
              <div className="mb-6 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold">{editingProduct ? t.editProduct : t.addProduct}</h2>
                <button onClick={() => setIsAdding(false)} className="rounded-full bg-zinc-100 p-2 text-zinc-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 pb-4 scrollbar-hide">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t.productName}</label>
                    <input
                      required
                      ref={nameInputRef}
                      type="text"
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 px-4 focus:border-emerald-500 focus:outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t.barcode} (Optional)</label>
                    <input
                      type="text"
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 px-4 focus:border-emerald-500 focus:outline-none"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="Type barcode"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t.sellingPrice} (Rs.)</label>
                      <input
                        required
                        type="number"
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 px-4 focus:border-emerald-500 focus:outline-none"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t.costPrice} (Rs.)</label>
                      <input
                        type="number"
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 px-4 focus:border-emerald-500 focus:outline-none"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t.stock}</label>
                      <input
                        required
                        type="number"
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 px-4 focus:border-emerald-500 focus:outline-none"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Stock Unit</label>
                      <select
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 px-4 focus:border-emerald-500 focus:outline-none"
                        value={formData.stockUnit}
                        onChange={(e) => setFormData({ ...formData, stockUnit: e.target.value })}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t.category}</label>
                      <select
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 px-4 focus:border-emerald-500 focus:outline-none"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option>General</option>
                        <option>Grocery</option>
                        <option>Electronics</option>
                        <option>Clothing</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Price Unit</label>
                      <select
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 px-4 focus:border-emerald-500 focus:outline-none"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
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
                </div>
                <div className="shrink-0 pt-4">
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-100 transition-transform active:scale-95"
                  >
                    {editingProduct ? t.updateProduct : t.addProduct}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {showBarcodeModal && (
          <BarcodePreview 
            product={showBarcodeModal} 
            onClose={() => setShowBarcodeModal(null)} 
          />
        )}
        {isBulkAdding && (
          <BulkProductAdd 
            language={language}
            onClose={() => setIsBulkAdding(false)}
            onSave={handleBulkSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
});
