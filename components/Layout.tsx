
import React, { useState } from 'react';
import { Page, Shop } from '../types';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Users, 
  LogOut, 
  Menu,
  Bell,
  FolderHeart,
  Store,
  ChevronDown,
  PlusCircle,
  Settings
} from 'lucide-react';

export interface AlertItem {
  id: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: Date;
}

interface LayoutProps {
  currentPage: Page;
  currentShop: Shop | null;
  shops: Shop[];
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  onSwitchShop: (shop: Shop) => void;
  onCreateShop: () => void;
  onManageShop: (shop: Shop) => void; // Added Prop
  alerts: AlertItem[];
  children: React.ReactNode;
}

const NavItem = ({ 
  page, 
  currentPage, 
  icon: Icon, 
  label, 
  onClick 
}: { 
  page: Page; 
  currentPage: Page; 
  icon: any; 
  label: string; 
  onClick: (p: Page) => void 
}) => {
  const isActive = currentPage === page;
  return (
    <button
      onClick={() => onClick(page)}
      className={`w-full flex items-center space-x-3 px-6 py-3 transition-colors duration-200 ${
        isActive 
          ? 'bg-ernest-gold text-ernest-blue font-bold border-r-4 border-white' 
          : 'text-slate-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
};

export const Layout: React.FC<LayoutProps> = ({ 
  currentPage, 
  currentShop,
  shops,
  onNavigate, 
  onLogout, 
  onSwitchShop,
  onCreateShop,
  onManageShop,
  alerts, 
  children 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showShopMenu, setShowShopMenu] = useState(false);

  const totalCount = alerts.length;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-ernest-blue shadow-xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <div className="p-8 border-b border-white/10 text-center">
            <div className="w-12 h-12 bg-ernest-gold rounded-full mx-auto mb-3 flex items-center justify-center text-ernest-blue font-bold text-2xl shadow-lg border-2 border-white/20">
              E
            </div>
            <h1 className="text-xl font-bold text-white tracking-wider">ERNEST</h1>
            <h2 className="text-xs text-ernest-gold tracking-[0.2em] uppercase">Enterprises</h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 space-y-1">
            <NavItem page={Page.DASHBOARD} currentPage={currentPage} icon={LayoutDashboard} label="Muhtasari" onClick={onNavigate} />
            <NavItem page={Page.INVENTORY} currentPage={currentPage} icon={Package} label="Mali & Stock" onClick={onNavigate} />
            <NavItem page={Page.SALES} currentPage={currentPage} icon={ShoppingCart} label="Mauzo" onClick={onNavigate} />
            <NavItem page={Page.EXPENSES} currentPage={currentPage} icon={CreditCard} label="Matumizi" onClick={onNavigate} />
            <NavItem page={Page.DEBTS} currentPage={currentPage} icon={Users} label="Madeni" onClick={onNavigate} />
            <NavItem page={Page.MEMORY} currentPage={currentPage} icon={FolderHeart} label="Kumbukumbu" onClick={onNavigate} />
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 text-center text-xs text-slate-500">
             &copy; 2024 Ernest Ent.
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-ernest-blue text-white shadow-md border-b border-white/10 z-30">
           <div className="px-6 py-4 flex items-center justify-between">
              {/* Left: Mobile Toggle & Title */}
              <div className="flex items-center">
                 <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden mr-4 text-slate-300 hover:text-white">
                   <Menu />
                 </button>
                 
                 {/* Shop Switcher */}
                 <div className="relative">
                    <button 
                      onClick={() => setShowShopMenu(!showShopMenu)}
                      className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 transition-colors"
                    >
                      <Store className="text-ernest-gold" size={18} />
                      <div className="text-left hidden md:block">
                        <p className="text-[10px] text-slate-400 uppercase leading-none font-bold">Duka Linalotumika</p>
                        <p className="text-sm font-bold text-white leading-tight">{currentShop?.name || 'Chagua Duka'}</p>
                      </div>
                      <ChevronDown size={14} className="text-slate-400 ml-2" />
                    </button>

                    {showShopMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowShopMenu(false)}></div>
                        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 text-slate-900 z-20 overflow-hidden animate-fade-in-up">
                           <div className="p-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                             Badilisha Duka
                           </div>
                           <div className="max-h-64 overflow-y-auto">
                             {shops.map(shop => (
                               <div key={shop.id} className={`flex items-center justify-between border-b border-slate-50 ${currentShop?.id === shop.id ? 'bg-blue-50' : ''}`}>
                                 <button
                                   onClick={() => { onSwitchShop(shop); setShowShopMenu(false); }}
                                   className={`flex-1 text-left px-4 py-3 text-sm font-medium hover:bg-slate-50 flex items-center ${currentShop?.id === shop.id ? 'text-ernest-blue' : 'text-slate-700'}`}
                                 >
                                   <span className="truncate">{shop.name}</span>
                                   {currentShop?.id === shop.id && <div className="ml-2 w-2 h-2 bg-ernest-blue rounded-full"></div>}
                                 </button>
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); onManageShop(shop); setShowShopMenu(false); }}
                                    className="p-3 text-slate-400 hover:text-ernest-blue transition-colors hover:bg-slate-100"
                                    title="Mipangilio ya Duka (Hariri/Futa)"
                                 >
                                    <Settings size={16} />
                                 </button>
                               </div>
                             ))}
                           </div>
                           <button 
                             onClick={() => { onCreateShop(); setShowShopMenu(false); }}
                             className="w-full text-left px-4 py-3 text-sm font-bold text-ernest-blue hover:bg-slate-50 flex items-center border-t border-slate-100"
                           >
                             <PlusCircle size={16} className="mr-2" /> Ongeza Duka Jipya
                           </button>
                        </div>
                      </>
                    )}
                 </div>
              </div>

              {/* Right: Notifications & User */}
              <div className="flex items-center space-x-6">
                 
                 {/* Notification Bell */}
                 <div className="relative">
                   <button 
                     onClick={() => setShowNotifications(!showNotifications)}
                     className="relative p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
                   >
                     <Bell size={22} />
                     {totalCount > 0 && (
                       <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                         {totalCount > 9 ? '9+' : totalCount}
                       </span>
                     )}
                   </button>

                   {/* Notification Dropdown */}
                   {showNotifications && (
                     <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)}></div>
                      <div className="absolute right-0 mt-3 w-80 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 z-40 overflow-hidden animate-fade-in-up origin-top-right">
                         <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                           <span className="font-bold text-sm text-slate-700">Taarifa</span>
                           <span className="text-xs text-slate-400">{totalCount} Mpya</span>
                         </div>
                         <div className="max-h-80 overflow-y-auto">
                            {totalCount === 0 ? (
                              <div className="p-8 text-center text-slate-400">
                                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Hakuna taarifa mpya</p>
                              </div>
                            ) : (
                              alerts.map(alert => (
                                <div key={alert.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start">
                                   <div className={`mt-1 mr-3 flex-shrink-0 w-2 h-2 rounded-full ${alert.type === 'critical' ? 'bg-red-500' : 'bg-ernest-gold'}`}></div>
                                   <div>
                                      <p className="text-sm text-slate-800 font-medium">{alert.message}</p>
                                      <p className="text-xs text-slate-400 mt-1">{alert.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                   </div>
                                </div>
                              ))
                            )}
                         </div>
                         <div className="p-2 bg-slate-50 border-t border-slate-200 text-center">
                           <button onClick={() => setShowNotifications(false)} className="text-xs text-ernest-blue font-bold hover:underline">Funga</button>
                         </div>
                      </div>
                     </>
                   )}
                 </div>

                 {/* User Profile */}
                 <div className="flex items-center space-x-3 border-l border-white/20 pl-6">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-bold text-white">Mtumiaji</p>
                      <p className="text-xs text-ernest-gold">Meneja</p>
                    </div>
                    <div className="relative group cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-ernest-gold text-ernest-blue flex items-center justify-center font-bold border-2 border-white/20 shadow-sm">
                        AD
                      </div>
                      <div className="absolute right-0 mt-2 w-48 bg-white text-slate-900 rounded-lg shadow-xl py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50 transform translate-y-2 group-hover:translate-y-0">
                        <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                          <LogOut size={14} className="mr-2"/> Ondoka (Sign Out)
                        </button>
                      </div>
                    </div>
                 </div>
              </div>
           </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
