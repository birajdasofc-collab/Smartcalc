import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Calendar, Filter, ChevronDown, Download, Share2, Printer, MoreVertical, PrinterCheck, PrinterIcon, MessageCircle, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { Transaction, Language, UserProfile } from '../types';
import { translations } from '../translations';
import { ThermalInvoicePreview } from './ThermalInvoicePreview';

interface ReportsProps {
  transactions: Transaction[];
  language: Language;
  usbPrinter: USBDevice | null;
  userProfile: UserProfile | null;
  onDownloadInvoice: (tx: Transaction) => void;
  onShareInvoice: (tx: Transaction) => void;
  onPrintInvoice: (tx: Transaction) => void;
}

type DateRange = 'today' | '7' | '28' | '365';

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export const Reports = React.memo(({ 
  transactions, 
  language, 
  usbPrinter, 
  userProfile,
  onDownloadInvoice,
  onShareInvoice,
  onPrintInvoice
}: ReportsProps) => {
  const [range, setRange] = useState<DateRange>('today');
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const t = translations[language];

  const { chartData, summary } = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    
    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else {
      const days = parseInt(range);
      startDate.setDate(now.getDate() - days);
    }

    const filteredTxs = transactions.filter(tx => new Date(tx.date) >= startDate);

    const totalSales = filteredTxs
      .filter(tx => tx.type === 'sale')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalCOGS = filteredTxs
      .filter(tx => tx.type === 'sale')
      .reduce((sum, tx) => {
        const itemsCOGS = tx.items?.reduce((itemSum, item) => itemSum + (item.costPrice || 0) * item.quantity, 0) || 0;
        return sum + itemsCOGS;
      }, 0);

    const totalExpenses = filteredTxs
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const grossProfit = totalSales - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    // Group by date for chart
    const dateMap = new Map();
    
    if (range === 'today') {
      // Group by hour for today (12-hour format)
      for (let i = 0; i < 24; i++) {
        const hour = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
        dateMap.set(hour, { sales: 0, expenses: 0 });
      }

      filteredTxs.forEach(tx => {
        const date = new Date(tx.date);
        const h = date.getHours();
        const hour = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
        if (dateMap.has(hour)) {
          const current = dateMap.get(hour);
          if (tx.type === 'sale') current.sales += tx.amount;
          else current.expenses += tx.amount;
        }
      });
    } else {
      const days = parseInt(range);
      // Initialize map with all dates in range
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dateMap.set(dateStr, { sales: 0, expenses: 0 });
      }

      filteredTxs.forEach(tx => {
        const dateStr = tx.date.split('T')[0];
        if (dateMap.has(dateStr)) {
          const current = dateMap.get(dateStr);
          if (tx.type === 'sale') current.sales += tx.amount;
          else current.expenses += tx.amount;
        }
      });
    }

    const chartData = Array.from(dateMap.entries())
      .map(([date, values]) => ({
        name: range === 'today' 
          ? date
          : range === '365' 
            ? new Date(date).toLocaleDateString([], { month: 'short' })
            : new Date(date).toLocaleDateString([], { day: 'numeric', month: 'short' }),
        fullDate: date,
        ...values
      }));

    if (range !== 'today') {
      chartData.reverse();
    }

    // If range is 365, group by month for better visualization
    if (range === '365') {
      const monthMap = new Map();
      chartData.forEach(item => {
        const month = new Date(item.fullDate).toLocaleDateString([], { month: 'short', year: '2-digit' });
        if (!monthMap.has(month)) {
          monthMap.set(month, { name: month, sales: 0, expenses: 0 });
        }
        const current = monthMap.get(month);
        current.sales += item.sales;
        current.expenses += item.expenses;
      });
      return {
        chartData: Array.from(monthMap.values()),
        summary: { totalSales, totalExpenses, totalCOGS, grossProfit, netProfit }
      };
    }

    return {
      chartData,
      summary: { totalSales, totalExpenses, totalCOGS, grossProfit, netProfit }
    };
  }, [transactions, range]);

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter(tx => 
      tx.id.toLowerCase().includes(term) ||
      tx.customerName?.toLowerCase().includes(term) ||
      tx.customerMobile?.includes(term) ||
      tx.note?.toLowerCase().includes(term) ||
      tx.category?.toLowerCase().includes(term)
    );
  }, [transactions, searchTerm]);

  const rangeLabels: Record<DateRange, string> = {
    today: t.today,
    '7': `7 ${t.days}`,
    '28': `28 ${t.days}`,
    '365': `1 ${t.year}`
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{t.reportsAnalytics}</h1>
          <p className="text-sm text-zinc-500">{t.trackBusinessGrowth}</p>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 shadow-sm ring-1 ring-zinc-200 transition-all hover:bg-zinc-50 active:scale-95"
          >
            <Filter size={18} className="text-emerald-600" />
            <span>{rangeLabels[range]}</span>
            <ChevronDown size={16} className={cn("transition-transform", showFilters && "rotate-180")} />
          </button>

          <AnimatePresence>
            {showFilters && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowFilters(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5"
                >
                  {(['today', '7', '28', '365'] as DateRange[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRange(r);
                        setShowFilters(false);
                      }}
                      className={cn(
                        "flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                        range === r 
                          ? "bg-emerald-50 text-emerald-600" 
                          : "text-zinc-600 hover:bg-zinc-50"
                      )}
                    >
                      {rangeLabels[r]}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t.totalSales}</p>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900">₹{Math.floor(summary.totalSales).toLocaleString()}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
              <TrendingDown size={20} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t.totalExpenses}</p>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900">₹{Math.floor(summary.totalExpenses).toLocaleString()}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <Wallet size={20} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t.netProfit}</p>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900">₹{Math.floor(summary.netProfit).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-zinc-400" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">{t.salesTrend}</h2>
        </div>
        <div className="h-64 w-full rounded-3xl bg-white p-6 shadow-sm">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="sales" stroke="#059669" strokeWidth={3} dot={range === '7'} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-zinc-400" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">{t.salesVsExpenses}</h2>
        </div>
        <div className="h-64 w-full rounded-3xl bg-white p-6 shadow-sm">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="sales" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#e11d48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">{t.recentTransactions}</h2>
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
            {usbPrinter ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <PrinterCheck size={12} />
                {usbPrinter.productName || "Printer Connected"}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <PrinterIcon size={12} />
                No Printer
              </span>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 text-zinc-400" size={20} />
          <input
            type="text"
            placeholder="Search by ID, Customer, or Note..."
            className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-10 pr-4 focus:border-emerald-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-12 text-center shadow-sm">
              <p className="text-sm text-zinc-400">{t.noTransactionsToday}</p>
            </div>
          ) : (
            filteredHistory.slice(0, 50).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "rounded-xl p-2",
                    tx.type === 'sale' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {tx.type === 'sale' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{tx.note || (tx.type === 'sale' ? t.sale : t.expense)}</p>
                    <p className="text-[10px] text-zinc-400">{new Date(tx.date).toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      tx.type === 'sale' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {tx.type === 'sale' ? '+' : '-'} ₹{Math.floor(tx.amount).toLocaleString()}
                    </p>
                    {tx.paymentMethod && (
                      <p className="text-[10px] text-zinc-400 uppercase tracking-tighter">{tx.paymentMethod}</p>
                    )}
                  </div>
                  {tx.type === 'sale' && (
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === tx.id ? null : tx.id)}
                        className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all active:scale-90"
                      >
                        <MoreVertical size={20} />
                      </button>

                      <AnimatePresence>
                        {activeMenu === tx.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActiveMenu(null)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5"
                            >
                              <button
                                onClick={() => {
                                  onDownloadInvoice(tx);
                                  setActiveMenu(null);
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                              >
                                <Download size={18} className="text-emerald-600" />
                                <span>Download PDF</span>
                              </button>
                              <button
                                onClick={() => {
                                  onShareInvoice(tx);
                                  setActiveMenu(null);
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                              >
                                <WhatsAppIcon size={18} />
                                <span>Share via</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTx(tx);
                                  setIsPreviewOpen(true);
                                  setActiveMenu(null);
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                              >
                                <Printer size={18} className="text-zinc-600" />
                                <span>Print (Thermal)</span>
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invoice Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && selectedTx && userProfile && (
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
                    transaction={selectedTx}
                    profile={userProfile}
                  />
                </div>
              </div>

              <div className="shrink-0 border-t border-zinc-100 bg-white p-6">
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      onPrintInvoice(selectedTx);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-100 transition-transform active:scale-95"
                  >
                    <Printer size={20} />
                    Print Now
                  </button>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="w-full rounded-2xl border-2 border-zinc-100 py-4 font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
