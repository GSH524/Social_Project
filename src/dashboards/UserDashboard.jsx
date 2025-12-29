import React, { useContext, useState, useEffect, useMemo } from "react";
import { db } from "../firebase"; 
import { AuthContext } from "../context/AuthContext";
// --- DATA IMPORTS ---
import { customers, orders as staticOrders, orderItems as staticItems, orderReturns } from "../data/dataUtils.js";
import products from "../data/product.js"; 
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

// --- ICONS & CHARTS ---
import { 
  Loader, User, ShoppingBag, CreditCard, LayoutDashboard, Edit, Calendar, 
  TrendingUp, ArrowUpRight, ArrowDownRight, Package, DollarSign, Activity, MapPin, Phone, Mail, Navigation,
  Tag, AlertCircle
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';

// --- CHART REGISTRATION ---
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';
ChartJS.defaults.font.family = "'Inter', sans-serif";

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [locLoading, setLocLoading] = useState(false);
  
  // Data States
  const [firebaseProfile, setFirebaseProfile] = useState(null);
  const [liveOrders, setLiveOrders] = useState([]); 
  
  // Filters
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: "", lastName: "", email: "", mobile: "",
    address: "", city: "", country: "", profileImage: ""
  });

  // ==========================================
  //  1. FETCH DATA
  // ==========================================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (user?.uid) {
        try {
          // A. Fetch Profile
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
              const data = docSnap.data();
              setFirebaseProfile(data);
              setEditFormData({
                firstName: data.firstName || "", lastName: data.lastName || "",
                email: data.email || user.email || "", mobile: data.mobile || "",
                address: data.address || "", city: data.city || "",
                country: data.country || "", profileImage: data.profileImage || ""
              });
          }

          // B. Fetch Live Orders
          const q = query(collection(db, "OrderItems"), where("userId", "==", user.uid));
          const orderSnap = await getDocs(q);
          const fetchedOrders = orderSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date() 
          }));
          
          fetchedOrders.sort((a, b) => b.createdAt - a.createdAt);
          setLiveOrders(fetchedOrders);

        } catch (error) { console.error("Error fetching dashboard data:", error); }
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // ==========================================
  //  2. DATA PROCESSING & MERGING
  // ==========================================

  const matchedCustomer = useMemo(() => 
    user?.email ? customers.find(c => c.customer_email.toLowerCase() === user.email.toLowerCase()) : null
  , [user]);

  const displayData = useMemo(() => {
    return {
      firstName: firebaseProfile?.firstName || matchedCustomer?.first_name || 'Guest',
      fullName: `${firebaseProfile?.firstName || matchedCustomer?.first_name || ''} ${firebaseProfile?.lastName || matchedCustomer?.last_name || ''}`.trim() || 'User',
      email: firebaseProfile?.email || matchedCustomer?.customer_email || user?.email,
      address: firebaseProfile?.address || matchedCustomer?.customer_address || 'N/A',
      city: firebaseProfile?.city || matchedCustomer?.customer_city || '',
      country: firebaseProfile?.country || matchedCustomer?.customer_country || '',
      mobile: firebaseProfile?.mobile || '',
      profileImage: firebaseProfile?.profileImage || matchedCustomer?.customer_image_url || ''
    };
  }, [firebaseProfile, matchedCustomer, user]);

  const rawData = useMemo(() => {
    // 1. Static Data (Legacy)
    const customerId = matchedCustomer?.customer_id;
    const staticUserOrders = customerId ? staticOrders.filter(o => o.customer_id === customerId) : [];
    
    // 2. Live Data (Firebase)
    const formattedLiveOrders = liveOrders.map(order => ({
        order_id: order.id,
        order_date: order.createdAt,
        order_total_amount: Number(order.totalAmount) || 0,
        order_status: order.orderStatus || 'Pending',
        source: 'live',
        items: order.items || []
    }));

    const combinedOrders = [...formattedLiveOrders, ...staticUserOrders];

    // 3. Extract Items for Charts
    let combinedItems = [];
    
    // Static Items
    if (customerId) {
        const userOrderIds = new Set(staticUserOrders.map(o => o.order_id));
        const staticUserItems = staticItems.filter(item => userOrderIds.has(item.order_id));
        combinedItems = [...staticUserItems];
    }

    // Live Items
    liveOrders.forEach(order => {
        if(order.items && Array.isArray(order.items)) {
            order.items.forEach((item, idx) => {
                combinedItems.push({
                    order_item_id: `${order.id}-${idx}`,
                    order_id: order.id,
                    product_id: item.product_id,
                    product_name: item.name || item.product_name,
                    quantity: item.quantity,
                    total_amount: (Number(item.selling_unit_price) * item.quantity) || 0,
                    source: 'live'
                });
            });
        }
    });

    // 4. Returns Logic (Static Only for now)
    // In a real app, you'd check live order status for "Returned"
    const staticReturnIds = new Set(orderReturns.map(r => r.order_item_id));
    const returnedItems = combinedItems.filter(i => {
        if(i.source === 'live') return false; // Assume live items aren't returned yet for demo
        return staticReturnIds.has(i.order_item_id);
    });

    return { orders: combinedOrders, items: combinedItems, returns: returnedItems }; 
  }, [matchedCustomer, liveOrders]);

  // Apply Filters
  const filteredData = useMemo(() => {
    let fOrders = rawData.orders;
    if (selectedYear !== 'All') {
      fOrders = fOrders.filter(o => new Date(o.order_date).getFullYear().toString() === selectedYear);
    }
    if (selectedMonth !== 'All') {
        fOrders = fOrders.filter(o => {
            const date = new Date(o.order_date);
            return date.toLocaleString('default', { month: 'long' }) === selectedMonth;
        });
    }
    const fOrderIds = new Set(fOrders.map(o => o.order_id));
    const fItems = rawData.items.filter(i => fOrderIds.has(i.order_id));
    // Filter returns to only those associated with the filtered orders
    const fReturns = rawData.returns.filter(r => fOrderIds.has(r.order_id));
    
    return { orders: fOrders, items: fItems, returns: fReturns };
  }, [rawData, selectedYear, selectedMonth]);

  // ==========================================
  //  3. KPI CALCULATIONS
  // ==========================================
  
  const kpiTotalOrders = filteredData.orders.length;
  
  const kpiTotalSpend = filteredData.orders.reduce((acc, curr) => acc + curr.order_total_amount, 0);
  
  const kpiReturnedOrders = filteredData.orders.filter(o => o.order_status === 'Returned' || o.order_status === 'Cancelled').length 
                            + filteredData.returns.length; // Approximate logic combining order status + item returns
  
  const kpiActiveOrders = filteredData.orders.filter(o => ['Pending', 'Shipped', 'Processing'].includes(o.order_status)).length;
  
  const kpiAvgOrderValue = kpiTotalOrders > 0 ? (kpiTotalSpend / kpiTotalOrders) : 0;

  const formatRupees = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  // ==========================================
  //  4. CHART DATA GENERATION
  // ==========================================

  // Chart 1: Order Trends (Daily Volume)
  const lineChartData = useMemo(() => {
    const grouped = {};
    const sortedOrders = [...filteredData.orders].sort((a,b) => new Date(a.order_date) - new Date(b.order_date));
    sortedOrders.forEach(o => {
        const date = new Date(o.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        grouped[date] = (grouped[date] || 0) + 1;
    });
    return {
        labels: Object.keys(grouped),
        datasets: [{
            label: 'Orders', data: Object.values(grouped), borderColor: '#8b5cf6',
            backgroundColor: (ctx) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)'); gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
              return gradient;
            },
            borderWidth: 3, tension: 0.4, fill: true, pointBackgroundColor: '#8b5cf6'
        }]
    };
  }, [filteredData]);

  // Chart 2: Category Split
  const pieChartData = useMemo(() => {
    const grouped = {};
    filteredData.items.forEach(item => {
        const prod = products.find(p => String(p.product_id) === String(item.product_id));
        const category = prod ? prod.product_category : 'Other'; 
        grouped[category] = (grouped[category] || 0) + item.total_amount;
    });
    return {
        labels: Object.keys(grouped),
        datasets: [{
            data: Object.values(grouped),
            backgroundColor: ['#8b5cf6', '#06b6d4', '#f43f5e', '#f59e0b', '#10b981', '#6366f1'],
            borderWidth: 0
        }]
    };
  }, [filteredData]);

  // Chart 3: Top Spending Products
  const barSpendData = useMemo(() => {
    const grouped = {};
    filteredData.items.forEach(item => {
        const prod = products.find(p => String(p.product_id) === String(item.product_id));
        const name = prod ? prod.product_name : (item.product_name || `Item #${item.product_id}`);
        grouped[name] = (grouped[name] || 0) + item.total_amount;
    });
    const sorted = Object.entries(grouped).sort((a,b) => b[1] - a[1]).slice(0, 5);
    return {
        labels: sorted.map(i => i[0].length > 15 ? i[0].substring(0,15)+'...' : i[0]),
        datasets: [{ label: 'Spend', data: sorted.map(i => i[1]), backgroundColor: '#06b6d4', borderRadius: 6, barThickness: 20 }]
    };
  }, [filteredData]);

  // Chart 4: Highest Returns (Based on Static Return Data)
  const barReturnData = useMemo(() => {
    const grouped = {};
    // Only map static returns for now as live returns aren't implemented
    filteredData.returns.forEach(ret => {
        const item = staticItems.find(i => i.order_item_id === ret.order_item_id);
        if (item) {
             const prod = products.find(p => p.product_id === item.product_id);
             const name = prod ? prod.product_name : 'Unknown';
             grouped[name] = (grouped[name] || 0) + 1;
        }
    });
    // Add logic: If an order status is 'Returned', count all its items
    filteredData.orders.filter(o => o.order_status === 'Returned').forEach(o => {
        const itemsInOrder = filteredData.items.filter(i => i.order_id === o.order_id);
        itemsInOrder.forEach(i => {
             const name = i.product_name || 'Unknown Item';
             grouped[name] = (grouped[name] || 0) + i.quantity;
        });
    });

    const sorted = Object.entries(grouped).sort((a,b) => b[1] - a[1]).slice(0, 5);
    return {
        labels: sorted.map(i => i[0].length > 15 ? i[0].substring(0,15)+'...' : i[0]),
        datasets: [{ label: 'Returned Units', data: sorted.map(i => i[1]), backgroundColor: '#f43f5e', borderRadius: 6, barThickness: 20 }]
    };
  }, [filteredData]);

  // ==========================================
  //  UI HANDLERS
  // ==========================================
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditFormData(prev => ({ ...prev, profileImage: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid), editFormData, { merge: true });
        setFirebaseProfile(prev => ({ ...prev, ...editFormData }));
        setIsEditingProfile(false);
        alert("Profile updated successfully!");
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                const data = await response.json();
                setEditFormData(prev => ({ ...prev, city: data.city || data.locality || '', country: data.countryName || '' }));
            } catch (error) { alert("Could not retrieve city name."); }
            setLocLoading(false);
        },
        () => { setLocLoading(false); alert("Unable to retrieve location."); }
    );
  };

  // --- RENDER ---
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader size={48} className="animate-spin text-violet-500" />
    </div>
  );

  const commonChartOptions = {
    responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false }, ticks: { color: '#94a3b8' } }, y: { grid: { color: 'rgba(148, 163, 184, 0.05)' }, ticks: { color: '#94a3b8' } } }
  };
  const horizontalChartOptions = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
    scales: { x: { grid: { color: 'rgba(148, 163, 184, 0.05)' }, ticks: { color: '#94a3b8' } }, y: { grid: { display: false }, ticks: { color: '#e2e8f0' } } }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-500/30 relative overflow-x-hidden">
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-violet-600/20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-cyan-600/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />

      <div className="relative z-10 p-3 md:p-8 max-w-[1600px] mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-8 md:mb-10 border-b border-slate-800/60 pb-6 md:pb-8">
            <div className="space-y-3 w-full xl:w-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" /> Live Dashboard
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 drop-shadow-lg leading-tight">
                    Welcome, <br className="md:hidden" /> {displayData.firstName}
                </h1>
                <p className="text-slate-400 text-sm md:text-lg max-w-2xl">
                    Here is your overview. You have <span className="text-white font-semibold">{kpiActiveOrders} active orders</span>.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
                <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md min-w-max shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)]">
                    {[
                        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                        { id: 'products', label: 'Products', icon: Tag },
                        { id: 'profile', label: 'Profile', icon: User },
                        { id: 'orders', label: 'Orders', icon: ShoppingBag },
                        { id: 'payments', label: 'Payments', icon: CreditCard },
                    ].map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap
                                ${activeTab === tab.id 
                                    ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] ring-1 ring-violet-400/50' 
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800 hover:shadow-inner'}
                            `}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </header>

        {/* MAIN CONTENT */}
        <div className="animate-fade-in-up">
            
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <>
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
                         <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-lg border border-slate-800 text-slate-400 text-sm shadow-md w-full sm:w-auto">
                             <Calendar size={16} className="text-violet-400" /> Filters:
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full sm:w-auto bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500">
                                <option value="All">All Years</option>
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                            </select>
                            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full sm:w-auto bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500">
                                <option value="All">All Months</option>
                                {['January','February','March','April','May','June','July','August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 mb-8">
                        {[
                            { title: 'Total Orders', value: kpiTotalOrders, icon: Package, color: 'text-violet-400', trend: '+12%', trendUp: true },
                            { title: 'Total Spend', value: formatRupees(kpiTotalSpend), icon: DollarSign, color: 'text-cyan-400', trend: '+5.4%', trendUp: true },
                            { title: 'Returned', value: kpiReturnedOrders, icon: AlertCircle, color: 'text-rose-400', trend: '-2%', trendUp: false },
                            { title: 'Active Orders', value: kpiActiveOrders, icon: TrendingUp, color: 'text-amber-400', trend: 'Live', trendUp: true },
                            { title: 'Avg Order Val', value: formatRupees(kpiAvgOrderValue), icon: Activity, color: 'text-emerald-400', trend: '+1.2%', trendUp: true },
                        ].map((kpi, idx) => (
                            <div key={idx} className={`bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 hover:border-slate-600 transition-all duration-300 group shadow-lg`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2.5 rounded-lg bg-slate-800/50 border border-slate-700 ${kpi.color}`}>
                                        <kpi.icon size={20} />
                                    </div>
                                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-slate-800 border border-slate-700 ${kpi.trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {kpi.trendUp ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                                        {kpi.trend}
                                    </div>
                                </div>
                                <h2 className={`text-2xl font-bold text-white mb-1`}>{kpi.value}</h2>
                                <p className="text-xs font-medium text-slate-400 uppercase">{kpi.title}</p>
                            </div>
                        ))}
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-xl">
                            <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-violet-500" /> Order Trends</h3>
                            <div className="h-64 md:h-72"><Line data={lineChartData} options={commonChartOptions} /></div>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-xl">
                            <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2"><Activity size={18} className="text-cyan-500" /> Category Split</h3>
                            <div className="h-64 md:h-72 relative"><Doughnut data={pieChartData} options={{ maintainAspectRatio: false }} /></div>
                        </div>
                    </div>

                    {/* Charts Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-xl">
                            <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2"><DollarSign size={18} className="text-emerald-500" /> Top Spending Products</h3>
                            <div className="h-64"><Bar data={barSpendData} options={horizontalChartOptions} /></div>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-xl">
                            <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2"><AlertCircle size={18} className="text-rose-500" /> Highest Returns</h3>
                            <div className="h-64"><Bar data={barReturnData} options={horizontalChartOptions} /></div>
                        </div>
                    </div>
                </>
            )}

            {/* Other tabs remain the same (Products, Profile, Orders, Payments) */}
            {/* ... (These sections from previous code can be pasted here unchanged if needed, omitted for brevity as specifically asked for Dash/Graphs) ... */}
            {/* For completeness, here is the Order History Table logic again to ensure it works */}
            {activeTab === 'orders' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
                    <div className="p-6 border-b border-slate-800"><h3 className="text-lg font-bold text-white flex items-center gap-2"><ShoppingBag size={20} className="text-violet-500"/> Order History</h3></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="p-5 font-semibold">Order ID</th>
                                    <th className="p-5 font-semibold">Date</th>
                                    <th className="p-5 font-semibold text-right">Amount</th>
                                    <th className="p-5 font-semibold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {rawData.orders.map(order => (
                                    <tr key={order.order_id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-5 text-sm font-medium text-violet-300">#{order.order_id.toString().slice(-8)}</td>
                                        <td className="p-5 text-sm text-slate-300">{new Date(order.order_date).toLocaleDateString()}</td>
                                        <td className="p-5 text-sm text-white font-bold text-right">{formatRupees(order.order_total_amount)}</td>
                                        <td className="p-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${order.order_status === 'Processing' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                {order.order_status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {rawData.orders.length === 0 && <div className="p-8 text-center text-slate-500">No orders found.</div>}
                    </div>
                </div>
            )}
            
            {activeTab === 'profile' && (
                <div className="max-w-5xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
                    <div className="h-24 md:h-32 bg-gradient-to-r from-violet-900 to-slate-900"></div>
                    <div className="px-4 md:px-8 pb-8 relative">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12 mb-8">
                            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-slate-950 p-1.5 ring-4 ring-slate-800 shadow-2xl relative">
                                {displayData.profileImage ? <img src={displayData.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-slate-500"><User size={40} /></div>}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{displayData.fullName}</h2>
                                <p className="text-violet-400 font-medium text-sm md:text-base">{displayData.email}</p>
                            </div>
                            <button onClick={() => { setEditFormData(displayData); setIsEditingProfile(!isEditingProfile); }} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium border border-white/10 flex items-center gap-2 text-sm">
                                <Edit size={16} /> {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                            </button>
                        </div>

                        {isEditingProfile ? (
                            <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                                {['firstName', 'lastName', 'mobile', 'address', 'city', 'country'].map(field => (
                                    <div key={field} className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">{field}</label>
                                        <input type="text" value={editFormData[field]} onChange={e => setEditFormData({...editFormData, [field]: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" />
                                    </div>
                                ))}
                                <button type="submit" className="md:col-span-2 bg-violet-600 hover:bg-violet-500 text-white py-3.5 rounded-xl font-bold mt-2">Save Changes</button>
                            </form>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800/50 flex items-center gap-4"><MapPin className="text-slate-400" size={20}/><span className="text-white">{displayData.address || 'No Address Set'}</span></div>
                                <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800/50 flex items-center gap-4"><Phone className="text-slate-400" size={20}/><span className="text-white">{displayData.mobile || 'No Phone Set'}</span></div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'payments' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
                    <div className="p-6 border-b border-slate-800"><h3 className="text-lg font-bold text-white flex items-center gap-2"><CreditCard size={20} className="text-emerald-500"/> Payment History</h3></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="p-5 font-semibold">Reference</th>
                                    <th className="p-5 font-semibold">Date</th>
                                    <th className="p-5 font-semibold text-right">Amount</th>
                                    <th className="p-5 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {rawData.orders.map(order => (
                                    <tr key={order.order_id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-5 text-sm font-mono text-slate-400">TXN-{order.order_id.toString().slice(-6)}</td>
                                        <td className="p-5 text-sm text-slate-300">{new Date(order.order_date).toLocaleDateString()}</td>
                                        <td className="p-5 text-sm text-white font-bold text-right">{formatRupees(order.order_total_amount)}</td>
                                        <td className="p-5"><span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Paid</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default UserDashboard;