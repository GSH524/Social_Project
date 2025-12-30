import React, { useContext, useState, useEffect, useMemo } from "react";
import { db } from "../firebase"; 
import { AuthContext } from "../context/AuthContext";
// --- DATA IMPORTS ---
import { customers, orders as staticOrders, orderItems as staticItems, orderReturns } from "../data/dataUtils.js";
import products from "../data/product.js"; 
// --- FIREBASE IMPORTS ---
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

// 1. IMPORT TOASTIFY
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- ICONS ---
import { 
  Loader, User, ShoppingBag, CreditCard, LayoutDashboard, Edit, Calendar, 
  TrendingUp, ArrowUpRight, ArrowDownRight, Package, DollarSign, Activity, MapPin, Phone, 
  Tag, AlertCircle, CornerUpLeft, X 
} from 'lucide-react';

// --- CHART JS IMPORTS ---
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';

// --- REGISTER CHARTS ---
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';
ChartJS.defaults.font.family = "'Inter', sans-serif";

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
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

  // Return Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [returnReason, setReturnReason] = useState("Wrong Size");

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

        } catch (error) { 
            console.error("Error fetching dashboard data:", error); 
            // Optional: toast.error("Could not load dashboard data.");
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // ==========================================
  //  2. DATA PROCESSING
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
      mobile: firebaseProfile?.mobile || '',
      profileImage: firebaseProfile?.profileImage || matchedCustomer?.customer_image_url || ''
    };
  }, [firebaseProfile, matchedCustomer, user]);

  const rawData = useMemo(() => {
    const customerId = matchedCustomer?.customer_id;
    const staticUserOrders = customerId ? staticOrders.filter(o => o.customer_id === customerId) : [];
    
    // Flag static orders with source: 'static'
    const flaggedStaticOrders = staticUserOrders.map(o => ({...o, source: 'static'}));

    const formattedLiveOrders = liveOrders.map(order => ({
        order_id: order.id,
        order_date: order.createdAt,
        order_total_amount: Number(order.totalAmount) || 0,
        order_status: order.orderStatus || 'Pending',
        source: 'live',
        items: order.items || []
    }));

    const combinedOrders = [...formattedLiveOrders, ...flaggedStaticOrders];

    let combinedItems = [];
    if (customerId) {
        const userOrderIds = new Set(staticUserOrders.map(o => o.order_id));
        combinedItems = [...staticItems.filter(item => userOrderIds.has(item.order_id))];
    }
    liveOrders.forEach(order => {
        if(order.items) order.items.forEach((item, idx) => combinedItems.push({
             order_item_id: `${order.id}-${idx}`, order_id: order.id, product_id: item.product_id, 
             product_name: item.name || item.product_name, quantity: item.quantity, total_amount: (item.selling_unit_price * item.quantity), source: 'live'
        }));
    });

    const staticReturnIds = new Set(orderReturns.map(r => r.order_item_id));
    const returnedItems = combinedItems.filter(i => i.source !== 'live' && staticReturnIds.has(i.order_item_id));

    return { orders: combinedOrders, items: combinedItems, returns: returnedItems }; 
  }, [matchedCustomer, liveOrders]);

  // Apply Filters
  const filteredData = useMemo(() => {
    let fOrders = rawData.orders;
    if (selectedYear !== 'All') fOrders = fOrders.filter(o => new Date(o.order_date).getFullYear().toString() === selectedYear);
    if (selectedMonth !== 'All') fOrders = fOrders.filter(o => new Date(o.order_date).toLocaleString('default', { month: 'long' }) === selectedMonth);
    const fOrderIds = new Set(fOrders.map(o => o.order_id));
    return { orders: fOrders, items: rawData.items.filter(i => fOrderIds.has(i.order_id)), returns: rawData.returns.filter(r => fOrderIds.has(r.order_id)) };
  }, [rawData, selectedYear, selectedMonth]);

  // KPI Calculations
  const kpiTotalOrders = filteredData.orders.length;
  const kpiTotalSpend = filteredData.orders.reduce((acc, curr) => acc + curr.order_total_amount, 0);
  const kpiReturnedOrders = filteredData.orders.filter(o => o.order_status === 'Returned' || o.order_status === 'Cancelled').length + filteredData.returns.length;
  const kpiActiveOrders = filteredData.orders.filter(o => ['Pending', 'Shipped', 'Processing'].includes(o.order_status)).length;
  const kpiAvgOrderValue = kpiTotalOrders > 0 ? (kpiTotalSpend / kpiTotalOrders) : 0;
  const formatRupees = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  // ==========================================
  //  3. CHART DATA GENERATION (4 VISUALS)
  // ==========================================

  // Visual 1: Line Chart (Order Trends)
  const lineChartData = useMemo(() => {
    const grouped = {};
    [...filteredData.orders].sort((a,b) => new Date(a.order_date) - new Date(b.order_date)).forEach(o => {
        const date = new Date(o.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        grouped[date] = (grouped[date] || 0) + 1;
    });
    return { labels: Object.keys(grouped), datasets: [{ label: 'Orders', data: Object.values(grouped), borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', fill: true, tension: 0.4 }] };
  }, [filteredData]);

  // Visual 2: Doughnut Chart (Categories)
  const pieChartData = useMemo(() => {
    const grouped = {};
    filteredData.items.forEach(item => {
        const prod = products.find(p => String(p.product_id) === String(item.product_id));
        const category = prod ? prod.product_category : 'Other'; 
        grouped[category] = (grouped[category] || 0) + item.total_amount;
    });
    return { labels: Object.keys(grouped), datasets: [{ data: Object.values(grouped), backgroundColor: ['#8b5cf6', '#06b6d4', '#f43f5e', '#f59e0b', '#10b981'], borderWidth: 0 }] };
  }, [filteredData]);

  // Visual 3: Bar Chart (Top Spend)
  const barSpendData = useMemo(() => {
    const grouped = {};
    filteredData.items.forEach(item => {
        const name = item.product_name || `Item #${item.product_id}`;
        grouped[name] = (grouped[name] || 0) + item.total_amount;
    });
    const sorted = Object.entries(grouped).sort((a,b) => b[1] - a[1]).slice(0, 5);
    return {
        labels: sorted.map(i => i[0].length > 15 ? i[0].substring(0,15)+'...' : i[0]),
        datasets: [{ label: 'Spend', data: sorted.map(i => i[1]), backgroundColor: '#06b6d4', borderRadius: 4, barThickness: 15 }]
    };
  }, [filteredData]);

  // Visual 4: Bar Chart (Returns)
  const barReturnData = useMemo(() => {
    const grouped = {};
    filteredData.returns.forEach(ret => {
        const item = rawData.items.find(i => i.order_item_id === ret.order_item_id);
        const name = item ? (item.product_name || 'Unknown') : 'Unknown';
        grouped[name] = (grouped[name] || 0) + 1;
    });
    filteredData.orders.filter(o => o.order_status === 'Returned').forEach(o => {
        const items = filteredData.items.filter(i => i.order_id === o.order_id);
        items.forEach(i => {
             const name = i.product_name || 'Unknown';
             grouped[name] = (grouped[name] || 0) + i.quantity;
        });
    });
    const sorted = Object.entries(grouped).sort((a,b) => b[1] - a[1]).slice(0, 5);
    return {
        labels: sorted.map(i => i[0].length > 15 ? i[0].substring(0,15)+'...' : i[0]),
        datasets: [{ label: 'Returned Units', data: sorted.map(i => i[1]), backgroundColor: '#f43f5e', borderRadius: 4, barThickness: 15 }]
    };
  }, [filteredData, rawData.items]);

  const horizontalChartOptions = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
    scales: { x: { grid: { color: 'rgba(148, 163, 184, 0.05)' }, ticks: { color: '#94a3b8' } }, y: { grid: { display: false }, ticks: { color: '#e2e8f0' } } }
  };

  // ==========================================
  //  4. ACTIONS (Profile & Returns)
  // ==========================================

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (user?.uid) {
        try {
            await setDoc(doc(db, 'users', user.uid), editFormData, { merge: true });
            setFirebaseProfile(prev => ({ ...prev, ...editFormData }));
            setIsEditingProfile(false);
            // 2. SUCCESS TOAST
            toast.success("Profile updated successfully!", { theme: "dark" });
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile.", { theme: "dark" });
        }
    }
  };

  const openReturnModal = (order) => {
    setSelectedReturnOrder(order);
    setReturnReason("Wrong Size");
    setReturnModalOpen(true);
  };

  const handleReturnSubmit = async () => {
    if (!selectedReturnOrder) return;

    if (selectedReturnOrder.source === 'live') {
        try {
            const orderRef = doc(db, "OrderItems", selectedReturnOrder.order_id);
            await updateDoc(orderRef, {
                orderStatus: "Returned",
                returnReason: returnReason,
                returnedAt: new Date()
            });
            setLiveOrders(prev => prev.map(o => o.id === selectedReturnOrder.order_id ? { ...o, orderStatus: "Returned" } : o));
            // 3. SUCCESS TOAST
            toast.success("Return request submitted successfully!", { theme: "dark" });
        } catch (error) {
            console.error("Error updating return:", error);
            // 4. ERROR TOAST
            toast.error("Failed to process return. Please try again.", { theme: "dark" });
        }
    } else {
        // 5. DEMO TOAST
        toast.info("Demo Success: Return request logged.", { theme: "dark" });
    }
    setReturnModalOpen(false);
  };

  // --- RENDER ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader size={48} className="animate-spin text-violet-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden">
      
      {/* 6. TOAST CONTAINER (Essential for rendering) */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-violet-600/20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-cyan-600/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 p-3 md:p-8 max-w-[1600px] mx-auto">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-8 md:mb-10 border-b border-slate-800/60 pb-6 md:pb-8">
            <div className="space-y-3 w-full xl:w-auto">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">Welcome, <br className="md:hidden" /> {displayData.firstName}</h1>
                <p className="text-slate-400">Overview: <span className="text-white font-semibold">{kpiActiveOrders} active orders</span>.</p>
            </div>
            {/* Tabs */}
            <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
                <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md min-w-max">
                    {[
                        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                        { id: 'orders', label: 'Orders', icon: ShoppingBag },
                        { id: 'profile', label: 'Profile', icon: User },
                        { id: 'payments', label: 'Payments', icon: CreditCard },
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === tab.id ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </header>

        <div className="animate-fade-in-up">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <>
                   {/* KPI Cards */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 mb-8">
                        {[
                            { title: 'Total Orders', value: kpiTotalOrders, icon: Package, color: 'text-violet-400', trendUp: true },
                            { title: 'Total Spend', value: formatRupees(kpiTotalSpend), icon: DollarSign, color: 'text-cyan-400', trendUp: true },
                            { title: 'Returned', value: kpiReturnedOrders, icon: AlertCircle, color: 'text-rose-400', trendUp: false },
                            { title: 'Active Orders', value: kpiActiveOrders, icon: TrendingUp, color: 'text-amber-400', trendUp: true },
                            { title: 'Avg Order Val', value: formatRupees(kpiAvgOrderValue), icon: Activity, color: 'text-emerald-400', trendUp: true },
                        ].map((kpi, idx) => (
                            <div key={idx} className={`bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2.5 rounded-lg bg-slate-800/50 border border-slate-700 ${kpi.color}`}><kpi.icon size={20} /></div>
                                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-slate-800 border border-slate-700 ${kpi.trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>{kpi.trendUp ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}</div>
                                </div>
                                <h2 className={`text-2xl font-bold text-white mb-1`}>{kpi.value}</h2>
                                <p className="text-xs font-medium text-slate-400 uppercase">{kpi.title}</p>
                            </div>
                        ))}
                    </div>

                    {/* ROW 1: Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                            <h3 className="text-base font-semibold text-white mb-6">Order Trends</h3>
                            <div className="h-64 md:h-72"><Line data={lineChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }}, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }} /></div>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                            <h3 className="text-base font-semibold text-white mb-6">Category Split</h3>
                            <div className="h-64 md:h-72 relative"><Doughnut data={pieChartData} options={{ maintainAspectRatio: false }} /></div>
                        </div>
                    </div>

                    {/* ROW 2: Bar Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                            <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2"><DollarSign size={18} className="text-emerald-500" /> Top Spending Products</h3>
                            <div className="h-64"><Bar data={barSpendData} options={horizontalChartOptions} /></div>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                            <h3 className="text-base font-semibold text-white mb-6 flex items-center gap-2"><AlertCircle size={18} className="text-rose-500" /> Highest Returns</h3>
                            <div className="h-64"><Bar data={barReturnData} options={horizontalChartOptions} /></div>
                        </div>
                    </div>
                </>
            )}

            {/* ORDERS TAB */}
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
                                    <th className="p-5 font-semibold text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {rawData.orders.map(order => (
                                    <tr key={order.order_id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-5 text-sm font-medium text-violet-300">#{order.order_id.toString().slice(-8)}</td>
                                        <td className="p-5 text-sm text-slate-300">{new Date(order.order_date).toLocaleDateString()}</td>
                                        <td className="p-5 text-sm text-white font-bold text-right">{formatRupees(order.order_total_amount)}</td>
                                        <td className="p-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border 
                                                ${order.order_status === 'Processing' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 
                                                  order.order_status === 'Returned' || order.order_status === 'Cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                {order.order_status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center">
                                            <button 
                                                onClick={() => openReturnModal(order)}
                                                disabled={['Returned', 'Cancelled'].includes(order.order_status)}
                                                className={`flex items-center justify-center gap-1 mx-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                                                    ${['Returned', 'Cancelled'].includes(order.order_status) 
                                                        ? 'opacity-50 cursor-not-allowed text-slate-500 bg-slate-800' 
                                                        : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30'
                                                    }`}
                                            >
                                                <CornerUpLeft size={14} /> 
                                                {['Returned', 'Cancelled'].includes(order.order_status) ? 'Closed' : 'Return'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {rawData.orders.length === 0 && <div className="p-8 text-center text-slate-500">No orders found.</div>}
                    </div>
                </div>
            )}
            
            {/* PROFILE TAB */}
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

            {/* PAYMENTS TAB */}
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

      {/* RETURN CONFIRMATION MODAL */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl transform transition-all scale-100 animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <CornerUpLeft size={24} className="text-rose-500" /> Return Order
                    </h3>
                    <button onClick={() => setReturnModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                </div>
                
                <p className="text-slate-300 text-sm mb-4">
                    You are requesting a return for Order <span className="text-violet-400 font-mono">#{selectedReturnOrder?.order_id.toString().slice(-8)}</span>.
                </p>

                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Reason</label>
                    <div className="space-y-2">
                        {['Wrong Size', 'Damaged Item', 'Not as Described', 'Changed Mind'].map((reason) => (
                            <label key={reason} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${returnReason === reason ? 'bg-violet-600/20 border-violet-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-800/80'}`}>
                                <input 
                                    type="radio" 
                                    name="returnReason" 
                                    value={reason} 
                                    checked={returnReason === reason} 
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    className="accent-violet-500 w-4 h-4"
                                />
                                <span className="text-sm font-medium">{reason}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setReturnModalOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700">Cancel</button>
                    <button onClick={handleReturnSubmit} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-500 shadow-lg shadow-rose-500/20">Confirm Return</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default UserDashboard;