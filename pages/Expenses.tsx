import React, { useState } from 'react';
import { Expense } from '../types';
import { CreditCard, Plus, Trash2, Calendar, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (e: Expense) => void;
  onDelete: (id: string) => void;
}

const COLORS = ['#0f172a', '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#6366f1', '#8b5cf6', '#ec4899'];

export const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    type: '', description: '', amount: 0, date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddExpense({
      id: Date.now().toString(),
      shopId: '', // Placeholder, injected by App.tsx
      type: newExpense.type || 'Nyingine',
      description: newExpense.description || '',
      amount: Number(newExpense.amount),
      date: new Date(newExpense.date || '').toISOString()
    });
    setIsModalOpen(false);
    setNewExpense({ type: '', description: '', amount: 0, date: new Date().toISOString().split('T')[0] });
  };

  // Filter Logic
  const filteredExpenses = filterDate 
    ? expenses.filter(e => e.date.startsWith(filterDate))
    : expenses;

  // Calculate Total
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group for Chart (Dynamic based on filter)
  const expenseData = filteredExpenses.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.name === curr.type);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.type, value: curr.amount });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6 pb-20"> {/* pb-20 for fixed footer space */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-ernest-blue">Matumizi</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded shadow transition-colors"
        >
          <Plus size={18} />
          <span>Weka Matumizi</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-2 text-slate-500 bg-white px-3 py-2 rounded border border-slate-200 shadow-sm">
              <Filter size={16} />
              <span className="text-xs font-bold mr-2">Chuja Tarehe:</span>
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-white border-none focus:outline-none text-sm text-slate-700 font-medium"
              />
              {filterDate && <button onClick={() => setFilterDate('')} className="text-xs text-red-500 font-bold ml-2">Futa</button>}
            </div>
            <div className="text-slate-500 text-sm font-medium">
              Rekodi {filteredExpenses.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Tarehe</th>
                  <th className="px-6 py-4">Aina</th>
                  <th className="px-6 py-4">Maelezo</th>
                  <th className="px-6 py-4 text-right">Kiasi</th>
                  <th className="px-6 py-4 text-center">Hatua</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...filteredExpenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                  <tr key={exp.id} className="group hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-600 text-sm">{new Date(exp.date).toLocaleDateString('sw-TZ')}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 font-medium">{exp.type}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-800">{exp.description || '-'}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-500">-TSh {exp.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => onDelete(exp.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        title="Futa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                     <td colSpan={5} className="text-center py-6 text-slate-400">Hakuna matumizi kwa tarehe hii.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-fit">
          <h3 className="font-bold text-ernest-blue mb-4">Mchanganuo ({filterDate ? 'Siku Hii' : 'Jumla'})</h3>
          <div className="h-64 w-full">
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `TSh ${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">Hakuna data ya chati</div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Footer Summary */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-20 flex justify-between items-center px-8">
         <div className="text-sm text-slate-500">
           Jumla ya rekodi {filteredExpenses.length}
         </div>
         <div className="text-right">
           <p className="text-xs text-slate-400 uppercase font-bold">Jumla ya Matumizi</p>
           <p className="text-2xl font-extrabold text-red-600">-TSh {totalAmount.toLocaleString()}</p>
         </div>
      </div>

       {/* Add Expense Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-scale-in">
            <h3 className="text-xl font-bold text-ernest-blue mb-4">Ongeza Matumizi</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aina ya Matumizi</label>
                  <input 
                    required
                    type="text"
                    placeholder="Mfano: Kodi, Umeme, Chakula..."
                    className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none"
                    value={newExpense.type} 
                    onChange={e => setNewExpense({...newExpense, type: e.target.value})}
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Tarehe</label>
                   <input required type="date" className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none"
                    value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Maelezo (Si lazima)</label>
                <input type="text" className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none"
                  value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="Maelezo fupi..." />
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Kiasi (TSh)</label>
                  <input required type="number" step="0.01" className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none"
                    value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Ghairi</button>
                <button type="submit" className="px-6 py-2 bg-red-500 text-white font-bold rounded hover:bg-red-600">Hifadhi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};