import React from 'react';
import { Home, ShoppingCart, Wallet, BarChart3, Settings, Package, Users, Mic, Plus } from 'lucide-react';
import { cn } from '../utils/cn';
import { Language } from '../types';
import { translations } from '../translations';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

import { motion, AnimatePresence } from 'motion/react';

const NavItem = React.memo(({ icon, label, active, onClick }: NavItemProps) => (
  <motion.button
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-1 p-2 transition-colors motion-gpu",
      active ? "text-emerald-600" : "text-zinc-500 hover:text-zinc-800"
    )}
  >
    {icon}
    <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
  </motion.button>
));

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onVoiceEntry?: () => void;
  language: Language;
  showInventoryAddMenu?: boolean;
  onCloseAddMenu?: () => void;
}

export const Layout = React.memo(({ children, activeTab, onTabChange, onVoiceEntry, language, showInventoryAddMenu }: LayoutProps) => {
  const t = translations[language];
  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);

  React.useEffect(() => {
    let timeoutId: any;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (window.visualViewport) {
          setIsKeyboardOpen(window.visualViewport.height < window.innerHeight * 0.85);
        }
      }, 100);
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900 transition-colors duration-300">
      <main className={cn(
        "relative flex-1 overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain transition-all duration-300",
        !isKeyboardOpen ? "pb-24" : "pb-0"
      )}>
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#e8fcf0] to-zinc-50/0 z-0" />
        <div className="relative z-10 mx-auto w-full max-w-md p-4">
          {children}
        </div>
      </main>

      <AnimatePresence>
        {!isKeyboardOpen && (
          <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/80 backdrop-blur-md z-40"
          >
            <div className="mx-auto grid w-full max-w-md grid-cols-5 place-items-center px-2 py-1 relative">
              <NavItem
                icon={<Home size={20} />}
                label={t.home}
                active={activeTab === 'home'}
                onClick={() => onTabChange('home')}
              />
              <NavItem
                icon={<ShoppingCart size={20} />}
                label={t.sales}
                active={activeTab === 'sales'}
                onClick={() => onTabChange('sales')}
              />
              
              {/* Central Dynamic Button */}
              <div className="flex w-full justify-center relative -top-6">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onVoiceEntry}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-200 ring-4 ring-white"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab === 'inventory' ? 'plus' : 'mic'}
                      initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                      animate={{ 
                        rotate: activeTab === 'inventory' && showInventoryAddMenu ? 45 : 0, 
                        opacity: 1, 
                        scale: 1 
                      }}
                      exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      {activeTab === 'inventory' ? <Plus size={28} /> : <Mic size={24} />}
                    </motion.div>
                  </AnimatePresence>
                </motion.button>
              </div>

              <NavItem
                icon={<Package size={20} />}
                label={t.inventory}
                active={activeTab === 'inventory'}
                onClick={() => onTabChange('inventory')}
              />
              <NavItem
                icon={<Settings size={20} />}
                label={t.settings}
                active={activeTab === 'settings'}
                onClick={() => onTabChange('settings')}
              />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
});
