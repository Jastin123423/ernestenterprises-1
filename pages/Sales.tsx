
import React, { useState } from 'react';
import { Sale, Product } from '../types';
import { ShoppingCart, Plus, Search, Calendar, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';

interface SalesProps {
  sales: Sale[];
  products: Product[];
  onAddSale: (sale: Sale) => void;
}

export const Sales: React.FC<SalesProps> = ({ sales, products, onAddSale }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  
  // New Sale State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customUnitPrice, setCustomUnitPrice] = useState<number>(0); 
  // Initialize with Local Date String (YYYY-MM-DD) to avoid UTC shifts
  const [saleDate, setSaleDate] = useState(() => {
    const d = new Date();
    // Handles local timezone offset correctly for input type="date"
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Handle Product Selection Change
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value;
    setSelectedProductId(pid);
    const prod = products.find(p => p.id === pid);
    if (prod) {
      // Auto-select the default selling price
      setCustomUnitPrice(prod.sellingPrice);
    } else {
      setCustomUnitPrice(0);
    }
  };

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (quantity > selectedProduct.stock) {
      alert("Kosa: Idadi inazidi stoku iliyopo!");
      return;
    }

    // Construct Date Object
    // We split manually to ensure we construct a date in LOCAL time, not UTC.
    const [y, m, d] = saleDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const now = new Date();

    // If the user selected "Today", attach the current HH:MM:SS for accurate "Day" filtering and sorting
    if (dateObj.toDateString() === now.toDateString()) {
      dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    } else {
      // For past/future dates, set to noon to be safe from timezone edge cases
      dateObj.setHours(12, 0, 0, 0);
    }

    const totalAmount = customUnitPrice * quantity;
    const profit = (customUnitPrice - selectedProduct.costPrice) * quantity;

    const newSale: Sale = {
      id: Date.now().toString(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      sellingPriceSnapshot: customUnitPrice, 
      costPriceSnapshot: selectedProduct.costPrice,
      totalAmount,
      profit,
      date: dateObj.toISOString() // Store as ISO, but built from Local values
    };

    onAddSale(newSale);
    setIsModalOpen(false);
    
    // Reset form but keep date as today
    setSelectedProductId('');
    setQuantity(1);
    setCustomUnitPrice(0);
  };

  const filteredSales = filterDate 
    ? sales.filter(s => s.date.startsWith(filterDate))
    : sales;

  const sortedSales = [...filteredSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate Totals for Display
  const totalRevenue = sortedSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProfit = sortedSales.reduce((sum, s) => sum + s.profit, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-ernest-blue">Rekodi za Mauzo</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-ernest-blue hover:bg-slate-800 text-white font-bold py-2 px-4 rounded shadow transition-colors"
        >
          <ShoppingCart size={18} />
          <span>Weka Mauzo Mpya</span>
        </button>
      </div>

      {/* Stats Cards based on Filter */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-xs text-slate-500 uppercase font-bold">Jumla ya Mauzo</p>
               <h3 className="text-2xl font-bold text-ernest-blue mt-1">TSh {totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="bg-blue-50 p-2 rounded-full text-ernest-blue">
               <DollarSign size={24} />
            </div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-xs text-slate-500 uppercase font-bold">Faida Iliyopatikana</p>
               <h3 className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                 TSh {totalProfit.toLocaleString()}
               </h3>
            </div>
            <div className={`p-2 rounded-full ${totalProfit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
               <TrendingUp size={24} />
            </div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2 text-slate-500 bg-white px-3 py-2 rounded border border-slate-200 shadow-sm">
            <Calendar size={16} />
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-white border-none focus:outline-none text-sm text-slate-700 font-medium"
            />
            {filterDate && <button onClick={() => setFilterDate('')} className="text-xs text-red-500 font-bold ml-2">Futa</button>}
          </div>
          <div className="text-slate-500 text-sm font-medium">
            Inaonesha rekodi {sortedSales.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Tarehe</th>
                <th className="px-6 py-4">Bidhaa</th>
                <th className="px-6 py-4 text-center">Idadi</th>
                <th className="px-6 py-4 text-right">Bei ya Unit</th>
                <th className="px-6 py-4 text-right">Jumla</th>
                <th className="px-6 py-4 text-right">Faida/Hasara</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSales.map(sale => {
                const isLoss = sale.profit < 0;
                return (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {new Date(sale.date).toLocaleDateString('sw-TZ')} <span className="text-xs text-slate-400">{new Date(sale.date).toLocaleTimeString('sw-TZ', {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{sale.productName}</td>
                    <td className="px-6 py-4 text-center text-slate-600">{sale.quantity}</td>
                    <td className="px-6 py-4 text-right text-slate-600">TSh {sale.sellingPriceSnapshot.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-ernest-blue">TSh {sale.totalAmount.toLocaleString()}</td>
                    <td className={`px-6 py-4 text-right font-medium ${isLoss ? 'text-red-500' : 'text-green-600'}`}>
                      {isLoss ? '-' : '+'}TSh {Math.abs(sale.profit).toLocaleString()}
                      {isLoss && <span className="block text-[10px] text-red-400">Imeuzwa chini ya gharama</span>}
                    </td>
                  </tr>
                );
              })}
              {sortedSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Hakuna mauzo yaliyorekodiwa{filterDate ? ' kwa tarehe hii' : ''}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* Add Sale Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-scale-in">
            <h3 className="text-xl font-bold text-ernest-blue mb-4">Weka Mauzo Mpya</h3>
            <form onSubmit={handleAddSale} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chagua Bidhaa</label>
                <select 
                  required 
                  className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none"
                  value={selectedProductId}
                  onChange={handleProductChange}
                >
                  <option value="">-- Chagua --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stock === 0}>
                      {p.name} (Zipo: {p.stock}) - Bei: TSh {p.sellingPrice.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Idadi</label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    max={selectedProduct?.stock}
                    className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none"
                    value={quantity} 
                    onChange={e => setQuantity(Number(e.target.value))} 
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Tarehe</label>
                  <input 
                    required 
                    type="date"
                    className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none"
                    value={saleDate} 
                    onChange={e => setSaleDate(e.target.value)} 
                  />
                </div>
              </div>

              {/* Editable Unit Price Field */}
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Bei ya Kuuzia (Unit) (TSh)</label>
                 <div className="relative">
                   <input 
                      required 
                      type="number" 
                      step="0.01"
                      className="w-full p-2 border border-slate-300 bg-white text-slate-900 font-bold rounded focus:ring-2 focus:ring-ernest-gold outline-none"
                      value={customUnitPrice} 
                      onChange={e => setCustomUnitPrice(Number(e.target.value))} 
                    />
                    {selectedProduct && customUnitPrice !== selectedProduct.sellingPrice && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-600 font-medium flex items-center">
                        <AlertCircle size={12} className="mr-1"/> Bei Imebadilishwa
                      </span>
                    )}
                 </div>
                 <p className="text-xs text-slate-400 mt-1">Unaweza kubadilisha bei kwa mauzo haya tu.</p>
              </div>

              {selectedProduct && (
                 <div className="bg-slate-50 p-3 rounded text-sm space-y-1 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bei ya Kawaida:</span>
                      <span className="font-medium text-slate-500 line-through decoration-slate-400">TSh {selectedProduct.sellingPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                      <span className="text-ernest-blue font-bold">Jumla ya Mauzo:</span>
                      <span className="text-ernest-blue font-bold text-lg">TSh {(customUnitPrice * quantity).toLocaleString()}</span>
                    </div>
                 </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Ghairi</button>
                <button type="submit" className="px-6 py-2 bg-ernest-gold text-ernest-blue font-bold rounded hover:bg-ernest-lightGold shadow-md" disabled={!selectedProductId}>Kamilisha Mauzo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
