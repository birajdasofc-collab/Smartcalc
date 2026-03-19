import React from 'react';
import { Transaction, UserProfile } from '../types';

interface DigitalInvoiceProps {
  transaction: Transaction;
  profile: UserProfile;
}

export const DigitalInvoice = ({ transaction, profile }: DigitalInvoiceProps) => {
  const subtotal = transaction.items?.reduce((sum, i) => sum + (i.price * i.quantity), 0) || transaction.amount + (transaction.discount || 0) - (transaction.gstAmount || 0);

  return (
    <div id={`digital-invoice-${transaction.id}`} className="w-[800px] bg-white p-12 text-zinc-900 font-sans shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-12 bg-emerald-600 p-8 -m-12 mb-12 text-white">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight">{profile.shopName}</h1>
          <p className="text-sm opacity-90 max-w-md">{profile.address}</p>
          <p className="text-sm font-bold">Mobile: {profile.mobile}</p>
        </div>
        <div className="text-right space-y-1">
          <h2 className="text-5xl font-black opacity-20">INVOICE</h2>
          <p className="text-sm opacity-90 font-bold">#{transaction.id.toUpperCase()}</p>
        </div>
      </div>

      {/* Bill To & Info */}
      <div className="grid grid-cols-2 gap-12 mb-12 pt-12">
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Bill To:</h3>
          <div className="space-y-1">
            <p className="text-xl font-bold">{transaction.customerName || 'Valued Customer'}</p>
            {transaction.customerMobile && <p className="text-zinc-500 font-medium">{transaction.customerMobile}</p>}
          </div>
        </div>
        <div className="space-y-4 text-right">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Invoice Details:</h3>
          <div className="space-y-1">
            <p className="font-bold">Date: <span className="text-zinc-500">{new Date(transaction.date).toLocaleDateString()} • {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span></p>
            <p className="font-bold">Payment: <span className="text-zinc-500 uppercase">{transaction.paymentMethod || 'CASH'}</span></p>
            <p className="font-bold">Status: <span className={transaction.status === 'pending' ? 'text-rose-600' : 'text-emerald-600'}>{transaction.status?.toUpperCase() || 'COMPLETED'}</span></p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-12">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50 text-left">
              <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-zinc-400">Item Description</th>
              <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-zinc-400 text-center">Qty</th>
              <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-zinc-400 text-right">Price</th>
              <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-zinc-400 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {transaction.items && transaction.items.length > 0 ? (
              transaction.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-6 px-6 font-bold text-zinc-900">{item.name}</td>
                  <td className="py-6 px-6 text-center font-medium text-zinc-500">{item.quantity} {item.unit || ''}</td>
                  <td className="py-6 px-6 text-right font-medium text-zinc-500">₹{Math.floor(item.price).toLocaleString()}</td>
                  <td className="py-6 px-6 text-right font-bold text-zinc-900">₹{Math.floor(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-6 px-6 font-bold text-zinc-900">{transaction.note || 'General Sale'}</td>
                <td className="py-6 px-6 text-center font-medium text-zinc-500">1</td>
                <td className="py-6 px-6 text-right font-medium text-zinc-500">₹{Math.floor(transaction.amount).toLocaleString()}</td>
                <td className="py-6 px-6 text-right font-bold text-zinc-900">₹{Math.floor(transaction.amount).toLocaleString()}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-80 space-y-4">
          <div className="flex justify-between text-zinc-500 font-medium">
            <span>Subtotal</span>
            <span>₹{Math.floor(subtotal).toLocaleString()}</span>
          </div>
          {transaction.gstAmount && (
            <div className="flex justify-between text-zinc-500 font-medium">
              <span>GST ({transaction.gstPercentage}%)</span>
              <span>+ ₹{Math.floor(transaction.gstAmount).toLocaleString()}</span>
            </div>
          )}
          {transaction.discount && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>Discount</span>
              <span>- ₹{Math.floor(transaction.discount).toLocaleString()}</span>
            </div>
          )}
          <div className="h-px bg-zinc-100 my-4" />
          <div className="flex justify-between items-center">
            <span className="text-xl font-black tracking-tight">Grand Total</span>
            <span className="text-3xl font-black text-emerald-600 tracking-tighter">₹{Math.floor(transaction.amount).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Signature & Notes */}
      <div className="flex justify-between items-end mb-12">
        <div className="space-y-4 max-w-md">
          {transaction.warrantyMonths && (
            <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-1">Warranty Information</p>
              <p className="text-sm font-bold text-emerald-900">{transaction.warrantyMonths} Months Warranty Included</p>
            </div>
          )}
          {transaction.note && transaction.items && transaction.items.length > 0 && (
            <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Notes / Description</p>
              <p className="text-sm font-medium text-zinc-600">{transaction.note}</p>
            </div>
          )}
        </div>
        
        {profile.signature && (
          <div className="text-center space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Authorized Signature</p>
            <img src={profile.signature} alt="Signature" className="h-16 object-contain mx-auto" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pt-12 border-t border-zinc-100">
        <p className="text-zinc-400 font-medium mb-2 italic">Thank you for your business!</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Powered by Smart Dukaan</span>
        </div>
      </div>
    </div>
  );
};
