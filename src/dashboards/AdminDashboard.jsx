import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { 
  LayoutDashboard, ShoppingBag, Users, Package, Settings, FileText, 
  BarChart2, Menu, X, User, Camera, Loader, TrendingUp, Filter, Calendar, Bell, Check, AlertCircle
} from 'lucide-react';
import { auth, db } from "../firebase"; 
import { doc, getDoc, updateDoc, collection, getDocs, onSnapshot, query, where, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";

// Static Data Utils
import { 
  customers as initialCustomers, 
  products as initialProducts, 
  orderItems as initialOrderItems 
} from "../data/dataUtils.js";

// Components
import AdminOrders from './AdminOrders';
import AdminProducts from './AdminProducts';
import AdminCustomers from './AdminCustomers';
import AdminAnalytics from './AdminAnalytics';
import AdminReports from './AdminReports';
import AdminSettings from './AdminSettings';

// Register ChartJS Components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';

// --- SUB-COMPONENT: ADMIN NOTIFICATION BELL ---
const AdminNotificationPanel = ({ onUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    // Listen for ADMIN notifications
    const q = query(
      collection(db, "notifications"), 
      where("type", "==", "admin") 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      notes.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNotifications(notes);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id) => {
    await deleteDoc(doc(db, "notifications", id));
  };

  const handleAcceptReturn = async (notification) => {
    if(!notification.fullOrderId || !notification.senderId) return;
    setProcessingId(notification.id);

    try {
        // 1. Update Order Status to "Returned"
        const orderRef = doc(db, "OrderItems", notification.fullOrderId);
        await updateDoc(orderRef, {
            orderStatus: "Returned",
            returnAcceptedAt: new Date()
        });

        // 2. Notify User
        await addDoc(collection(db, "notifications"), {
            type: "user",
            recipientId: notification.senderId,
            message: `Your return request for Order #${notification.fullOrderId.slice(0,6)}... has been ACCEPTED.`,
            createdAt: serverTimestamp(),
            read: false
        });

        // 3. Remove this notification
        await deleteDoc(doc(db, "notifications", notification.id));
        
        // 4. Trigger dashboard refresh
        if(onUpdate) onUpdate();
        
        alert("Return Accepted and User Notified.");
    } catch (error) {
        console.error("Error accepting return:", error);
        alert("Failed to accept return.");
    } finally {
        setProcessingId(null);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-slate-400 hover:text-white transition-colors">
        <Bell size={24} />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h4 className="font-bold text-white text-sm">Notifications</h4>
            <button onClick={() => setIsOpen(false)}><X size={16} className="text-slate-500 hover:text-white"/></button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No new notifications</div>
            ) : (
              notifications.map(note => (
                <div key={note.id} className="p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2 items-center">
                        <div className="p-1 bg-amber-500/10 rounded text-amber-500"><AlertCircle size={14}/></div>
                        <span className="text-xs font-bold text-white">{note.senderName}</span>
                    </div>
                    <button onClick={() => markAsRead(note.id)} className="text-slate-500 hover:text-rose-400">
                        <X size={14}/>
                    </button>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{note.message}</p>
                  
                  {note.fullOrderId && (
                      <button 
                        onClick={() => handleAcceptReturn(note)}
                        disabled={processingId === note.id}
                        className="w-full py-1.5 mt-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors flex justify-center items-center gap-2"
                      >
                         {processingId === note.id ? <Loader className="animate-spin" size={12}/> : "Accept Return"}
                      </button>
                  )}
                  <p className="text-[10px] text-slate-500 mt-2 text-right">{note.createdAt?.toDate().toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};


const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- FILTER STATE ---
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(''); // "" = All Months

  // Profile & Data State
  const [adminProfile, setAdminProfile] = useState({ firstName: '', lastName: '', email: '', role: 'Admin', profileImage: '' });
  const [editFormData, setEditFormData] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState([]); 
  const [customers, setCustomers] = useState(initialCustomers);
  const [loadingData, setLoadingData] = useState(true);

  // --- DATA SYNC ---
  const fetchAllData = useCallback(async () => {
    setLoadingData(true);
    try {
      // 1. PRODUCTS
      const prodSnap = await getDocs(collection(db, "products"));
      const dbProds = prodSnap.docs.map(d => ({ ...d.data(), product_id: parseInt(d.id) || d.id }));
      const dbProdIds = new Set(dbProds.map(p => p.product_id));
      setProducts([...dbProds, ...initialProducts.filter(p => !dbProdIds.has(p.product_id))]);

      // 2. ORDERS
      const staticOrdersMap = {};
      if (initialOrderItems && initialOrderItems.length > 0) {
        initialOrderItems.forEach(item => {
          const oId = item.order_id;
          if (!staticOrdersMap[oId]) {
            staticOrdersMap[oId] = {
              order_id: oId,
              order_date: new Date(2023, 9 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
              customer_id: `Demo-User-${oId % 100}`, 
              order_status: item.is_returned ? "Returned" : "Delivered",
              order_total_amount: 0,
              payment_status: "Paid",
              isFirebase: false
            };
          }
          staticOrdersMap[oId].order_total_amount += (item.total_amount || 0);
          if (item.is_returned) staticOrdersMap[oId].order_status = "Returned";
        });
      }
      const calculatedStaticOrders = Object.values(staticOrdersMap);

      const firebaseSnap = await getDocs(collection(db, "OrderItems"));
      const firebaseOrders = firebaseSnap.docs.map(d => {
        const data = d.data();
        return {
          order_id: d.id, 
          order_date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          order_status: data.orderStatus || 'Pending',
          order_total_amount: Number(data.totalAmount) || 0,
          customer_id: data.userId || data.email || 'Guest',
          payment_status: data.paymentStatus || 'Paid',
          isFirebase: true
        };
      });

      setOrders([...calculatedStaticOrders, ...firebaseOrders].sort((a,b) => new Date(b.order_date) - new Date(a.order_date)));

      // 3. CUSTOMERS
      const custSnap = await getDocs(collection(db, "customers"));
      const dbCust = custSnap.docs.map(d => ({ ...d.data(), customer_id: parseInt(d.id) || d.id }));
      const userSnap = await getDocs(collection(db, "users"));
      const realUsers = userSnap.docs.map(d => ({
        customer_id: d.id, customer_full_name: `${d.data().firstName || ''} ${d.data().lastName || ''}`,
        customer_email: d.data().email, customer_image_url: d.data().profileImage,
        customer_city: d.data().city, customer_country: d.data().country,
        customer_created_date: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toLocaleDateString() : 'N/A',
        customer_is_active: true, type: 'User'
      }));
      const existingIds = new Set([...dbCust, ...realUsers].map(c => c.customer_id));
      setCustomers([...realUsers, ...dbCust, ...initialCustomers.filter(c => !existingIds.has(c.customer_id))]);

    } catch (err) { console.error(err); } finally { setLoadingData(false); }
  }, []);

  useEffect(() => {
    fetchAllData();
    const fetchProfile = async () => {
      if(auth.currentUser) {
        try {
          const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
          if(snap.exists()) setAdminProfile({ ...snap.data(), role: 'Admin' });
        } catch(e) { console.log("Profile not found"); }
      }
    };
    fetchProfile();
  }, [fetchAllData]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      if(auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), editFormData);
        setAdminProfile(p => ({...p, ...editFormData}));
        setShowProfileModal(false);
      }
    } catch(e) { alert("Error updating profile"); } finally { setIsSavingProfile(false); }
  };

  // --- FILTER LOGIC ---
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
        const d = new Date(o.order_date);
        const yearMatch = selectedYear ? d.getFullYear().toString() === selectedYear : true;
        const monthMatch = selectedMonth ? (d.getMonth() + 1).toString().padStart(2, '0') === selectedMonth : true;
        return yearMatch && monthMatch;
    });
  }, [orders, selectedYear, selectedMonth]);

  const totalRevenue = filteredOrders
    .filter(o => o.order_status !== "Cancelled" && o.order_status !== "Returned")
    .reduce((sum, o) => sum + (Number(o.order_total_amount) || 0), 0);

  // --- CHART DATA AGGREGATION ---
  const chartData = useMemo(() => {
    let labels = [];
    let revenueData = [];
    let ordersData = [];
    const statusDist = {};

    if (selectedMonth) {
      // === DAILY VIEW (When a Month is Selected) ===
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      labels = Array.from({length: daysInMonth}, (_, i) => `${i + 1}`);
      revenueData = new Array(daysInMonth).fill(0);
      ordersData = new Array(daysInMonth).fill(0);

      filteredOrders.forEach(o => {
        const d = new Date(o.order_date);
        const day = d.getDate();
        revenueData[day - 1] += Number(o.order_total_amount) || 0;
        ordersData[day - 1] += 1;
        statusDist[o.order_status] = (statusDist[o.order_status] || 0) + 1;
      });
    } else {
      // === MONTHLY VIEW (Year Selected) ===
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      revenueData = new Array(12).fill(0);
      ordersData = new Array(12).fill(0);
      
      filteredOrders.forEach(o => {
        const d = new Date(o.order_date);
        const month = d.getMonth();
        revenueData[month] += Number(o.order_total_amount) || 0;
        ordersData[month] += 1;
        statusDist[o.order_status] = (statusDist[o.order_status] || 0) + 1;
      });
    }

    return {
       labels,
       revenue: revenueData,
       orders: ordersData,
       statusLabels: Object.keys(statusDist),
       statusValues: Object.values(statusDist)
    };
  }, [filteredOrders, selectedYear, selectedMonth]);


  // Helper for Dropdown Options
  const years = [2022, 2023, 2024, 2025, 2026];
  const months = [
    { value: '01', label: 'January' }, { value: '02', label: 'February' },
    { value: '03', label: 'March' }, { value: '04', label: 'April' },
    { value: '05', label: 'May' }, { value: '06', label: 'June' },
    { value: '07', label: 'July' }, { value: '08', label: 'August' },
    { value: '09', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'customers', icon: Users, label: 'Customers' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics' },
    { id: 'reports', icon: FileText, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full font-sans text-slate-200 bg-[#0f172a] selection:bg-violet-500/30 relative">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]"/>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]"/>
      </div>

      {/* --- ADMIN TOOLBAR --- */}
      <nav className="h-20 bg-black/20 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-10 shrink-0 relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-full transition-colors">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 className="text-2xl font-bold tracking-tight text-white">GSH&nbsp;<span className="text-violet-500">Admin</span></h2>
        </div>

        <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1.5 rounded-full border border-white/5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium ${
                activeSection === item.id 
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          {/* ADMIN NOTIFICATION BELL */}
          <AdminNotificationPanel onUpdate={fetchAllData} />

          <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setEditFormData(adminProfile); setShowProfileModal(true); }}>
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold text-white group-hover:text-violet-400 transition-colors">{adminProfile.firstName}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">{adminProfile.role}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                {adminProfile.profileImage ? <img src={adminProfile.profileImage} className="w-full h-full object-cover" alt="p"/> : <span className="font-bold text-white text-sm">{adminProfile.firstName?.[0]}</span>}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- MOBILE MENU --- */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full h-[calc(100vh-80px)] bg-slate-900/95 backdrop-blur-2xl z-40 border-t border-white/5 flex flex-col p-6 animate-fade-in-up">
            <div className="space-y-2">
              {navItems.map((item) => (
                  <button key={item.id} onClick={() => { setActiveSection(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-medium ${activeSection === item.id ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  <item.icon size={20} />
                  <span className="text-lg">{item.label}</span>
                  </button>
              ))}
            </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative z-10">
        {loadingData ? (
          <div className="flex h-full items-center justify-center flex-col gap-4 text-slate-500 animate-pulse">
            <Loader className="animate-spin text-violet-500" size={40}/> <span className="text-sm tracking-widest uppercase">Syncing Database...</span>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {activeSection === 'dashboard' && (
              <div className="space-y-8 animate-fade-in-up">
                
                {/* Header with Year/Month Dropdowns */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">Welcome back, {adminProfile.firstName}</h1>
                    <p className="text-slate-400 mt-1 text-sm lg:text-base">
                        {selectedMonth 
                          ? `Analytics for ${months.find(m=>m.value===selectedMonth)?.label}, ${selectedYear}` 
                          : `Annual Overview for ${selectedYear}`}
                    </p>
                  </div>
                  
                  {/* --- FILTER DROPDOWNS --- */}
                  <div className="flex gap-3 bg-black/20 border border-white/10 p-2 rounded-xl">
                      {/* Year Selector */}
                      <div className="relative group">
                          <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-slate-500"><Calendar size={14}/></div>
                          <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-transparent text-white text-sm pl-8 pr-2 py-1.5 outline-none cursor-pointer appearance-none hover:bg-white/5 rounded-lg transition-colors [&>option]:bg-slate-900"
                          >
                             {years.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                      </div>

                      <div className="w-px bg-white/10 h-6 my-auto"></div>

                      {/* Month Selector */}
                      <div className="relative group">
                          <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-slate-500"><Filter size={14}/></div>
                          <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent text-white text-sm pl-8 pr-8 py-1.5 outline-none cursor-pointer appearance-none hover:bg-white/5 rounded-lg transition-colors [&>option]:bg-slate-900 w-full min-w-[120px]"
                          >
                             <option value="">All Months</option>
                             {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                          </select>
                      </div>

                      {(selectedMonth || selectedYear !== currentYear) && (
                          <button 
                            onClick={()=>{setSelectedYear(currentYear); setSelectedMonth('');}}
                            className="text-xs text-slate-500 hover:text-white px-2 border-l border-white/10"
                          >
                            Reset
                          </button>
                      )}
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {[
                    { label: 'Total Orders', value: filteredOrders.length, color: 'text-blue-400', from: 'from-blue-600/20', to: 'to-blue-900/5', icon: ShoppingBag },
                    { label: 'Revenue', value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, color: 'text-emerald-400', from: 'from-emerald-600/20', to: 'to-emerald-900/5', icon: BarChart2 },
                    { label: 'Customers', value: customers.length, color: 'text-violet-400', from: 'from-violet-600/20', to: 'to-violet-900/5', icon: Users },
                    { label: 'Products', value: products.length, color: 'text-amber-400', from: 'from-amber-600/20', to: 'to-amber-900/5', icon: Package },
                  ].map((stat, idx) => (
                    <div key={idx} className="relative overflow-hidden bg-white/5 border border-white/5 p-6 rounded-3xl group hover:border-white/10 transition-all duration-300 hover:-translate-y-1 shadow-xl">
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.from} ${stat.to} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}/>
                      <div className="relative z-10 flex justify-between items-start">
                        <div><p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p><h3 className={`text-2xl lg:text-3xl font-bold ${stat.color} drop-shadow-sm`}>{stat.value}</h3></div>
                        <div className={`p-3 rounded-2xl bg-white/5 ${stat.color} ring-1 ring-white/5 shadow-inner`}> <stat.icon size={22}/> </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* --- CHARTS ROW 1 (Line + Pie) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Revenue Line Chart */}
                  <div className="lg:col-span-2 bg-white/5 border border-white/5 rounded-3xl p-6 lg:p-8 backdrop-blur-sm relative overflow-hidden shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6">Revenue Trend ({selectedMonth ? 'Daily' : 'Monthly'})</h3>
                    <div className="h-60 lg:h-72 w-full">
                      <Line 
                        data={{ 
                          labels: chartData.labels, 
                          datasets: [{ 
                            label: 'Revenue', 
                            data: chartData.revenue, 
                            borderColor: '#8b5cf6', 
                            backgroundColor: 'rgba(139, 92, 246, 0.1)', 
                            fill: true, 
                            tension: 0.4, 
                            pointBackgroundColor: '#8b5cf6' 
                          }] 
                        }} 
                        options={{ 
                          responsive: true, 
                          maintainAspectRatio: false, 
                          plugins: { legend: { display: false } }, 
                          scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } 
                        }} 
                      />
                    </div>
                  </div>

                  {/* Order Status Pie Chart */}
                  <div className="bg-white/5 border border-white/5 rounded-3xl p-6 lg:p-8 backdrop-blur-sm relative shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6">Order Status</h3>
                    <div className="h-64 flex justify-center">
                      <Pie 
                        data={{ 
                          labels: chartData.statusLabels, 
                          datasets: [{ 
                            data: chartData.statusValues, 
                            backgroundColor: ['#fbbf24', '#3b82f6', '#10b981', '#f43f5e'], 
                            borderWidth: 0 
                          }] 
                        }} 
                        options={{ 
                          plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', usePointStyle: true, padding: 20 } } } 
                        }} 
                      />
                    </div>
                  </div>
                </div>

                {/* --- CHARTS ROW 2 (Bar Chart) --- */}
                <div className="grid grid-cols-1">
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 lg:p-8 backdrop-blur-sm relative shadow-xl">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><TrendingUp size={20}/></div>
                            <h3 className="text-lg font-bold text-white">Order Volume ({selectedMonth ? 'Daily' : 'Monthly'})</h3>
                          </div>
                          <div className="h-60 lg:h-72 w-full">
                            <Bar
                                data={{
                                    labels: chartData.labels,
                                    datasets: [{
                                        label: 'Orders Count',
                                        data: chartData.orders,
                                        backgroundColor: '#10b981',
                                        borderRadius: 6,
                                        barThickness: selectedMonth ? 15 : 30 
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                                        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                                    }
                                }}
                            />
                          </div>
                    </div>
                </div>

              </div>
            )}

            {activeSection === 'products' && <AdminProducts initialProducts={products} onUpdate={fetchAllData} />}
            {activeSection === 'orders' && <AdminOrders initialOrders={filteredOrders} onUpdate={fetchAllData} />}
            {activeSection === 'customers' && <AdminCustomers initialCustomers={customers} onUpdate={fetchAllData} />}
            {activeSection === 'analytics' && <AdminAnalytics orders={filteredOrders} />}
            {activeSection === 'reports' && <AdminReports orders={filteredOrders} products={products} customers={customers} />}
            {activeSection === 'settings' && <AdminSettings />}
          </div>
        )}
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 flex justify-end relative z-10">
              <button onClick={()=>setShowProfileModal(false)} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors"><X size={20}/></button>
            </div>
            <div className="px-8 pb-8 overflow-y-auto space-y-6 relative z-10 -mt-6">
              <div className="flex flex-col items-center">
                <div className="relative group w-28 h-28 mb-4">
                  <div className="w-full h-full rounded-full border-4 border-[#0f172a] shadow-xl overflow-hidden bg-slate-800">
                    {editFormData.profileImage ? <img src={editFormData.profileImage} className="w-full h-full object-cover" alt="p"/> : <User className="w-full h-full p-6 text-slate-600"/>}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-violet-600 p-2 rounded-full cursor-pointer hover:bg-violet-500 shadow-lg border-4 border-[#0f172a]"><Camera size={16} className="text-white"/><input type="file" className="hidden" onChange={(e)=>{const file=e.target.files[0]; if(file){const r=new FileReader(); r.onloadend=()=>setEditFormData(p=>({...p,profileImage:r.result})); r.readAsDataURL(file)}}}/></label>
                </div>
                <h3 className="text-xl font-bold text-white">Edit Profile</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input value={editFormData.firstName || ''} onChange={e=>setEditFormData({...editFormData, firstName:e.target.value})} placeholder="First Name" className="bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none"/>
                <input value={editFormData.lastName || ''} onChange={e=>setEditFormData({...editFormData, lastName:e.target.value})} placeholder="Last Name" className="bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none"/>
              </div>
              <input value={editFormData.mobile || ''} onChange={e=>setEditFormData({...editFormData, mobile:e.target.value})} placeholder="Phone Number" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none"/>
              <input value={editFormData.address || ''} onChange={e=>setEditFormData({...editFormData, address:e.target.value})} placeholder="Address" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none"/>
              <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-violet-900/20 transition-all">{isSavingProfile ? <Loader className="animate-spin m-auto" size={20}/> : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;