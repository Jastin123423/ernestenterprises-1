
import React, { useState, useEffect, useMemo } from 'react';
import { Page, Product, Sale, Expense, Debt, MemoryItem } from './types';
import { storage } from './services/storageService';
import { Layout, AlertItem } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Sales } from './pages/Sales';
import { Expenses } from './pages/Expenses';
import { Debts } from './pages/Debts';
import { Memories } from './pages/Memories';
import { Login } from './pages/Login';

const App = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LOGIN);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);

  // Initialize Data
  const refreshData = () => {
    setProducts(storage.getProducts());
    setSales(storage.getSales());
    setExpenses(storage.getExpenses());
    setDebts(storage.getDebts());
    setMemories(storage.getMemories());
  };

  useEffect(() => {
    refreshData();
  }, [isLoggedIn]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage(Page.DASHBOARD);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage(Page.LOGIN);
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
          message: `Madeni: ${d.debtorName} anadaiwa $${d.amountOwed}.`,
          timestamp: new Date(d.dueDate)
        });
      }
    });

    return list;
  }, [products, debts]);

  // --- Handlers ---

  const handleSaveProduct = (p: Product) => {
    // storage.saveProduct handles both Add (new ID) and Update (existing ID)
    storage.saveProduct(p);
    refreshData();
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm("Je, una uhakika unataka kufuta bidhaa hii?")) {
      storage.deleteProduct(id);
      refreshData();
    }
  };

  const handleAddSale = (s: Sale) => {
    storage.addSale(s);
    refreshData();
  };

  const handleAddExpense = (e: Expense) => {
    storage.addExpense(e);
    refreshData();
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm("Je, una uhakika unataka kufuta matumizi haya?")) {
      storage.deleteExpense(id);
      refreshData();
    }
  };

  const handleAddDebt = (d: Debt) => {
    storage.addDebt(d);
    refreshData();
  };

  const handlePayDebt = (id: string, amount: number) => {
    // Direct call, storage handles logic
    storage.payDebt(id, amount);
    refreshData();
  };

  const handleDeleteDebt = (id: string) => {
    if (window.confirm("Je, una uhakika unataka kufuta deni hili?")) {
      storage.deleteDebt(id);
      refreshData();
    }
  };

  const handleAddMemory = (m: MemoryItem) => {
    try {
      if (memories.some(existing => existing.id === m.id)) {
        storage.updateMemory(m);
      } else {
        storage.addMemory(m);
      }
      refreshData();
    } catch (e) {
      // Error alert handled in service
    }
  };

  const handleDeleteMemory = (id: string) => {
    if(window.confirm("Je, una uhakika unataka kufuta kumbukumbu hii?")) {
      storage.deleteMemory(id);
      refreshData();
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} alerts={alerts}>
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
    </Layout>
  );
};

export default App;
