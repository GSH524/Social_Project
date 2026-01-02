import React, { useContext, useState, useEffect, useMemo } from "react";
import { db } from "../firebase"; 
import { AuthContext } from "../context/AuthContext";

// --- REDUX IMPORTS ---
import { useDispatch } from 'react-redux';
import { addItem } from '../slices/cartSlice'; 

// --- DATA IMPORTS ---
import { 
  customers, 
  payments as staticPayments, 
  caddress as staticAddresses, 
  orders as staticOrders, 
  orderItems as staticItems, 
  products 
} from "../data/dataUtils.js";

// --- FIREBASE IMPORTS ---
import { 
  doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, onSnapshot, serverTimestamp, deleteDoc 
} from "firebase/firestore";

// --- TOASTIFY ---
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- ICONS ---
import { 
  Loader, User, ShoppingBag, CreditCard, LayoutDashboard, 
  TrendingUp, Package, DollarSign, MapPin, Phone, 
  AlertCircle, X, Bell, Check, Filter, Calendar, CheckCircle, ChevronRight, ShoppingCart, Star, Camera
} from 'lucide-react';

// --- CHART JS IMPORTS ---
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';
ChartJS.defaults.font.family = "'Inter', sans-serif";

// ==========================================
//  SUB-COMPONENT: NOTIFICATIONS PANEL
// ==========================================
const NotificationsPanel = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "notifications"), where("recipientId", "==", userId), where("type", "==", "user"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      notes.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNotifications(notes);
    });
    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (id) => await deleteDoc(doc(db, "notifications", id));

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-slate-400 hover:text-white transition-colors bg-slate-800/50 rounded-lg hover:bg-slate-800">
        <Bell size={22} />
        {notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900 animate-pulse"></span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
            <h4 className="font-bold text-white text-sm">Notifications</h4>
            <button onClick={() => setIsOpen(false)}><X size={16} className="text-slate-500 hover:text-white"/></button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? <div className="p-4 text-center text-xs text-slate-500">No new notifications</div> : 
              notifications.map(note => (
                <div key={note.id} className="p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors flex gap-3">
                  <div className="mt-1 p-1.5 bg-emerald-500/10 rounded-full text-emerald-400 h-fit"><Check size={14} /></div>
                  <div className="flex-1">
                      <p className="text-sm text-slate-300 mb-1 leading-snug">{note.message}</p>
                      <p className="text-[10px] text-slate-500">{note.createdAt?.toDate ? note.createdAt.toDate().toLocaleString() : 'Just now'}</p>
                  </div>
                  <button onClick={() => markAsRead(note.id)} className="text-slate-500 hover:text-rose-400 self-start"><X size={14}/></button>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
//  SUB-COMPONENT: FEATURED PRODUCTS (Top Rated & Best Selling)
// ==========================================
const FeaturedProducts = ({ products, onAddToCart }) => {
  
  // Helper to render stars
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        size={10} 
        className={`${i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-slate-500"}`} 
      />
    ));
  };

  return (
    <div className="mb-8 animate-fade-in-up">
      <div className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Package size={20} className="text-violet-500"/> Top Rated & Best Selling</h3>
          <span className="text-xs text-slate-500 flex items-center gap-1">Swipe for more <ChevronRight size={12}/></span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-violet-900/50 scrollbar-track-slate-900/0">
          {products.slice(0, 15).map((prod) => (
            <div key={prod.product_id} className="min-w-[200px] md:min-w-[240px] bg-slate-950/80 border border-slate-800 rounded-xl p-3 hover:border-violet-500/50 transition-all group hover:scale-[1.02] shadow-lg flex flex-col justify-between">
              <div>
                <div className="h-32 md:h-40 bg-slate-900 rounded-lg mb-3 overflow-hidden relative">
                  <img src={prod.image_url} alt={prod.product_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                  
                  {/* Price Tag */}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-emerald-400 border border-emerald-500/30">
                    ${prod.selling_unit_price.toFixed(2)}
                  </div>

                  {/* Rating Overlay */}
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 border border-white/10">
                    <div className="flex">{renderStars(prod.product_rating || 0)}</div>
                    <span className="text-[10px] text-slate-200 font-bold ml-1">({prod.product_rating})</span>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-white truncate" title={prod.product_name}>{prod.product_name}</h4>
                <div className="flex justify-between items-center mt-2 mb-3">
                  <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">{prod.product_category}</span>
                  <span className="text-[10px] text-violet-400 font-medium">{prod.sales_count > 0 ? `${prod.sales_count} Sold` : 'New Arrival'}</span>
                </div>
              </div>
              
              <button 
                onClick={() => onAddToCart(prod)}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-violet-900/20 active:scale-95"
              >
                <ShoppingCart size={14} /> Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
//  SUB-COMPONENT: OVERVIEW TAB
// ==========================================
const OverviewTab = ({ orders, displayData, filters, setFilters, availableMonths, yearsList, availableCategories }) => {
  const kpiTotalSpend = orders.filter(o => !['Cancelled', 'Returned'].includes(o.order_status)).reduce((acc, curr) => acc + curr.order_total_amount, 0);
  const formatRupees = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  // --- DATA PROCESSING FOR CHARTS ---
  const validOrders = orders.filter(o => !['Cancelled', 'Returned'].includes(o.order_status));

  // 1. Total Amount Spent Trend (Line)
  const dailySpendData = {};
  validOrders.forEach(o => {
      const dateKey = new Date(o.order_date).toLocaleDateString('en-US', {month:'short', day:'numeric'});
      dailySpendData[dateKey] = (dailySpendData[dateKey] || 0) + o.order_total_amount;
  });
  const lineChartData = {
    labels: Object.keys(dailySpendData),
    datasets: [{
      label: 'Total Spend',
      data: Object.values(dailySpendData),
      borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', fill: true, tension: 0.4
    }]
  };

  // 2. Orders by Status (Doughnut)
  const statusCounts = {};
  orders.forEach(o => statusCounts[o.order_status] = (statusCounts[o.order_status] || 0) + 1);
  const donutChartData = {
    labels: Object.keys(statusCounts),
    datasets: [{
      data: Object.values(statusCounts),
      backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#f43f5e', '#6366f1'], borderWidth: 0
    }]
  };

  // --- DATA FOR 3 NEW BAR CHARTS (By Product Name) ---
  const returnsByProduct = {};
  const spendByProduct = {};
  const activeByProduct = {};

  orders.forEach(order => {
      order.items.forEach(item => {
          const pName = item.product_name;
          
          // 3. Count of Return Orders
          if(['Returned', 'Return Requested'].includes(order.order_status)) {
              returnsByProduct[pName] = (returnsByProduct[pName] || 0) + (item.quantity || 1);
          }

          // 4. Total Amount Spent
          if(!['Cancelled', 'Returned'].includes(order.order_status)) {
              const amount = (Number(item.selling_unit_price) * (item.quantity || 1)) || 0;
              spendByProduct[pName] = (spendByProduct[pName] || 0) + amount;
          }

          // 5. Active Orders
          if(['Pending', 'Processing', 'Shipped'].includes(order.order_status)) {
              activeByProduct[pName] = (activeByProduct[pName] || 0) + (item.quantity || 1);
          }
      });
  });

  // Sort and Slice Top 5
  const getTop5 = (data) => Object.entries(data).sort((a,b) => b[1] - a[1]).slice(0, 5);
  const topReturns = getTop5(returnsByProduct);
  const topSpend = getTop5(spendByProduct);
  const topActive = getTop5(activeByProduct);

  const horizontalChartOptions = {
    indexAxis: 'y', 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { legend: { display: false } },
    scales: { x: { grid: { color: 'rgba(148, 163, 184, 0.05)' } }, y: { grid: { display: false }, ticks: { color: '#e2e8f0', font: {size: 10} } } }
  };

  const chartReturns = { labels: topReturns.map(i => i[0].substring(0,15)+'...'), datasets: [{ label: 'Returns', data: topReturns.map(i => i[1]), backgroundColor: '#f43f5e', borderRadius: 4 }] };
  const chartSpend = { labels: topSpend.map(i => i[0].substring(0,15)+'...'), datasets: [{ label: 'Spent', data: topSpend.map(i => i[1]), backgroundColor: '#10b981', borderRadius: 4 }] };
  const chartActive = { labels: topActive.map(i => i[0].substring(0,15)+'...'), datasets: [{ label: 'Active Qty', data: topActive.map(i => i[1]), backgroundColor: '#3b82f6', borderRadius: 4 }] };

  return (
    <div className="animate-fade-in-up">
      {/* Filters */}
      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl mb-8 backdrop-blur-sm shadow-lg flex flex-col gap-3">
          <div className="flex items-center gap-2 text-violet-400 font-bold uppercase text-xs tracking-widest border-b border-slate-800/50 pb-2 mb-1">
            <Filter size={14}/> Data Filters
          </div>
          <div className="flex flex-wrap gap-4 w-full">
             <div className="flex-1 min-w-[140px]">
                <label className="text-xs text-slate-500 mb-1 block ml-1">Year</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                  <select value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})} className="w-full pl-9 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-violet-500 hover:bg-slate-700/80 transition-colors cursor-pointer appearance-none">
                    <option value="All">All Years</option>{yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
             </div>
             <div className="flex-1 min-w-[140px]">
                <label className="text-xs text-slate-500 mb-1 block ml-1">Month</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                  <select value={filters.month} onChange={(e) => setFilters({...filters, month: e.target.value})} className="w-full pl-9 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-violet-500 hover:bg-slate-700/80 transition-colors cursor-pointer appearance-none">
                    <option value="All">All Months</option>{availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
             </div>
             <div className="flex-1 min-w-[140px]">
                <label className="text-xs text-slate-500 mb-1 block ml-1">Category</label>
                <div className="relative">
                  <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                  <select value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value})} className="w-full pl-9 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-violet-500 hover:bg-slate-700/80 transition-colors cursor-pointer appearance-none">
                    {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
             </div>
          </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { title: 'Total Orders', value: orders.length, icon: Package, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { title: 'Total Spend', value: formatRupees(kpiTotalSpend), icon: DollarSign, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { title: 'Returns', value: orders.filter(o => ['Returned', 'Return Requested'].includes(o.order_status)).length, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
            { title: 'Active', value: orders.filter(o => ['Pending', 'Processing', 'Shipped'].includes(o.order_status)).length, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { title: 'Delivered', value: orders.filter(o => o.order_status === 'Delivered').length, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className={`p-2 w-fit rounded-lg mb-4 ${kpi.bg} ${kpi.color}`}><kpi.icon size={20} /></div>
                <h2 className="text-2xl font-bold text-white mb-1">{kpi.value}</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.title}</p>
            </div>
          ))}
      </div>

      {/* Charts Grid */}
      <div className="space-y-6 mb-6">
          
          {/* Row 1: Spend Trend & Orders Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-violet-500"/> Total Amount Spent Trend</h3>
                <div className="h-64"><Line data={lineChartData} options={{maintainAspectRatio: false, plugins: {legend: {display: false}}, scales: {x: {grid: {display: false}}, y: {grid: {color: 'rgba(255,255,255,0.05)'}}}}} /></div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Package size={16} className="text-amber-500"/> Orders by Status</h3>
                <div className="h-64 relative"><Doughnut data={donutChartData} options={{maintainAspectRatio: false, cutout: '70%', plugins: {legend: {position: 'bottom', labels: {color: '#94a3b8'}}}}} /></div>
            </div>
          </div>

          {/* Row 2: The 3 New Cluster/Bar Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Chart 1: Returns by Product */}
             <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><AlertCircle size={16} className="text-rose-500"/> Returns by Product</h3>
                <div className="h-48"><Bar data={chartReturns} options={horizontalChartOptions} /></div>
             </div>
             
             {/* Chart 2: Spend by Product */}
             <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><DollarSign size={16} className="text-emerald-500"/> Spend by Product</h3>
                <div className="h-48"><Bar data={chartSpend} options={horizontalChartOptions} /></div>
             </div>

             {/* Chart 3: Active Orders by Product */}
             <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-blue-500"/> Active by Product</h3>
                <div className="h-48"><Bar data={chartActive} options={horizontalChartOptions} /></div>
             </div>
          </div>

          {/* User Address Section */}
          <div className="bg-gradient-to-r from-violet-900/40 to-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-lg">
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="p-3 bg-violet-500/20 rounded-full text-violet-400 shadow-inner shadow-violet-500/20"><MapPin size={24}/></div>
                  <div className="text-center sm:text-left">
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Primary Delivery Address</p>
                      <p className="text-lg text-white font-medium">{displayData.address}, {displayData.city}</p>
                      <p className="text-sm text-slate-400">{displayData.country}</p>
                  </div>
              </div>
              <div className="px-4 py-2 bg-slate-800 rounded-lg text-sm text-slate-300 border border-slate-700">
                  {displayData.mobile || 'No contact info'}
              </div>
          </div>

      </div>
    </div>
  );
};

// ==========================================
//  SUB-COMPONENT: ORDERS TAB (Table)
// ==========================================
const OrdersTab = ({ orders, onReturnClick }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl animate-fade-in-up shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
              <th className="p-5">Order ID</th><th className="p-5">Date</th><th className="p-5">Items</th><th className="p-5">Amount</th><th className="p-5">Status</th><th className="p-5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {orders.length > 0 ? orders.map(order => (
              <tr key={order.order_id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-5 font-mono text-violet-300">#{order.order_id.toString().slice(0,8)}</td>
                <td className="p-5 text-slate-300 text-sm">{new Date(order.order_date).toLocaleDateString()}</td>
                <td className="p-5 text-sm text-slate-400">{order.items.length}</td>
                <td className="p-5 font-bold text-white">${order.order_total_amount.toFixed(2)}</td>
                <td className="p-5"><span className={`px-2 py-1 text-xs rounded border ${order.order_status === 'Delivered' ? 'border-emerald-500 text-emerald-400' : order.order_status === 'Returned' ? 'border-rose-500 text-rose-400' : 'border-violet-500 text-violet-400'}`}>{order.order_status}</span></td>
                <td className="p-5 text-center">
                  <button onClick={() => onReturnClick(order)} disabled={['Returned', 'Cancelled', 'Return Requested'].includes(order.order_status)} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all">Return</button>
                </td>
              </tr>
            )) : <tr><td colSpan="6" className="p-8 text-center text-slate-500 italic">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
//  SUB-COMPONENT: PAYMENTS TAB (Table)
// ==========================================
const PaymentsTab = ({ orders }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden animate-fade-in-up shadow-xl">
       <div className="p-6 border-b border-slate-800"><h3 className="text-xl font-bold text-white flex items-center gap-2"><CreditCard size={24} className="text-emerald-500"/> Payment History</h3></div>
       <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
              <thead><tr className="bg-slate-950 text-slate-400 text-xs uppercase"><th className="p-5">Ref ID</th><th className="p-5">Order</th><th className="p-5">Method</th><th className="p-5 text-right">Amount</th><th className="p-5 text-center">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                  {orders.map(order => (
                      <tr key={order.order_id} className="hover:bg-slate-800/30">
                          <td className="p-5 font-mono text-slate-500">TXN-{order.order_id.toString().slice(0,6)}</td>
                          <td className="p-5 text-violet-400">#{order.order_id.toString().slice(0,8)}</td>
                          <td className="p-5 text-white">{order.payment_method}</td>
                          <td className="p-5 text-right font-bold text-white">${order.order_total_amount.toFixed(2)}</td>
                          <td className="p-5 text-center"><span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold uppercase">Paid</span></td>
                      </tr>
                  ))}
              </tbody>
          </table>
       </div>
    </div>
  );
};

// ==========================================
//  SUB-COMPONENT: PROFILE TAB
// ==========================================
const ProfileTab = ({ displayData, handleProfileSave, isEditing, setIsEditing, editData, setEditData }) => {
  
  // Logic for image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if(file){
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData(prev => ({...prev, profileImage: reader.result}));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-fade-in-up shadow-2xl">
      <div className="h-40 bg-gradient-to-r from-violet-800 to-indigo-900 relative">
        <div className="absolute -bottom-12 left-6 md:left-8">
            <div className="relative group w-24 h-24">
                <div className="w-full h-full rounded-full bg-slate-950 p-1 ring-4 ring-slate-900 overflow-hidden">
                    {(isEditing ? editData.profileImage : displayData.profileImage) ? (
                        <img src={isEditing ? editData.profileImage : displayData.profileImage} className="w-full h-full rounded-full object-cover" alt="Profile"/>
                    ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center"><User size={32} className="text-slate-500"/></div>
                    )}
                </div>
                
                {/* Camera Icon Overlay - Only when Editing */}
                {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-violet-600 p-2 rounded-full cursor-pointer hover:bg-violet-500 shadow-lg border-2 border-slate-900 text-white transition-all transform hover:scale-110 active:scale-95">
                        <Camera size={14}/>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange}/>
                    </label>
                )}
            </div>
        </div>
      </div>
      <div className="pt-16 px-6 md:px-8 pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
          <div><h2 className="text-2xl font-bold text-white">{displayData.fullName}</h2><p className="text-slate-400">{displayData.email}</p><div className="mt-2 inline-block px-3 py-1 bg-slate-800 rounded text-xs font-mono text-violet-400">ID: {displayData.customerId}</div></div>
          <button onClick={() => setIsEditing(!isEditing)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 transition-colors w-full sm:w-auto">{isEditing ? 'Cancel' : 'Edit Profile'}</button>
        </div>
        {isEditing ? (
          <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-950/50 p-6 rounded-xl border border-slate-800">
            {['firstName', 'lastName', 'mobile', 'address', 'city', 'country'].map(field => (<div key={field}><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{field}</label><input type="text" value={editData[field]} onChange={e => setEditData({...editData, [field]: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-violet-500 outline-none"/></div>))}
            <button type="submit" className="md:col-span-2 bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-lg font-bold transition-colors">Update Profile</button>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700"><h4 className="text-sm text-slate-400 font-bold uppercase mb-3 flex items-center gap-2"><MapPin size={16}/> Address</h4><p className="text-white text-lg">{displayData.address}</p><p className="text-slate-400">{displayData.city}, {displayData.country}</p></div>
            <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700"><h4 className="text-sm text-slate-400 font-bold uppercase mb-3 flex items-center gap-2"><Phone size={16}/> Contact</h4><p className="text-white text-lg">{displayData.mobile || "Not set"}</p><p className="text-slate-400">{displayData.email}</p></div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
//  MAIN COMPONENT: USER DASHBOARD
// ==========================================
const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch(); 
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [firebaseProfile, setFirebaseProfile] = useState(null);
  const [liveOrders, setLiveOrders] = useState([]); 
  const [topProducts, setTopProducts] = useState([]); // State for Top Products
  
  // Filters
  const currentYear = new Date().getFullYear();
  const yearsList = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
  const [filters, setFilters] = useState({ year: 'All', month: 'All', category: 'All' });

  // UI State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [returnReason, setReturnReason] = useState("Wrong Size");

  // --- DATA FETCHING ---
  useEffect(() => {
    let unsubscribeOrders = () => {}; 
    const init = async () => {
      setLoading(true);
      if (user?.uid) {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
             const data = docSnap.data();
             setFirebaseProfile(data);
             setEditFormData({
               firstName: data.firstName || "", lastName: data.lastName || "", email: data.email || user.email || "",
               mobile: data.mobile || "", address: data.address || "", city: data.city || "", country: data.country || "", profileImage: data.profileImage || ""
             });
          }
          const q = query(collection(db, "OrderItems"), where("userId", "==", user.uid));
          unsubscribeOrders = onSnapshot(q, (snapshot) => {
              const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date() }));
              fetched.sort((a, b) => b.createdAt - a.createdAt);
              setLiveOrders(fetched);
              setLoading(false);
          });
        } catch (e) { console.error(e); setLoading(false); }
      } else { setLoading(false); }
    };
    init();
    return () => unsubscribeOrders();
  }, [user]);

  // --- COMPUTE TOP PRODUCTS (Highest Rating & Sales) ---
  useEffect(() => {
    if (products.length > 0 && staticItems.length > 0) {
        // 1. Calculate Sales Count per product
        const productSales = {};
        staticItems.forEach(item => {
            productSales[item.product_id] = (productSales[item.product_id] || 0) + (item.ordered_quantity || 1);
        });

        // 2. Merge Sales Count into Products
        const productsWithStats = products.map(p => ({
            ...p,
            sales_count: productSales[p.product_id] || 0
        }));

        // 3. Sort: First by Sales (Popularity), Then by Rating (Quality)
        // Adjust weight as needed. Here, both are important.
        const sortedProducts = productsWithStats.sort((a, b) => {
            // Sort by sales desc
            if (b.sales_count !== a.sales_count) {
                return b.sales_count - a.sales_count;
            }
            // If sales equal, sort by rating desc
            return (b.product_rating || 0) - (a.product_rating || 0);
        });

        setTopProducts(sortedProducts);
    }
  }, []);

  // --- DATA COMPUTATION ---
  const matchedCustomer = useMemo(() => user?.email ? customers.find(c => c.customer_email.toLowerCase() === user.email.toLowerCase()) : null, [user]);
  const customerAddressObj = useMemo(() => matchedCustomer ? staticAddresses.find(a => a.customer_id === matchedCustomer.customer_id) : null, [matchedCustomer]);

  const displayData = useMemo(() => ({
    customerId: matchedCustomer?.customer_id || (user?.uid ? user.uid.substring(0, 8).toUpperCase() : 'N/A'),
    firstName: firebaseProfile?.firstName || matchedCustomer?.first_name || 'Guest',
    fullName: `${firebaseProfile?.firstName || matchedCustomer?.first_name || ''} ${firebaseProfile?.lastName || matchedCustomer?.last_name || ''}`.trim() || 'User',
    email: firebaseProfile?.email || matchedCustomer?.customer_email || user?.email,
    address: firebaseProfile?.address || customerAddressObj?.address_line || 'N/A',
    city: firebaseProfile?.city || customerAddressObj?.city || '',
    country: firebaseProfile?.country || customerAddressObj?.country || '',
    mobile: firebaseProfile?.mobile || '',
    profileImage: firebaseProfile?.profileImage || matchedCustomer?.customer_image_url || ''
  }), [firebaseProfile, matchedCustomer, user, customerAddressObj]);

  const rawData = useMemo(() => {
    const customerId = matchedCustomer?.customer_id;
    const staticUserOrders = customerId ? staticOrders.filter(o => o.customer_id === customerId) : [];
    
    const formattedStatic = staticUserOrders.map(o => ({
        order_id: String(o.order_id), order_date: o.order_created_date, order_total_amount: o.order_total_amount, order_status: o.order_status, source: 'static',
        payment_method: staticPayments.find(p => p.order_id === o.order_id)?.payment_method || 'Card',
        items: staticItems.filter(i => i.order_id === o.order_id).map(i => ({ ...i, product_name: products.find(p => p.product_id === i.product_id)?.product_name || 'Item', category: products.find(p => p.product_id === i.product_id)?.product_category || 'Uncategorized' }))
    }));

    const formattedLive = liveOrders.map(order => ({
        order_id: order.id, order_date: order.createdAt, order_total_amount: Number(order.totalAmount) || 0, order_status: order.orderStatus || 'Pending', source: 'live', payment_method: 'Online',
        items: (order.items || []).map(i => ({ ...i, product_name: i.name || i.product_name || 'Item', category: i.category || 'Uncategorized', quantity: i.quantity || 1 }))
    }));
    return [...formattedLive, ...formattedStatic].sort((a,b) => new Date(b.order_date) - new Date(a.order_date));
  }, [matchedCustomer, liveOrders]);

  const filteredOrders = useMemo(() => {
    return rawData.filter(order => {
        const d = new Date(order.order_date);
        const matchesYear = filters.year === 'All' || d.getFullYear() === parseInt(filters.year);
        const matchesMonth = filters.month === 'All' || d.toLocaleString('default', { month: 'short' }) === filters.month;
        const matchesCategory = filters.category === 'All' || order.items.some(i => i.category === filters.category);
        return matchesYear && matchesMonth && matchesCategory;
    });
  }, [rawData, filters]);

  // --- ACTIONS ---
  const handleAddToCart = (product) => {
    dispatch(addItem({
        product_id: product.product_id,
        product_name: product.product_name,
        image_url: product.image_url,
        selling_unit_price: product.selling_unit_price
    }));
    toast.success(`${product.product_name} added to cart!`, { theme: "dark", icon: <ShoppingCart size={16}/>, position: "bottom-right" });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (user?.uid) {
        try {
            await setDoc(doc(db, 'users', user.uid), editFormData, { merge: true });
            setFirebaseProfile(prev => ({ ...prev, ...editFormData }));
            setIsEditingProfile(false);
            toast.success("Profile Updated!", { theme: "dark" });
        } catch { toast.error("Update failed.", { theme: "dark" }); }
    }
  };

  const openReturnModal = (order) => { setSelectedReturnOrder(order); setReturnModalOpen(true); };
  
  const handleReturnSubmit = async () => {
    if (!selectedReturnOrder) return;
    if (selectedReturnOrder.source === 'live') {
        try {
            await updateDoc(doc(db, "OrderItems", selectedReturnOrder.order_id), { orderStatus: "Return Requested", returnReason, returnDate: serverTimestamp() });
            await addDoc(collection(db, "notifications"), {
                type: "admin", subType: "return_request", title: "New Return Request",
                message: `Customer ${displayData.fullName} requested return for Order #${selectedReturnOrder.order_id.slice(0,6)}...`,
                orderId: selectedReturnOrder.order_id, customerId: user.uid, customerName: displayData.fullName,
                returnReason, createdAt: serverTimestamp(), isRead: false
            });
            toast.success("Return Requested!", { theme: "dark" });
        } catch { toast.error("Failed to request return.", { theme: "dark" }); }
    } else { toast.info("Demo Mode: Return logged locally.", { theme: "dark" }); }
    setReturnModalOpen(false);
  };

  // --- RENDER ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader size={48} className="animate-spin text-violet-500" /></div>;

  const availableCategories = ['All', ...new Set(products.map(p => p.product_category))];
  const availableMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="fixed inset-0 pointer-events-none"><div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px]" /><div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px]" /></div>

      <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-slate-800 pb-6">
            <div className="w-full md:w-auto">
                <h1 className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">Welcome back, {displayData.firstName}</h1>
                <p className="text-slate-400 mt-2 flex items-center gap-2 text-sm md:text-base">Customer ID: <span className="font-mono text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">{displayData.customerId}</span></p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 backdrop-blur-md overflow-x-auto w-full sm:w-auto scrollbar-hide">
                    {[{id:'overview', label:'Dashboard', icon:LayoutDashboard}, {id:'orders', label:'Orders', icon:ShoppingBag}, {id:'payments', label:'Payments', icon:CreditCard}, {id:'profile', label:'Profile', icon:User}].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span></button>
                    ))}
                </div>
                <div className="self-end sm:self-auto"><NotificationsPanel userId={user?.uid} /></div>
            </div>
        </header>

        {activeTab === 'overview' && <FeaturedProducts products={topProducts} onAddToCart={handleAddToCart} />}
        
        {activeTab === 'overview' && (
           <OverviewTab 
              orders={filteredOrders} 
              displayData={displayData}
              filters={filters} 
              setFilters={setFilters} 
              availableMonths={availableMonths} 
              yearsList={yearsList} 
              availableCategories={availableCategories} 
           />
        )}

        {activeTab === 'orders' && <OrdersTab orders={filteredOrders} onReturnClick={openReturnModal} />}
        {activeTab === 'payments' && <PaymentsTab orders={filteredOrders} />}
        {activeTab === 'profile' && <ProfileTab displayData={displayData} handleProfileSave={handleProfileSave} isEditing={isEditingProfile} setIsEditing={setIsEditingProfile} editData={editFormData} setEditData={setEditFormData} />}

        {returnModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in-up">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-4">Confirm Return</h3>
                    <div className="space-y-2 mb-6">{['Wrong Size', 'Damaged', 'Changed Mind', 'Other'].map(r => (<label key={r} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${returnReason === r ? 'bg-violet-600/20 border-violet-500 text-white' : 'bg-slate-800 border-slate-700 hover:bg-slate-800/80'}`}><input type="radio" value={r} checked={returnReason === r} onChange={e => setReturnReason(e.target.value)} className="accent-violet-500"/><span className="text-sm">{r}</span></label>))}</div>
                    <div className="flex gap-3"><button onClick={() => setReturnModalOpen(false)} className="flex-1 py-2 bg-slate-800 rounded-lg text-slate-300 hover:bg-slate-700">Cancel</button><button onClick={handleReturnSubmit} className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold">Submit</button></div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;