
import React, { useState } from 'react';
import { Debt, Product } from '../types';
import { Users, AlertCircle, Package, Type, Trash2, History, CreditCard, ChevronDown, ChevronUp, Filter } from 'lucide-react';

interface DebtsProps {
  debts: Debt[];
  products: Product[];
  onAddDebt: (d: Debt) => void;
  onPayDebt: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
}

export const Debts: React.FC<DebtsProps> = ({ debts, products, onAddDebt, onPayDebt, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  
  // Create Debt Form State
  const [debtType, setDebtType] = useState<'stock' | 'custom'>('stock');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [amountOwed, setAmountOwed] = useState<number>(0);
  const [debtorName, setDebtorName] = useState('');
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');

  // Payment Modal State
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Toggle Row Expansion
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // --- Handlers ---

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value;
    setSelectedProductId(pid);
    const prod = products.find(p => p.id === pid);
    if (prod) {
      setAmountOwed(prod.sellingPrice * quantity);
    } else {
      setAmountOwed(0);
    }
  };

  const handleQuantityChange = (qty: number) => {
    setQuantity(qty);
    if (debtType === 'stock') {
      const prod = products.find(p => p.id === selectedProductId);
      if (prod) {
        setAmountOwed(prod.sellingPrice * qty);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let prodId = 'custom';
    let prodName = customProductName;

    if (debtType === 'stock') {
       const prod = products.find(p => p.id === selectedProductId);
       if (!prod && !customProductName) return;
       if (prod) {
           prodId = prod.id;
           prodName = prod.name;
       }
    }

    onAddDebt({
      id: Date.now().toString(),
      debtorName,
      productId: prodId,
      productName: prodName || 'Deni',
      quantity,
      totalAmount: Number(amountOwed),
      amountOwed: Number(amountOwed),
      borrowDate: new Date(borrowDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      isPaid: false,
      payments: []
    });

    setIsModalOpen(false);
    resetForm();
  };

  const openPayModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.amountOwed); // Default to full remaining amount
    setIsPayModalOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDebt && paymentAmount > 0) {
      if (paymentAmount > selectedDebt.amountOwed) {
        alert("Kiasi unacholipa ni kikubwa kuliko deni!");
        return;
      }
      onPayDebt(selectedDebt.id, Number(paymentAmount));
      setIsPayModalOpen(false);
      setSelectedDebt(null);
      setPaymentAmount(0);
    }
  };

  const resetForm = () => {
    setDebtType('stock');
    setSelectedProductId('');
    setCustomProductName('');
    setQuantity(1);
    setAmountOwed(0);
    setDebtorName('');
    setBorrowDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
  };

  // Filter logic
  const filteredDebts = filterDate
    ? debts.filter(d => d.borrowDate.startsWith(filterDate))
    : debts;

  // Total Calculation
  const totalDebtAmount = filteredDebts.reduce((sum, d) => sum + d.amountOwed, 0);

  return (
    <div className="space-y-6 pb-20"> {/* pb-20 for footer */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-ernest-blue">Madeni na Mikopo</h2>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center space-x-2 bg-ernest-gold text-ernest-blue font-bold py-2 px-4 rounded shadow hover:bg-ernest-lightGold transition-colors"
        >
          <Users size={18} />
          <span>Kopesha Bidhaa/Pesa</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
         {/* Filter Bar */}
         <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
           <div className="flex items-center space-x-2 text-slate-500 bg-white px-3 py-2 rounded border border-slate-200 shadow-sm">
              <Filter size={16} />
              <span className="text-xs font-bold mr-2">Chuja kwa Tarehe ya Kukopa:</span>
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-white border-none focus:outline-none text-sm text-slate-700 font-medium"
              />
              {filterDate && <button onClick={() => setFilterDate('')} className="text-xs text-red-500 font-bold ml-2">Onyesha Yote</button>}
           </div>
           
           <div className="flex items-center text-sm text-slate-500">
              <AlertCircle size={16} className="text-slate-400 mr-2" />
              <span>Madeni {filteredDebts.length}</span>
           </div>
         </div>

         <div className="overflow-x-auto">
           <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Mdeni</th>
                <th className="px-6 py-4">Bidhaa</th>
                <th className="px-6 py-4 text-right">Jumla ya Deni</th>
                <th className="px-6 py-4 text-right">Amelipa</th>
                <th className="px-6 py-4 text-right text-red-600">Baki (Anadaiwa)</th>
                <th className="px-6 py-4 text-center">Hatua</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDebts.map(debt => {
                 const isOverdue = !debt.isPaid && new Date(debt.dueDate) < new Date();
                 const paidAmount = debt.totalAmount - debt.amountOwed;
                 const isExpanded = expandedRow === debt.id;

                 return (
                  <React.Fragment key={debt.id}>
                    <tr className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="font-bold text-slate-800">{debt.debtorName}</div>
                         <div className="text-[10px] text-slate-400">Kukopa: {new Date(debt.borrowDate).toLocaleDateString('sw-TZ')}</div>
                         {isOverdue && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">IMEPITWA</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="text-sm">{debt.productName}</div>
                        <div className="text-xs text-slate-400">
                           {new Date(debt.dueDate).toLocaleDateString('sw-TZ')} (Tarehe ya mwisho)
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-500">TSh {debt.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">TSh {paidAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-ernest-blue text-lg">
                        TSh {debt.amountOwed.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => openPayModal(debt)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow transition-colors flex items-center"
                          >
                            <CreditCard size={14} className="mr-1"/> Lipa
                          </button>
                          
                          <button 
                            onClick={() => setExpandedRow(isExpanded ? null : debt.id)}
                            className={`p-1.5 rounded transition-colors ${isExpanded ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:bg-slate-100'}`}
                            title="Angalia Historia"
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <History size={18} />}
                          </button>

                          <button 
                            onClick={() => onDelete(debt.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Futa Deni"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/80 animate-fade-in">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="pl-4 border-l-2 border-ernest-gold">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Historia ya Malipo</h4>
                            {debt.payments && debt.payments.length > 0 ? (
                              <ul className="space-y-2">
                                {debt.payments.map((payment, idx) => (
                                  <li key={idx} className="text-sm text-slate-700 flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                    <span className="font-medium mr-2">{new Date(payment.date).toLocaleDateString('sw-TZ')}</span>
                                    <span className="text-slate-500 mr-1">amelipa</span>
                                    <span className="font-bold text-green-700">TSh {payment.amount.toLocaleString()}</span>
                                  </li>
                                ))}
                                <li className="text-sm font-medium pt-2 border-t border-slate-200 mt-2 text-slate-500">
                                   Jumla imelipwa: TSh {paidAmount.toLocaleString()} • Bado anadaiwa: TSh {debt.amountOwed.toLocaleString()}
                                </li>
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-400 italic">Hakuna malipo yaliyofanyika bado.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                 );
              })}
              {filteredDebts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Hakuna madeni yaliyorekodiwa kwa tarehe hii.</td>
                </tr>
              )}
            </tbody>
           </table>
         </div>
      </div>

       {/* Floating Footer Summary */}
       <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-20 flex justify-between items-center px-8">
         <div className="text-sm text-slate-500">
           {filterDate ? `Madeni ya tarehe: ${new Date(filterDate).toLocaleDateString('sw-TZ')}` : 'Madeni Yote'}
         </div>
         <div className="text-right">
           <p className="text-xs text-slate-400 uppercase font-bold">Jumla Unayodai</p>
           <p className="text-2xl font-extrabold text-ernest-blue">TSh {totalDebtAmount.toLocaleString()}</p>
         </div>
      </div>

      {/* Add Debt Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-scale-in">
            <h3 className="text-xl font-bold text-ernest-blue mb-4">Rekodi Deni Jipya</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jina la Mdeni</label>
                <input 
                  required 
                  type="text" 
                  className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none" 
                  value={debtorName} 
                  onChange={e => setDebtorName(e.target.value)} 
                />
              </div>

              {/* Toggle Stock vs Custom */}
              <div className="bg-slate-100 p-1 rounded flex">
                 <button 
                   type="button" 
                   onClick={() => setDebtType('stock')}
                   className={`flex-1 py-1 text-sm font-bold rounded shadow-sm transition-all ${debtType === 'stock' ? 'bg-white text-ernest-blue' : 'text-slate-400'}`}
                 >
                   <Package size={14} className="inline mr-1"/> Bidhaa ya Dukani
                 </button>
                 <button 
                   type="button" 
                   onClick={() => setDebtType('custom')}
                   className={`flex-1 py-1 text-sm font-bold rounded shadow-sm transition-all ${debtType === 'custom' ? 'bg-white text-ernest-blue' : 'text-slate-400'}`}
                 >
                   <Type size={14} className="inline mr-1"/> Bidhaa Maalum/Pesa
                 </button>
              </div>

              {debtType === 'stock' ? (
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
                        {p.name} (Zipo: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Jina la Bidhaa au Sababu</label>
                   <input 
                      required 
                      type="text" 
                      placeholder="Mfano: Mchele Kilo 5 au Mkopo wa Pesa"
                      className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none"
                      value={customProductName}
                      onChange={e => setCustomProductName(e.target.value)}
                    />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Idadi (Kama ipo)</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none" 
                    value={quantity} 
                    onChange={e => handleQuantityChange(Number(e.target.value))} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jumla Anayodaiwa (TSh)</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none font-bold" 
                    value={amountOwed} 
                    onChange={e => setAmountOwed(Number(e.target.value))} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Tarehe ya Kukopa</label>
                   <input 
                      type="date" 
                      className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none" 
                      value={borrowDate} 
                      onChange={e => setBorrowDate(e.target.value)} 
                    />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Tarehe ya Kulipa</label>
                   <input 
                      required
                      type="date" 
                      className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none" 
                      value={dueDate} 
                      onChange={e => setDueDate(e.target.value)} 
                    />
                 </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Ghairi</button>
                <button type="submit" className="px-6 py-2 bg-ernest-gold text-ernest-blue font-bold rounded hover:bg-ernest-lightGold shadow-md">Hifadhi Deni</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Partial Debt Modal */}
      {isPayModalOpen && selectedDebt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
             <h3 className="text-lg font-bold text-ernest-blue mb-2">Lipa Deni la {selectedDebt.debtorName}</h3>
             <p className="text-sm text-slate-500 mb-4">Anadaiwa jumla ya <span className="font-bold text-red-600">TSh {selectedDebt.amountOwed.toLocaleString()}</span></p>
             
             <form onSubmit={handlePaymentSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kiasi Anacholipa Sasa (TSh)</label>
                  <input 
                    required
                    autoFocus
                    type="number" 
                    max={selectedDebt.amountOwed}
                    min="1"
                    className="w-full p-3 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold text-lg"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                   <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Ghairi</button>
                   <button type="submit" className="px-6 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 shadow">Thibitisha Malipo</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
