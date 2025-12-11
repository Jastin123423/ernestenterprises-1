
export enum Page {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  SALES = 'SALES',
  EXPENSES = 'EXPENSES',
  DEBTS = 'DEBTS',
  MEMORY = 'MEMORY',
}

export interface Product {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStockAlert: number;
  lastRestockDate?: string; // ISO Date String
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  sellingPriceSnapshot: number; // Price at moment of sale
  costPriceSnapshot: number;    // Cost at moment of sale
  totalAmount: number;
  profit: number;
  date: string; // ISO String
}

export interface Expense {
  id: string;
  type: string;
  description: string;
  amount: number;
  date: string; // ISO String
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
}

export interface Debt {
  id: string;
  debtorName: string;
  productId: string;
  productName: string;
  totalAmount: number; // Original Debt Amount
  amountOwed: number; // Remaining Balance
  borrowDate: string; // ISO String
  dueDate: string; // ISO String
  isPaid: boolean;
  quantity: number;
  payments: PaymentRecord[];
}

export interface MemoryItem {
  id: string;
  title: string;
  description: string;
  date: string; // ISO String
  type: 'image' | 'text';
  base64Data?: string; // For images
}

export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  totalStockValue: number;
  lowStockItems: number;
  pendingDebtsAmount: number;
  overdueDebtsCount: number;
}
