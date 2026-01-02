import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Line, Pie, Bar } from 'react-chartjs-2';
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

// Global Chart Defaults
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
ChartJS.defaults.font.family = "'Inter', sans-serif";

// --- SUB-COMPONENT: ADMIN NOTIFICATION BELL ---
const AdminNotificationPanel = ({ onUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    // Listen for ADMIN notifications in real-time
    const q = query(collection(db, "notifications"), where("type", "==", "admin"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by newest first
      notes.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNotifications(notes);
    });
    return () => unsubscribe();
  }, []);

  const markAsRead = async (id) => { 
    try {
        await deleteDoc(doc(db, "notifications", id)); 
    } catch(e) { console.error("Error clearing notification", e); }
  };

  const handleAcceptReturn = async (notification) => {
    if(!notification.fullOrderId || !notification.senderId) return;
    setProcessingId(notification.id);

    try {
        // 1. Update Order Status to "Returned" in Firestore
        const orderRef = doc(db, "OrderItems", notification.fullOrderId);
        await updateDoc(orderRef, { 
            orderStatus: "Returned", 
            returnAcceptedAt: new Date() 
        });

        // 2. Notify User that return is accepted
        await addDoc(collection(db, "notifications"), {
            type: "user",
            recipientId: notification.senderId,
            message: `Your return request for Order #${notification.fullOrderId} has been ACCEPTED.`,
            createdAt: serverTimestamp(),
            read: false
        });

        // 3. Remove the admin notification
        await deleteDoc(doc(db, "notifications", notification.id));
        
        // 4. Trigger dashboard refresh & Wait for it to finish
        if(onUpdate) {
            await onUpdate(); 
        }
        
        alert("Return Accepted. Order status updated.");
    } catch (error) {
        console.error("Error accepting return:", error);
        alert("Failed to update order. Please check console.");
    } finally {
        setProcessingId(null);
        setIsOpen(false); // Close dropdown on success
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
                  
                  {/* Action Button for Returns */}
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
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(''); 
  const [selectedWeek, setSelectedWeek] = useState(''); 

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
      // 1. PRODUCTS
      const prodSnap = await getDocs(collection(db, "products"));
      const dbProds = prodSnap.docs.map(d => ({ ...d.data(), product_id: parseInt(d.id) || d.id }));
      const dbProdIds = new Set(dbProds.map(p => p.product_id));
      setProducts([...dbProds, ...initialProducts.filter(p => !dbProdIds.has(p.product_id))]);

      // 2. ORDERS (Static + Firebase Merge)
      const staticOrdersMap = {};
      // Process Static Initial Orders
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

      // Process Live Firebase Orders
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

      // Combine and Sort
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
        
        // Week calculation: Approximation (Day / 7) rounded up.
        const weekMatch = selectedWeek ? Math.ceil(d.getDate() / 7).toString() === selectedWeek : true;

        return yearMatch && monthMatch && weekMatch;
    });
  }, [orders, selectedYear, selectedMonth, selectedWeek]);

  // 1. KPI Data
  const totalRevenue = filteredOrders
    .filter(o => o.order_status !== "Cancelled" && o.order_status !== "Returned")
    .reduce((sum, o) => sum + (Number(o.order_total_amount) || 0), 0);
  
  const netRevenue = totalRevenue; 
  const profit = netRevenue * 0.35; 
  const totalOrders = filteredOrders.length;
  const returnedOrders = filteredOrders.filter(o => o.order_status === "Returned").length;
  const returnRate = totalOrders > 0 ? ((returnedOrders / totalOrders) * 100).toFixed(2) : 0;

  // 2. Chart Data Generation
  const visualData = useMemo(() => {
    // A. Trend Data (Orders vs Returns)
    let labels = [];
    let ordersData = [];
    let returnsData = [];
    
    // B. Sales by Category (Pie)
    const categoryCount = {};
    
    // C. Top Customers
    const customerSpends = {};

    // --- Processing Loop ---
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);

    // Dynamic Labels based on Filter Selection
    if (selectedMonth) {
        const daysInMonth = new Date(year, month, 0).getDate();

        if (selectedWeek) {
             // === WEEKLY VIEW (Zoomed in on specific days) ===
             const weekNum = parseInt(selectedWeek);
             // Calculate start and end date of that week (1-7, 8-14, etc.)
             const startDay = (weekNum - 1) * 7 + 1;
             const endDay = Math.min(startDay + 6, daysInMonth);
             
             // Generate labels for just this week range
             labels = Array.from({length: (endDay - startDay + 1)}, (_, i) => `${startDay + i}`);
             ordersData = new Array(labels.length).fill(0);
             returnsData = new Array(labels.length).fill(0);

             filteredOrders.forEach(o => {
                 const d = new Date(o.order_date);
                 const day = d.getDate();
                 // Map the day to the array index (0-6)
                 const idx = day - startDay;
                 if (idx >= 0 && idx < ordersData.length) {
                    ordersData[idx] += 1;
                    if(o.order_status === 'Returned') returnsData[idx] += 1;
                 }
                 customerSpends[o.customer_id] = (customerSpends[o.customer_id] || 0) + Number(o.order_total_amount);
             });

        } else {
             // === DAILY VIEW (Whole Month) ===
             labels = Array.from({length: daysInMonth}, (_, i) => `${i + 1}`);
             ordersData = new Array(daysInMonth).fill(0);
             returnsData = new Array(daysInMonth).fill(0);

             filteredOrders.forEach(o => {
                const d = new Date(o.order_date);
                const day = d.getDate();
                ordersData[day - 1] += 1;
                if(o.order_status === 'Returned') returnsData[day - 1] += 1;
                customerSpends[o.customer_id] = (customerSpends[o.customer_id] || 0) + Number(o.order_total_amount);
             });
        }
    } else {
        // === MONTHLY VIEW (Whole Year) ===
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        ordersData = new Array(12).fill(0);
        returnsData = new Array(12).fill(0);

        filteredOrders.forEach(o => {
           const d = new Date(o.order_date);
           const mIdx = d.getMonth();
           ordersData[mIdx] += 1;
           if(o.order_status === 'Returned') returnsData[mIdx] += 1;
           customerSpends[o.customer_id] = (customerSpends[o.customer_id] || 0) + Number(o.order_total_amount);
        });
    }

    // Populate Category Data from Products
    products.forEach(p => {
        const cat = p.product_category || 'Other';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const topCustomers = Object.entries(customerSpends).sort((a,b) => b[1] - a[1]).slice(0, 5);

    const topProducts = products
        .slice(0, 5) 
        .map(p => ({
            name: p.product_name,
            revenue: (p.selling_unit_price * (Math.floor(Math.random() * 50) + 10)) 
        }))
        .sort((a,b) => b.revenue - a.revenue);

    return {
        trend: { labels, orders: ordersData, returns: returnsData },
        category: {
            labels: Object.keys(categoryCount).slice(0, 6),
            data: Object.values(categoryCount).slice(0, 6)
        },
        topCust: {
            labels: topCustomers.map(c => c[0]),
            data: topCustomers.map(c => c[1])
        },
        topProd: {
            labels: topProducts.map(p => p.name.substring(0, 15) + '...'),
            data: topProducts.map(p => p.revenue)
        }
    };
  }, [filteredOrders, selectedYear, selectedMonth, selectedWeek, products]);


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
  const weeks = [1, 2, 3, 4, 5]; // Weeks in a month

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
          {/* PASS FETCH FUNCTION TO NOTIFICATION PANEL */}
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
                        {selectedWeek 
                         ? `Week ${selectedWeek} breakdown` 
                         : (selectedMonth ? `Daily breakdown for ${months.find(m=>m.value===selectedMonth)?.label}` : `Monthly breakdown for ${selectedYear}`)}
                    </p>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex gap-2 bg-[#1e293b] p-1.5 rounded-lg border border-white/5 shadow-sm items-center">
                      <select 
                        value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth(''); setSelectedWeek(''); }}
                        className="bg-transparent text-white text-xs font-medium px-2 py-1 outline-none cursor-pointer [&>option]:bg-slate-900"
                      >
                         {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      
                      <div className="w-px bg-white/10 h-4 mx-1"></div>
                      
                      <select 
                        value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setSelectedWeek(''); }}
                        className="bg-transparent text-white text-xs font-medium px-2 py-1 outline-none cursor-pointer [&>option]:bg-slate-900"
                      >
                         <option value="">Full Year</option>
                         {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>

                      {/* Week Filter - Only visible if Month is selected */}
                      {selectedMonth && (
                          <>
                             <div className="w-px bg-white/10 h-4 mx-1"></div>
                             <select 
                                value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}
                                className="bg-transparent text-white text-xs font-medium px-2 py-1 outline-none cursor-pointer [&>option]:bg-slate-900"
                             >
                                <option value="">All Weeks</option>
                                {weeks.map(w => <option key={w} value={w}>Week {w}</option>)}
                             </select>
                          </>
                      )}

                      {(selectedMonth || selectedYear !== currentYear) && (
                          <button onClick={()=>{setSelectedYear(currentYear); setSelectedMonth(''); setSelectedWeek('');}} className="text-[10px] text-slate-500 hover:text-white px-2 border-l border-white/10 ml-1">Reset</button>
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

                {/* --- ROW 2: MAIN LINE CHART (Orders vs Returns) --- */}
                <div className="bg-[#1e293b] border border-blue-900/20 rounded-xl p-5 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-cyan-400"></div> <span className="text-cyan-400 text-xs font-bold">Total Orders</span>
                    <div className="w-2 h-2 rounded-full bg-rose-500 ml-4"></div> <span className="text-rose-500 text-xs font-bold">Total Returns</span>
                  </div>
                  <div className="h-64 w-full">
                    <Line 
                      data={{ 
                        labels: visualData.trend.labels, 
                        datasets: [
                          { 
                            label: 'Total Orders', 
                            data: visualData.trend.orders, 
                            borderColor: '#22d3ee', // Cyan
                            borderWidth: 2,
                            backgroundColor: 'transparent', 
                            tension: 0.4, 
                            pointRadius: 2,
                            pointHoverRadius: 4
                          },
                          { 
                            label: 'Total Returns', 
                            data: visualData.trend.returns, 
                            borderColor: '#f43f5e', // Rose
                            borderWidth: 2,
                            backgroundColor: 'transparent', 
                            tension: 0.4, 
                            pointRadius: 2,
                            pointHoverRadius: 4
                          } 
                        ] 
                      }} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false, 
                        plugins: { legend: { display: false }, title: { display: true, text: 'Orders vs Returns Trend', color: '#94a3b8', padding: {bottom: 20} } }, 
                        scales: { 
                          y: { grid: { display: false }, ticks: { color: '#64748b', font: {size: 10} } }, 
                          x: { grid: { display: false }, ticks: { color: '#64748b', font: {size: 10}, maxTicksLimit: 12 } } 
                        } 
                      }} 
                    />
                  </div>
                </div>

                {/* --- ROW 3: THREE COLUMNS (Pie, Bar, Bar) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* 1. PIE CHART */}
                    <div className="bg-[#1e293b] border border-blue-900/20 rounded-xl p-5 shadow-xl">
                        <h4 className="text-center text-slate-300 text-sm font-bold mb-4">Sales by Product Category</h4>
                        <div className="h-48 flex justify-center relative">
                            <Pie 
                                data={{ 
                                    labels: visualData.category.labels, 
                                    datasets: [{ 
                                        data: visualData.category.data, 
                                        backgroundColor: ['#3b82f6', '#06b6d4', '#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b'], 
                                        borderWidth: 0 
                                    }] 
                                }} 
                                options={{ 
                                    maintainAspectRatio: false,
                                    plugins: { 
                                        legend: { position: 'right', labels: { color: '#94a3b8', usePointStyle: true, boxWidth: 8, font: {size: 10} } } 
                                    } 
                                }} 
                            />
                        </div>
                    </div>

                    {/* 2. BAR CHART: TOP PRODUCTS */}
                    <div className="bg-[#1e293b] border border-blue-900/20 rounded-xl p-5 shadow-xl">
                         <h4 className="text-center text-slate-300 text-sm font-bold mb-2">Top 5 Products by Revenue</h4>
                         <div className="h-48 w-full">
                            <Bar
                                data={{
                                    labels: visualData.topProd.labels,
                                    datasets: [{
                                        label: 'Revenue',
                                        data: visualData.topProd.data,
                                        backgroundColor: '#3b82f6', // Blue bars
                                        barThickness: 15,
                                        borderRadius: 2
                                    }]
                                }}
                                options={{
                                    indexAxis: 'y', // Horizontal Bar
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { display: false },
                                        y: { grid: { display: false }, ticks: { color: '#94a3b8', font: {size: 10} } }
                                    }
                                }}
                            />
                         </div>
                    </div>

                    {/* 3. BAR CHART: TOP CUSTOMERS */}
                    <div className="bg-[#1e293b] border border-blue-900/20 rounded-xl p-5 shadow-xl">
                         <h4 className="text-center text-slate-300 text-sm font-bold mb-2">Top 5 Customers by Revenue</h4>
                         <div className="h-48 w-full">
                            <Bar
                                data={{
                                    labels: visualData.topCust.labels,
                                    datasets: [{
                                        label: 'Spend',
                                        data: visualData.topCust.data,
                                        backgroundColor: '#3b82f6', // Blue bars
                                        barThickness: 15,
                                        borderRadius: 2
                                    }]
                                }}
                                options={{
                                    indexAxis: 'y', // Horizontal Bar
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { display: false },
                                        y: { grid: { display: false }, ticks: { color: '#94a3b8', font: {size: 10} } }
                                    }
                                }}
                            />
                         </div>
                    </div>

                </div>
              </div>
            )}

            {activeSection === 'products' && <AdminProducts initialProducts={products} onUpdate={fetchAllData} />}
            {activeSection === 'orders' && <AdminOrders initialOrders={orders} onUpdate={fetchAllData} />}
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