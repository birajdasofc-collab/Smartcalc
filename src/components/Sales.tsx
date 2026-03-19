import React, { useState, useMemo, useRef } from 'react';
import { Plus, User, FileText, QrCode, History, Search, Download, Trash2, Minus, Wallet, Banknote, Camera, Share2, Printer, MoreVertical, CreditCard, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { Product, TransactionItem, PaymentMethod, Language, Transaction } from '../types';
import { translations } from '../translations';
import { BarcodeScanner } from './BarcodeScanner';
import { ThermalInvoicePreview } from './ThermalInvoicePreview';
import { UserProfile } from '../types';

interface SalesProps {
  products: Product[];
  onAddSale: (data: { 
    amount: number; 
    customerName: string; 
    customerMobile?: string;
    note: string; 
    items: TransactionItem[]; 
    discount: number;
    gstPercentage?: number;
    gstAmount?: number;
    warrantyMonths?: number;
    paymentMethod: PaymentMethod;
  }) => void;
  onDownloadInvoice: (tx: Transaction) => void;
  onShareInvoice: (tx: Transaction) => void;
  onPrintInvoice: (tx: Transaction) => void;
  onProductNotFound?: (barcode: string) => void;
  salesHistory: Transaction[];
  language: Language;
  userProfile: UserProfile | null;
  connectedDevice: any;
  connectedPrinter: USBDevice | null;
}

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export const Sales = React.memo(({ 
  products, 
  onAddSale, 
  onDownloadInvoice, 
  onShareInvoice,
  onPrintInvoice,
  onProductNotFound,
  salesHistory, 
  language,
  userProfile,
  connectedDevice,
  connectedPrinter
}: SalesProps) => {
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [selectedItems, setSelectedItems] = useState<TransactionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState<string>('');
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState<string>('18');
  const [warrantyEnabled, setWarrantyEnabled] = useState(false);
  const [warrantyMonths, setWarrantyMonths] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pendingSale, setPendingSale] = useState<any>(null);
  const [stockLimitMessage, setStockLimitMessage] = useState<string | null>(null);

  const t = translations[language];

  const playScanSound = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.1);
    
    setTimeout(() => audioCtx.close(), 200);
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.qrCode?.toLowerCase().includes(term) ||
      p.barcode?.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return salesHistory;
    const term = searchTerm.toLowerCase();
    return salesHistory.filter(tx => 
      tx.id.toLowerCase().includes(term) ||
      tx.customerName?.toLowerCase().includes(term) ||
      tx.customerMobile?.includes(term) ||
      tx.note?.toLowerCase().includes(term)
    );
  }, [salesHistory, searchTerm]);

  const addItem = (product: Product) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setStockLimitMessage(`Stock limit crossed for ${product.name}`);
          setTimeout(() => setStockLimitMessage(null), 3000);
          return prev;
        }
        return prev.map(item => 
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      if (product.stock <= 0) {
        setStockLimitMessage(`${product.name} is out of stock`);
        setTimeout(() => setStockLimitMessage(null), 3000);
        return prev;
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.price,
        unit: product.unit || 'unit',
        costPrice: product.costPrice
      }];
    });
    setSearchTerm('');
  };

  const handleScan = (decodedText: string) => {
    let productIdToFind = String(decodedText).trim();
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed && parsed.id) {
        productIdToFind = String(parsed.id).trim();
      }
    } catch (e) {
      // Not a JSON string, use as is
    }

    const product = products.find(p => 
      (p.id && String(p.id).trim() === productIdToFind) || 
      (p.qrCode && String(p.qrCode).trim() === productIdToFind) || 
      (p.barcode && String(p.barcode).trim() === productIdToFind) ||
      p.name.toLowerCase() === productIdToFind.toLowerCase()
    );

    if (product) {
      playScanSound();
      addItem(product);
      // Keep scanner open for more items
    } else {
      onProductNotFound?.(productIdToFind);
      setIsScannerOpen(false);
    }
  };

  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setSelectedItems(selectedItems.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty > product.stock) {
          setStockLimitMessage(`Stock limit crossed for ${product.name}`);
          setTimeout(() => setStockLimitMessage(null), 3000);
          return item;
        }
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gstPercent = gstEnabled ? (parseFloat(gstPercentage) || 0) : 0;
  const gstAmount = Math.round((subtotal * gstPercent) / 100);
  const totalWithGst = subtotal + gstAmount;
  const discountAmount = Math.round(parseFloat(discount) || 0);
  const total = Math.round(Math.max(0, totalWithGst - discountAmount));
  const discountPercentage = totalWithGst > 0 ? ((discountAmount / totalWithGst) * 100).toFixed(1) : '0';

  const hasElectronics = useMemo(() => {
    return selectedItems.some(item => {
      const product = products.find(p => p.id === item.productId);
      return product?.category?.toLowerCase() === 'electronics';
    });
  }, [selectedItems, products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;
    
    const formattedMobile = customerMobile.startsWith('+') 
      ? customerMobile 
      : customerMobile.length === 10 
        ? `+91${customerMobile}` 
        : customerMobile;

    const saleData = {
      amount: total,
      customerName,
      customerMobile: formattedMobile,
      note,
      items: selectedItems,
      discount: discountAmount,
      gstPercentage: gstEnabled ? gstPercent : undefined,
      gstAmount: gstEnabled ? gstAmount : undefined,
      warrantyMonths: (hasElectronics && warrantyEnabled) ? (parseInt(warrantyMonths) || 0) : undefined,
      paymentMethod,
      status: paymentMethod === 'credit' ? 'pending' : 'completed'
    };

    onAddSale(saleData);

    // Reset form
    setSelectedItems([]);
    setCustomerName('');
    setCustomerMobile('');
    setNote('');
    setDiscount('');
    setGstEnabled(false);
    setWarrantyEnabled(false);
    setWarrantyMonths('');
    setPaymentMethod('cash');
  };

  const confirmAndProcessSale = () => {
    if (!pendingSale) return;
    
    onAddSale({
      amount: pendingSale.amount,
      customerName: pendingSale.customerName,
      customerMobile: pendingSale.customerMobile,
      note: pendingSale.note,
      items: pendingSale.items,
      discount: pendingSale.discount,
      gstPercentage: pendingSale.gstPercentage,
      gstAmount: pendingSale.gstAmount,
      warrantyMonths: pendingSale.warrantyMonths,
      paymentMethod: pendingSale.paymentMethod
    });

    // Reset form
    setSelectedItems([]);
    setCustomerName('');
    setCustomerMobile('');
    setNote('');
    setDiscount('');
    setGstEnabled(false);
    setWarrantyEnabled(false);
    setWarrantyMonths('');
    setPaymentMethod('cash');
    setIsPreviewOpen(false);
    setPendingSale(null);
  };

  return (
    <div className="space-y-8">
      {/* Stock Limit Message */}
      <AnimatePresence>
        {stockLimitMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-rose-600 text-white px-6 py-3 rounded-2xl shadow-xl font-bold flex items-center gap-2"
          >
            <Plus size={20} className="rotate-45" />
            {stockLimitMessage}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{t.salesModule}</h1>
          <p className="text-sm text-zinc-500">{t.trackRevenue}</p>
        </div>
        <div className="flex rounded-2xl bg-zinc-100 p-1">
          <button
            onClick={() => setActiveTab('new')}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-semibold transition-all",
              activeTab === 'new' ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500"
            )}
          >
            {t.newSale}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-semibold transition-all",
              activeTab === 'history' ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500"
            )}
          >
            {t.history}
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Product Selection */}
          <div className="space-y-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input
                  type="text"
                  placeholder={t.searchProducts}
                  className="w-full rounded-2xl border border-zinc-200 bg-white py-4 pl-12 pr-4 focus:border-emerald-500 focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <AnimatePresence>
                  {searchTerm && filteredProducts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-0 right-0 top-full z-10 mt-2 max-h-60 overflow-auto rounded-3xl border border-zinc-100 bg-white p-2 shadow-xl"
                    >
                      {filteredProducts.map(product => (
                        <button
                          key={product.id}
                          onClick={() => addItem(product)}
                          className="flex w-full items-center justify-between rounded-2xl p-4 text-left hover:bg-zinc-50"
                        >
                          <div>
                            <p className="font-bold text-zinc-900">{product.name}</p>
                            <p className="text-xs text-zinc-500">Rs. {Math.floor(product.price).toLocaleString()}</p>
                          </div>
                          <Plus size={18} className="text-emerald-600" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center justify-center rounded-2xl bg-emerald-50 px-6 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                title={t.scanProduct}
              >
                <Camera size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">{t.selectedItems}</h3>
              {selectedItems.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-zinc-100 py-12 text-center">
                  <Plus size={32} className="mx-auto mb-2 text-zinc-200" />
                  <p className="text-sm text-zinc-400">{t.addProductsToStart}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map(item => (
                    <motion.div
                      layout
                      key={item.productId}
                      className="flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-zinc-900">{item.name}</p>
                        <p className="text-xs text-zinc-500">Rs. {Math.floor(item.price).toLocaleString()} / {item.unit}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center rounded-xl bg-zinc-100 p-1">
                          <button
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white hover:text-rose-500"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white hover:text-emerald-600"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-zinc-300 hover:text-rose-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Summary & Checkout */}
          <div className="space-y-6">
            <div className="rounded-[40px] bg-white p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-zinc-400" size={20} />
                      <input
                        type="text"
                        placeholder={t.customerName}
                        required
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 focus:border-emerald-500 focus:outline-none"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-3 text-zinc-400" size={20} />
                      <input
                        type="tel"
                        placeholder={t.customerMobile}
                        required
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 focus:border-emerald-500 focus:outline-none"
                        value={customerMobile}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 10) setCustomerMobile(val);
                        }}
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-zinc-400" size={20} />
                    <input
                      type="text"
                      placeholder={t.noteDescription}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 focus:border-emerald-500 focus:outline-none"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl bg-zinc-50 p-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">{t.subtotal}</span>
                    <span className="font-bold">Rs. {Math.floor(subtotal).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="gst-toggle"
                        className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                        checked={gstEnabled}
                        onChange={(e) => setGstEnabled(e.target.checked)}
                      />
                      <label htmlFor="gst-toggle" className="text-sm text-zinc-500">Add GST</label>
                    </div>
                    {gstEnabled && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="%"
                          className="w-16 rounded-xl border border-zinc-200 bg-white py-1 px-2 text-right text-sm font-bold focus:border-emerald-500 focus:outline-none"
                          value={gstPercentage}
                          onChange={e => setGstPercentage(e.target.value)}
                        />
                        <span className="text-xs font-bold text-zinc-400">%</span>
                      </div>
                    )}
                  </div>

                  {gstEnabled && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">GST Amount ({gstPercent}%)</span>
                      <span className="font-bold text-emerald-600">+ Rs. {Math.floor(gstAmount).toLocaleString()}</span>
                    </div>
                  )}

                  {hasElectronics && (
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="warranty-toggle"
                          className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                          checked={warrantyEnabled}
                          onChange={(e) => setWarrantyEnabled(e.target.checked)}
                        />
                        <label htmlFor="warranty-toggle" className="text-sm text-zinc-500">Add Warranty</label>
                      </div>
                      {warrantyEnabled && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Months"
                            className="w-20 rounded-xl border border-zinc-200 bg-white py-1 px-2 text-right text-sm font-bold focus:border-emerald-500 focus:outline-none"
                            value={warrantyMonths}
                            onChange={e => setWarrantyMonths(e.target.value)}
                          />
                          <span className="text-xs font-bold text-zinc-400">Mo</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">{t.discount} (Rs.)</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-emerald-600">({discountPercentage}%)</span>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-24 rounded-xl border border-zinc-200 bg-white py-1 px-3 text-right text-sm font-bold focus:border-emerald-500 focus:outline-none"
                        value={discount}
                        onChange={e => setDiscount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="h-px bg-zinc-200" />
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">{t.total}</span>
                    <span className="text-2xl font-black text-emerald-600">Rs. {Math.floor(total).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">{t.paymentMethod}</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 rounded-2xl border-2 py-3 font-bold transition-all",
                        paymentMethod === 'cash' 
                          ? "border-emerald-600 bg-emerald-50 text-emerald-600" 
                          : "border-zinc-100 bg-white text-zinc-400"
                      )}
                    >
                      <Banknote size={18} />
                      <span className="text-[10px]">{t.cash}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 rounded-2xl border-2 py-3 font-bold transition-all",
                        paymentMethod === 'online' 
                          ? "border-emerald-600 bg-emerald-50 text-emerald-600" 
                          : "border-zinc-100 bg-white text-zinc-400"
                      )}
                    >
                      <Wallet size={18} />
                      <span className="text-[10px]">{t.online}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit')}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 rounded-2xl border-2 py-3 font-bold transition-all",
                        paymentMethod === 'credit' 
                          ? "border-emerald-600 bg-emerald-50 text-emerald-600" 
                          : "border-zinc-100 bg-white text-zinc-400"
                      )}
                    >
                      <CreditCard size={18} />
                      <span className="text-[10px]">{t.credit}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={selectedItems.length === 0 || !customerName || !customerMobile}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-5 font-black text-white shadow-xl shadow-emerald-100 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {paymentMethod === 'online' ? <QrCode size={20} /> : paymentMethod === 'credit' ? <CreditCard size={20} /> : <FileText size={20} />}
                  {paymentMethod === 'online' ? t.generateQRConfirm : paymentMethod === 'credit' ? t.confirmCreditSale : t.confirmCashSale}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-3 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder={t.searchSales}
              className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-10 pr-4 focus:border-emerald-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-12 text-center shadow-sm">
                <History size={48} className="mb-4 text-zinc-200" />
                <p className="text-sm text-zinc-400">{t.noSalesHistory}</p>
              </div>
            ) : (
              filteredHistory.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                      <Plus size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{tx.customerName || tx.note || t.sale}</p>
                      <p className="text-[10px] text-zinc-400">
                        {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} • {tx.paymentMethod?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-emerald-600">+ Rs. {Math.floor(tx.amount).toLocaleString()}</p>
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === tx.id ? null : tx.id)}
                        className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all active:scale-90"
                      >
                        <MoreVertical size={18} />
                      </button>

                      <AnimatePresence>
                        {activeMenu === tx.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActiveMenu(null)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 5 }}
                              transition={{ duration: 0.1, ease: "easeOut" }}
                              className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5"
                            >
                              <button
                                onClick={() => {
                                  setPendingSale(tx);
                                  setIsPreviewOpen(true);
                                  setActiveMenu(null);
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                              >
                                <FileText size={16} className="text-emerald-600" />
                                <span>View Bill</span>
                              </button>
                              <button
                                onClick={() => {
                                  onDownloadInvoice(tx);
                                  setActiveMenu(null);
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                              >
                                <Download size={16} className="text-emerald-600" />
                                <span>Download PDF</span>
                              </button>
                              <button
                                onClick={() => {
                                  onShareInvoice(tx);
                                  setActiveMenu(null);
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                              >
                                <WhatsAppIcon size={16} />
                                <span>Share via</span>
                              </button>
                              <button
                                onClick={() => {
                                  onPrintInvoice(tx);
                                  setActiveMenu(null);
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                              >
                                <Printer size={16} className="text-zinc-600" />
                                <span>Print (Thermal)</span>
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {isScannerOpen && (
          <BarcodeScanner
            language={language}
            onScan={handleScan}
            onClose={() => setIsScannerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Invoice Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && pendingSale && userProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative flex flex-col w-full max-w-[340px] max-h-[85vh] overflow-hidden rounded-[40px] bg-white shadow-2xl ring-1 ring-black/5"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-5 shrink-0">
                <h3 className="text-lg font-black text-zinc-900">Invoice Preview</h3>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="rounded-full bg-zinc-50 p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-zinc-50/50">
                <div className="mx-auto flex justify-center pb-4">
                  <ThermalInvoicePreview 
                    transaction={pendingSale}
                    profile={userProfile}
                  />
                </div>
              </div>

              <div className="shrink-0 border-t border-zinc-100 bg-white p-6">
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => onPrintInvoice(pendingSale)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-zinc-100 py-4 font-bold text-zinc-600 hover:bg-zinc-50 transition-all active:scale-95"
                  >
                    <Printer size={20} />
                    Print Invoice
                  </button>
                  {pendingSale.id ? (
                    <button
                      onClick={() => setIsPreviewOpen(false)}
                      className="w-full rounded-2xl bg-zinc-900 py-4 font-black text-white shadow-lg shadow-zinc-200 transition-all active:scale-95 hover:bg-zinc-800"
                    >
                      Close
                    </button>
                  ) : (
                    <button
                      onClick={confirmAndProcessSale}
                      className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-100 transition-all active:scale-95 hover:bg-emerald-700"
                    >
                      Confirm & Save Sale
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
