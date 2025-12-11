
import { Product, Sale, Expense, Debt, MemoryItem, PaymentRecord } from '../types';

// Initial Mock Data - CLEAN SLATE
const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_EXPENSES: Expense[] = [];

const STORAGE_KEYS = {
  PRODUCTS: 'ernest_products',
  SALES: 'ernest_sales',
  EXPENSES: 'ernest_expenses',
  DEBTS: 'ernest_debts',
  MEMORIES: 'ernest_memories',
};

class StorageService {
  private get<T>(key: string, initial: T): T {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initial;
  }

  private set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Storage Quota Exceeded", e);
      alert("Nafasi imejaa! Tafadhali futa picha au kumbukumbu za zamani.");
      throw e;
    }
  }

  // --- Products ---
  getProducts(): Product[] {
    return this.get<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  saveProduct(product: Product): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    
    if (index >= 0) {
      const existingProduct = products[index];
      // Logic: If stock has increased, update the lastRestockDate
      if (product.stock > existingProduct.stock) {
        product.lastRestockDate = new Date().toISOString();
      } else {
        // Preserve old date if stock didn't increase
        product.lastRestockDate = existingProduct.lastRestockDate;
      }
      products[index] = product;
    } else {
      // New product gets current date
      product.lastRestockDate = new Date().toISOString();
      products.push(product);
    }
    this.set(STORAGE_KEYS.PRODUCTS, products);
  }

  deleteProduct(id: string): void {
    const products = this.getProducts().filter(p => p.id !== id);
    this.set(STORAGE_KEYS.PRODUCTS, products);
  }

  // --- Sales ---
  getSales(): Sale[] {
    return this.get<Sale[]>(STORAGE_KEYS.SALES, []);
  }

  addSale(sale: Sale): void {
    const sales = this.getSales();
    sales.push(sale);
    this.set(STORAGE_KEYS.SALES, sales);

    // Update Stock
    const products = this.getProducts();
    const product = products.find(p => p.id === sale.productId);
    if (product) {
      product.stock -= sale.quantity;
      // Note: We do NOT update lastRestockDate when selling
      this.saveProduct({ ...product, lastRestockDate: product.lastRestockDate }); 
    }
  }

  // --- Expenses ---
  getExpenses(): Expense[] {
    return this.get<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  }

  addExpense(expense: Expense): void {
    const expenses = this.getExpenses();
    expenses.push(expense);
    this.set(STORAGE_KEYS.EXPENSES, expenses);
  }

  deleteExpense(id: string): void {
    const expenses = this.getExpenses().filter(e => e.id !== id);
    this.set(STORAGE_KEYS.EXPENSES, expenses);
  }

  // --- Debts ---
  getDebts(): Debt[] {
    const debts = this.get<Debt[]>(STORAGE_KEYS.DEBTS, []);
    // Migration: ensure new fields exist for old data
    return debts.map(d => ({
      ...d,
      totalAmount: d.totalAmount || d.amountOwed,
      payments: d.payments || []
    }));
  }

  addDebt(debt: Debt): void {
    const debts = this.getDebts();
    // Initialize payments and total logic
    debt.payments = [];
    debt.totalAmount = debt.amountOwed;
    
    debts.push(debt);
    this.set(STORAGE_KEYS.DEBTS, debts);

    // Decrease stock immediately when lent ONLY IF it is a tracked product
    const products = this.getProducts();
    const product = products.find(p => p.id === debt.productId);
    if (product) {
      product.stock -= debt.quantity;
      this.saveProduct({ ...product, lastRestockDate: product.lastRestockDate });
    }
  }

  payDebt(debtId: string, amount: number): void {
    const debts = this.getDebts();
    const debtIndex = debts.findIndex(d => d.id === debtId);
    
    if (debtIndex === -1) return;
    
    const debt = debts[debtIndex];
    
    // 1. Record Payment in Debt History
    const payment: PaymentRecord = {
      id: Date.now().toString(),
      amount: amount,
      date: new Date().toISOString()
    };
    
    debt.payments.push(payment);
    debt.amountOwed -= amount;
    
    // Safety check for negative
    if (debt.amountOwed < 0) debt.amountOwed = 0;

    // 2. Create a SALE record (Cash In) for this payment
    // We treat debt payment as revenue coming in now.
    
    const newSale: Sale = {
      id: `pay-${Date.now()}`,
      productId: debt.productId === 'custom' ? 'debt-payment' : debt.productId,
      productName: `Malipo ya Deni: ${debt.debtorName} (${debt.productName})`,
      quantity: 0, // No stock change now
      sellingPriceSnapshot: amount,
      costPriceSnapshot: 0, // Cost was handled when item left stock (inventory asset drop)
      totalAmount: amount,
      profit: amount, // Cash recovery
      date: new Date().toISOString()
    };
    
    this.addSale(newSale); // This saves the sale

    // 3. Update or Delete Debt
    if (debt.amountOwed <= 0) {
      // Fully paid - delete logic requested
      debt.isPaid = true;
      // We can remove it from list or keep it marked as paid. 
      // User said "deleted automatically". Let's remove it from the active debts list.
      const updatedDebts = debts.filter(d => d.id !== debtId);
      this.set(STORAGE_KEYS.DEBTS, updatedDebts);
    } else {
      // Still owing, update record
      debts[debtIndex] = debt;
      this.set(STORAGE_KEYS.DEBTS, debts);
    }
  }

  deleteDebt(id: string): void {
    const debts = this.getDebts().filter(d => d.id !== id);
    this.set(STORAGE_KEYS.DEBTS, debts);
  }

  // --- Memories ---
  getMemories(): MemoryItem[] {
    return this.get<MemoryItem[]>(STORAGE_KEYS.MEMORIES, []);
  }

  addMemory(memory: MemoryItem): void {
    const memories = this.getMemories();
    memories.push(memory);
    this.set(STORAGE_KEYS.MEMORIES, memories);
  }

  updateMemory(memory: MemoryItem): void {
    const memories = this.getMemories();
    const index = memories.findIndex(m => m.id === memory.id);
    if (index >= 0) {
      memories[index] = memory;
      this.set(STORAGE_KEYS.MEMORIES, memories);
    }
  }

  deleteMemory(id: string): void {
    const memories = this.getMemories().filter(m => m.id !== id);
    this.set(STORAGE_KEYS.MEMORIES, memories);
  }
}

export const storage = new StorageService();
