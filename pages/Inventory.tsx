
import React, { useState } from 'react';
import { Product, Sale } from '../types';
import { Plus, Search, Trash2, Edit2, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  sales: Sale[];
  onAdd: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, sales, onAdd, onEdit, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '', category: 'Jumla', costPrice: 0, sellingPrice: 0, stock: 0, minStockAlert: 5
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingId(null);
    setProductForm({ name: '', category: 'Jumla', costPrice: 0, sellingPrice: 0, stock: 0, minStockAlert: 5 });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setProductForm({ ...product });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productForm.name && productForm.costPrice !== undefined) {
      const payload: Product = {
        id: editingId || Date.now().toString(),
        name: productForm.name,
        category: productForm.category || 'Jumla',
        costPrice: Number(productForm.costPrice),
        sellingPrice: Number(productForm.sellingPrice),
        stock: Number(productForm.stock),
        minStockAlert: Number(productForm.minStockAlert),
        lastRestockDate: productForm.lastRestockDate
      };

      if (editingId) {
        onEdit(payload);
      } else {
        onAdd(payload);
      }
      
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ernest-blue">Usimamizi wa Bidhaa</h2>
          <p className="text-sm text-slate-500">Fuatilia stoku na mwenendo wa kifedha wa kila bidhaa.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-ernest-gold hover:bg-ernest-lightGold text-ernest-blue font-bold py-2 px-4 rounded shadow transition-colors"
        >
          <Plus size={18} />
          <span>Ongeza Bidhaa Mpya</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tafuta bidhaa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-ernest-gold focus:border-transparent text-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Jina la Bidhaa</th>
                <th className="px-6 py-4 text-right">Gharama / Bei</th>
                <th className="px-6 py-4 text-center">Hali ya Stoku</th>
                <th className="px-6 py-4 text-center">Thamani ya Stoku</th>
                <th className="px-6 py-4 text-right">Faida Iliyopatikana</th>
                <th className="px-6 py-4 text-center">Hatua</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => {
                // Calculate performance stats for this product
                const productSales = sales.filter(s => s.productId === product.id);
                const totalRevenue = productSales.reduce((acc, s) => acc + s.totalAmount, 0);
                const totalProfit = productSales.reduce((acc, s) => acc + s.profit, 0);
                const soldCount = productSales.reduce((acc, s) => acc + s.quantity, 0);
                const currentStockValue = product.stock * product.costPrice;

                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-500 bg-slate-100 inline-block px-1 rounded mt-1">{product.category}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col">
                        <span className="text-ernest-blue font-bold">TSh {product.sellingPrice.toLocaleString()}</span>
                        <span className="text-xs text-slate-400">Gharama: TSh {product.costPrice.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex flex-col items-center">
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            product.stock <= product.minStockAlert ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {product.stock <= product.minStockAlert && <AlertTriangle size={12} className="mr-1" />}
                            {product.stock} Zilizopo
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1">Jumla Zimeuzwa: {soldCount}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">
                      TSh {currentStockValue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {totalProfit >= 0 ? '+' : ''}TSh {totalProfit.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Mapato: TSh {totalRevenue.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => openEditModal(product)}
                          className="text-slate-400 hover:text-ernest-blue transition-colors p-2 rounded hover:bg-slate-100"
                          title="Hariri Bidhaa"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => onDelete(product.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded hover:bg-red-50"
                          title="Futa Bidhaa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Hakuna bidhaa zilizopatikana.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-scale-in">
            <h3 className="text-xl font-bold text-ernest-blue mb-4">
              {editingId ? 'Hariri Bidhaa' : 'Ongeza Bidhaa Mpya'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jina la Bidhaa</label>
                <input required type="text" className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none" 
                  value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kundi (Category)</label>
                  <input type="text" className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none"
                    value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Idadi (Stock)</label>
                  <input required type="number" className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none"
                    value={productForm.stock} onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gharama ya Kununua (TSh)</label>
                  <input required type="number" step="0.01" className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none"
                    value={productForm.costPrice} onChange={e => setProductForm({...productForm, costPrice: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bei ya Kuuzia (TSh)</label>
                  <input required type="number" step="0.01" className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none"
                    value={productForm.sellingPrice} onChange={e => setProductForm({...productForm, sellingPrice: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Kiwango cha Tahadhari (Low Stock Alert)</label>
                  <input required type="number" className="w-full p-2 border border-slate-300 bg-white text-slate-900 rounded focus:ring-2 focus:ring-ernest-gold outline-none"
                    value={productForm.minStockAlert} onChange={e => setProductForm({...productForm, minStockAlert: Number(e.target.value)})} />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Ghairi</button>
                <button type="submit" className="px-6 py-2 bg-ernest-blue text-white rounded hover:bg-slate-800">
                  {editingId ? 'Hifadhi Mabadiliko' : 'Tengeneza Bidhaa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
