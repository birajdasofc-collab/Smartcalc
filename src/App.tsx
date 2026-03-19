import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Store } from 'lucide-react';
import { Sales } from './components/Sales';
import { Expenses } from './components/Expenses';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { SplashScreen } from './components/SplashScreen';
import { QRModal } from './components/QRModal';
import { BluetoothScanner } from './components/BluetoothScanner';
import { Inventory } from './components/Inventory';
import { Customers } from './components/Customers';
import { ExitModal } from './components/ExitModal';
import { VoiceTutorial } from './components/VoiceTutorial';
import { SkeletonLoader } from './components/SkeletonLoader';
import { USBPrinterService } from './services/usbPrinterService';
import { ThermalInvoicePreview } from './components/ThermalInvoicePreview';
import { DigitalInvoice } from './components/DigitalInvoice';
import { VoiceInput, ParsedVoiceEntry } from './components/VoiceInput';
import { BarcodeScanner } from './components/BarcodeScanner';
import { UserProfile, Transaction, Product, TransactionItem, PaymentMethod, Customer } from './types';
import { Language, translations } from './translations';
import { cn } from './utils/cn';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import * as htmlToImage from 'html-to-image';
import { dataService } from './services/dataService';

export default function App() {
  const [showSplash, setShowSplash] = useState(false);
  const [user, setUser] = useState<any>({ uid: 'test-user', displayName: 'Test User' });

  // Splash screen fallback
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);
    return () => clearTimeout(splashTimer);
  }, []);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(true);
  const [isAppOpening, setIsAppOpening] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [navigationStack, setNavigationStack] = useState<string[]>([]);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState<any>(null);
  const [bluetoothDevice, setBluetoothDevice] = useState<any>(null);
  const [usbPrinter, setUsbPrinter] = useState<USBDevice | null>(null);
  const [lastBackPressTime, setLastBackPressTime] = useState(0);
  const [showExitToast, setShowExitToast] = useState(false);
  const [isVoiceInputOpen, setIsVoiceInputOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isVoiceTutorialOpen, setIsVoiceTutorialOpen] = useState(false);
  const [showInventoryAddMenu, setShowInventoryAddMenu] = useState(false);
  const [voiceInitialTranscript, setVoiceInitialTranscript] = useState('');
  const [barcodeScannerContext, setBarcodeScannerContext] = useState<'general' | 'inventory_form'>('general');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const t = translations[language];

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // App Opening Delay for Skeleton
  useEffect(() => {
    // Fallback timer to ensure app opens even if profile is slow
    const fallbackTimer = setTimeout(() => {
      setIsAppOpening(false);
    }, 5000);

    if (user && profile) {
      const timer = setTimeout(() => {
        setIsAppOpening(false);
      }, 1000); // Reduced from 1.5s
      return () => {
        clearTimeout(timer);
        clearTimeout(fallbackTimer);
      };
    }
    return () => clearTimeout(fallbackTimer);
  }, [user, profile]);

  // Data Initialization
  useEffect(() => {
    // Fallback to stop loading after 8 seconds no matter what
    const loadingFallback = setTimeout(() => {
      setLoading(false);
    }, 8000);

    const init = async () => {
      try {
        const userProfile = await dataService.getProfile('test-user');
        if (userProfile) {
          setProfile(userProfile);
          if (userProfile.language) setLanguage(userProfile.language);
        } else {
          // Create a default profile if none exists
          const defaultProfile: UserProfile = {
            uid: 'test-user',
            name: 'Test Owner',
            shopName: 'My Smart Dukaan',
            mobile: '9876543210',
            address: '123 Market Street',
            upiId: 'test@upi',
            createdAt: new Date().toISOString(),
            language: 'en',
            role: 'client'
          };
          await dataService.saveProfile(defaultProfile);
          setProfile(defaultProfile);
        }
      } catch (err) {
        console.error("Initialization error:", err);
        // Fallback to a default profile even on error to unblock the app
        const fallbackProfile: UserProfile = {
          uid: 'test-user',
          name: 'Test Owner',
          shopName: 'My Smart Dukaan',
          mobile: '9876543210',
          address: '123 Market Street',
          upiId: 'test@upi',
          createdAt: new Date().toISOString(),
          language: 'en',
          role: 'client'
        };
        setProfile(fallbackProfile);
      } finally {
        setLoading(false);
        clearTimeout(loadingFallback);
      }
    };
    init();
    return () => clearTimeout(loadingFallback);
  }, []);

  // Real-time Data Subscriptions
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setProducts([]);
      setCustomers([]);
      return;
    }

    const unsubTxs = dataService.subscribeTransactions(user.uid, setTransactions);
    const unsubProducts = dataService.subscribeProducts(user.uid, setProducts);
    const unsubCustomers = dataService.subscribeCustomers(user.uid, setCustomers);

    return () => {
      unsubTxs();
      unsubProducts();
      unsubCustomers();
    };
  }, [user]);

  const { todayTxs, todaySales, todayExpenses, todayCOGS, totalPendingCredit } = React.useMemo(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const txs = transactions.filter(tx => tx && tx.date && typeof tx.date === 'string' && tx.date.startsWith(today));
      const sales = txs.filter(tx => tx.type === 'sale').reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const expenses = txs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const cogs = txs.filter(tx => tx.type === 'sale').reduce((sum, tx) => {
        const itemsCOGS = tx.items?.reduce((itemSum, item) => itemSum + (item.costPrice || 0) * item.quantity, 0) || 0;
        return sum + itemsCOGS;
      }, 0);
      const pendingCredit = transactions
        .filter(tx => tx && tx.type === 'sale' && tx.paymentMethod === 'credit' && tx.status === 'pending')
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);
      return { todayTxs: txs, todaySales: sales, todayExpenses: expenses, todayCOGS: cogs, totalPendingCredit: pendingCredit };
    } catch (err) {
      console.error("Memo calculation error:", err);
      return { todayTxs: [], todaySales: 0, todayExpenses: 0, todayCOGS: 0, totalPendingCredit: 0 };
    }
  }, [transactions]);

  const recentTransactions = React.useMemo(() => todayTxs.slice(0, 5), [todayTxs]);

  // Initialize history push to catch back button
  useEffect(() => {
    window.history.pushState(null, '');
  }, []);

  // Smart Back Navigation Logic
  const handleBackNavigation = React.useCallback(() => {
    if (isQRModalOpen) {
      setIsQRModalOpen(false);
      setCurrentSale(null);
      return;
    }

    if (navigationStack.length > 0) {
      const newStack = [...navigationStack];
      const prevTab = newStack.pop();
      setNavigationStack(newStack);
      if (prevTab) setActiveTab(prevTab);
    } else if (activeTab !== 'home') {
      setActiveTab('home');
    } else {
      const now = Date.now();
      if (now - lastBackPressTime < 2000) {
        setIsExitModalOpen(true);
        setShowExitToast(false);
      } else {
        setLastBackPressTime(now);
        setShowExitToast(true);
        setTimeout(() => setShowExitToast(false), 2000);
      }
    }
  }, [navigationStack, activeTab, isQRModalOpen, lastBackPressTime]);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      // Prevent default back navigation
      window.history.pushState(null, '');
      handleBackNavigation();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [handleBackNavigation]);

  const handleTabChange = React.useCallback((newTab: string) => {
    if (newTab === activeTab) return;
    setShowInventoryAddMenu(false);
    setNavigationStack(prev => [...prev, activeTab]);
    setActiveTab(newTab);
  }, [activeTab]);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo(0, 0);
    // Also scroll any main containers if they exist
    const main = document.querySelector('main');
    if (main) main.scrollTo(0, 0);
  }, [activeTab]);

  const handleLogin = React.useCallback(async (userData: any) => {
    setUser(userData);
    const userProfile = await dataService.getProfile(userData.uid);
    if (userProfile) {
      setProfile(userProfile);
      if (userProfile.language) setLanguage(userProfile.language);
    }
  }, []);

  const handleOnboardingComplete = React.useCallback(async (data: any) => {
    if (!user) return;
    const { ownerName, ...rest } = data;
    const newProfile: UserProfile = {
      uid: user.uid,
      name: ownerName || '',
      ...rest,
      createdAt: new Date().toISOString(),
      role: 'client'
    };
    await dataService.saveProfile(newProfile);
    setProfile(newProfile);
    if (data.language) setLanguage(data.language);
  }, [user]);

  const handleUpdateProfile = React.useCallback(async (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...data };
    await dataService.saveProfile(updated);
    setProfile(updated);
    if (data.language) setLanguage(data.language);
  }, [profile]);

  const handleLanguageChange = React.useCallback(async (lang: Language) => {
    setLanguage(lang);
    if (profile) {
      const updated = { ...profile, language: lang };
      await dataService.saveProfile(updated);
      setProfile(updated);
    }
  }, [profile]);

  const generateInvoice = React.useCallback((tx: Transaction) => {
    if (!profile) return;
    const doc = new jsPDF();
    const primaryColor = '#059669'; // Emerald 600
    
    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor('#FFFFFF');
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(profile.shopName, 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(profile.address, 20, 32);
    doc.text(`Mobile: ${profile.mobile}`, 150, 32);

    // Invoice Info
    doc.setTextColor('#1f2937');
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, 60);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${tx.id.toUpperCase()}`, 20, 70);
    doc.text(`Date: ${new Date(tx.date).toLocaleDateString()}`, 20, 75);
    doc.text(`Payment: ${tx.paymentMethod?.toUpperCase() || 'CASH'}`, 20, 80);

    if (tx.customerName) {
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 140, 60);
      doc.setFont('helvetica', 'normal');
      doc.text(tx.customerName, 140, 65);
    }

    // Table Header
    doc.setFillColor('#f3f4f6');
    doc.rect(20, 90, 170, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Item Description', 25, 96.5);
    doc.text('Qty', 120, 96.5);
    doc.text('Price', 145, 96.5);
    doc.text('Total', 175, 96.5);

    // Items
    let y = 110;
    doc.setFont('helvetica', 'normal');
    if (tx.items && tx.items.length > 0) {
      tx.items.forEach(item => {
        doc.text(item.name, 25, y);
        doc.text(`${item.quantity} ${item.unit || ''}`, 120, y);
        doc.text(item.price.toLocaleString(), 145, y);
        doc.text((item.price * item.quantity).toLocaleString(), 175, y);
        y += 10;
      });
    } else {
      doc.text(tx.note || 'General Sale', 25, y);
      doc.text('1', 120, y);
      doc.text(tx.amount.toLocaleString(), 145, y);
      doc.text(tx.amount.toLocaleString(), 175, y);
      y += 10;
    }

    // Totals
    y += 10;
    doc.line(20, y, 190, y);
    y += 10;
    
    const subtotal = tx.items?.reduce((sum, i) => sum + (i.price * i.quantity), 0) || tx.amount + (tx.discount || 0) - (tx.gstAmount || 0);
    
    doc.text('Subtotal:', 140, y);
    doc.text(`Rs. ${subtotal.toLocaleString()}`, 175, y);

    if (tx.gstAmount) {
      y += 8;
      doc.text(`GST (${tx.gstPercentage}%):`, 140, y);
      doc.text(`+ Rs. ${tx.gstAmount.toLocaleString()}`, 175, y);
    }
    
    if (tx.discount) {
      y += 8;
      doc.setTextColor('#dc2626');
      doc.text('Discount:', 140, y);
      doc.text(`- Rs. ${tx.discount.toLocaleString()}`, 175, y);
      doc.setTextColor('#1f2937');
    }

    y += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', 130, y);
    doc.text(`Rs. ${tx.amount.toLocaleString()}`, 170, y);

    // Warranty & Notes
    y += 20;
    if (tx.warrantyMonths) {
      doc.setFontSize(10);
      doc.setFillColor('#ecfdf5');
      doc.rect(20, y, 170, 10, 'F');
      doc.setTextColor('#059669');
      doc.text(`WARRANTY: ${tx.warrantyMonths} Months Warranty Included`, 25, y + 6.5);
      y += 15;
    }

    if (tx.note && tx.items && tx.items.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor('#4b5563');
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(tx.note, 20, y + 5, { maxWidth: 170 });
      y += 15;
    }

    // Signature
    doc.setTextColor('#1f2937');
    if (profile.signature) {
      y += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Authorized by', 105, y, { align: 'center' });
      try {
        doc.addImage(profile.signature, 'PNG', 85, y + 2, 40, 20);
      } catch (e) {
        console.error("Failed to add signature to PDF", e);
      }
    }

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor('#9ca3af');
    doc.text('Thank you for shopping with us!', 105, 250, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('Powered by Smart Dukaan', 105, 260, { align: 'center' });

    doc.save(`invoice_${tx.id}.pdf`);
  }, [profile]);

  const printToThermalPrinter = React.useCallback(async (tx: Transaction) => {
    if (!profile) return;
    
    if (!usbPrinter) {
      alert("Please connect a USB Thermal Printer via OTG first in Settings.");
      setActiveTab('settings');
      return;
    }

    try {
      const printerService = new USBPrinterService(usbPrinter);
      const receiptData = USBPrinterService.generateReceipt(tx, profile);
      await printerService.print(receiptData);
      alert("Printing successful!");
    } catch (err) {
      console.error("Printing failed:", err);
      alert("Printing failed. Please ensure your printer is connected and turned on.");
    }
  }, [profile, usbPrinter]);

  const shareInvoiceViaWhatsApp = React.useCallback(async (tx: Transaction) => {
    if (!profile) return;
    
    try {
      const text = `*Invoice from ${profile.shopName}*\n` +
                   `Invoice #: ${tx.id.toUpperCase()}\n` +
                   `Date: ${new Date(tx.date).toLocaleDateString()}\n` +
                   `Amount: *Rs. ${tx.amount.toLocaleString()}*\n\n` +
                   `Items:\n` +
                   (tx.items?.map(i => `- ${i.name}: ${i.quantity} x ${i.price}`).join('\n') || 'General Sale') +
                   `\n\nThank you for shopping with us!`;

      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      
      // Try navigator.share first if supported (for image sharing)
      const element = document.getElementById(`digital-invoice-${tx.id}`);
      if (element && navigator.share && typeof navigator.canShare === 'function') {
        try {
          const originalStyle = element.style.cssText;
          element.style.cssText = "position: fixed; left: 0; top: 0; visibility: visible; z-index: 9999; background: white; width: 400px;";
          const dataUrl = await htmlToImage.toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2 });
          element.style.cssText = originalStyle;

          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], `invoice_${tx.id}.png`, { type: 'image/png' });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Invoice from ${profile.shopName}`,
              text: text
            });
            return;
          }
        } catch (shareErr) {
          console.warn("Navigator share failed, falling back to link", shareErr);
        }
      }

      // Fallback to direct WhatsApp link
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error("Sharing failed:", err);
      alert("Sharing failed. Please try again.");
    }
  }, [profile]);

  const handleAddProduct = React.useCallback(async (data: Omit<Product, 'id' | 'userId'>) => {
    if (!user) return;
    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      ...data
    };
    await dataService.saveProduct(newProduct);
  }, [user]);

  const handleDeleteProduct = React.useCallback(async (id: string) => {
    await dataService.deleteProduct(id);
  }, []);

  const handleUpdateProduct = React.useCallback(async (product: Product) => {
    await dataService.saveProduct(product);
  }, []);

  const confirmSale = React.useCallback(async (tx: Transaction) => {
    await dataService.addTransaction(tx);
    
    // Update stock
    if (tx.items) {
      for (const item of tx.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await dataService.saveProduct({
            ...product,
            stock: Math.max(0, product.stock - item.quantity)
          });
        }
      }
    }
    generateInvoice(tx);
    setIsQRModalOpen(false);
    setCurrentSale(null);
  }, [products, generateInvoice]);

  const handleAddSale = React.useCallback(async (data: { 
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
  }) => {
    if (!user) return;
    
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      type: 'sale',
      amount: data.amount,
      date: new Date().toISOString(),
      customerName: data.customerName || `Customer ${data.customerMobile?.slice(-4) || ''}`,
      customerMobile: data.customerMobile,
      note: data.note,
      items: data.items,
      discount: data.discount,
      gstPercentage: data.gstPercentage,
      gstAmount: data.gstAmount,
      warrantyMonths: data.warrantyMonths,
      paymentMethod: data.paymentMethod,
      status: data.paymentMethod === 'credit' ? 'pending' : 'completed'
    };

    if (data.customerName || data.customerMobile) {
      const existingCustomer = customers.find(c => 
        (data.customerMobile && c.mobile === data.customerMobile) || 
        (data.customerName && c.name.toLowerCase() === data.customerName.toLowerCase())
      );

      if (existingCustomer) {
        await dataService.saveCustomer({
          ...existingCustomer,
          name: data.customerName || existingCustomer.name,
          mobile: data.customerMobile || existingCustomer.mobile,
          totalSpent: existingCustomer.totalSpent + data.amount,
          creditAmount: (existingCustomer.creditAmount || 0) + (data.paymentMethod === 'credit' ? data.amount : 0),
          lastVisit: new Date().toISOString()
        });
      } else {
        const newCustomer: Customer = {
          id: Math.random().toString(36).substr(2, 9),
          userId: user.uid,
          name: data.customerName || `Customer ${data.customerMobile?.slice(-4) || ''}`,
          mobile: data.customerMobile || '',
          totalSpent: data.amount,
          creditAmount: data.paymentMethod === 'credit' ? data.amount : 0,
          lastVisit: new Date().toISOString(),
          joinDate: new Date().toISOString()
        };
        await dataService.saveCustomer(newCustomer);
      }
    }

    if (data.paymentMethod === 'online') {
      setCurrentSale(newTx);
      setIsQRModalOpen(true);
    } else {
      await confirmSale(newTx);
    }
  }, [user, customers, confirmSale]);

  const handleAddExpense = React.useCallback(async (data: { amount: number; category: string; note: string }) => {
    if (!user) return;
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      type: 'expense',
      amount: data.amount,
      date: new Date().toISOString(),
      category: data.category,
      note: data.note,
    };
    await dataService.addTransaction(newTx);
  }, [user]);

  const handleReturnItem = React.useCallback(async (transactionId: string, itemIndex: number) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || !tx.items) return;

    const item = tx.items[itemIndex];
    if (item.isReturned) return;

    const itemTotal = item.price * item.quantity;
    
    // Update stock
    const product = products.find(p => p.id === item.productId);
    if (product) {
      await dataService.saveProduct({ ...product, stock: product.stock + item.quantity });
    }

    // Update customer
    if (tx.customerMobile) {
      const customer = customers.find(c => c.mobile === tx.customerMobile);
      if (customer) {
        await dataService.saveCustomer({
          ...customer,
          totalSpent: customer.totalSpent - itemTotal,
          creditAmount: tx.paymentMethod === 'credit' ? Math.max(0, customer.creditAmount - itemTotal) : customer.creditAmount
        });
      }
    }

    const newItems = [...(tx.items || [])];
    newItems[itemIndex] = { ...newItems[itemIndex], isReturned: true };
    await dataService.updateTransaction({
      ...tx,
      amount: tx.amount - itemTotal,
      items: newItems
    });
  }, [transactions, products, customers]);

  const handleReturnSale = React.useCallback(async (transactionId: string) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || tx.isReturned) return;

    // Update stock for all items
    if (tx.items) {
      for (const item of tx.items) {
        if (!item.isReturned) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            await dataService.saveProduct({ ...product, stock: product.stock + item.quantity });
          }
        }
      }
    }

    // Update customer
    if (tx.customerMobile || tx.customerId) {
      const customer = customers.find(c => (tx.customerId && c.id === tx.customerId) || (tx.customerMobile && c.mobile === tx.customerMobile));
      if (customer) {
        await dataService.saveCustomer({
          ...customer,
          totalSpent: Math.max(0, customer.totalSpent - tx.amount),
          creditAmount: tx.paymentMethod === 'credit' ? Math.max(0, (customer.creditAmount || 0) - tx.amount) : customer.creditAmount
        });
      }
    }

    await dataService.updateTransaction({
      ...tx,
      isReturned: true,
      items: tx.items?.map(item => ({ ...item, isReturned: true }))
    });
  }, [transactions, products, customers]);

  const handleCollectCredit = React.useCallback(async (customerMobile: string, amount: number, method: 'cash' | 'online') => {
    if (!user) return;

    const collectionTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      type: 'credit_collection',
      amount: amount,
      date: new Date().toISOString(),
      customerMobile: customerMobile,
      paymentMethod: method,
      status: 'completed',
      note: `Credit Collection - ${method.toUpperCase()}`
    };

    await dataService.addTransaction(collectionTx);

    // Update pending transactions
    const pendingTxs = transactions.filter(tx => tx.customerMobile === customerMobile && tx.status === 'pending');
    for (const tx of pendingTxs) {
      await dataService.updateTransaction({
        ...tx,
        status: 'collected',
        collectedDate: new Date().toISOString(),
        collectedMethod: method
      });
    }

    const customer = customers.find(c => c.mobile === customerMobile);
    if (customer) {
      await dataService.saveCustomer({ ...customer, creditAmount: Math.max(0, (customer.creditAmount || 0) - amount) });
    }
  }, [user, transactions, customers]);

  const handleVoiceConfirm = React.useCallback(async (entries: ParsedVoiceEntry[]) => {
    if (!user) return;
    
    for (const entry of entries) {
      if (entry.type === 'cashIn') {
        const newTx: Transaction = {
          id: Math.random().toString(36).substr(2, 9),
          userId: user.uid,
          type: 'sale',
          amount: entry.amount || 0,
          date: new Date().toISOString(),
          note: `[Voice Cash In] ${entry.note}`,
          paymentMethod: 'cash',
          status: 'completed'
        };
        await dataService.addTransaction(newTx);
      } else if (entry.type === 'restock') {
        if (entry.productId) {
          const product = products.find(p => p.id === entry.productId);
          if (product) {
            await dataService.saveProduct({
              ...product,
              stock: (product.stock || 0) + entry.quantity
            });
            setToast({ message: `Restocked ${entry.quantity} ${product.name}`, type: 'success' });
          }
        } else if (entry.productName) {
          setActiveTab('inventory');
          setShowInventoryAddMenu(true);
          setToast({ message: `Product "${entry.productName}" not found. Please add it to inventory first.`, type: 'error' });
        }
      } else if (entry.type === 'sale') {
        if (entry.productId) {
          const product = products.find(p => p.id === entry.productId);
          if (product) {
            // Check stock limit
            if (product.stock < entry.quantity) {
              setToast({ message: `Stock limit crossed for ${product.name}. Available: ${product.stock}`, type: 'error' });
              continue;
            }

            const newTx: Transaction = {
              id: Math.random().toString(36).substr(2, 9),
              userId: user.uid,
              type: 'sale',
              amount: entry.amount || (product.price * entry.quantity),
              date: new Date().toISOString(),
              note: `[Voice Sale] ${entry.note}`,
              paymentMethod: 'cash',
              status: 'completed',
              items: [{
                productId: entry.productId,
                name: product.name,
                quantity: entry.quantity,
                price: product.price,
                unit: product.unit || 'piece'
              }]
            };
            await dataService.addTransaction(newTx);

            // Update stock
            await dataService.saveProduct({
              ...product,
              stock: Math.max(0, product.stock - entry.quantity)
            });
            setToast({ message: `Sold ${entry.quantity} ${product.name}`, type: 'success' });
          }
        } else if (entry.productName) {
          setActiveTab('inventory');
          setShowInventoryAddMenu(true);
          setToast({ message: `Product "${entry.productName}" not found. Cannot create sale.`, type: 'error' });
        }
      } else if (entry.type === 'expense') {
        const newTx: Transaction = {
          id: Math.random().toString(36).substr(2, 9),
          userId: user.uid,
          type: 'expense',
          amount: entry.amount || 0,
          date: new Date().toISOString(),
          note: `[Voice Expense] ${entry.note}`,
          paymentMethod: 'cash',
          status: 'completed'
        };
        await dataService.addTransaction(newTx);
        setToast({ message: `Expense of ₹${entry.amount} recorded`, type: 'success' });
      }
    }
    setIsVoiceInputOpen(false);
  }, [user, products]);

  const handleBarcodeScan = React.useCallback(async (barcode: string) => {
    const scannedBarcode = String(barcode).trim();
    if (barcodeScannerContext === 'inventory_form') {
      window.dispatchEvent(new CustomEvent('barcode-scanned', { detail: scannedBarcode }));
      setIsBarcodeScannerOpen(false);
    } else {
      const product = products.find(p => 
        (p.barcode && String(p.barcode).trim() === scannedBarcode) || 
        (p.id && String(p.id).trim() === scannedBarcode) ||
        (p.qrCode && String(p.qrCode).trim() === scannedBarcode)
      );
      if (product) {
        // EXISTING PRODUCT: Increment stock by 1
        const updatedProduct = { ...product, stock: (product.stock || 0) + 1 };
        await handleUpdateProduct(updatedProduct);
        
        // Show "Stock Updated (+1)" toast
        setToast({
          message: `${product.name}: ${t.stockUpdated} (+1)`,
          type: 'success'
        });
        // Keep scanner open for more scans if it's an existing product
      } else {
        // NEW PRODUCT: Show error toast and keep scanner open or close it
        setToast({
          message: t.productNotFound,
          type: 'error'
        });
      }
    }
    setBarcodeScannerContext('general');
  }, [products, barcodeScannerContext, handleUpdateProduct, t, setActiveTab]);

  const handleQRPaymentDone = React.useCallback(async () => {
    if (!isQRModalOpen) return;

    if (!currentSale) {
      // This is a generic QR from Quick Actions
      setIsQRModalOpen(false);
      return;
    }

    await confirmSale(currentSale);
  }, [isQRModalOpen, currentSale, confirmSale]);

  const handleLogout = React.useCallback(async () => {
    setUser(null);
    setProfile(null);
    setTransactions([]);
    setProducts([]);
    setCustomers([]);
    setToast({ message: 'Logged out successfully', type: 'success' });
  }, []);

  const handleResetData = React.useCallback(async () => {
    if (!user) return;
    try {
      await dataService.resetData(user.uid);
      setProfile(null);
      setTransactions([]);
      setProducts([]);
      setCustomers([]);
      setToast({ message: 'Data reset successfully', type: 'success' });
      // Reload to re-initialize default profile or go to onboarding
      window.location.reload();
    } catch (err) {
      setToast({ message: 'Failed to reset data', type: 'error' });
    }
  }, [user]);

  const salesHistory = React.useMemo(() => transactions.filter(tx => tx.type === 'sale'), [transactions]);
  const expenseHistory = React.useMemo(() => transactions.filter(tx => tx.type === 'expense'), [transactions]);

  const handleVoiceEntry = React.useCallback(() => {
    if (activeTab === 'inventory') {
      setShowInventoryAddMenu(prev => !prev);
      return;
    }
    const hasSeenTutorial = localStorage.getItem('hasSeenVoiceTutorial');
    if (!hasSeenTutorial) {
      setIsVoiceTutorialOpen(true);
    } else {
      setIsVoiceInputOpen(true);
    }
  }, [activeTab]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 text-center">
        <div className="mb-8 rounded-full bg-emerald-100 p-6 text-emerald-600">
          <Store size={48} />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-zinc-900">{t.welcome}</h1>
        <p className="mb-8 text-zinc-500">{t.loginToManage}</p>
        <button
          onClick={() => handleLogin({ uid: 'test-user', displayName: 'Test User' })}
          className="w-full max-w-xs rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-100 transition-transform active:scale-95"
        >
          {t.useDemoLogin}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <p className="text-zinc-500">Initializing local profile...</p>
        </div>
      </div>
    );
  }

  if (isAppOpening && activeTab === 'home') {
    return <SkeletonLoader />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={handleTabChange} 
      onVoiceEntry={handleVoiceEntry}
      language={language}
      showInventoryAddMenu={showInventoryAddMenu}
      onCloseAddMenu={() => setShowInventoryAddMenu(false)}
    >
      <div className="motion-gpu">
        {toast && (
          <div className="fixed top-4 left-1/2 z-[100] -translate-x-1/2">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "rounded-full px-6 py-3 font-bold text-white shadow-lg backdrop-blur-md",
                toast.type === 'success' ? "bg-emerald-600/90" : "bg-rose-600/90"
              )}
            >
              {toast.message}
            </motion.div>
          </div>
        )}
        {activeTab === 'home' && (
          <Dashboard
            language={language}
            todaySales={todaySales}
            todayExpenses={todayExpenses}
            todayCOGS={todayCOGS}
            totalPendingCredit={totalPendingCredit}
            onNewSale={() => handleTabChange('sales')}
            onAddExpense={() => handleTabChange('expenses')}
            onViewReports={() => handleTabChange('reports')}
            onGenerateQR={() => setIsQRModalOpen(true)}
            onViewInventory={() => handleTabChange('inventory')}
            onVoiceEntry={handleVoiceEntry}
            recentTransactions={recentTransactions}
            products={products}
            shopName={profile.shopName}
            dailySalesGoal={profile.dailySalesGoal}
          />
        )}
        {activeTab === 'sales' && (
          <Sales 
            language={language}
            products={products}
            onAddSale={handleAddSale} 
            onDownloadInvoice={generateInvoice}
            onShareInvoice={shareInvoiceViaWhatsApp}
            onPrintInvoice={printToThermalPrinter}
            onProductNotFound={(barcode) => {
              setToast({
                message: t.productNotFound,
                type: 'error'
              });
            }}
            salesHistory={salesHistory} 
            userProfile={profile}
            connectedDevice={bluetoothDevice}
            connectedPrinter={usbPrinter}
          />
        )}
        {activeTab === 'inventory' && (
          <Inventory
            language={language}
            products={products}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateProduct={handleUpdateProduct}
            showAddMenu={showInventoryAddMenu}
            onCloseAddMenu={() => setShowInventoryAddMenu(false)}
            onBarcodeScan={() => {
              setBarcodeScannerContext('inventory_form');
              setIsBarcodeScannerOpen(true);
            }}
            setToast={setToast}
          />
        )}
        {activeTab === 'customers' && (
          <Customers
            language={language}
            customers={customers}
            transactions={transactions}
            totalPendingCredit={totalPendingCredit}
            onCollectCredit={handleCollectCredit}
            onReturnItem={handleReturnItem}
            onReturnSale={handleReturnSale}
            upiId={profile.upiId}
            shopName={profile.shopName}
          />
        )}
        {activeTab === 'expenses' && (
          <Expenses 
            language={language}
            onAddExpense={handleAddExpense} 
            expenseHistory={expenseHistory} 
          />
        )}
        {activeTab === 'reports' && (
          <Reports 
            transactions={transactions} 
            language={language} 
            usbPrinter={usbPrinter}
            userProfile={profile}
            onDownloadInvoice={generateInvoice}
            onShareInvoice={shareInvoiceViaWhatsApp}
            onPrintInvoice={printToThermalPrinter}
          />
        )}
        {activeTab === 'settings' && (
          <Settings 
            language={language}
            onLanguageChange={handleLanguageChange}
            userProfile={profile} 
            onLogout={handleLogout} 
            onResetData={handleResetData}
            onUpdateProfile={handleUpdateProfile}
            onDeviceConnected={setBluetoothDevice}
            connectedDevice={bluetoothDevice}
            onPrinterConnected={setUsbPrinter}
            connectedPrinter={usbPrinter}
            onTabChange={handleTabChange}
          />
        )}
      </div>

      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          setCurrentSale(null);
        }}
        amount={currentSale?.amount || 0}
        upiId={profile.upiId}
        shopName={profile.shopName}
        onPaymentDone={handleQRPaymentDone}
        language={language}
      />

      <ExitModal 
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirm={() => window.close()}
        language={language}
      />

      <AnimatePresence>
        {isVoiceTutorialOpen && (
          <VoiceTutorial
            language={language}
            onClose={() => setIsVoiceTutorialOpen(false)}
            onFinish={() => {
              localStorage.setItem('hasSeenVoiceTutorial', 'true');
              setIsVoiceTutorialOpen(false);
              setIsVoiceInputOpen(true);
            }}
          />
        )}
        {isVoiceInputOpen && (
          <VoiceInput
            language={language}
            products={products}
            initialTranscript={voiceInitialTranscript}
            onClose={() => {
              setIsVoiceInputOpen(false);
              setVoiceInitialTranscript('');
            }}
            onConfirm={(entries) => {
              handleVoiceConfirm(entries);
              setVoiceInitialTranscript('');
            }}
          />
        )}
        {isBarcodeScannerOpen && (
          <BarcodeScanner
            language={language}
            onClose={() => setIsBarcodeScannerOpen(false)}
            onScan={handleBarcodeScan}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExitToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-zinc-800 px-6 py-3 text-sm font-medium text-white shadow-xl"
          >
            Press back again to exit
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Invoices for sharing/printing */}
      <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none">
        {transactions.filter(tx => tx.type === 'sale').map(tx => (
          <div key={tx.id}>
            <ThermalInvoicePreview transaction={tx} profile={profile} />
            <DigitalInvoice transaction={tx} profile={profile} />
          </div>
        ))}
      </div>
    </Layout>
  );
}
