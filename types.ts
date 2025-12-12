
export enum Page {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  SALES = 'SALES',
  EXPENSES = 'EXPENSES',
  DEBTS = 'DEBTS',
  MEMORY = 'MEMORY',
}

export interface Shop {
  id: string;
  name: string;
  location: string;
  createdAt: string;
}

export interface Product {
  id: string;
  shopId: string;
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
  shopId: string;
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
  shopId: string;
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
  shopId: string;
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
  shopId: string;
  title: string;
  description: string;
  date: string; // ISO String
  type: 'image' | 'text' | 'file';
  fileType?: string; // MIME type e.g. 'application/pdf'
  fileName?: string; // Original file name
  base64Data?: string; // Legacy local storage support
  imageUrl?: string; // New Firebase URL support (used for all files now)
}

export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  totalStockValue: number;
  lowStockItems: number;
  pendingDebtsAmount: number;
  overdueDebtsCount: number;
}
