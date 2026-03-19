import { UserProfile, Transaction, Product, Customer } from '../types';

// Local Storage Data Service
const STORAGE_KEYS = {
  PROFILE: 'sd_profile_',
  TRANSACTIONS: 'sd_transactions_',
  PRODUCTS: 'sd_products_',
  CUSTOMERS: 'sd_customers_',
};

const getFromStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    if (!data || data === 'undefined') return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading from storage:', e);
    return [];
  }
};

const saveToStorage = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to storage:', e);
  }
};

export const dataService = {
  // Connection Test
  async testConnection() {
    console.log("Local Data Service: Ready.");
  },

  // User Profile
  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE + uid);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error("Error getting profile from storage:", err);
      return null;
    }
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE + profile.uid, JSON.stringify(profile));
    } catch (err) {
      console.error("Error saving profile to storage:", err);
    }
  },

  // Transactions
  subscribeTransactions(uid: string, callback: (transactions: Transaction[]) => void) {
    const key = STORAGE_KEYS.TRANSACTIONS + uid;
    let lastData = '';
    const update = () => {
      const raw = localStorage.getItem(key) || '[]';
      if (raw !== lastData) {
        lastData = raw;
        const txs = JSON.parse(raw);
        callback(txs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  },

  async addTransaction(tx: Transaction): Promise<void> {
    const key = STORAGE_KEYS.TRANSACTIONS + tx.userId;
    const txs = getFromStorage<Transaction>(key);
    saveToStorage(key, [...txs, tx]);
  },

  async updateTransaction(tx: Transaction): Promise<void> {
    const key = STORAGE_KEYS.TRANSACTIONS + tx.userId;
    const txs = getFromStorage<Transaction>(key);
    saveToStorage(key, txs.map(t => t.id === tx.id ? tx : t));
  },

  // Products
  subscribeProducts(uid: string, callback: (products: Product[]) => void) {
    const key = STORAGE_KEYS.PRODUCTS + uid;
    let lastData = '';
    const update = () => {
      const raw = localStorage.getItem(key) || '[]';
      if (raw !== lastData) {
        lastData = raw;
        callback(JSON.parse(raw));
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  },

  async saveProduct(product: Product): Promise<void> {
    const key = STORAGE_KEYS.PRODUCTS + product.userId;
    const products = getFromStorage<Product>(key);
    const exists = products.find(p => p.id === product.id);
    if (exists) {
      saveToStorage(key, products.map(p => p.id === product.id ? product : p));
    } else {
      saveToStorage(key, [...products, product]);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEYS.PRODUCTS));
    allKeys.forEach(key => {
      const products = getFromStorage<Product>(key);
      if (products.find(p => p.id === id)) {
        saveToStorage(key, products.filter(p => p.id !== id));
      }
    });
  },

  // Customers
  subscribeCustomers(uid: string, callback: (customers: Customer[]) => void) {
    const key = STORAGE_KEYS.CUSTOMERS + uid;
    let lastData = '';
    const update = () => {
      const raw = localStorage.getItem(key) || '[]';
      if (raw !== lastData) {
        lastData = raw;
        callback(JSON.parse(raw));
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  },

  async saveCustomer(customer: Customer): Promise<void> {
    const key = STORAGE_KEYS.CUSTOMERS + customer.userId;
    const customers = getFromStorage<Customer>(key);
    const exists = customers.find(c => c.id === customer.id);
    if (exists) {
      saveToStorage(key, customers.map(c => c.id === customer.id ? customer : c));
    } else {
      saveToStorage(key, [...customers, customer]);
    }
  }
};
