import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Plus, Minus, BarChart3, QrCode, AlertCircle, ChevronRight, Mic, Lightbulb, Trophy, Target, ScanBarcode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { Product, Language } from '../types';
import { translations } from '../translations';

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  color: 'emerald' | 'rose' | 'indigo';
}

const SummaryCard = React.memo(({ title, amount, icon, color }: SummaryCardProps) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={cn(
      "relative overflow-hidden rounded-3xl p-5 shadow-sm",
      color === 'emerald' && "bg-emerald-50 text-emerald-900",
      color === 'rose' && "bg-rose-50 text-rose-900",
      color === 'indigo' && "bg-indigo-50 text-indigo-900"
    )}
  >
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-60">{title}</p>
        <p className="text-2xl font-bold tracking-tight">₹{Math.floor(amount).toLocaleString()}</p>
      </div>
      <div className={cn(
        "rounded-2xl p-3 shadow-inner",
        color === 'emerald' && "bg-emerald-100/50",
        color === 'rose' && "bg-rose-100/50",
        color === 'indigo' && "bg-indigo-100/50"
      )}>
        {icon}
      </div>
    </div>
  </motion.div>
));

SummaryCard.displayName = 'SummaryCard';

interface QuickActionProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}

const QuickAction = React.memo(({ label, icon, onClick, color }: QuickActionProps) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 transition-transform active:scale-95"
  >
    <div className={cn("rounded-2xl p-4 text-white shadow-lg", color)}>
      {icon}
    </div>
    <span className="text-xs font-medium text-zinc-600">{label}</span>
  </button>
));

QuickAction.displayName = 'QuickAction';

interface DashboardProps {
  todaySales: number;
  todayExpenses: number;
  todayCOGS?: number;
  totalPendingCredit: number;
  onNewSale: () => void;
  onAddExpense: () => void;
  onViewReports: () => void;
  onGenerateQR: () => void;
  onViewInventory: () => void;
  onVoiceEntry: () => void;
  recentTransactions: any[];
  products: Product[];
  language: Language;
  shopName: string;
  dailySalesGoal?: number;
}

