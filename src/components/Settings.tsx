import React, { useState } from 'react';
import { User, Store, CreditCard, LogOut, Trash2, Globe, ChevronRight, X, Languages, Bluetooth, Printer, PenTool, Users, CheckCircle, BarChart3, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { UserProfile, Language } from '../types';
import { translations } from '../translations';
import { BluetoothScanner } from './BluetoothScanner';
import { USBPrinterConnector } from './USBPrinterConnector';
import { SignaturePad } from './SignaturePad';

interface SettingsProps {
  userProfile: UserProfile | null;
  onLogout: () => void;
  onResetData: () => void;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onDeviceConnected: (device: any) => void;
  connectedDevice: any;
  onPrinterConnected: (device: USBDevice | null) => void;
  connectedPrinter: USBDevice | null;
  onTabChange: (tab: string) => void;
}

const SettingItem = ({ icon, label, value, onClick, color = 'zinc', danger = false }: any) => (
  <button
    onClick={onClick}
    className="flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-sm transition-transform active:scale-98"
  >
    <div className="flex items-center gap-4">
      <div className={cn(
        "rounded-xl p-2",
        color === 'emerald' && "bg-emerald-50 text-emerald-600",
        color === 'rose' && "bg-rose-50 text-rose-600",
        color === 'indigo' && "bg-indigo-50 text-indigo-600",
        color === 'zinc' && "bg-zinc-50 text-zinc-600"
      )}>
        {icon}
      </div>
      <div className="text-left">
        <p className={cn("text-sm font-semibold", danger ? "text-rose-600" : "text-zinc-900")}>{label}</p>
        {value && <p className="text-[10px] text-zinc-400">{value}</p>}
      </div>
    </div>
    <ChevronRight size={18} className="text-zinc-300" />
  </button>
);

export const Settings = React.memo(({ userProfile, onLogout, onResetData, onUpdateProfile, language, onLanguageChange, onDeviceConnected, connectedDevice, onPrinterConnected, connectedPrinter, onTabChange }: SettingsProps) => {
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [isEditingGst, setIsEditingGst] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [isConnectingDevice, setIsConnectingDevice] = useState(false);
  const [isConnectingPrinter, setIsConnectingPrinter] = useState(false);
  const [isCreatingSignature, setIsCreatingSignature] = useState(false);
  
  const [newUpi, setNewUpi] = useState(userProfile?.upiId || '');
  const [newShopName, setNewShopName] = useState(userProfile?.shopName || '');
  const [newOwnerName, setNewOwnerName] = useState(userProfile?.name || '');
  const [newGst, setNewGst] = useState(userProfile?.gstNumber || '');
  const [newDailyGoal, setNewDailyGoal] = useState(userProfile?.dailySalesGoal?.toString() || '');
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  const t = translations[language];

  const handleUpdateShop = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ shopName: newShopName });
    setIsEditingShop(false);
  };

  const handleUpdateOwner = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ name: newOwnerName });
    setIsEditingOwner(false);
  };

  const handleSaveSignature = (signature: string) => {
    onUpdateProfile({ signature });
    setIsCreatingSignature(false);
  };

  const languages: { code: Language; name: string; native: string }[] = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  ];

  const currentLanguageName = languages.find(l => l.code === language)?.native || 'English';

  const modalVariants = {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", damping: 25, stiffness: 300 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{t.settings}</h1>
        <p className="text-sm text-zinc-500">Manage your profile and app preferences</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">{t.shopProfile}</h2>
        <div className="space-y-3">
          <SettingItem
            icon={<Store size={20} />}
            label={t.shopName}
            value={userProfile?.shopName || 'Not Set'}
            onClick={() => setIsEditingShop(true)}
            color="emerald"
          />
          <SettingItem
            icon={<User size={20} />}
            label="Owner Name"
            value={userProfile?.name || 'Not Set'}
            onClick={() => setIsEditingOwner(true)}
            color="emerald"
          />
          <SettingItem
            icon={<CreditCard size={20} />}
            label={t.upiId}
            value={userProfile?.upiId || 'Not Set'}
            onClick={() => setIsEditingUpi(true)}
            color="emerald"
          />
          <SettingItem
            icon={<CheckCircle size={20} />}
            label="GSTIN"
            value={userProfile?.gstNumber || 'Not Set'}
            onClick={() => setIsEditingGst(true)}
            color="emerald"
          />
          <SettingItem
            icon={<Target size={20} />}
            label={t.dailySalesGoal}
            value={userProfile?.dailySalesGoal ? `₹${userProfile.dailySalesGoal.toLocaleString()}` : 'Not Set'}
            onClick={() => setIsEditingGoal(true)}
            color="emerald"
          />
          <SettingItem
            icon={<PenTool size={20} />}
            label="Digital Signature"
            value={userProfile?.signature ? 'Signature Saved' : 'No Signature'}
            onClick={() => setIsCreatingSignature(true)}
            color="emerald"
          />
          <SettingItem
            icon={<Users size={20} />}
            label={t.customers}
            value="Manage Khata & Customers"
            onClick={() => onTabChange('customers')}
            color="emerald"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Reports & Analytics</h2>
        <div className="space-y-3">
          <SettingItem
            icon={<BarChart3 size={20} />}
            label={t.reports}
            value="View Sales & Expense Reports"
            onClick={() => onTabChange('reports')}
            color="emerald"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">App Preferences</h2>
        <div className="space-y-3">
          <SettingItem
            icon={<Languages size={20} />}
            label={t.language}
            value={currentLanguageName}
            onClick={() => setIsChangingLanguage(true)}
            color="indigo"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Device Connection</h2>
        <div className="space-y-3">
          <SettingItem
            icon={<Bluetooth size={20} />}
            label="Connect Calculator"
            value={connectedDevice ? `Connected: ${connectedDevice.name || 'ESP32'}` : 'Disconnected'}
            onClick={() => setIsConnectingDevice(true)}
            color="indigo"
          />
          <SettingItem
            icon={<Printer size={20} />}
            label="Connect Printer"
            value={connectedPrinter ? `Connected: ${connectedPrinter.productName || 'Thermal Printer'}` : 'Disconnected'}
            onClick={() => setIsConnectingPrinter(true)}
            color="indigo"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Account</h2>
        <div className="space-y-3">
          <SettingItem
            icon={<Trash2 size={20} />}
            label={t.resetData}
            onClick={onResetData}
            color="rose"
            danger
          />
          <SettingItem
            icon={<LogOut size={20} />}
            label={t.logout}
            onClick={onLogout}
            color="rose"
            danger
          />
        </div>
      </div>

      <AnimatePresence>
        {isEditingUpi && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsEditingUpi(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl"
            >

              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">Update UPI ID</h2>
                <button onClick={() => setIsEditingUpi(false)} className="rounded-full bg-zinc-100 p-2 text-zinc-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                onUpdateProfile({ upiId: newUpi });
                setIsEditingUpi(false);
              }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">New UPI ID</label>
                  <input
                    required
                    type="text"
                    placeholder="example@upi"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 px-4 focus:border-emerald-500 focus:outline-none"
                    value={newUpi}
                    onChange={(e) => setNewUpi(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-100 transition-transform active:scale-95"
                >
                  Save UPI ID
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isEditingShop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsEditingShop(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl"
            >

              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">Update Shop Name</h2>
                <button onClick={() => setIsEditingShop(false)} className="rounded-full bg-zinc-100 p-2 text-zinc-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateShop} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">New Shop Name</label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 px-4 focus:border-emerald-500 focus:outline-none"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-100 transition-transform active:scale-95"
                >
                  Save Shop Name
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isEditingOwner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsEditingOwner(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl"
            >

              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">Update Owner Name</h2>
                <button onClick={() => setIsEditingOwner(false)} className="rounded-full bg-zinc-100 p-2 text-zinc-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateOwner} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">New Owner Name</label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 px-4 focus:border-emerald-500 focus:outline-none"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-100 transition-transform active:scale-95"
                >
                  Save Owner Name
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isCreatingSignature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsCreatingSignature(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl"
            >

              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">Create E-Signature</h2>
                <button onClick={() => setIsCreatingSignature(false)} className="rounded-full bg-zinc-100 p-2 text-zinc-400">
                  <X size={20} />
                </button>
              </div>
              <SignaturePad 
                onSave={handleSaveSignature} 
                onClose={() => setIsCreatingSignature(false)} 
                initialSignature={userProfile?.signature}
              />
            </motion.div>
          </div>
        )}

        {isConnectingDevice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsConnectingDevice(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >

              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">Bluetooth Connection</h2>
                <button onClick={() => setIsConnectingDevice(false)} className="rounded-full bg-zinc-100 p-2 text-zinc-400">
                  <X size={20} />
                </button>
              </div>
              <BluetoothScanner 
                onDeviceConnected={(device) => {
                  onDeviceConnected(device);
                  if (device) setIsConnectingDevice(false);
                }} 
                connectedDevice={connectedDevice} 
              />
            </motion.div>
          </div>
        )}

        {isChangingLanguage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsChangingLanguage(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl"
            >

              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">{t.selectLanguage}</h2>
                <button onClick={() => setIsChangingLanguage(false)} className="rounded-full bg-zinc-100 p-2 text-zinc-400">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setIsChangingLanguage(false);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-2xl border-2 p-4 transition-all",
                      language === lang.code
                        ? "border-emerald-600 bg-emerald-50 text-emerald-600"
                        : "border-zinc-100 bg-white text-zinc-400"
                    )}
                  >
                    <span className="text-sm font-bold">{lang.native}</span>
                    <span className="text-[10px]">{lang.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
        {isEditingGst && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsEditingGst(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">Update GSTIN</h2>
                <button onClick={() => setIsEditingGst(false)} className="rounded-full bg-zinc-100 p-2 text-zinc-400">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                onUpdateProfile({ gstNumber: newGst });
                setIsEditingGst(false);
              }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">GSTIN</label>
                  <input
                    type="text"
                    placeholder="Enter GSTIN"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 px-4 focus:border-emerald-500 focus:outline-none"
                    value={newGst}
                    onChange={(e) => setNewGst(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-100 transition-transform active:scale-95"
                >
                  Save GSTIN
                </button>
              </form>
            </motion.div>
          </div>
        )}
        {isEditingGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsEditingGoal(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">{t.setDailyGoal}</h2>
                <button onClick={() => setIsEditingGoal(false)} className="rounded-full bg-zinc-100 p-2 text-zinc-400">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                onUpdateProfile({ dailySalesGoal: Math.round(Number(newDailyGoal)) });
                setIsEditingGoal(false);
              }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t.dailySalesGoal} (₹)</label>
                  <input
                    required
                    type="number"
                    placeholder="e.g. 5000"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 px-4 focus:border-emerald-500 focus:outline-none"
                    value={newDailyGoal}
                    onChange={(e) => setNewDailyGoal(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-100 transition-transform active:scale-95"
                >
                  {t.saveChanges}
                </button>
              </form>
            </motion.div>
          </div>
        )}
        {isConnectingPrinter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsConnectingPrinter(false)}
            />
            <motion.div
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >

              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">Printer Connection</h2>
                <button onClick={() => setIsConnectingPrinter(false)} className="rounded-full bg-zinc-100 p-2 text-zinc-400">
                  <X size={20} />
                </button>
              </div>
              <USBPrinterConnector 
                onPrinterConnected={(device) => {
                  onPrinterConnected(device);
                  if (device) setIsConnectingPrinter(false);
                }} 
                connectedPrinter={connectedPrinter} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
