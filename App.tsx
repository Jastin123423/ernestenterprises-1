
import React, { useState, useEffect, useMemo } from 'react';
import { Page, Product, Sale, Expense, Debt, MemoryItem, Shop } from './types';
import { storage } from './services/storageService';
import { Layout, AlertItem } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Sales } from './pages/Sales';
import { Expenses } from './pages/Expenses';
import { Debts } from './pages/Debts';
import { Memories } from './pages/Memories';
import { Login } from './pages/Login';
import { Store, Plus, Save, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

const App = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LOGIN);
  
  // Persistent Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('ernest_auth') === 'true';
  });
  
  // Shop State
  const [shops, setShops] = useState<Shop[]>([]);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [isLoadingShops, setIsLoadingShops] = useState(true); 
  
  // Create Modal State
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopLocation, setNewShopLocation] = useState('');

  // Edit Modal State
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [editShopName, setEditShopName] = useState('');
  const [editShopLocation, setEditShopLocation] = useState('');
  const [isDeletingShop, setIsDeletingShop] = useState(false);

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);

  // Initialize Page based on Auth
  useEffect(() => {
    if (isLoggedIn) {
      setCurrentPage(Page.DASHBOARD);
    }
  }, [isLoggedIn]);

  // --- PERSIST ACTIVE SHOP ---
  // Save the current shop ID to localStorage whenever it changes
  useEffect(() => {
    if (currentShop) {
      localStorage.setItem('ernest_active_shop_id', currentShop.id);
    }
  }, [currentShop]);

  // --- SHOP SYNC ---
  useEffect(() => {
    if(!isLoggedIn) {
      setIsLoadingShops(false);
      return;
    }

    setIsLoadingShops(true);
    const unsubShops = storage.subscribeToShops((fetchedShops) => {
      setShops(fetchedShops);
      setIsLoadingShops(false);
      
      if (fetchedShops.length > 0) {
        setCurrentShop(prev => {
           // 1. If we already have a shop selected in state, ensure it still exists in the DB list
           if (prev) {
              const stillExists = fetchedShops.find(s => s.id === prev.id);
              if (stillExists) return prev;
           }

           // 2. If no valid active shop (e.g. fresh reload), check LocalStorage for last used shop
           const savedShopId = localStorage.getItem('ernest_active_shop_id');
           if (savedShopId) {
             const savedShop = fetchedShops.find(s => s.id === savedShopId);
             if (savedShop) return savedShop;
           }

           // 3. Fallback: Default to first available shop
           return fetchedShops[0];
        });
      } else {
        setCurrentShop(null);
      }
    });

    return () => unsubShops();
  }, [isLoggedIn]);

  // --- DATA SYNC (Dependent on Current Shop) ---
  useEffect(() => {
    if (!isLoggedIn || !currentShop) {
      // Clear data if no shop selected
      setProducts([]);
      setSales([]);
      setExpenses([]);
      setDebts([]);
      setMemories([]);
      return;
    }

    // Set up listeners for Firestore collections filtered by Shop ID
    const unsubProducts = storage.subscribeToProducts(currentShop.id, setProducts);
    const unsubSales = storage.subscribeToSales(currentShop.id, setSales);
    const unsubExpenses = storage.subscribeToExpenses(currentShop.id, setExpenses);
    const unsubDebts = storage.subscribeToDebts(currentShop.id, setDebts);
    const unsubMemories = storage.subscribeToMemories(currentShop.id, setMemories);

    // Cleanup listeners on unmount or shop switch
    return () => {
      unsubProducts();
      unsubSales();
      unsubExpenses();
      unsubDebts();
      unsubMemories();
    };
  }, [isLoggedIn, currentShop]);

  const handleLogin = () => {
    localStorage.setItem('ernest_auth', 'true');
    setIsLoggedIn(true);
    setCurrentPage(Page.DASHBOARD);
  };

  const handleLogout = () => {
    localStorage.removeItem('ernest_auth');
    setIsLoggedIn(false);
    setCurrentPage(Page.LOGIN);
    setCurrentShop(null);
  };

  // --- Shop Handlers ---

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newShopName) return;

    const newShop: Shop = {
      id: Date.now().toString(),
      name: newShopName,
      location: newShopLocation,
      createdAt: new Date().toISOString()
    };

    try {
      await storage.createShop(newShop);
      setCurrentShop(newShop);
      setIsShopModalOpen(false);
      setNewShopName('');
      setNewShopLocation('');
    } catch (e) {
      alert("Imeshindikana kutengeneza duka.");
    }
  };

  const openEditShop = (shop: Shop) => {
    setEditingShop(shop);
    setEditShopName(shop.name);
    setEditShopLocation(shop.location);
    setIsDeletingShop(false);
  };

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop || !editShopName) return;

    try {
      await storage.updateShop({
        ...editingShop,
        name: editShopName,
        location: editShopLocation
      });
      
      if (currentShop && currentShop.id === editingShop.id) {
        setCurrentShop({
           ...currentShop,
           name: editShopName,
           location: editShopLocation
        });
      }

      setEditingShop(null);
    } catch (error) {
      alert("Imeshindikana kusasisha duka.");
    }
  };

  const handleDeleteShop = async () => {
    if (!editingShop) return;
    
    setIsDeletingShop(true);
    try {
      await storage.deleteShop(editingShop.id);
      setEditingShop(null);
    } catch (error) {
      alert("Hitilafu imetokea wakati wa kufuta duka. Jaribu tena.");
      setIsDeletingShop(false);
    }
  };

  // --- Alert Logic ---
  const alerts = useMemo<AlertItem[]>(() => {
    const list: AlertItem[] = [];

    // Low Stock Alerts
    products.forEach(p => {
      if (p.stock <= p.minStockAlert) {
        list.push({
          id: `stock-${p.id}`,
          type: p.stock === 0 ? 'critical' : 'warning',
          message: `Stoku Ndogo: ${p.name} imebaki ${p.stock} tu.`,
          timestamp: new Date() 
        });
      }
    });

    // Overdue Debt Alerts
    debts.forEach(d => {
      if (!d.isPaid && new Date(d.dueDate) < new Date()) {
        list.push({
          id: `debt-${d.id}`,
          type: 'warning',
          message: `Madeni: ${d.debtorName} anadaiwa TSh ${d.amountOwed.toLocaleString()}.`,
          timestamp: new Date(d.dueDate)
        });
      }
    });

    return list;
  }, [products, debts]);

  // --- Async Handlers (Inject Shop ID) ---

  const handleSaveProduct = async (p: Product) => {
    if (!currentShop) return;
    try {
      await storage.saveProduct({ ...p, shopId: currentShop.id });
    } catch (e) {
      alert("Imeshindikana kuhifadhi bidhaa. Jaribu tena.");
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Je, una uhakika unataka kufuta bidhaa hii?")) {
      try {
        await storage.deleteProduct(id);
      } catch (e) {
        alert("Imeshindikana kufuta bidhaa.");
      }
    }
  };

  const handleAddSale = async (s: Sale) => {
    if (!currentShop) return;
    try {
      await storage.addSale({ ...s, shopId: currentShop.id });
    } catch (e) {
      // Error handled in service
    }
  };

  const handleAddExpense = async (e: Expense) => {
    if (!currentShop) return;
    try {
      await storage.addExpense({ ...e, shopId: currentShop.id });
    } catch (err) {
      alert("Kosa katika kuhifadhi matumizi.");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm("Je, una uhakika unataka kufuta matumizi haya?")) {
      await storage.deleteExpense(id);
    }
  };

  const handleAddDebt = async (d: Debt) => {
    if (!currentShop) return;
    try {
      await storage.addDebt({ ...d, shopId: currentShop.id });
    } catch (e) {
      alert("Kosa katika kuhifadhi deni.");
    }
  };

  const handlePayDebt = async (id: string, amount: number) => {
    try {
      await storage.payDebt(id, amount);
    } catch (e) {
      alert("Malipo yameshindikana.");
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (window.confirm("Je, una uhakika unataka kufuta deni hili?")) {
      await storage.deleteDebt(id);
    }
  };

  const handleAddMemory = async (m: MemoryItem, file?: File) => {
    if (!currentShop) return;
    try {
      await storage.addMemory({ ...m, shopId: currentShop.id }, file);
    } catch (e) {
      alert("Imeshindikana kupakia faili. Angalia mtandao wako.");
      console.error(e);
    }
  };

  const handleDeleteMemory = async (id: string, imageUrl?: string) => {
    if(window.confirm("Je, una uhakika unataka kufuta kumbukumbu hii?")) {
      await storage.deleteMemory(id, imageUrl);
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // We have intentionally REMOVED the auto-create shop modal logic here 
  // to allow users to use the top menu to create a shop if they wish,
  // instead of being forced upon login.

  return (
    <Layout 
      currentPage={currentPage} 
      currentShop={currentShop}
      shops={shops}
      onNavigate={setCurrentPage} 
      onLogout={handleLogout} 
      onSwitchShop={setCurrentShop}
      onCreateShop={() => setIsShopModalOpen(true)}
      onManageShop={openEditShop}
      alerts={alerts}
    >
      {/* Shop Content - Only Render if a Shop is Selected */}
      {currentShop ? (
        <>
          {currentPage === Page.DASHBOARD && (
            <Dashboard sales={sales} expenses={expenses} products={products} debts={debts} />
          )}
          {currentPage === Page.INVENTORY && (
            <Inventory 
              products={products} 
              sales={sales} 
              onAdd={handleSaveProduct} 
              onEdit={handleSaveProduct}
              onDelete={handleDeleteProduct} 
            />
          )}
          {currentPage === Page.SALES && (
            <Sales sales={sales} products={products} onAddSale={handleAddSale} />
          )}
          {currentPage === Page.EXPENSES && (
            <Expenses expenses={expenses} onAddExpense={handleAddExpense} onDelete={handleDeleteExpense} />
          )}
          {currentPage === Page.DEBTS && (
            <Debts 
              debts={debts} 
              products={products} 
              onAddDebt={handleAddDebt} 
              onPayDebt={handlePayDebt} 
              onDelete={handleDeleteDebt}
            />
          )}
          {currentPage === Page.MEMORY && (
            <Memories memories={memories} onAdd={handleAddMemory} onDelete={handleDeleteMemory} />
          )}
        </>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
           {isLoadingShops ? (
             <div className="flex flex-col items-center animate-pulse">
                <Store size={64} className="mb-4 opacity-30" />
                <p>Inatafuta Maduka...</p>
             </div>
           ) : (
             <>
               <Store size={64} className="mb-4 opacity-50" />
               <p>Tafadhali chagua au tengeneza duka kuanza.</p>
             </>
           )}
        </div>
      )}

      {/* Create Shop Modal */}
      {isShopModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
             <div className="text-center mb-6">
                <div className="w-16 h-16 bg-ernest-gold rounded-full mx-auto mb-4 flex items-center justify-center text-ernest-blue">
                   <Store size={32} />
                </div>
                <h2 className="text-2xl font-bold text-ernest-blue">
                  {shops.length === 0 ? "Karibu Ernest Enterprises" : "Ongeza Duka Jipya"}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {shops.length === 0 ? "Anza kwa kufungua duka lako la kwanza." : "Ingiza taarifa za duka jipya."}
                </p>
             </div>

             <form onSubmit={handleCreateShop} className="space-y-4">
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">Jina la Duka</label>
                   <input 
                      required
                      autoFocus
                      type="text" 
                      placeholder="Mfano: Duka la Kariakoo"
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ernest-gold outline-none"
                      value={newShopName}
                      onChange={e => setNewShopName(e.target.value)}
                   />
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">Eneo (Location)</label>
                   <input 
                      type="text" 
                      placeholder="Mfano: Mtaa wa Kongo"
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ernest-gold outline-none"
                      value={newShopLocation}
                      onChange={e => setNewShopLocation(e.target.value)}
                   />
                </div>

                <button type="submit" className="w-full bg-ernest-blue text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center mt-6">
                   <Plus size={20} className="mr-2" /> Tengeneza Duka
                </button>
                
                {shops.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setIsShopModalOpen(false)}
                    className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
                  >
                    Ghairi
                  </button>
                )}
             </form>
          </div>
        </div>
      )}

      {/* Edit Shop Modal */}
      {editingShop && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
              <h3 className="text-xl font-bold text-ernest-blue mb-4 flex items-center">
                 <Store className="mr-2" size={24} /> Mipangilio ya Duka
              </h3>
              
              <form onSubmit={handleUpdateShop} className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Jina la Duka</label>
                    <input 
                       required
                       type="text" 
                       className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ernest-gold outline-none"
                       value={editShopName}
                       onChange={e => setEditShopName(e.target.value)}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Eneo (Location)</label>
                    <input 
                       type="text" 
                       className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ernest-gold outline-none"
                       value={editShopLocation}
                       onChange={e => setEditShopLocation(e.target.value)}
                    />
                 </div>

                 <div className="flex justify-end space-x-3 pt-2">
                    <button 
                       type="button" 
                       onClick={() => setEditingShop(null)}
                       className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                    >
                       Ghairi
                    </button>
                    <button 
                       type="submit"
                       className="px-4 py-2 bg-ernest-blue text-white rounded-lg hover:bg-slate-800 font-bold flex items-center"
                    >
                       <Save size={16} className="mr-2" /> Hifadhi
                    </button>
                 </div>
              </form>

              {/* Danger Zone */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                 <h4 className="text-xs font-bold text-red-600 uppercase mb-2 flex items-center">
                    <AlertTriangle size={14} className="mr-1" /> Eneo la Hatari (Danger Zone)
                 </h4>
                 <p className="text-xs text-slate-500 mb-3">
                    Kufuta duka hili kutaondoa data zote zikiwemo bidhaa, mauzo, madeni na matumizi. Kitendo hiki hakiwezi kurudishwa.
                 </p>
                 
                 {isDeletingShop ? (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center animate-pulse">
                       <p className="text-red-800 font-bold text-sm mb-3">
                          Je, una uhakika kabisa? Data zote zitapotea!
                       </p>
                       <div className="flex justify-center space-x-3">
                          <button 
                             onClick={() => setIsDeletingShop(false)}
                             className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 text-sm font-medium"
                          >
                             Sitaki Kufuta
                          </button>
                          <button 
                             onClick={handleDeleteShop}
                             className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-bold flex items-center"
                          >
                             <Trash2 size={14} className="mr-1" /> Ndio, Futa Kabisa
                          </button>
                       </div>
                    </div>
                 ) : (
                    <button 
                       onClick={() => setIsDeletingShop(true)}
                       className="w-full py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors font-bold text-sm flex items-center justify-center"
                    >
                       <Trash2 size={16} className="mr-2" /> Futa Duka Hili
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}

    </Layout>
  );
};

export default App;