const HeroSlider = () => {
  const banners = [
    {
      id: 1,
      title: "Grow Your Business",
      subtitle: "Track every sale with precision",
      color: "bg-emerald-600",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      title: "Smart Inventory",
      subtitle: "Never run out of stock again",
      color: "bg-indigo-600",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      title: "Digital Invoices",
      subtitle: "Professional bills in seconds",
      color: "bg-amber-600",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80"
    }
  ];

  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-[40px] shadow-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn("absolute inset-0 flex items-center p-8", banners[currentIndex].color)}
        >
          <div className="relative z-10 space-y-2 text-white">
            <h3 className="text-2xl font-black leading-tight">{banners[currentIndex].title}</h3>
            <p className="text-sm font-medium opacity-90">{banners[currentIndex].subtitle}</p>
            <button className="mt-4 rounded-full bg-white px-6 py-2 text-xs font-bold text-zinc-900 shadow-sm transition-transform active:scale-95">
              Learn More
            </button>
          </div>
          <div className="absolute inset-0 z-0">
            <img 
              src={banners[currentIndex].image} 
              alt="" 
              className="h-full w-full object-cover opacity-30 mix-blend-overlay"
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>
      </AnimatePresence>
      
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {banners.map((_, i) => (
          <div 
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export const Dashboard = React.memo(({
  todaySales,
  todayExpenses,
  todayCOGS = 0,
  totalPendingCredit,
  onNewSale,
  onAddExpense,
  onViewReports,
  onGenerateQR,
  onViewInventory,
  onVoiceEntry,
  recentTransactions,
  products,
  language,
  shopName,
  dailySalesGoal
}: DashboardProps) => {
  const profit = todaySales - todayCOGS - todayExpenses;
  const lowStockProducts = products.filter(p => p.stock <= 5);
  const t = translations[language];

  const goalProgress = dailySalesGoal ? Math.min((todaySales / dailySalesGoal) * 100, 100) : 0;
  const isGoalReached = dailySalesGoal ? todaySales >= dailySalesGoal : false;

  const getInsights = () => {
    const sales = recentTransactions.filter(tx => tx.type === 'sale');
    const productSales: Record<string, number> = {};
    
    sales.forEach(s => {
      if (s.items) {
        s.items.forEach((item: any) => {
          productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
        });
      }
    });

    const sortedProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]);
    const topProduct = sortedProducts[0]?.[0] || 'N/A';
    const lowProduct = products.find(p => !productSales[p.name])?.name || sortedProducts[sortedProducts.length - 1]?.[0] || 'N/A';

    return {
      topProduct,
      lowProduct,
      profitStatus: profit >= 0 ? 'positive' : 'negative',
      summary: profit > 1000 ? t.dailySummary + ": Great day!" : t.dailySummary + ": Keep going!"
    };
  };

  const insights = getInsights();

  return (
    <div className="space-y-8">
      <div className="relative mb-6 pt-6 pb-4">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">{shopName}</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600/60 mt-1">{t.todaySummary}</p>
      </div>

      <AnimatePresence>
        {lowStockProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative overflow-hidden rounded-3xl bg-rose-500 p-5 text-white shadow-lg shadow-rose-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="rounded-2xl bg-white/20 p-3">
                  <AlertCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold">{t.lowStockAlert}</h3>
                  <p className="text-xs opacity-90">
                    {lowStockProducts.length} {lowStockProducts.length === 1 ? t.itemRunningLow : t.itemsRunningLow}
                  </p>
                </div>
              </div>
              <button 
                onClick={onViewInventory}
                className="flex items-center gap-1 rounded-xl bg-white/20 px-3 py-2 text-xs font-bold transition-colors hover:bg-white/30"
              >
                {t.fixNow}
                <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              {lowStockProducts.slice(0, 3).map(p => (
                <span key={p.id} className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-medium">
                  {p.name} ({p.stock})
                </span>
              ))}
              {lowStockProducts.length > 3 && (
                <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-medium">
                  +{lowStockProducts.length - 3} {t.more}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">{t.todaySummary}</h2>
        <div className="grid grid-cols-2 gap-4">
          <SummaryCard
            title={t.totalSales}
            amount={todaySales}
            icon={<TrendingUp size={20} />}
            color="emerald"
          />
          <SummaryCard
            title={t.totalExpenses}
            amount={todayExpenses}
            icon={<TrendingDown size={20} />}
            color="rose"
          />
          <SummaryCard
            title={t.netProfit}
            amount={profit}
            icon={<Wallet size={20} />}
            color="indigo"
          />
          <SummaryCard
            title={t.pendingCredit}
            amount={totalPendingCredit}
            icon={<AlertCircle size={20} />}
            color="rose"
          />
        </div>
      </div>

      {dailySalesGoal && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">{t.dailySalesGoal}</h2>
            <span className={cn(
              "text-xs font-bold px-2 py-1 rounded-full",
              isGoalReached ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
            )}>
              {isGoalReached ? t.goalReached : `${Math.round(goalProgress)}%`}
            </span>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-zinc-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl",
                  isGoalReached ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                )}>
                  <Target size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.goalProgress}</p>
                  <p className="text-lg font-bold text-zinc-900">₹{Math.floor(todaySales).toLocaleString()} / ₹{Math.floor(dailySalesGoal).toLocaleString()}</p>
                </div>
              </div>
              {!isGoalReached && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t.remaining}</p>
                  <p className="text-sm font-bold text-rose-600">₹{Math.floor(dailySalesGoal - todaySales).toLocaleString()}</p>
                </div>
              )}
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goalProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full transition-colors duration-500",
                  isGoalReached ? "bg-emerald-500" : "bg-indigo-500"
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Dashboard */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">{t.insights}</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-3xl border border-amber-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">{t.topSelling}</p>
            </div>
            <p className="text-lg font-bold text-zinc-900">{insights.topProduct}</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-3xl border border-indigo-100 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">{t.lowSelling}</p>
            </div>
            <p className="text-lg font-bold text-zinc-900">{insights.lowProduct}</p>
          </motion.div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">{t.quickActions}</h2>
        <div className="grid grid-cols-4 gap-4 rounded-3xl bg-white p-6 shadow-sm">
          <QuickAction
            label={t.newSale}
            icon={<Plus size={24} />}
            onClick={onNewSale}
            color="bg-emerald-600 shadow-emerald-200"
          />
          <QuickAction
            label={t.addExpense}
            icon={<Minus size={24} />}
            onClick={onAddExpense}
            color="bg-rose-600 shadow-rose-200"
          />
          <QuickAction
            label={t.reports}
            icon={<BarChart3 size={24} />}
            onClick={onViewReports}
            color="bg-indigo-600 shadow-indigo-200"
          />
          <QuickAction
            label={t.qrCode}
            icon={<QrCode size={24} />}
            onClick={onGenerateQR}
            color="bg-zinc-800 shadow-zinc-200"
          />
        </div>
      </div>

      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">{t.recentTransactions}</h2>
          <button onClick={onViewReports} className="text-xs font-semibold text-emerald-600 hover:underline">{t.viewAll}</button>
        </div>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-12 text-center shadow-sm">
              <p className="text-sm text-zinc-400">{t.noTransactionsToday}</p>
            </div>
          ) : (
            recentTransactions.map((tx) => (
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
                    <p className="text-[10px] text-zinc-400">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                  </div>
                </div>
                <p className={cn(
                  "text-sm font-bold",
                  tx.type === 'sale' ? "text-emerald-600" : "text-rose-600"
                )}>
                  {tx.type === 'sale' ? '+' : '-'} ₹{Math.floor(tx.amount).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-4 pb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Special Offers & Tips</h2>
        <HeroSlider />
      </div>
    </div>
  );
});
