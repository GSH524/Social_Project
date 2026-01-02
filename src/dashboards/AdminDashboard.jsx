import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Line, Pie, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import {
  LayoutDashboard, ShoppingBag, Users, Package, Settings, FileText,
  BarChart2, Menu, X, User, Camera, Loader, Calendar, Bell, AlertCircle
} from 'lucide-react';
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, collection, getDocs, onSnapshot, query, where, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";

// Static Data Utils
import {
  customers as initialCustomers,
  products as initialProducts,
  orderItems as initialOrderItems,
  orders as initialStaticOrders,
  payments as initialPayments,
  shippments as initialShipments,
  orderReturns as initialReturns
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

// Global Chart Defaults
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
ChartJS.defaults.font.family = "'Inter', sans-serif";

// --- SUB-COMPONENT: ADMIN NOTIFICATION PANEL ---
const AdminNotificationPanel = ({ onUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "notifications"), where("type", "==", "admin"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      notes.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNotifications(notes);
    });
    return () => unsubscribe();
  }, []);

  const markAsRead = async (id) => {
    try { await deleteDoc(doc(db, "notifications", id)); }
    catch(e) { console.error("Error clearing notification", e); }
  };

  const handleAcceptReturn = async (notification) => {
    if(!notification.fullOrderId || !notification.senderId) return;
    setProcessingId(notification.id);

    try {
        const orderRef = doc(db, "OrderItems", notification.fullOrderId);
        await updateDoc(orderRef, { orderStatus: "Returned", returnAcceptedAt: new Date() });

        await addDoc(collection(db, "notifications"), {
            type: "user",
            recipientId: notification.senderId,
            message: `Your return request for Order #${notification.fullOrderId} has been ACCEPTED.`,
            createdAt: serverTimestamp(),
            read: false
        });

        await deleteDoc(doc(db, "notifications", notification.id));

        if(onUpdate) await onUpdate();

        alert("Return Accepted. Order status updated.");
    } catch (error) {
        console.error("Error accepting return:", error);
        alert("Failed to update order.");
    } finally {
        setProcessingId(null);
        setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-slate-400 hover:text-white transition-colors">
        <Bell size={24} />
        {notifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900"></span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h4 className="font-bold text-white text-sm">Notifications</h4>
            <button onClick={() => setIsOpen(false)}><X size={16} className="text-slate-500 hover:text-white"/></button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? <div className="p-4 text-center text-xs text-slate-500">No new notifications</div> : (
              notifications.map(note => (
                <div key={note.id} className="p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2 items-center">
                        <div className="p-1 bg-amber-500/10 rounded text-amber-500"><AlertCircle size={14}/></div>
                        <span className="text-xs font-bold text-white">{note.senderName || 'System'}</span>
                    </div>
                    <button onClick={() => markAsRead(note.id)} className="text-slate-500 hover:text-rose-400"><X size={14}/></button>
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
                  <p className="text-[10px] text-slate-500 mt-2 text-right">{note.createdAt?.toDate ? note.createdAt.toDate().toLocaleString() : 'Just now'}</p>
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
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedDay, setSelectedDay] = useState('');

  // Data State
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
      // 1. Customers
      const custSnap = await getDocs(collection(db, "customers"));
      const dbCust = custSnap.docs.map(d => ({ ...d.data(), customer_id: parseInt(d.id) || d.id }));
      const userSnap = await getDocs(collection(db, "users"));
      const realUsers = userSnap.docs.map(d => ({
        customer_id: d.id,
        customer_full_name: `${d.data().firstName || ''} ${d.data().lastName || ''}`.trim() || 'Unknown User',
        customer_email: d.data().email,
        customer_image_url: d.data().profileImage,
        customer_city: d.data().city,
        customer_country: d.data().country,
        customer_created_date: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toLocaleDateString() : 'N/A',
        customer_is_active: true,
        type: 'User'
      }));
      const existingIds = new Set([...dbCust, ...realUsers].map(c => c.customer_id));
      const allCustomers = [...realUsers, ...dbCust, ...initialCustomers.filter(c => !existingIds.has(c.customer_id))];
      setCustomers(allCustomers);

      const customerNameMap = {};
      allCustomers.forEach(c => { customerNameMap[c.customer_id] = c.customer_full_name || `Customer ${c.customer_id}`; });

      // 2. Products
      const prodSnap = await getDocs(collection(db, "products"));
      const dbProds = prodSnap.docs.map(d => ({ ...d.data(), product_id: parseInt(d.id) || d.id }));
      const dbProdIds = new Set(dbProds.map(p => p.product_id));
      setProducts([...dbProds, ...initialProducts.filter(p => !dbProdIds.has(p.product_id))]);

      // 3. Orders
      const staticOrderUserMap = {};
      if(initialStaticOrders) {
          initialStaticOrders.forEach(o => { staticOrderUserMap[o.order_id] = o.customer_id; });
      }

      const staticOrdersAggregation = {};
      if (initialOrderItems && initialOrderItems.length > 0) {
        initialOrderItems.forEach(item => {
          const oId = item.order_id;
          if (!staticOrdersAggregation[oId]) {
            let realCustId = staticOrderUserMap[oId];
            if (!realCustId && allCustomers.length > 0) {
                const index = oId % allCustomers.length;
                realCustId = allCustomers[index].customer_id;
            }
            const custName = customerNameMap[realCustId] || `Customer ${realCustId || oId}`;
            const originalOrder = initialStaticOrders.find(o => o.order_id === oId);
            const orderDate = originalOrder ? originalOrder.order_created_date : new Date().toISOString();

            staticOrdersAggregation[oId] = {
              order_id: oId,
              order_date: new Date(orderDate).toISOString().split('T')[0],
              customer_id: custName,
              order_status: item.is_returned ? "Returned" : "Delivered",
              order_total_amount: 0,
              payment_status: "Paid",
              isFirebase: false,
              payment_method: "Credit Card"
            };
            const payment = initialPayments.find(p => p.order_id === oId);
            if (payment) staticOrdersAggregation[oId].payment_method = payment.payment_method;
          }
          staticOrdersAggregation[oId].order_total_amount += (item.total_amount || 0);
          if (item.is_returned) staticOrdersAggregation[oId].order_status = "Returned";
        });
      }
      const calculatedStaticOrders = Object.values(staticOrdersAggregation);

      const firebaseSnap = await getDocs(collection(db, "OrderItems"));
      const firebaseOrders = firebaseSnap.docs.map(d => {
        const data = d.data();
        const custName = customerNameMap[data.userId] || data.email || 'Guest';
        return {
          order_id: d.id,
          order_date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          order_status: data.orderStatus || 'Pending',
          order_total_amount: Number(data.totalAmount) || 0,
          customer_id: custName,
          payment_status: data.paymentStatus || 'Paid',
          isFirebase: true,
          payment_method: data.paymentMethod || 'Unknown'
        };
      });

      setOrders([...calculatedStaticOrders, ...firebaseOrders].sort((a,b) => new Date(b.order_date) - new Date(a.order_date)));

    } catch (err) { console.error("Error fetching data:", err); } finally { setLoadingData(false); }
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

  // --- ANALYTICS & FILTER LOGIC ---
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
        const d = new Date(o.order_date);
        const yearMatch = selectedYear ? d.getFullYear().toString() === selectedYear : true;
        const monthMatch = selectedMonth ? (d.getMonth() + 1).toString().padStart(2, '0') === selectedMonth : true;
        const weekMatch = selectedWeek ? Math.ceil(d.getDate() / 7).toString() === selectedWeek : true;
        const dayMatch = selectedDay ? d.getDate().toString() === selectedDay : true;
        return yearMatch && monthMatch && weekMatch && dayMatch;
    });
  }, [orders, selectedYear, selectedMonth, selectedWeek, selectedDay]);

  const totalRevenue = filteredOrders
    .filter(o => o.order_status !== "Cancelled" && o.order_status !== "Returned")
    .reduce((sum, o) => sum + (Number(o.order_total_amount) || 0), 0);
  const netRevenue = totalRevenue;
  const profit = netRevenue * 0.35;
  const totalOrders = filteredOrders.length;
  const returnedOrders = filteredOrders.filter(o => o.order_status === "Returned").length;
  const returnRate = totalOrders > 0 ? ((returnedOrders / totalOrders) * 100).toFixed(2) : 0;

  // --- CHART DATA GENERATION ---
  const visualData = useMemo(() => {
    let labels = [];
    let revenueData = [];
    let ordersData = [];
    const paymentMethodRevenue = {};
    const categoryRevenue = {};

    const year = selectedYear ? parseInt(selectedYear) : new Date().getFullYear();
    const month = selectedMonth ? parseInt(selectedMonth) : new Date().getMonth() + 1;

    // A. Trend Logic
    if (selectedMonth) {
        const daysInMonth = new Date(year, month, 0).getDate();
        if (selectedWeek) {
             const weekNum = parseInt(selectedWeek);
             const startDay = (weekNum - 1) * 7 + 1;
             const endDay = Math.min(startDay + 6, daysInMonth);
             labels = Array.from({length: (endDay - startDay + 1)}, (_, i) => `${startDay + i}`);
             revenueData = new Array(labels.length).fill(0);
             ordersData = new Array(labels.length).fill(0);
             filteredOrders.forEach(o => {
                 const d = new Date(o.order_date);
                 const idx = d.getDate() - startDay;
                 if (idx >= 0 && idx < revenueData.length) {
                    ordersData[idx] += 1;
                    if (o.order_status !== 'Returned' && o.order_status !== 'Cancelled') revenueData[idx] += Number(o.order_total_amount);
                 }
             });
        } else if (selectedDay) {
             labels = [`${selectedMonth}/${selectedDay}`];
             ordersData = [filteredOrders.length];
             revenueData = [filteredOrders.filter(o => o.order_status !== 'Returned' && o.order_status !== 'Cancelled').reduce((sum, o) => sum + Number(o.order_total_amount), 0)];
        } else {
             labels = Array.from({length: daysInMonth}, (_, i) => `${i + 1}`);
             revenueData = new Array(daysInMonth).fill(0);
             ordersData = new Array(daysInMonth).fill(0);
             filteredOrders.forEach(o => {
                const day = new Date(o.order_date).getDate();
                ordersData[day - 1] += 1;
                if (o.order_status !== 'Returned' && o.order_status !== 'Cancelled') revenueData[day - 1] += Number(o.order_total_amount);
             });
        }
    } else {
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        revenueData = new Array(12).fill(0);
        ordersData = new Array(12).fill(0);
        filteredOrders.forEach(o => {
           const mIdx = new Date(o.order_date).getMonth();
           ordersData[mIdx] += 1;
           if (o.order_status !== 'Returned' && o.order_status !== 'Cancelled') revenueData[mIdx] += Number(o.order_total_amount);
        });
    }

    // B. Aggregations (Optimized)
    const validOrderIds = new Set(filteredOrders
        .filter(o => o.order_status !== 'Returned' && o.order_status !== 'Cancelled')
        .map(o => o.order_id));

    // Payment Method
    filteredOrders.forEach(o => {
        if (validOrderIds.has(o.order_id)) {
            const pm = o.payment_method || 'Unknown';
            paymentMethodRevenue[pm] = (paymentMethodRevenue[pm] || 0) + Number(o.order_total_amount);
        }
    });

    // Product Category
    const productMap = new Map(products.map(p => [p.product_id, p.product_category || 'Other']));
    initialOrderItems.forEach(item => {
        if (validOrderIds.has(item.order_id)) {
            const cat = productMap.get(item.product_id) || 'Other';
            categoryRevenue[cat] = (categoryRevenue[cat] || 0) + Number(item.total_amount);
        }
    });

    const sortedCategories = Object.entries(categoryRevenue)
        .sort((a, b) => b[1] - a[1]) 
        .slice(0, 6); 

    return {
        trend: { labels, revenue: revenueData, orders: ordersData },
        paymentMethod: {
            labels: Object.keys(paymentMethodRevenue),
            data: Object.values(paymentMethodRevenue)
        },
        categoryRevenue: {
            labels: sortedCategories.map(c => c[0]),
            data: sortedCategories.map(c => c[1])
        }
    };
  }, [filteredOrders, selectedYear, selectedMonth, selectedWeek, selectedDay, products]);


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
  const weeks = [1, 2, 3, 4, 5]; 
  const days = Array.from({length: 31}, (_, i) => i + 1);

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
    <div className="flex flex-col h-[calc(100vh-80px)] w-full font-sans text-slate-200 bg-[#0f172a] selection:bg-cyan-500/30 relative">

      {/* --- ADMIN TOOLBAR --- */}
      <nav className="h-20 bg-[#1e293b]/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-10 shrink-0 relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-full transition-colors">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 className="text-2xl font-bold tracking-tight text-white">GSH&nbsp;<span className="text-cyan-400">Admin</span></h2>
        </div>

        <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1.5 rounded-full border border-white/5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium ${
                activeSection === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          <AdminNotificationPanel onUpdate={fetchAllData} />

          <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setEditFormData(adminProfile); setShowProfileModal(true); }}>
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold text-white">{adminProfile.firstName}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">{adminProfile.role}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 p-[2px]">
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
                  <button key={item.id} onClick={() => { setActiveSection(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-medium ${activeSection === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  <item.icon size={20} />
                  <span className="text-lg">{item.label}</span>
                  </button>
              ))}
            </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative z-10 bg-[#0f172a]">
        {loadingData ? (
          <div className="flex h-full items-center justify-center flex-col gap-4 text-slate-500 animate-pulse">
            <Loader className="animate-spin text-cyan-500" size={40}/> <span className="text-sm tracking-widest uppercase">Syncing Database...</span>
          </div>
        ) : (
          <div className="max-w-[1600px] mx-auto">
            {activeSection === 'dashboard' && (
              <div className="space-y-6 animate-fade-in-up">

                {/* --- TOP BAR: Title & Filter --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Executive Overview</h1>
                    <p className="text-slate-400 text-sm">
                        {selectedDay
                          ? `Daily breakdown for ${selectedMonth}/${selectedDay}/${selectedYear}`
                          : (selectedWeek
                            ? `Week ${selectedWeek} breakdown`
                            : (selectedMonth ? `Daily breakdown for ${months.find(m=>m.value===selectedMonth)?.label}`
                            : (selectedYear ? `Monthly breakdown for ${selectedYear}` : "All-Time Overview")))}
                    </p>
                  </div>

                  {/* Filters */}
                  <div className="flex gap-2 bg-[#1e293b] p-1.5 rounded-lg border border-white/5 shadow-sm items-center">
                      <select
                        value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth(''); setSelectedWeek(''); setSelectedDay(''); }}
                        className="bg-transparent text-white text-xs font-medium px-2 py-1 outline-none cursor-pointer [&>option]:bg-slate-900"
                      >
                          <option value="">All Years</option>
                          {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>

                      <div className="w-px bg-white/10 h-4 mx-1"></div>

                      <select
                        value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setSelectedWeek(''); setSelectedDay(''); }}
                        className="bg-transparent text-white text-xs font-medium px-2 py-1 outline-none cursor-pointer [&>option]:bg-slate-900"
                      >
                          <option value="">All Months</option>
                          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>

                      {selectedMonth && (
                          <>
                             <div className="w-px bg-white/10 h-4 mx-1"></div>
                             <select
                                value={selectedWeek} onChange={(e) => { setSelectedWeek(e.target.value); setSelectedDay(''); }}
                                className="bg-transparent text-white text-xs font-medium px-2 py-1 outline-none cursor-pointer [&>option]:bg-slate-900"
                             >
                                <option value="">All Weeks</option>
                                {weeks.map(w => <option key={w} value={w}>Week {w}</option>)}
                             </select>
                          </>
                      )}

                       {selectedMonth && (
                           <>
                              <div className="w-px bg-white/10 h-4 mx-1"></div>
                              <select
                                 value={selectedDay} onChange={(e) => { setSelectedDay(e.target.value); setSelectedWeek(''); }}
                                 className="bg-transparent text-white text-xs font-medium px-2 py-1 outline-none cursor-pointer [&>option]:bg-slate-900"
                              >
                                 <option value="">All Days</option>
                                 {days.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                           </>
                       )}

                      {(selectedMonth || selectedYear) && (
                          <button onClick={()=>{setSelectedYear(''); setSelectedMonth(''); setSelectedWeek(''); setSelectedDay('');}} className="text-[10px] text-slate-500 hover:text-white px-2 border-l border-white/10 ml-1">Reset</button>
                      )}
                  </div>
                </div>

                {/* --- ROW 1: KPI CARDS --- */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Total Revenue', value: `${(totalRevenue/1000).toFixed(2)}K`, sub: 'Gross Income' },
                    { label: 'Net Revenue', value: `${(netRevenue/1000).toFixed(2)}K`, sub: 'After Returns' },
                    { label: 'Total Profit', value: `${(profit/1000).toFixed(2)}K`, sub: 'Est. Margin' },
                    { label: 'Total Orders', value: totalOrders, sub: 'All Status' },
                    { label: 'Total Customers', value: `${(customers.length/1000).toFixed(1)}K`, sub: 'Active Base' },
                    { label: 'Return Rate %', value: `${returnRate}%`, sub: 'Of Total Orders' },
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-[#1e293b] border border-blue-900/30 p-4 rounded-xl shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80"></div>
                      <h3 className="text-2xl font-bold text-white mt-1 group-hover:scale-105 transition-transform origin-left">{stat.value}</h3>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* --- ROW 2: TWO MAIN TREND CHARTS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* 1. NET REVENUE TREND */}
                  <div className="bg-[#1e293b] border border-blue-900/20 rounded-xl p-5 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <h4 className="text-slate-300 text-sm font-bold">Net Revenue Trend</h4>
                      <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                          <span className="text-emerald-400 text-xs font-bold">Net Revenue (₹)</span>
                      </div>
                    </div>
                    <div className="h-72 w-full relative z-10">
                      <Line
                        data={{
                          labels: visualData.trend.labels,
                          datasets: [{
                              label: 'Net Revenue',
                              data: visualData.trend.revenue,
                              borderColor: '#34d399', // Emerald
                              borderWidth: 3,
                              backgroundColor: (context) => {
                                const ctx = context.chart.ctx;
                                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                                gradient.addColorStop(0, 'rgba(52, 211, 153, 0.3)');
                                gradient.addColorStop(1, 'rgba(52, 211, 153, 0)');
                                return gradient;
                              },
                              fill: true,
                              tension: 0.4,
                              pointRadius: 4,
                              pointHoverRadius: 6,
                              pointBackgroundColor: '#34d399',
                              pointBorderColor: '#0f172a',
                              pointBorderWidth: 2,
                            }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: { mode: 'index', intersect: false },
                          plugins: {
                            legend: { display: false },
                            title: { display: false },
                            tooltip: {
                              backgroundColor: 'rgba(15, 23, 42, 0.9)',
                              titleColor: '#fff',
                              bodyColor: '#94a3b8',
                              borderColor: 'rgba(255, 255, 255, 0.1)',
                              borderWidth: 1,
                              padding: 10,
                              boxPadding: 4,
                              usePointStyle: true,
                            }
                          },
                          scales: {
                            y: {
                              grid: { color: 'rgba(255, 255, 255, 0.05)', borderDash: [5, 5] },
                              ticks: { color: '#64748b', font: {size: 10}, padding: 10, callback: (val) => '₹' + val/1000 + 'k' }
                            },
                            x: {
                              grid: { display: false },
                              ticks: { color: '#64748b', font: {size: 10}, maxTicksLimit: 12, padding: 10 }
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0f172a] to-transparent pointer-events-none"></div>
                  </div>

                  {/* 2. ORDERS TREND */}
                  <div className="bg-[#1e293b] border border-blue-900/20 rounded-xl p-5 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <h4 className="text-slate-300 text-sm font-bold">Total Orders Trend</h4>
                      <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]"></div>
                          <span className="text-blue-400 text-xs font-bold">Total Orders</span>
                      </div>
                    </div>
                    <div className="h-72 w-full relative z-10">
                      <Line
                        data={{
                          labels: visualData.trend.labels,
                          datasets: [{
                              label: 'Total Orders',
                              data: visualData.trend.orders,
                              borderColor: '#60a5fa', // Blue
                              borderWidth: 3,
                              backgroundColor: (context) => {
                                const ctx = context.chart.ctx;
                                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                                gradient.addColorStop(0, 'rgba(96, 165, 250, 0.3)');
                                gradient.addColorStop(1, 'rgba(96, 165, 250, 0)');
                                return gradient;
                              },
                              fill: true,
                              tension: 0.4,
                              pointRadius: 4,
                              pointHoverRadius: 6,
                              pointBackgroundColor: '#60a5fa',
                              pointBorderColor: '#0f172a',
                              pointBorderWidth: 2,
                            }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: { mode: 'index', intersect: false },
                          plugins: {
                            legend: { display: false },
                            title: { display: false },
                            tooltip: {
                              backgroundColor: 'rgba(15, 23, 42, 0.9)',
                              titleColor: '#fff',
                              bodyColor: '#94a3b8',
                              borderColor: 'rgba(255, 255, 255, 0.1)',
                              borderWidth: 1,
                              padding: 10,
                              boxPadding: 4,
                              usePointStyle: true,
                            }
                          },
                          scales: {
                            y: {
                              grid: { color: 'rgba(255, 255, 255, 0.05)', borderDash: [5, 5] },
                              ticks: { color: '#64748b', font: {size: 10}, padding: 10 }
                            },
                            x: {
                              grid: { display: false },
                              ticks: { color: '#64748b', font: {size: 10}, maxTicksLimit: 12, padding: 10 }
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0f172a] to-transparent pointer-events-none"></div>
                  </div>

                </div>

                {/* --- ROW 3: THREE COLUMNS (Donut, Bar) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* 1. DONUT CHART: NET REVENUE BY PAYMENT METHOD */}
                    <div className="bg-[#1e293b] border border-blue-900/20 rounded-xl p-5 shadow-xl relative overflow-hidden lg:col-span-1">
                        <h4 className="text-center text-slate-300 text-sm font-bold mb-4 relative z-10">Net Revenue by Payment Method</h4>
                        <div className="h-64 flex justify-center relative z-10">
                            <Doughnut
                                data={{
                                    labels: visualData.paymentMethod.labels,
                                    datasets: [{
                                        data: visualData.paymentMethod.data,
                                        backgroundColor: ['#3b82f6', '#06b6d4', '#8b5cf6', '#d946ef', '#f43f5e'],
                                        borderWidth: 2,
                                        borderColor: '#0f172a',
                                        hoverBorderWidth: 4,
                                    }]
                                }}
                                options={{
                                    maintainAspectRatio: false,
                                    cutout: '70%',
                                    plugins: {
                                        legend: {
                                          position: 'right',
                                          labels: {
                                            color: '#94a3b8',
                                            usePointStyle: true,
                                            pointStyle: 'circle',
                                            boxWidth: 8,
                                            font: {size: 11},
                                            padding: 15
                                          }
                                        },
                                        tooltip: {
                                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                          bodyColor: '#fff',
                                          borderColor: 'rgba(255, 255, 255, 0.1)',
                                          borderWidth: 1,
                                          padding: 10,
                                          boxPadding: 4,
                                          usePointStyle: true,
                                          callbacks: {
                                            label: function(context) {
                                                const label = context.label || '';
                                                const value = context.parsed || 0;
                                                return `${label}: ₹${(value/1000).toFixed(1)}k`;
                                            }
                                          }
                                        }
                                    }
                                }}
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
                    </div>

                    {/* 2. BAR CHART: NET REVENUE BY PRODUCT CATEGORY (Sorted & Horizontal) */}
                    <div className="bg-[#1e293b] border border-blue-900/20 rounded-xl p-5 shadow-xl relative overflow-hidden lg:col-span-2">
                          <h4 className="text-center text-slate-300 text-sm font-bold mb-4 relative z-10">Net Revenue by Product Category</h4>
                          <div className="h-64 w-full relative z-10">
                            <Bar
                                data={{
                                    labels: visualData.categoryRevenue.labels,
                                    datasets: [{
                                        label: 'Net Revenue',
                                        data: visualData.categoryRevenue.data,
                                        backgroundColor: (context) => {
                                          const ctx = context.chart.ctx;
                                          const gradient = ctx.createLinearGradient(0, 0, 300, 0);
                                          gradient.addColorStop(0, '#3b82f6');
                                          gradient.addColorStop(1, '#06b6d4');
                                          return gradient;
                                        },
                                        barThickness: 20,
                                        borderRadius: 8,
                                        borderSkipped: false,
                                    }]
                                }}
                                options={{
                                    indexAxis: 'y', // Horizontal Layout
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: { display: false },
                                      tooltip: {
                                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                        titleColor: '#fff',
                                        bodyColor: '#94a3b8',
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                        borderWidth: 1,
                                        padding: 10,
                                        boxPadding: 4,
                                        callbacks: {
                                            label: (context) => `Revenue: ₹${(context.parsed.x/1000).toFixed(1)}k`
                                        }
                                      }
                                    },
                                    scales: {
                                        x: { display: false },
                                        y: {
                                          grid: { display: false },
                                          ticks: {
                                            color: '#94a3b8',
                                            font: {size: 11, weight: '500'},
                                            padding: 8,
                                            crossAlign: 'far',
                                          }
                                        }
                                    }
                                }}
                            />
                         </div>
                         <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 pointer-events-none"></div>
                    </div>

                </div>
              </div>
            )}

            {/* --- UPDATED: PASSING FULL PROPS TO SUB-COMPONENTS --- */}
            {activeSection === 'products' && (
                <AdminProducts
                    initialProducts={products}
                    orders={orders}
                    orderItems={initialOrderItems}
                    payments={initialPayments}
                    onUpdate={fetchAllData}
                />
            )}

            {activeSection === 'orders' && <AdminOrders initialOrders={orders} onUpdate={fetchAllData} />}
            {activeSection === 'customers' && <AdminCustomers initialCustomers={customers} orders={orders} onUpdate={fetchAllData} />}
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
                  <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-500 shadow-lg border-4 border-[#0f172a]"><Camera size={16} className="text-white"/><input type="file" className="hidden" onChange={(e)=>{const file=e.target.files[0]; if(file){const r=new FileReader(); r.onloadend=()=>setEditFormData(p=>({...p,profileImage:r.result})); r.readAsDataURL(file)}}}/></label>
                </div>
                <h3 className="text-xl font-bold text-white">Edit Profile</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input value={editFormData.firstName || ''} onChange={e=>setEditFormData({...editFormData, firstName:e.target.value})} placeholder="First Name" className="bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"/>
                <input value={editFormData.lastName || ''} onChange={e=>setEditFormData({...editFormData, lastName:e.target.value})} placeholder="Last Name" className="bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"/>
              </div>
              <input value={editFormData.mobile || ''} onChange={e=>setEditFormData({...editFormData, mobile:e.target.value})} placeholder="Phone Number" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"/>
              <input value={editFormData.address || ''} onChange={e=>setEditFormData({...editFormData, address:e.target.value})} placeholder="Address" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"/>
              <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all">{isSavingProfile ? <Loader className="animate-spin m-auto" size={20}/> : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;