import React, { useState, useMemo } from 'react';
import { Minus, Tag, FileText, History, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';
import { Language } from '../types';
import { translations } from '../translations';

interface ExpensesProps {
  onAddExpense: (data: { amount: number; category: string; note: string }) => void;
  expenseHistory: any[];
  language: Language;
}

const categories = ['Rent', 'Inventory', 'Salary', 'Utility', 'Food', 'Other'];

export const Expenses = React.memo(({ onAddExpense, expenseHistory, language }: ExpensesProps) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [searchTerm, setSearchTerm] = useState('');

  const t = translations[language];

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return expenseHistory;
    const term = searchTerm.toLowerCase();
    return expenseHistory.filter(tx => 
      tx.category.toLowerCase().includes(term) ||
      tx.note?.toLowerCase().includes(term) ||
      tx.amount.toString().includes(term)
    );
  }, [expenseHistory, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    onAddExpense({
      amount: Math.round(parseFloat(amount)),
      category,
      note
    });
    setAmount('');
    setCategory('Other');
    setNote('');
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{t.expenseTracker}</h1>
          <p className="text-sm text-zinc-500">{t.manageCosts}</p>
        </div>
        <div className="flex rounded-2xl bg-zinc-100 p-1">
          <button
            onClick={() => setActiveTab('new')}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-semibold transition-all",
              activeTab === 'new' ? "bg-white text-rose-600 shadow-sm" : "text-zinc-500"
            )}
          >
            {t.addExpense}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-semibold transition-all",
              activeTab === 'history' ? "bg-white text-rose-600 shadow-sm" : "text-zinc-500"
            )}
          >
            {t.history}
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{t.expenseAmount}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-400">₹</span>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 pl-10 pr-4 text-3xl font-bold text-zinc-900 focus:border-rose-500 focus:outline-none"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Tag className="absolute left-3 top-3 text-zinc-400" size={20} />
                <select
                  className="w-full appearance-none rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 focus:border-rose-500 focus:outline-none"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-zinc-400" size={20} />
                <input
                  type="text"
                  placeholder={t.noteDescription}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 focus:border-rose-500 focus:outline-none"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-4 font-semibold text-white shadow-lg shadow-rose-100 transition-transform active:scale-95"
            >
              <Minus size={20} />
              {t.saveExpense}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder={t.searchExpenses}
              className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-10 pr-4 focus:border-rose-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-12 text-center shadow-sm">
                <History size={48} className="mb-4 text-zinc-200" />
                <p className="text-sm text-zinc-400">{t.noExpenseHistory}</p>
              </div>
            ) : (
              filteredHistory.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
                      <Minus size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{tx.category} - {tx.note || t.expense}</p>
                      <p className="text-[10px] text-zinc-400">{new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-rose-600">- ₹{Math.floor(tx.amount).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});
