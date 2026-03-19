export interface UserProfile {
  uid: string;
  name: string; // Owner Name
  shopName: string;
  mobile: string;
  address: string;
  upiId: string;
  gstNumber?: string;
  signature?: string; // Base64 signature image
  createdAt: string;
  dailySalesGoal?: number;
  language?: Language;
  role?: string;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  price: number; // Selling Price
  costPrice?: number;
  stock: number;
  category: string;
  unit: string;
  stockUnit?: string;
  qrCode?: string;
  barcode?: string;
}

export interface TransactionItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  costPrice?: number;
  isReturned?: boolean;
}

export type TransactionType = 'sale' | 'expense' | 'credit_collection';
export type PaymentMethod = 'cash' | 'online' | 'credit';
export type TransactionStatus = 'pending' | 'collected' | 'completed';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  date: string;
  note: string;
  customerName?: string;
  customerMobile?: string;
  customerId?: string;
  category?: string; // For expenses
  items?: TransactionItem[]; // For sales
  discount?: number; // Total discount in Rs
  gstPercentage?: number;
  gstAmount?: number;
  paymentMethod?: PaymentMethod;
  status?: TransactionStatus;
  collectedDate?: string;
  collectedMethod?: 'cash' | 'online';
  isReturned?: boolean;
  warrantyMonths?: number;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  mobile: string;
  totalSpent: number;
  creditAmount: number;
  lastVisit: string;
  joinDate?: string;
}

export type Language = 'en' | 'hi' | 'bn' | 'mr' | 'as' | 'gu';

export interface AppSettings {
  language: Language;
}
