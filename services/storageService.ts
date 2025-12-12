
import { Product, Sale, Expense, Debt, MemoryItem, PaymentRecord, Shop } from '../types';
import { db, storageBucket } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  getDoc,
  runTransaction,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Collection References
const shopsCol = collection(db, 'shops');
const productsCol = collection(db, 'products');
const salesCol = collection(db, 'sales');
const expensesCol = collection(db, 'expenses');
const debtsCol = collection(db, 'debts');
const memoriesCol = collection(db, 'memories');

class StorageService {
  
  // --- SHOPS MANAGEMENT ---

  subscribeToShops(callback: (shops: Shop[]) => void) {
    const q = query(shopsCol, orderBy('createdAt'));
    return onSnapshot(q, (snapshot) => {
      const shops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shop));
      callback(shops);
    });
  }

  async createShop(shop: Shop): Promise<void> {
    await setDoc(doc(shopsCol, shop.id), shop);
  }

  async updateShop(shop: Shop): Promise<void> {
    const shopRef = doc(shopsCol, shop.id);
    await updateDoc(shopRef, {
      name: shop.name,
      location: shop.location
    });
  }

  async deleteShop(shopId: string): Promise<void> {
    // 1. Delete all related data in other collections
    // We must query each collection for data belonging to this shop
    const collectionsToCheck = ['products', 'sales', 'expenses', 'debts', 'memories'];
    
    for (const colName of collectionsToCheck) {
      const q = query(collection(db, colName), where('shopId', '==', shopId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) continue;

      // Firestore batch limit is 500. We process in chunks of 400 to be safe.
      const chunk = 400;
      for (let i = 0; i < snapshot.docs.length; i += chunk) {
        const batch = writeBatch(db);
        snapshot.docs.slice(i, i + chunk).forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    }

    // 2. Delete the shop document itself
    await deleteDoc(doc(shopsCol, shopId));
  }

  // --- REAL-TIME SUBSCRIPTIONS (SCOPED BY SHOP ID) ---
  
  subscribeToProducts(shopId: string, callback: (products: Product[]) => void) {
    const q = query(productsCol, where('shopId', '==', shopId)); 
    // Note: To order by name with a where clause, Firestore requires an index. 
    // We will sort client-side to avoid index complexity for the user.
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      products.sort((a, b) => a.name.localeCompare(b.name));
      callback(products);
    });
  }

  subscribeToSales(shopId: string, callback: (sales: Sale[]) => void) {
    const q = query(salesCol, where('shopId', '==', shopId));
    return onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(sales);
    });
  }

  subscribeToExpenses(shopId: string, callback: (expenses: Expense[]) => void) {
    const q = query(expensesCol, where('shopId', '==', shopId));
    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(expenses);
    });
  }

  subscribeToDebts(shopId: string, callback: (debts: Debt[]) => void) {
    const q = query(debtsCol, where('shopId', '==', shopId));
    return onSnapshot(q, (snapshot) => {
      const debts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt));
      debts.sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
      callback(debts);
    });
  }

  subscribeToMemories(shopId: string, callback: (memories: MemoryItem[]) => void) {
    const q = query(memoriesCol, where('shopId', '==', shopId));
    return onSnapshot(q, (snapshot) => {
      const memories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MemoryItem));
      memories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(memories);
    });
  }

  // --- PRODUCTS ---

  async saveProduct(product: Product): Promise<void> {
    const docRef = doc(productsCol, product.id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const existing = docSnap.data() as Product;
      // Update restock date if stock increased
      if (product.stock > existing.stock) {
        product.lastRestockDate = new Date().toISOString();
      } else {
        product.lastRestockDate = existing.lastRestockDate;
      }
    } else {
      product.lastRestockDate = new Date().toISOString();
    }

    await setDoc(docRef, product);
  }

  async deleteProduct(id: string): Promise<void> {
    await deleteDoc(doc(productsCol, id));
  }

  // --- SALES ---

  async addSale(sale: Sale): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(productsCol, sale.productId);
        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists()) {
          throw new Error("Bidhaa haipo!");
        }

        const product = productSnap.data() as Product;
        const newStock = product.stock - sale.quantity;

        if (newStock < 0) {
          throw new Error("Stoku haitoshi!");
        }

        // 1. Update Product Stock
        transaction.update(productRef, { stock: newStock });

        // 2. Add Sale Record
        const saleRef = doc(salesCol, sale.id);
        transaction.set(saleRef, sale);
      });
    } catch (e) {
      console.error("Transaction failed: ", e);
      alert("Imeshindikana kuuza: " + e);
      throw e;
    }
  }

  // --- EXPENSES ---

  async addExpense(expense: Expense): Promise<void> {
    await setDoc(doc(expensesCol, expense.id), expense);
  }

  async deleteExpense(id: string): Promise<void> {
    await deleteDoc(doc(expensesCol, id));
  }

  // --- DEBTS ---

  async addDebt(debt: Debt): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        if (debt.productId && debt.productId !== 'custom') {
           const productRef = doc(productsCol, debt.productId);
           const productSnap = await transaction.get(productRef);
           
           if (productSnap.exists()) {
             const product = productSnap.data() as Product;
             const newStock = product.stock - debt.quantity;
             transaction.update(productRef, { stock: newStock });
           }
        }
        
        debt.payments = [];
        debt.totalAmount = debt.amountOwed;

        const debtRef = doc(debtsCol, debt.id);
        transaction.set(debtRef, debt);
      });
    } catch (e) {
      console.error("Failed to add debt: ", e);
      throw e;
    }
  }

  async payDebt(debtId: string, amount: number): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const debtRef = doc(debtsCol, debtId);
        const debtSnap = await transaction.get(debtRef);
        
        if (!debtSnap.exists()) throw new Error("Deni halipo");
        
        const debt = debtSnap.data() as Debt;
        
        // 1. Record Payment
        const payment: PaymentRecord = {
          id: Date.now().toString(),
          amount: amount,
          date: new Date().toISOString()
        };
        
        const newAmountOwed = debt.amountOwed - amount;
        const updatedPayments = [...(debt.payments || []), payment];
        
        // 2. Create Sale (Revenue)
        const saleId = `pay-${Date.now()}`;
        const newSale: Sale = {
          id: saleId,
          shopId: debt.shopId, // IMPORTANT: Inherit Shop ID from Debt
          productId: debt.productId === 'custom' ? 'debt-payment' : debt.productId,
          productName: `Malipo ya Deni: ${debt.debtorName} (${debt.productName})`,
          quantity: 0, 
          sellingPriceSnapshot: amount,
          costPriceSnapshot: 0,
          totalAmount: amount,
          profit: amount,
          date: new Date().toISOString()
        };
        
        const saleRef = doc(salesCol, saleId);
        transaction.set(saleRef, newSale);

        // 3. Update Debt
        if (newAmountOwed <= 0) {
           transaction.update(debtRef, { 
             amountOwed: 0, 
             payments: updatedPayments, 
             isPaid: true 
           });
        } else {
           transaction.update(debtRef, { 
             amountOwed: newAmountOwed, 
             payments: updatedPayments 
           });
        }
      });
    } catch (e) {
      console.error("Pay debt error", e);
      throw e;
    }
  }

  async deleteDebt(id: string): Promise<void> {
    await deleteDoc(doc(debtsCol, id));
  }

  // --- MEMORIES & STORAGE ---

  async uploadFile(file: File): Promise<string> {
     // Ensure safe filename
     const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
     const storageRef = ref(storageBucket, `memories/${Date.now()}_${safeName}`);
     
     // Set metadata to help browser handle the file correctly
     const metadata = {
       contentType: file.type
     };

     // Use uploadBytes (simple) instead of resumable for speed on small files
     // This reduces the number of network roundtrips.
     const snapshot = await uploadBytes(storageRef, file, metadata);
     return await getDownloadURL(snapshot.ref);
  }

  async addMemory(memory: MemoryItem, file?: File): Promise<void> {
    if (file) {
      try {
        const url = await this.uploadFile(file);
        memory.imageUrl = url;
        memory.fileType = file.type;
        memory.fileName = file.name;
        
        if (file.type.startsWith('image/')) {
          memory.type = 'image';
        } else {
          memory.type = 'file';
        }
      } catch (error) {
        console.error("Error uploading file for memory:", error);
        throw new Error("Failed to upload file");
      }
    } else {
       memory.type = 'text';
    }
    
    delete memory.base64Data; 
    
    await setDoc(doc(memoriesCol, memory.id), memory);
  }

  async deleteMemory(id: string, imageUrl?: string): Promise<void> {
    await deleteDoc(doc(memoriesCol, id));
    if (imageUrl) {
      try {
        const fileRef = ref(storageBucket, imageUrl);
        await deleteObject(fileRef);
      } catch (e) {
        console.warn("Could not delete file from storage:", e);
      }
    }
  }
}

export const storage = new StorageService();
