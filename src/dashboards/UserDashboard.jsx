import React, { useContext, useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
// --- DATA IMPORTS ---
import { customers, orders, orderItems, orderReturns } from "../data/dataUtils.js";
import products from "../data/product.js"; 
import { doc, getDoc, setDoc } from "firebase/firestore";

// --- ICONS & CHARTS ---
import { 
  Loader, ChevronDown, User, ShoppingBag, CreditCard, LayoutDashboard, Edit, Calendar, 
  TrendingUp, ArrowUpRight, ArrowDownRight, Package, DollarSign, Activity, MapPin, Phone, Mail, Navigation,
  Tag, ShoppingCart, Camera, Upload
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
  const [firebaseProfile, setFirebaseProfile] = useState(null);
  
  // Filters
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Initialize Form Data
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    country: "",
    profileImage: ""
  });

  // ==========================================
  //  DATA LOGIC
  // ==========================================

  const matchedCustomer = useMemo(() => 
    user?.email ? customers.find(c => c.customer_email.toLowerCase() === user.email.toLowerCase()) : null
  , [user]);

  const displayData = useMemo(() => {
    return {
      firstName: firebaseProfile?.firstName || matchedCustomer?.first_name || 'Guest',
      lastName: firebaseProfile?.lastName || matchedCustomer?.last_name || '',
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
    if (!matchedCustomer) return { orders: [], items: [], returns: [] };
    const customerId = matchedCustomer.customer_id;
    const userOrders = orders.filter(o => o.customer_id === customerId);
    const userOrderIds = new Set(userOrders.map(o => o.order_id));
    const userItems = orderItems.filter(item => userOrderIds.has(item.order_id));
    const userItemIds = new Set(userItems.map(i => i.order_item_id));
    const userReturns = orderReturns.filter(ret => userItemIds.has(ret.order_item_id));
    return { orders: userOrders, items: userItems, returns: userReturns };
  }, [matchedCustomer]);

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
    const fItemIds = new Set(fItems.map(i => i.order_item_id));
    const fReturns = rawData.returns.filter(r => fItemIds.has(r.order_item_id));
    return { orders: fOrders, items: fItems, returns: fReturns };
  }, [rawData, selectedYear, selectedMonth]);

  const productStats = useMemo(() => {
    const stats = {};
    filteredData.items.forEach(item => {
        const prod = products.find(p => p.product_id === item.product_id);
        if (prod) {
            if (!stats[item.product_id]) {
                stats[item.product_id] = { ...prod, personalSpend: 0, personalQty: 0, ordersCount: 0 };
            }
            stats[item.product_id].personalSpend += item.total_amount;
            stats[item.product_id].personalQty += (item.quantity || 1); 
            stats[item.product_id].ordersCount += 1;
        }
    });
    return Object.values(stats).sort((a, b) => b.personalSpend - a.personalSpend);
  }, [filteredData]);

  const kpiTotalOrders = filteredData.orders.length;
  const kpiTotalSpend = filteredData.orders.reduce((acc, curr) => acc + curr.order_total_amount, 0);
  const kpiReturnedOrders = filteredData.returns.length;
  const kpiActiveOrders = filteredData.orders.filter(o => ['Pending', 'Shipped'].includes(o.order_status)).length;
  const kpiAvgOrderValue = kpiTotalOrders > 0 ? (kpiTotalSpend / kpiTotalOrders) : 0;

  const formatRupees = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const lineChartData = useMemo(() => {
    const grouped = {};
    filteredData.orders.forEach(o => {
        const date = new Date(o.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
        grouped[date] = (grouped[date] || 0) + 1;
    });
    return {
        labels: Object.keys(grouped),
        datasets: [{
            label: 'Orders',
            data: Object.values(grouped),
            borderColor: '#8b5cf6',
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
              gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
              return gradient;
            },
            borderWidth: 3, tension: 0.4, fill: true, pointBackgroundColor: '#8b5cf6', pointBorderColor: '#fff', pointRadius: 4, pointHoverRadius: 6
        }]
    };
  }, [filteredData]);

  const pieChartData = useMemo(() => {
    const grouped = {};
    filteredData.items.forEach(item => {
        const prod = products.find(p => p.product_id === item.product_id);
        if (prod) grouped[prod.product_category] = (grouped[prod.product_category] || 0) + item.total_amount;
    });
    return {
        labels: Object.keys(grouped),
        datasets: [{
            data: Object.values(grouped),
            backgroundColor: ['#8b5cf6', '#06b6d4', '#f43f5e', '#f59e0b', '#10b981', '#6366f1'],
            borderWidth: 0, hoverOffset: 10
        }]
    };
  }, [filteredData]);

  const barSpendData = useMemo(() => {
    const grouped = {};
    filteredData.items.forEach(item => {
        const prod = products.find(p => p.product_id === item.product_id);
        if (prod) grouped[prod.product_name] = (grouped[prod.product_name] || 0) + item.total_amount;
    });
    const sorted = Object.entries(grouped).sort((a,b) => b[1] - a[1]).slice(0, 5);
    return {
        labels: sorted.map(i => i[0].length > 18 ? i[0].substring(0,18)+'...' : i[0]),
        datasets: [{
            label: 'Spend', data: sorted.map(i => i[1]), backgroundColor: '#06b6d4', borderRadius: 6, barThickness: 20
        }]
    };
  }, [filteredData]);

  const barReturnData = useMemo(() => {
    const grouped = {};
    filteredData.returns.forEach(ret => {
        const item = orderItems.find(i => i.order_item_id === ret.order_item_id);
        if (item) {
            const prod = products.find(p => p.product_id === item.product_id);
            if (prod) grouped[prod.product_name] = (grouped[prod.product_name] || 0) + 1;
        }
    });
    const sorted = Object.entries(grouped).sort((a,b) => b[1] - a[1]).slice(0, 5);
    return {
        labels: sorted.map(i => i[0].length > 18 ? i[0].substring(0,18)+'...' : i[0]),
        datasets: [{
            label: 'Returns', data: sorted.map(i => i[1]), backgroundColor: '#f43f5e', borderRadius: 6, barThickness: 20
        }]
    };
  }, [filteredData]);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      if (user?.uid) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
              const data = docSnap.data();
              setFirebaseProfile(data);
              setEditFormData({
                firstName: data.firstName || matchedCustomer?.first_name || "",
                lastName: data.lastName || matchedCustomer?.last_name || "",
                email: data.email || user.email || "",
                mobile: data.mobile || "",
                address: data.address || matchedCustomer?.customer_address || "",
                city: data.city || matchedCustomer?.customer_city || "",
                country: data.country || matchedCustomer?.customer_country || "",
                profileImage: data.profileImage || matchedCustomer?.customer_image_url || ""
              });
          } else {
              setEditFormData({
                firstName: matchedCustomer?.first_name || "",
                lastName: matchedCustomer?.last_name || "",
                email: user.email || "",
                mobile: "",
                address: matchedCustomer?.customer_address || "",
                city: matchedCustomer?.customer_city || "",
                country: matchedCustomer?.customer_country || "",
                profileImage: matchedCustomer?.customer_image_url || ""
              });
          }
        } catch (error) { console.error(error); }
      }
      setLoading(false);
    };
    fetchUserData();
  }, [user, matchedCustomer]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData(prev => ({
          ...prev,
          profileImage: reader.result 
        }));
      };
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
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                );
                const data = await response.json();
                
                setEditFormData(prev => ({
                    ...prev,
                    city: data.city || data.locality || '',
                    country: data.countryName || ''
                }));
            } catch (error) {
                console.error("Error fetching location name:", error);
                alert("Could not retrieve city name. Coordinates found.");
            }
            setLocLoading(false);
        },
        (error) => {
            setLocLoading(false);
            alert("Unable to retrieve your location. Please check browser permissions.");
        }
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader size={48} className="animate-spin text-violet-500" />
    </div>
  );

  const commonChartOptions = {
    responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false }, ticks: { color: '#94a3b8', font: {size: 11} } }, y: { grid: { color: 'rgba(148, 163, 184, 0.05)' }, ticks: { color: '#94a3b8', font: {size: 11} } } }
  };

  const horizontalChartOptions = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
    scales: { x: { grid: { color: 'rgba(148, 163, 184, 0.05)' }, ticks: { color: '#94a3b8' } }, y: { grid: { display: false }, ticks: { color: '#e2e8f0', font: { size: 12 } } } }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-500/30 relative overflow-x-hidden">
      
      {/* --- VISUAL BACKGROUND BLOBS --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-violet-600/20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-cyan-600/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />

      <div className="relative z-10 p-3 md:p-8 max-w-[1600px] mx-auto">
        
        {/* --- HEADER --- */}
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

            {/* Navigation Tabs - Horizontal Scroll on Mobile */}
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
                            <tab.icon size={16} className={activeTab === tab.id ? 'animate-bounce-subtle' : ''} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </header>

        {/* --- MAIN CONTENT --- */}
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
                            <div className="relative group w-full sm:w-auto">
                                <select 
                                    value={selectedYear} 
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="w-full sm:w-auto appearance-none bg-slate-900 text-white border border-slate-700 rounded-lg px-5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-violet-500/50 transition-colors shadow-sm cursor-pointer"
                                >
                                    <option value="All">All Years</option>
                                    <option value="2019">2019</option>
                                    <option value="2020">2020</option>
                                    <option value="2021">2021</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-violet-400 transition-colors pointer-events-none" />
                            </div>

                            <div className="relative group w-full sm:w-auto">
                                <select 
                                    value={selectedMonth} 
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full sm:w-auto appearance-none bg-slate-900 text-white border border-slate-700 rounded-lg px-5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-violet-500/50 transition-colors shadow-sm cursor-pointer"
                                >
                                    <option value="All">All Months</option>
                                    {['January','February','March','April','May','June','July','August'].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-violet-400 transition-colors pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 mb-8">
                        {[
                            { title: 'Total Orders', value: kpiTotalOrders, icon: Package, color: 'text-violet-400', glow: 'hover:shadow-violet-500/20', trend: '+12%', trendUp: true },
                            { title: 'Total Spend', value: formatRupees(kpiTotalSpend), icon: DollarSign, color: 'text-cyan-400', glow: 'hover:shadow-cyan-500/20', trend: '+5.4%', trendUp: true },
                            { title: 'Returned', value: kpiReturnedOrders, icon: Activity, color: 'text-rose-400', glow: 'hover:shadow-rose-500/20', trend: '-2%', trendUp: false },
                            { title: 'Active Orders', value: kpiActiveOrders, icon: TrendingUp, color: 'text-amber-400', glow: 'hover:shadow-amber-500/20', trend: 'Live', trendUp: true },
                            { title: 'Avg Order Val', value: formatRupees(kpiAvgOrderValue), icon: Activity, color: 'text-emerald-400', glow: 'hover:shadow-emerald-500/20', trend: '+1.2%', trendUp: true },
                        ].map((kpi, idx) => (
                            <div key={idx} className={`bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 hover:border-slate-600 transition-all duration-300 group shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] ${kpi.glow}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2.5 rounded-lg bg-slate-800/50 border border-slate-700 ${kpi.color} shadow-inner group-hover:scale-110 transition-transform`}>
                                        <kpi.icon size={20} />
                                    </div>
                                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full shadow-sm ${kpi.trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                        {kpi.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        {kpi.trend}
                                    </div>
                                </div>
                                <h2 className={`text-2xl font-bold text-white mb-1 tracking-tight truncate ${kpi.title === 'Total Spend' ? 'text-cyan-300 drop-shadow-md' : ''}`}>
                                    {kpi.value}
                                </h2>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{kpi.title}</p>
                            </div>
                        ))}
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                    <TrendingUp size={18} className="text-violet-500" /> Order Trends
                                </h3>
                                <span className="text-xs text-slate-500 hidden sm:block">Daily Volume</span>
                            </div>
                            <div className="h-64 md:h-72">
                                <Line data={lineChartData} options={commonChartOptions} />
                            </div>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                    <Activity size={18} className="text-cyan-500" /> Category Split
                                </h3>
                            </div>
                            <div className="h-64 md:h-72 relative">
                                <Doughnut data={pieChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 10, padding: 20, font: {size: 11} } } } }} />
                            </div>
                        </div>
                    </div>

                    {/* Charts Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
                            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-3 mb-4">Top Spending Products</h3>
                            <div className="h-64">
                                <Bar data={barSpendData} options={horizontalChartOptions} />
                            </div>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
                            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-3 mb-4">Highest Returns</h3>
                            <div className="h-64">
                                <Bar data={barReturnData} options={horizontalChartOptions} />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* 2. TOP PRODUCTS TAB */}
            {activeTab === 'products' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 border-b border-slate-800 pb-4 gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Tag size={20} className="text-violet-500" /> Your Favorites
                                </h3>
                                <p className="text-sm text-slate-400 mt-1">Suggested based on past orders.</p>
                            </div>
                            <span className="text-xs bg-violet-900/40 text-violet-300 px-3 py-1 rounded-full border border-violet-500/20 whitespace-nowrap">Sorted by Total Spend</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {productStats.length > 0 ? (
                                productStats.map((prod, index) => (
                                    <div key={prod.product_id} className="group relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all duration-300">
                                        <div className="aspect-square w-full bg-slate-900 relative overflow-hidden">
                                            {prod.image_url ? (
                                                <img src={prod.image_url} alt={prod.product_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                    <Package size={48} />
                                                </div>
                                            )}
                                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md border border-white/10">
                                                #{index + 1}
                                            </div>
                                            <div className="absolute top-2 right-2 bg-violet-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                {prod.product_category}
                                            </div>
                                        </div>
                                        
                                        <div className="p-4">
                                            <h4 className="text-white font-bold text-base md:text-lg mb-1 truncate" title={prod.product_name}>{prod.product_name}</h4>
                                            
                                            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Spend</p>
                                                    <p className="text-cyan-400 font-bold font-mono text-sm">{formatRupees(prod.personalSpend)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Quantity</p>
                                                    <p className="text-white font-bold text-sm">{prod.personalQty} <span className="text-[10px] text-slate-500 font-normal">units</span></p>
                                                </div>
                                            </div>
                                            
                                            <button className="w-full mt-4 bg-slate-800 hover:bg-violet-600 text-slate-300 hover:text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 group-hover:border-violet-500/50 border border-transparent">
                                                <ShoppingCart size={14} /> Buy Again
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12 text-slate-500">
                                    <Package size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>No product history found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. PROFILE TAB */}
            {activeTab === 'profile' && (
                <div className="max-w-5xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)]">
                    <div className="h-24 md:h-32 bg-gradient-to-r from-violet-900 to-slate-900"></div>
                    <div className="px-4 md:px-8 pb-8 relative">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 -mt-12 md:-mt-12 mb-8 text-center md:text-left">
                            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-slate-950 p-1.5 ring-4 ring-slate-800 shadow-2xl relative group">
                                {displayData.profileImage ? (
                                    <img src={displayData.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                                        <User size={40} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 pb-0 md:pb-2">
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 drop-shadow-md">{displayData.fullName}</h2>
                                <p className="text-violet-400 font-medium flex items-center justify-center md:justify-start gap-1 text-sm md:text-base"><Mail size={14}/> {displayData.email}</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setEditFormData(displayData);
                                    setIsEditingProfile(!isEditingProfile);
                                }}
                                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/10 flex items-center gap-2 shadow-lg text-sm"
                            >
                            <Edit size={16} /> {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                            </button>
                        </div>

                        {isEditingProfile ? (
                            <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-fade-in bg-slate-950/50 p-4 md:p-6 rounded-2xl border border-slate-800 shadow-inner">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">First Name</label>
                                    <input type="text" value={editFormData.firstName} onChange={e => setEditFormData({...editFormData, firstName: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder-slate-600 shadow-sm" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Last Name</label>
                                    <input type="text" value={editFormData.lastName} onChange={e => setEditFormData({...editFormData, lastName: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder-slate-600 shadow-sm" />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Mobile</label>
                                    <input type="text" value={editFormData.mobile} onChange={e => setEditFormData({...editFormData, mobile: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder-slate-600 shadow-sm" />
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Address</label>
                                    <input type="text" value={editFormData.address} onChange={e => setEditFormData({...editFormData, address: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder-slate-600 shadow-sm" />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">City / Location</label>
                                        <button type="button" onClick={handleDetectLocation} disabled={locLoading} className="flex items-center gap-1 text-[10px] bg-violet-600/20 text-violet-300 hover:bg-violet-600/40 px-2 py-1 rounded transition-colors shadow-sm">{locLoading ? <Loader size={10} className="animate-spin" /> : <Navigation size={10} />}{locLoading ? "Fetching..." : "Detect Location"}</button>
                                    </div>
                                    <input type="text" value={editFormData.city} onChange={e => setEditFormData({...editFormData, city: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder-slate-600 shadow-sm" placeholder="Enter city or click Detect" />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Country</label>
                                    <input type="text" value={editFormData.country} onChange={e => setEditFormData({...editFormData, country: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder-slate-600 shadow-sm" />
                                </div>

                                <div className="md:col-span-2 flex flex-col gap-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Profile Image</label>
                                    <div className="flex items-center gap-4 p-4 border border-dashed border-slate-700 rounded-xl bg-slate-900/50">
                                        <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
                                            {editFormData.profileImage ? (
                                                <img src={editFormData.profileImage} alt="Preview" className="w-full h-full object-cover" />
                                            ) : <User className="w-full h-full p-2 text-slate-600" />}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleImageChange} 
                                                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700 cursor-pointer" 
                                            />
                                            <p className="text-[10px] text-slate-500 mt-1">Supports JPG, PNG (Max 5MB)</p>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="md:col-span-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-bold shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all mt-2">Save Changes</button>
                            </form>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 md:p-5 rounded-2xl bg-slate-800/30 border border-slate-800/50 flex items-start gap-4 shadow-md">
                                    <div className="p-3 rounded-lg bg-slate-800 text-slate-400"><User size={20}/></div>
                                    <div className="overflow-hidden"><span className="block text-xs font-semibold text-slate-500 uppercase">Customer ID</span><span className="text-lg text-white truncate block">{matchedCustomer?.customer_id || 'N/A'}</span></div>
                                </div>
                                <div className="p-4 md:p-5 rounded-2xl bg-slate-800/30 border border-slate-800/50 flex items-start gap-4 shadow-md">
                                    <div className="p-3 rounded-lg bg-slate-800 text-slate-400"><MapPin size={20}/></div>
                                    <div className="overflow-hidden"><span className="block text-xs font-semibold text-slate-500 uppercase">Location</span><span className="text-lg text-white truncate block">{displayData.city}, {displayData.country}</span></div>
                                </div>
                                <div className="p-4 md:p-5 rounded-2xl bg-slate-800/30 border border-slate-800/50 flex items-start gap-4 shadow-md">
                                    <div className="p-3 rounded-lg bg-slate-800 text-slate-400"><MapPin size={20}/></div>
                                    <div className="overflow-hidden"><span className="block text-xs font-semibold text-slate-500 uppercase">Address</span><span className="text-lg text-white truncate block">{displayData.address}</span></div>
                                </div>
                                <div className="p-4 md:p-5 rounded-2xl bg-slate-800/30 border border-slate-800/50 flex items-start gap-4 shadow-md">
                                    <div className="p-3 rounded-lg bg-slate-800 text-slate-400"><Phone size={20}/></div>
                                    <div className="overflow-hidden"><span className="block text-xs font-semibold text-slate-500 uppercase">Phone</span><span className="text-lg text-white truncate block">{displayData.mobile || 'Not set'}</span></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 4. ORDERS STATUS TAB */}
            {activeTab === 'orders' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
                    <div className="p-4 md:p-6 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2"><ShoppingBag size={20} className="text-violet-500"/> Order History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider shadow-sm whitespace-nowrap">
                                    <th className="p-4 md:p-5 font-semibold">Order ID</th>
                                    <th className="p-4 md:p-5 font-semibold">Date</th>
                                    <th className="p-4 md:p-5 font-semibold text-right">Amount</th>
                                    <th className="p-4 md:p-5 font-semibold text-center">Items</th>
                                    <th className="p-4 md:p-5 font-semibold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 whitespace-nowrap">
                                {rawData.orders.map(order => (
                                    <tr key={order.order_id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-4 md:p-5 text-sm font-medium text-violet-300">#{order.order_id}</td>
                                        <td className="p-4 md:p-5 text-sm text-slate-300">{new Date(order.order_date).toLocaleDateString()}</td>
                                        <td className="p-4 md:p-5 text-sm text-white font-bold text-right">{formatRupees(order.order_total_amount)}</td>
                                        <td className="p-4 md:p-5 text-sm text-slate-400 text-center">
                                            {rawData.items.filter(i => i.order_id === order.order_id).length}
                                        </td>
                                        <td className="p-4 md:p-5 text-center">
                                            <span className={`
                                                px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-sm
                                                ${order.order_status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : ''}
                                                ${order.order_status === 'Shipped' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : ''}
                                                ${order.order_status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                                                ${order.order_status === 'Cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : ''}
                                            `}>
                                                {order.order_status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 5. PAYMENTS TAB */}
            {activeTab === 'payments' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
                    <div className="p-4 md:p-6 border-b border-slate-800">
                        <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2"><CreditCard size={20} className="text-emerald-500"/> Payment History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider shadow-sm whitespace-nowrap">
                                    <th className="p-4 md:p-5 font-semibold">Reference ID</th>
                                    <th className="p-4 md:p-5 font-semibold">Order Date</th>
                                    <th className="p-4 md:p-5 font-semibold text-right">Amount</th>
                                    <th className="p-4 md:p-5 font-semibold">Method</th>
                                    <th className="p-4 md:p-5 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 whitespace-nowrap">
                                {rawData.orders.filter(o => o.order_status !== 'Cancelled').map(order => (
                                    <tr key={order.order_id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 md:p-5 text-sm font-mono text-slate-400">TXN-{order.order_id}X9</td>
                                        <td className="p-4 md:p-5 text-sm text-slate-300">{new Date(order.order_date).toLocaleDateString()}</td>
                                        <td className="p-4 md:p-5 text-sm text-white font-bold text-right">{formatRupees(order.order_total_amount)}</td>
                                        <td className="p-4 md:p-5 text-sm text-slate-400 flex items-center gap-2">
                                            <CreditCard size={14}/> Credit Card
                                        </td>
                                        <td className="p-4 md:p-5">
                                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit shadow-sm">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Paid
                                            </span>
                                        </td>
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