import React, { useState, useMemo } from 'react';
import { Search, Users, Phone, Star, TrendingUp, Calendar, ArrowRight, CreditCard, Banknote, Wallet, QrCode, X, History, ChevronRight, MessageCircle, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer, Language, Transaction, PaymentMethod } from '../types';
import { translations } from '../translations';
import { cn } from '../utils/cn';

interface CustomersProps {
  customers: Customer[];
  transactions: Transaction[];
  totalPendingCredit: number;
  onCollectCredit: (customerMobile: string, amount: number, method: 'cash' | 'online') => void;
  onReturnItem: (transactionId: string, itemIndex: number) => void;
  onReturnSale: (transactionId: string) => void;
  language: Language;
  upiId?: string;
  shopName?: string;
}

export const Customers = ({ customers, transactions, totalPendingCredit, onCollectCredit, onReturnItem, onReturnSale, language, upiId, shopName }: CustomersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [collectingCredit, setCollectingCredit] = useState<{ customer: Customer, amount: number } | null>(null);
  const [collectMethod, setCollectMethod] = useState<'cash' | 'online'>('cash');
  const [showQR, setShowQR] = useState(false);
  
  // Filtering states for Khata view
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'credit_collection'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'online' | 'credit'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const t = translations[language];

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile.includes(searchTerm)
    ).sort((a, b) => (b.creditAmount || 0) - (a.creditAmount || 0));
  }, [customers, searchTerm]);

  const stats = useMemo(() => {
    return {
      totalCustomers: customers.length,
      totalPendingCredit: totalPendingCredit,
      customersWithCredit: customers.filter(c => (c.creditAmount || 0) > 0).length
    };
  }, [customers, totalPendingCredit]);

  const getCustomerTransactions = (mobile: string) => {
    let filtered = transactions.filter(tx => tx.customerMobile === mobile);
    
    if (filterType === 'sale') {
      filtered = filtered.filter(tx => tx.type === 'sale');
    } else if (filterType === 'credit_collection') {
      filtered = filtered.filter(tx => tx.status === 'collected');
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(tx => tx.paymentMethod === paymentFilter);
    }

    if (startDate) {
      filtered = filtered.filter(tx => new Date(tx.date) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(tx => new Date(tx.date) <= end);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleCollect = () => {
    if (!collectingCredit) return;
    if (collectMethod === 'online' && !showQR) {
      setShowQR(true);
      return;
    }
    onCollectCredit(collectingCredit.customer.mobile, collectingCredit.amount, collectMethod);
    setCollectingCredit(null);
    setCollectMethod('cash');
    setShowQR(false);
  };

  const upiUrl = useMemo(() => {
    if (!collectingCredit || !upiId) return '';
    const name = encodeURIComponent(shopName || 'Shop');
    const id = encodeURIComponent(upiId);
    const amount = Math.floor(collectingCredit.amount).toString();
    return `upi://pay?pa=${id}&pn=${name}&am=${amount}&cu=INR`;
  }, [collectingCredit, upiId, shopName]);

  const qrUrl = useMemo(() => {
    if (!upiUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;
  }, [upiUrl]);

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{t.customers}</h1>
          <p className="text-sm text-zinc-500">Manage Khata & Credit</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Customers</p>
              <p className="text-2xl font-black text-zinc-900">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pending Credit</p>
              <p className="text-2xl font-black text-rose-600">Rs. {stats.totalPendingCredit.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <History size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Active Khata</p>
              <p className="text-2xl font-black text-zinc-900">{stats.customersWithCredit}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or mobile..."
            className="w-full rounded-2xl border border-zinc-200 bg-white py-4 pl-12 pr-4 focus:border-emerald-500 focus:outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full rounded-[40px] border-2 border-dashed border-zinc-100 py-20 text-center">
              <Users size={48} className="mx-auto mb-4 text-zinc-200" />
              <p className="text-zinc-400">No customers found</p>
            </div>
          ) : (
            filteredCustomers.map((customer, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="group relative overflow-hidden rounded-[32px] bg-white p-6 shadow-sm border border-zinc-100 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-xl font-black text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900">{customer.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Phone size={14} />
                        <span>{customer.mobile}</span>
                      </div>
                    </div>
                  </div>
                  {(customer.creditAmount || 0) > 0 && (
                    <div className="text-right flex flex-col items-end gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Due</p>
                        <p className="text-lg font-black text-rose-600">Rs. {customer.creditAmount?.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const message = `Hello ${customer.name}, this is a reminder from ${shopName || 'our shop'} regarding your outstanding balance of Rs. ${customer.creditAmount?.toLocaleString()}. Please clear it at your earliest convenience. Thank you!`;
                          const mobile = customer.mobile.replace(/\D/g, '');
                          const finalMobile = mobile.length === 10 ? `91${mobile}` : mobile;
                          window.open(`https://wa.me/${finalMobile}?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="flex items-center gap-1 rounded-lg bg-[#25D366] px-3 py-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-[#22c35e] transition-colors"
                      >
                        <MessageCircle size={12} />
                        Reminder
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-zinc-50 pt-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t.lastVisit}</p>
                    <div className="flex items-center gap-1 text-zinc-900 font-bold">
                      <Calendar size={12} className="text-zinc-400" />
                      <span className="text-sm">{new Date(customer.lastVisit).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                    <span>View Khata</span>
                    <ChevronRight size={16} />
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 h-1 w-0 bg-emerald-500 transition-all group-hover:w-full" />
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-t-[40px] bg-white shadow-2xl sm:rounded-[40px] flex flex-col"
            >
              <div className="p-8 border-b border-zinc-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-black text-emerald-600">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-zinc-900">{selectedCustomer.name}</h2>
                      <p className="text-zinc-500 font-medium">{selectedCustomer.mobile}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="rounded-full bg-zinc-100 p-2 text-zinc-400">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-zinc-50 p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Outstanding Credit</p>
                    <p className="text-2xl font-black text-rose-600">Rs. {(selectedCustomer.creditAmount || 0).toLocaleString()}</p>
                    {(selectedCustomer.creditAmount || 0) > 0 && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => setCollectingCredit({ customer: selectedCustomer, amount: selectedCustomer.creditAmount || 0 })}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-[11px] font-bold text-white shadow-lg shadow-emerald-100"
                        >
                          <Banknote size={14} />
                          {t.collectPayment}
                        </button>
                        <button
                          onClick={() => {
                            const message = `Hello ${selectedCustomer.name}, this is a reminder from ${shopName || 'our shop'} regarding your outstanding balance of Rs. ${selectedCustomer.creditAmount?.toLocaleString()}. Please clear it at your earliest convenience. Thank you!`;
                            const mobile = selectedCustomer.mobile.replace(/\D/g, '');
                            const finalMobile = mobile.length === 10 ? `91${mobile}` : mobile;
                            window.open(`https://wa.me/${finalMobile}?text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2.5 text-[11px] font-bold text-white shadow-lg shadow-emerald-100"
                          title={t.sendReminder}
                        >
                          <MessageCircle size={14} />
                          Reminder
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="rounded-3xl bg-zinc-50 p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Spent</p>
                    <p className="text-2xl font-black text-emerald-600">Rs. {selectedCustomer.totalSpent.toLocaleString()}</p>
                    <p className="mt-4 text-xs text-zinc-500 font-medium">Last Visit: {new Date(selectedCustomer.lastVisit).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-zinc-50/50 pb-32">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Purchase History</h3>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                      showFilters ? "bg-emerald-600 text-white" : "bg-white text-zinc-600 border border-zinc-200 shadow-sm"
                    )}
                  >
                    <Filter size={14} />
                    {t.filter}
                  </button>
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-6"
                    >
                      <div className="rounded-2xl bg-white p-4 border border-zinc-100 shadow-sm space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t.startDate}</label>
                            <input 
                              type="date" 
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full rounded-xl border border-zinc-100 bg-zinc-50 p-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t.endDate}</label>
                            <input 
                              type="date" 
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full rounded-xl border border-zinc-100 bg-zinc-50 p-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t.filterByType}</label>
                          <div className="flex gap-2">
                            {(['all', 'sale', 'credit_collection'] as const).map((type) => (
                              <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={cn(
                                  "flex-1 rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider transition-all",
                                  filterType === type 
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-100" 
                                    : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                                )}
                              >
                                {type === 'all' ? t.allTypes : type === 'sale' ? t.sales : t.creditCollections}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Payment Method</label>
                          <div className="flex gap-2">
                            {(['all', 'cash', 'online', 'credit'] as const).map((method) => (
                              <button
                                key={method}
                                onClick={() => setPaymentFilter(method)}
                                className={cn(
                                  "flex-1 rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider transition-all",
                                  paymentFilter === method 
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-100" 
                                    : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                                )}
                              >
                                {method}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setStartDate('');
                            setEndDate('');
                            setFilterType('all');
                            setPaymentFilter('all');
                          }}
                          className="w-full text-[10px] font-bold text-rose-500 uppercase tracking-widest py-1"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  {getCustomerTransactions(selectedCustomer.mobile).map(tx => (
                    <div key={tx.id} className="rounded-2xl bg-white p-4 shadow-sm border border-zinc-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                            tx.status === 'pending' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                            {tx.status || 'completed'}
                          </span>
                          {tx.isReturned && (
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">
                              {t.returned}
                            </span>
                          )}
                          <span className="text-xs text-zinc-400">{new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-bold text-zinc-900",
                            tx.isReturned && "line-through text-zinc-400"
                          )}>
                            Rs. {tx.amount.toLocaleString()}
                          </p>
                          {!tx.isReturned && tx.type === 'sale' && (
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to return this entire sale? This will restore stock and update customer spending.')) {
                                  onReturnSale(tx.id);
                                }
                              }}
                              className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:underline mt-1"
                            >
                              {t.markAsReturned}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tx.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className={cn(
                              "text-[10px] px-2 py-1 rounded-lg flex items-center gap-2",
                              item.isReturned ? "bg-rose-50 text-rose-600 line-through" : "bg-zinc-100 text-zinc-600"
                            )}>
                              {item.name} x{item.quantity}
                              {item.isReturned && <span className="text-[8px] font-black uppercase tracking-tighter">({t.returned})</span>}
                            </span>
                            {!item.isReturned && tx.type === 'sale' && (
                              <button
                                onClick={() => onReturnItem(tx.id, i)}
                                className="text-[8px] font-bold text-rose-500 uppercase tracking-tighter hover:underline"
                              >
                                {t.markAsReturned}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-zinc-50 flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                        <span>Method: {tx.paymentMethod}</span>
                        {tx.collectedDate && <span>Collected: {new Date(tx.collectedDate).toLocaleDateString()} • {new Date(tx.collectedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>}
                      </div>
                    </div>
                  ))}
                  {getCustomerTransactions(selectedCustomer.mobile).length === 0 && (
                    <div className="text-center py-10 text-zinc-400 italic">No transactions found</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collect Credit Modal */}
      <AnimatePresence>
        {collectingCredit && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md rounded-[40px] bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">Collect Payment</h2>
                <button onClick={() => { setCollectingCredit(null); setShowQR(false); }} className="rounded-full bg-zinc-100 p-2 text-zinc-400">
                  <X size={20} />
                </button>
              </div>

              {!showQR ? (
                <div className="space-y-6">
                  <div className="text-center p-6 rounded-3xl bg-zinc-50">
                    <p className="text-sm text-zinc-500 mb-1">Amount to Collect</p>
                    <p className="text-4xl font-black text-emerald-600">Rs. {collectingCredit.amount.toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setCollectMethod('cash')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-6 rounded-3xl border-2 transition-all",
                        collectMethod === 'cash' ? "border-emerald-600 bg-emerald-50 text-emerald-600" : "border-zinc-100 text-zinc-400"
                      )}
                    >
                      <Banknote size={32} />
                      <span className="font-bold">Cash</span>
                    </button>
                    <button
                      onClick={() => setCollectMethod('online')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-6 rounded-3xl border-2 transition-all",
                        collectMethod === 'online' ? "border-emerald-600 bg-emerald-50 text-emerald-600" : "border-zinc-100 text-zinc-400"
                      )}
                    >
                      <Wallet size={32} />
                      <span className="font-bold">Online</span>
                    </button>
                  </div>

                  <button
                    onClick={handleCollect}
                    className="w-full rounded-2xl bg-emerald-600 py-5 font-black text-white shadow-xl shadow-emerald-100"
                  >
                    {collectMethod === 'online' ? 'Generate QR Code' : 'Confirm Collection'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="mx-auto w-64 h-64 rounded-3xl bg-white p-4 shadow-inner border border-zinc-100">
                    <img src={qrUrl} alt="Payment QR" className="w-full h-full" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-zinc-500">Scan to pay</p>
                    <p className="text-2xl font-black text-zinc-900">Rs. {collectingCredit.amount.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={handleCollect}
                    className="w-full rounded-2xl bg-emerald-600 py-5 font-black text-white shadow-xl shadow-emerald-100"
                  >
                    Mark as Collected
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
