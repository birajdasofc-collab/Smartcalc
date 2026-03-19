
import React from 'react';
import { Transaction, UserProfile } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '../utils/cn';

interface ThermalInvoicePreviewProps {
  transaction: Transaction;
  profile: UserProfile;
  className?: string;
}

export const ThermalInvoicePreview = ({ transaction, profile, className }: ThermalInvoicePreviewProps) => {
  const subtotal = transaction.items?.reduce((sum, i) => sum + (i.price * i.quantity), 0) || 
                   (transaction.amount + (transaction.discount || 0) - (transaction.gstAmount || 0));

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className={cn("w-[300px] bg-white p-4 font-mono text-[12px] leading-tight text-black shadow-lg mx-auto", className)}>
      {/* Shop Header */}
      <div className="text-center space-y-1 mb-2">
        <h1 className="text-lg font-bold uppercase">{profile.shopName}</h1>
        {profile.gstNumber && <p className="text-[10px]">GSTIN: {profile.gstNumber}</p>}
        <p className="text-[10px]">{profile.address}</p>
      </div>

      {/* Thick Solid Line */}
      <div className="h-[3px] bg-black my-2" />

      {/* Billing Info */}
      <div className="space-y-1 mb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-bold">Bill to</p>
            <p>{transaction.customerName || 'Customer'}</p>
            <p>{transaction.customerMobile || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p>Date : {formatDate(transaction.date)}</p>
            <p>Inv number : {transaction.id.toUpperCase().slice(0, 8)}</p>
          </div>
        </div>
      </div>

      {/* Dashed Line */}
      <div className="border-t border-dashed border-black my-2" />

      {/* Product Table */}
      <table className="w-full text-left mb-2">
        <thead>
          <tr>
            <th className="py-1">Product</th>
            <th className="py-1 text-center">Qnty</th>
            <th className="py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transaction.items && transaction.items.length > 0 ? (
            transaction.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1">{item.name}</td>
                <td className="py-1 text-center">x{item.quantity}</td>
                <td className="py-1 text-right">{Math.floor(item.price * item.quantity)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="py-1">{transaction.note || 'General Sale'}</td>
              <td className="py-1 text-center">x1</td>
              <td className="py-1 text-right">{Math.floor(transaction.amount)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="space-y-1 text-right pt-2">
        <p>Product amount : {Math.floor(subtotal)}</p>
        {transaction.gstAmount && (
          <p>GST : {transaction.gstPercentage}%</p>
        )}
        {transaction.discount && (
          <p>Discount : {((transaction.discount / (subtotal + (transaction.gstAmount || 0))) * 100).toFixed(1)}%</p>
        )}
        <p>Subtotal : {Math.floor(subtotal + (transaction.gstAmount || 0))}</p>
        <p className="font-bold text-sm">Total amount : {Math.floor(transaction.amount)}</p>
      </div>

      {/* Dashed Line */}
      <div className="border-t border-dashed border-black my-4" />

      {/* QR Section */}
      <div className="text-center space-y-3">
        {(transaction.paymentMethod === 'online' || transaction.paymentMethod === 'credit') && (
          <div className="flex flex-col items-center gap-2">
            <div className="bg-white p-2 border border-black">
              <QRCodeSVG 
                value={`upi://pay?pa=${profile.upiId}&pn=${profile.shopName}&am=${transaction.amount}&cu=INR`}
                size={120}
              />
            </div>
            <p className="font-bold">amount ₹{Math.floor(transaction.amount)}</p>
          </div>
        )}

        <p className="font-bold mt-4">Thank you for shopping with us !</p>
      </div>

      {/* Dashed Line */}
      <div className="border-t border-dashed border-black my-4" />

      {/* Footer */}
      <div className="text-center">
        <p className="text-[10px]">Powered by Smart Dukaan</p>
      </div>
    </div>
  );
};
