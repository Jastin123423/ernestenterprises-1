
import React, { useState, useMemo } from 'react';
import { Sale, Expense, Product, Debt } from '../types';
import { TrendingUp, TrendingDown, AlertCircle, DollarSign, Package, BarChart2, Flag, Calendar, ChevronLeft, ChevronRight, Lightbulb, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface DashboardProps {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  debts: Debt[];
}

type FilterType = 'day' | 'week' | 'month' | 'year';

export const Dashboard: React.FC<DashboardProps> = ({ sales, expenses, products, debts }) => {
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- Date Logic Helpers ---
  
  const getRange = (date: Date, type: FilterType) => {
    const start = new Date(date);
    const end = new Date(date);
    let label = '';

    if (type === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      label = start.toLocaleDateString('sw-TZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (type === 'week') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday start
      start.setDate(diff);
      start.setHours(0,0,0,0);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
      label = `Wiki ya ${start.toLocaleDateString('sw-TZ')}`;
    } else if (type === 'month') {
      start.setDate(1);
      start.setHours(0,0,0,0);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      end.setHours(23,59,59,999);
      label = start.toLocaleDateString('sw-TZ', { month: 'long', year: 'numeric' });
    } else if (type === 'year') {
      start.setMonth(0, 1);
      start.setHours(0,0,0,0);
      end.setMonth(11, 31);
      end.setHours(23,59,59,999);
      label = start.getFullYear().toString();
    }

    return { start, end, label };
  };

  const { start: rangeStart, end: rangeEnd, label: rangeLabel } = getRange(selectedDate, filterType);

  // Check if selected view is "Today"
  const isToday = filterType === 'day' && selectedDate.toDateString() === new Date().toDateString();
  const displayLabel = isToday ? 'Leo' : rangeLabel;

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (filterType === 'day') newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    if (filterType === 'week') newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    if (filterType === 'month') newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    if (filterType === 'year') newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    // Filter by Range
    const filteredSales = sales.filter(s => {
      const d = new Date(s.date).getTime();
      return d >= rangeStart.getTime() && d <= rangeEnd.getTime();
    });

    const filteredExpenses = expenses.filter(e => {
      const d = new Date(e.date).getTime();
      return d >= rangeStart.getTime() && d <= rangeEnd.getTime();
    });

    // Period Calculations
    const periodRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const periodCOGS = filteredSales.reduce((sum, s) => sum + (s.costPriceSnapshot * s.quantity), 0);
    const periodExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const periodNetProfit = periodRevenue - periodCOGS - periodExpenses;
    const itemsSoldPeriod = filteredSales.reduce((sum, s) => sum + s.quantity, 0);

    // --- All Time / Real Capital Calculations ---
    
    // 1. Assets (Inventory at Cost)
    const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
    
    // 2. Receivables (Outstanding Debts)
    const pendingDebtsAmount = debts
      .filter(d => !d.isPaid)
      .reduce((sum, d) => sum + d.amountOwed, 0);

    // 3. Cash/Equity Generated (All Time Profit)
    const allTimeRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const allTimeCOGS = sales.reduce((sum, s) => sum + (s.costPriceSnapshot * s.quantity), 0);
    const allTimeExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const allTimeNetProfit = allTimeRevenue - allTimeCOGS - allTimeExpenses;

    // Real Business Value = (Cash from Profit) + (Inventory Assets) + (Pending Receivables)
    const totalBusinessValue = allTimeNetProfit + totalStockValue + pendingDebtsAmount;

    // Inventory Alerts
    const lowStockItems = products.filter(p => p.stock <= p.minStockAlert);
    
    // Last Restock Logic
    let lastRestockDate = null;
    let daysSinceRestock = 0;
    const sortedByRestock = [...products].sort((a, b) => {
      const dateA = a.lastRestockDate ? new Date(a.lastRestockDate).getTime() : 0;
      const dateB = b.lastRestockDate ? new Date(b.lastRestockDate).getTime() : 0;
      return dateB - dateA;
    });

    if (sortedByRestock.length > 0 && sortedByRestock[0].lastRestockDate) {
      lastRestockDate = new Date(sortedByRestock[0].lastRestockDate);
      const diffTime = Math.abs(new Date().getTime() - lastRestockDate.getTime());
      daysSinceRestock = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1; 
      if (daysSinceRestock < 0) daysSinceRestock = 0;
    }

    return {
      filteredSales,
      periodRevenue,
      periodNetProfit,
      periodExpenses,
      itemsSoldPeriod,
      totalStockValue,
      pendingDebtsAmount,
      allTimeNetProfit,
      totalBusinessValue,
      lowStockItems,
      lastRestockDate,
      daysSinceRestock
    };
  }, [sales, expenses, products, debts, rangeStart, rangeEnd]);

  // --- Recommendations & Insights ---
  const recommendations = useMemo(() => {
    const tips = [];
    const currentSales = stats.filteredSales;

    // 1. Calculate Product Performance in current period
    const productPerformance: Record<string, number> = {};
    currentSales.forEach(s => {
      productPerformance[s.productId] = (productPerformance[s.productId] || 0) + s.quantity;
    });

    // Find Top Seller
    let topProductId = '';
    let maxSold = 0;
    Object.entries(productPerformance).forEach(([pid, qty]) => {
      if (qty > maxSold) {
        maxSold = qty;
        topProductId = pid;
      }
    });
    const topProduct = products.find(p => p.id === topProductId);

    // Tip 1: Top Seller Advice
    if (topProduct) {
      if (topProduct.stock < 10) {
        tips.push({
          id: 'top-critical',
          icon: Zap,
          color: 'text-red-600',
          bg: 'bg-red-50',
          title: '🔥 Inayouza Sana (Critical)',
          text: `"${topProduct.name}" ndio bidhaa inayouza zaidi (${maxSold} zimeuzwa), lakini stoku imeisha (${topProduct.stock}). Ongeza mzigo haraka!`
        });
      } else {
        tips.push({
          id: 'top-good',
          icon: TrendingUp,
          color: 'text-green-600',
          bg: 'bg-green-50',
          title: '🌟 Bidhaa Bora',
          text: `"${topProduct.name}" inaongoza kwa mauzo. Hakikisha inaonekana vizuri kwa wateja.`
        });
      }
    }

    // Tip 2: Trend Analysis (Compare with previous period)
    const duration = rangeEnd.getTime() - rangeStart.getTime();
    const prevStart = new Date(rangeStart.getTime() - duration); 
    const prevEnd = new Date(rangeEnd.getTime() - duration);
    
    const prevSales = sales.filter(s => {
      const d = new Date(s.date).getTime();
      return d >= prevStart.getTime() && d <= prevEnd.getTime();
    });
    const prevRevenue = prevSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const currentRevenue = stats.periodRevenue;

    if (prevRevenue > 0) {
      const growth = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
      if (growth > 10) {
        tips.push({
          id: 'trend-up',
          icon: ArrowUpRight,
          color: 'text-ernest-blue',
          bg: 'bg-blue-50',
          title: '🚀 Ukuaji wa Mauzo',
          text: `Mapato yameongezeka kwa ${growth.toFixed(1)}% kulinganisha na kipindi kilichopita. Kazi nzuri!`
        });
      } else if (growth < -10) {
        tips.push({
          id: 'trend-down',
          icon: ArrowDownRight,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          title: '📉 Hatua Inahitajika',
          text: `Mapato yamepungua kwa ${Math.abs(growth).toFixed(1)}%. Fikiria kufanya punguzo la bei.`
        });
      }
    }

    // Tip 3: Dead Stock Opportunity
    const unsoldItems = products.filter(p => p.stock > 10 && !productPerformance[p.id]);
    if (unsoldItems.length > 0) {
      const randomUnsold = unsoldItems[Math.floor(Math.random() * unsoldItems.length)];
      tips.push({
        id: 'unsold',
        icon: Lightbulb,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        title: '💡 Ushauri wa Mauzo',
        text: `"${randomUnsold.name}" haijauzwa hivi karibuni. Jaribu kuiuza kwa punguzo au fungasha na bidhaa nyingine.`
      });
    }

    if (tips.length === 0) {
       tips.push({
          id: 'default',
          icon: Lightbulb,
          color: 'text-slate-600',
          bg: 'bg-slate-50',
          title: 'Ushauri wa Biashara',
          text: "Fuatilia mauzo yako kila siku ili kupata ushauri bora hapa."
        });
    }

    return tips;
  }, [stats.filteredSales, stats.periodRevenue, products, rangeStart, rangeEnd, sales]);


  // Stock Movement Data (Top 5 active products)
  const stockMovementData = useMemo(() => {
    return products.map(product => {
      const soldCount = stats.filteredSales
        .filter(s => s.productId === product.id)
        .reduce((sum, s) => sum + s.quantity, 0);
      return {
        ...product,
        soldCount
      };
    })
    .filter(p => p.soldCount > 0 || p.stock < 100) 
    .sort((a, b) => b.soldCount - a.soldCount) 
    .slice(0, 5);
  }, [products, stats.filteredSales]);

  // Chart Data (Based on selected range)
  const chartData = useMemo(() => {
    const data = [];
    const current = new Date(rangeStart);
    // Limit points to avoid crowding
    const totalDays = (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 3600 * 24);
    
    if (totalDays < 0) return [];

    while (current <= rangeEnd) {
      const dateStr = current.toLocaleDateString();
      let matchLabel = dateStr;
      
      if (filterType === 'year') {
         matchLabel = current.toLocaleDateString('sw-TZ', { month: 'short' });
      } else if (filterType === 'month') {
         matchLabel = current.getDate().toString();
      }

      const pointSales = sales.filter(s => {
         const sDate = new Date(s.date);
         if (filterType === 'year') {
            return sDate.getMonth() === current.getMonth() && sDate.getFullYear() === current.getFullYear();
         }
         return sDate.toLocaleDateString() === current.toLocaleDateString();
      });

      const revenue = pointSales.reduce((sum, s) => sum + s.totalAmount, 0);
      const profit = pointSales.reduce((sum, s) => sum + s.profit, 0);

      const existing = data.find(d => d.name === matchLabel);
      if (existing && filterType === 'year') {
         existing.revenue += revenue;
         existing.profit += profit;
      } else {
         data.push({
           name: filterType === 'day' ? current.getHours() + ':00' : matchLabel, 
           revenue,
           profit,
         });
      }

      // Increment
      if (filterType === 'year') {
         current.setMonth(current.getMonth() + 1);
      } else {
         current.setDate(current.getDate() + 1);
      }
    }
    return data;
  }, [sales, rangeStart, rangeEnd, filterType]);

  const mapFilterLabel = (type: FilterType) => {
    switch(type) {
      case 'day': return 'Leo';
      case 'week': return 'Wiki';
      case 'month': return 'Mwezi';
      case 'year': return 'Mwaka';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* --- Filters Bar --- */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-2">
         <div className="flex items-center space-x-4 mb-4 md:mb-0 w-full md:w-auto justify-between">
            <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 bg-white border border-slate-200">
               <ChevronLeft size={20} />
            </button>
            <div className="flex items-center space-x-2 relative px-2">
               <Calendar size={18} className="text-ernest-gold" />
               <span className="font-bold text-ernest-blue text-lg whitespace-nowrap">{displayLabel}</span>
               {filterType === 'day' && (
                  <input 
                    type="date" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    onChange={(e) => {
                       if(e.target.value) setSelectedDate(new Date(e.target.value));
                    }}
                  />
               )}
            </div>
            <button onClick={() => navigateDate('next')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 bg-white border border-slate-200">
               <ChevronRight size={20} />
            </button>
         </div>

         <div className="flex bg-slate-100 p-1 rounded-lg">
            {(['day', 'week', 'month', 'year'] as FilterType[]).map(type => (
               <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                     filterType === type 
                     ? 'bg-white text-ernest-blue shadow-sm' 
                     : 'text-slate-400 hover:text-slate-600'
                  }`}
               >
                  {mapFilterLabel(type)}
               </button>
            ))}
         </div>
      </div>

      {/* --- Recommendations Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map(rec => {
          const Icon = rec.icon;
          return (
            <div key={rec.id} className={`${rec.bg} p-4 rounded-xl border border-transparent hover:border-black/5 transition-all flex items-start space-x-4`}>
              <div className={`p-2 rounded-full bg-white shadow-sm ${rec.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <h4 className={`font-bold text-sm mb-1 ${rec.color}`}>{rec.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {rec.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- Stats Row --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={64} className="text-ernest-blue" />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">
            Mauzo ({displayLabel})
          </p>
          <h3 className="text-3xl font-extrabold text-ernest-blue mt-2">TSh {stats.periodRevenue.toLocaleString()}</h3>
          <p className="text-sm text-green-600 flex items-center mt-2 font-medium">
            <Package size={14} className="mr-1"/> Bidhaa {stats.itemsSoldPeriod} zimeuzwa
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            {stats.periodNetProfit >= 0 ? (
              <TrendingUp size={64} className="text-green-600" />
            ) : (
              <TrendingDown size={64} className="text-red-600" />
            )}
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">
            Faida Halisi ({displayLabel})
          </p>
          <h3 className={`text-3xl font-extrabold mt-2 ${stats.periodNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            TSh {stats.periodNetProfit.toLocaleString()}
          </h3>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            Matumizi: TSh {stats.periodExpenses.toLocaleString()}
          </p>
        </div>

        {/* Real Capital Value Card */}
        <div className="bg-gradient-to-br from-ernest-blue to-slate-900 p-6 rounded-xl shadow-lg relative overflow-hidden text-white">
           <div className="absolute top-0 right-0 p-4 opacity-10">
            <BarChart2 size={64} className="text-ernest-gold" />
          </div>
          <div className="relative z-10">
             <p className="text-slate-300 text-xs font-bold uppercase tracking-wide flex items-center">
               Mtaji Kamili wa Biashara <Flag size={10} className="ml-2 text-ernest-gold" />
             </p>
             <h3 className="text-3xl font-extrabold text-ernest-gold mt-2">TSh {stats.totalBusinessValue.toLocaleString()}</h3>
             <div className="text-[10px] text-slate-300 mt-3 space-y-1 opacity-90">
                <div className="flex justify-between"><span>Rasilimali (Mali):</span> <span>TSh {stats.totalStockValue.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Madeni unayodai:</span> <span>TSh {stats.pendingDebtsAmount.toLocaleString()}</span></div>
                <div className="flex justify-between border-t border-white/20 pt-1"><span>Pesa Taslimu (Faida):</span> <span>TSh {stats.allTimeNetProfit.toLocaleString()}</span></div>
             </div>
          </div>
        </div>

        {/* Inventory Health Widget */}
        <div className={`p-6 rounded-xl shadow-sm border relative overflow-hidden group transition-all ${stats.lowStockItems.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flag size={64} className={stats.lowStockItems.length > 0 ? 'text-red-500' : 'text-slate-400'} />
          </div>
          <p className={`${stats.lowStockItems.length > 0 ? 'text-red-700' : 'text-slate-500'} text-xs font-bold uppercase tracking-wide`}>Afya ya Stoku</p>
          
          <div className="mt-2">
            {stats.lowStockItems.length > 0 ? (
               <div>
                  <h3 className="text-3xl font-extrabold text-red-600">{stats.lowStockItems.length}</h3>
                  <p className="text-sm text-red-700 font-bold mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1"/> Bidhaa Zinaisha
                  </p>
               </div>
            ) : (
              <div>
                 <h3 className="text-3xl font-extrabold text-green-600">Safi</h3>
                 <p className="text-sm text-green-700 font-bold mt-1">Stoku iko vizuri</p>
              </div>
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t border-black/5 flex items-center text-xs text-slate-600">
             <Calendar size={12} className="mr-1 opacity-70"/>
             <span>Mzigo Mpya: </span>
             <span className="font-bold ml-1">
               {stats.lastRestockDate ? (
                 stats.daysSinceRestock === 0 ? 'Leo' : `Siku ${stats.daysSinceRestock} zimepita`
               ) : 'Bado'}
             </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-ernest-blue">Mwenendo wa Mauzo</h3>
              <p className="text-xs text-slate-400">Mapato na Faida: {displayLabel}</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-500 rounded-full border border-slate-200 uppercase">{mapFilterLabel(filterType)}</span>
          </div>
          <div className="h-80 w-full">
             {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `TSh ${value}`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value) => [`TSh ${Number(value).toLocaleString()}`, '']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Mapato" />
                    <Area type="monotone" dataKey="profit" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" name="Faida" />
                  </AreaChart>
                </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-slate-300">
                 <p>Hakuna data kwa kipindi hiki</p>
               </div>
             )}
          </div>
        </div>

        {/* Right Column: Stock & Alerts */}
        <div className="space-y-6">
          
          {/* Stock Movement */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-ernest-blue mb-1">Bidhaa Zinazotoka</h3>
            <p className="text-xs text-slate-500 mb-5">Bidhaa zinazouzwa sana kipindi hiki</p>
            
            <div className="space-y-5">
              {stockMovementData.map(item => {
                const totalVolume = item.stock + item.soldCount;
                const soldPercent = totalVolume === 0 ? 0 : (item.soldCount / totalVolume) * 100;
                const isLow = item.stock <= item.minStockAlert;
                
                return (
                  <div key={item.id} className="group">
                    <div className="flex justify-between text-sm mb-1.5">
                      <div className="flex items-center">
                        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-slate-700'}`}>{item.name}</span>
                        {isLow && <Flag size={10} className="ml-1 text-red-500 fill-current" />}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        <span className="text-ernest-blue">Zimeuzwa {item.soldCount}</span> <span className="text-slate-300">|</span> Zimebaki {item.stock}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${isLow ? 'bg-red-500' : 'bg-ernest-gold'}`}
                        style={{ width: `${Math.max(soldPercent, 5)}%` }} 
                      ></div>
                    </div>
                  </div>
                );
              })}
              {stockMovementData.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Hakuna mauzo ya hivi karibuni.</p>
              )}
            </div>
          </div>

          {/* Critical Alerts List (If any) */}
          {stats.lowStockItems.length > 0 && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
               <h4 className="text-red-800 font-bold flex items-center mb-3">
                 <AlertCircle size={18} className="mr-2"/> Stoku Inayoisha
               </h4>
               <ul className="space-y-2">
                 {stats.lowStockItems.slice(0, 3).map(p => (
                   <li key={p.id} className="text-sm text-red-700 flex justify-between bg-white/50 p-2 rounded">
                     <span>{p.name}</span>
                     <span className="font-bold">Zimebaki {p.stock}</span>
                   </li>
                 ))}
                 {stats.lowStockItems.length > 3 && (
                   <li className="text-xs text-center text-red-600 font-medium mt-1">
                     + Bidhaa nyingine {stats.lowStockItems.length - 3}
                   </li>
                 )}
               </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
