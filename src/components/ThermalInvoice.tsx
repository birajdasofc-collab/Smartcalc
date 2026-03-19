import React from 'react';
import { Transaction, UserProfile } from '../types';
import { QRCodeSVG } from 'qrcode.react';

interface ThermalInvoiceProps {
  transaction: Transaction;
  profile: UserProfile;
}

export const ThermalInvoice = ({ transaction, profile }: ThermalInvoiceProps) => {
  const subtotal = transaction.items?.reduce((sum, i) => sum + (i.price * i.quantity), 0) || 
                   (transaction.amount + (transaction.discount || 0) - (transaction.gstAmount || 0));

  const formatDate = (dateStr: string) => {
    return `${new Date(dateStr).toLocaleDateString()} ${new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  };

  return (
    <div id={`thermal-invoice-${transaction.id}`} className="w-[300px] bg-white p-4 font-mono text-[12px] leading-tight text-black">
      {/* Shop Header */}
      <div className="text-center space-y-1 mb-2">
        <h1 className="text-lg font-bold uppercase">{profile.shopName}</h1>
        {profile.gstNumber && <p className="text-[10px]">Shop GST number: {profile.gstNumber}</p>}
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
                <td className="py-1 text-right">{item.price * item.quantity}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="py-1">{transaction.note || 'General Sale'}</td>
              <td className="py-1 text-center">x1</td>
              <td className="py-1 text-right">{transaction.amount}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="space-y-1 text-right pt-2">
        <p>Product amount : {subtotal}</p>
        {transaction.gstAmount && (
          <p>Gst in Percent : {transaction.gstPercentage}%</p>
        )}
        {transaction.discount && (
          <p>Discount in % : {Math.round((transaction.discount / (subtotal + (transaction.gstAmount || 0))) * 100)}%</p>
        )}
        <p>Subtotal : {subtotal + (transaction.gstAmount || 0)}</p>
        <p className="font-bold text-sm">Total amount : {transaction.amount}</p>
      </div>

      {/* Dashed Line */}
      <div className="border-t border-dashed border-black my-4" />

      {/* Warranty & Notes */}
      {(transaction.warrantyMonths || (transaction.note && transaction.items && transaction.items.length > 0)) && (
        <div className="space-y-2 mb-4 text-[10px]">
          {transaction.warrantyMonths && (
            <div className="border border-black p-2 text-center">
              <p className="font-bold uppercase">Warranty Information</p>
              <p>{transaction.warrantyMonths} Months Warranty Included</p>
            </div>
          )}
          {transaction.note && transaction.items && transaction.items.length > 0 && (
            <div className="border border-dashed border-black p-2">
              <p className="font-bold uppercase mb-1">Notes / Description</p>
              <p>{transaction.note}</p>
            </div>
          )}
        </div>
      )}

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
            <p className="font-bold">amount ₹{transaction.amount}</p>
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
