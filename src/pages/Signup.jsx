import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, Shield, LayoutDashboard, ShoppingBag, 
  ArrowRight, Search, CheckCircle, 
  XCircle, Loader, UserPlus, LogOut, Globe,
  Trophy, TrendingUp, DollarSign, Award, Crown, Calendar
} from 'lucide-react';
import { db, auth } from "../firebase"; 
import { collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- CHART IMPORTS ---
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

// Register Charts
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement, Filler);
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';

// --- SUB-COMPONENT: PORTAL CARD ---
const PortalCard = ({ title, description, icon: Icon, color, onClick, buttonText }) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all group relative overflow-hidden">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        <Icon size={80} />
    </div>
    <div>
        <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-20 flex items-center justify-center mb-4 text-white`}>
            <Icon size={24} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-6">{description}</p>
    </div>
    <button onClick={onClick} className="w-full py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-slate-700">
        {buttonText} <ArrowRight size={14} />
    </button>
  </div>
);

// --- MAIN COMPONENT ---
const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]); // State for orders 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);

      // 2. Fetch Orders (for calculations)
      const ordersSnap = await getDocs(collection(db, "OrderItems"));
      const ordersData = ordersSnap.docs.map(doc => {
         const d = doc.data();
         return {
             id: doc.id,
             ...d,
             createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date()
         };
      });
      setOrders(ordersData);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- CALCULATE INSIGHTS ---
  const insights = useMemo(() => {
    if (orders.length === 0) return { topCustomer: null, topProduct: null, monthlyRevenue: [] };

    const customerSpend = {};
    const productSales = {};
    const monthlyData = {};

    orders.forEach(order => {
        // 1. Customer Spend Logic
        const uid = order.userId;
        const total = Number(order.totalAmount || 0);
        
        if (customerSpend[uid]) {
            customerSpend[uid].spend += total;
            customerSpend[uid].orders += 1;
        } else {
            customerSpend[uid] = { spend: total, orders: 1 };
        }

        // 2. Product Sales Logic
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const pId = item.id || item.product_id;
                const qty = Number(item.quantity || 1);
                const revenue = Number(item.price || item.selling_unit_price || 0) * qty;
                
                if (productSales[pId]) {
                    productSales[pId].qty += qty;
                    productSales[pId].revenue += revenue;
                } else {
                    productSales[pId] = {
                        name: item.name || item.product_name,
                        image: item.image || item.image_url,
                        qty: qty,
                        revenue: revenue
                    };
                }
            });
        }

        // 3. Monthly Revenue for Chart
        const monthKey = order.createdAt.toLocaleString('default', { month: 'short' });
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + total;
    });

    // Find Best Customer
    let bestCustId = null;
    let maxSpend = 0;
    Object.entries(customerSpend).forEach(([uid, data]) => {
        if (data.spend > maxSpend) {
            maxSpend = data.spend;
            bestCustId = uid;
        }
    });
    const bestCustomer = bestCustId ? users.find(u => u.id === bestCustId) : null;
    const bestCustomerDetails = bestCustomer ? { ...bestCustomer, ...customerSpend[bestCustId] } : null;

    // Find Best Product
    let bestProdId = null;
    let maxSold = 0;
    Object.entries(productSales).forEach(([pid, data]) => {
        if (data.qty > maxSold) {
            maxSold = data.qty;
            bestProdId = pid;
        }
    });
    const bestProduct = bestProdId ? productSales[bestProdId] : null;

    return { 
        topCustomer: bestCustomerDetails, 
        topProduct: bestProduct,
        monthlyRevenue: monthlyData 
    };
  }, [orders, users]);

  // Chart Data Preparation
  const lineChartData = {
    labels: Object.keys(insights.monthlyRevenue),
    datasets: [{
      label: 'Revenue (₹)',
      data: Object.values(insights.monthlyRevenue),
      borderColor: '#f43f5e', // Rose-500
      backgroundColor: 'rgba(244, 63, 94, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4
    }]
  };

  const roleDistribution = {
      labels: ['Super Admins', 'Admins', 'Customers'],
      datasets: [{
          data: [
              users.filter(u => u.role === 'super_admin').length,
              users.filter(u => u.role === 'admin').length,
              users.filter(u => !u.role || u.role === 'user').length
          ],
          backgroundColor: ['#f43f5e', '#8b5cf6', '#10b981'],
          borderWidth: 0
      }]
  };

  // ... (Role Update Handlers remain same as before) ...
  const handleRoleUpdate = async (userId, newRole) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole, updatedAt: serverTimestamp() });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`User updated to ${newRole}`);
    } catch (error) { toast.error("Failed to update role"); }
  };

  const handlePromoteByEmail = async (e) => {
    e.preventDefault();
    const targetUser = users.find(u => u.email.toLowerCase() === newAdminEmail.toLowerCase());
    if (targetUser) {
      if (window.confirm(`Are you sure you want to promote ${targetUser.email} to Super Admin?`)) {
        await handleRoleUpdate(targetUser.id, 'super_admin');
        setShowAddAdminModal(false);
        setNewAdminEmail("");
      }
    } else { toast.error("User with this email not found in database."); }
  };

  const filteredUsers = users.filter(u => 
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.firstName && u.firstName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <ToastContainer position="top-right" theme="dark" />
      
      {/* Top Navigation */}
      <nav className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
             <div className="bg-gradient-to-tr from-rose-600 to-orange-600 p-2 rounded-lg">
                 <Shield size={20} className="text-white"/>
             </div>
             <h1 className="text-lg font-bold text-white tracking-wide">SUPER<span className="text-rose-500">ADMIN</span></h1>
         </div>
         <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                 <p className="text-xs text-slate-400">Logged in as</p>
                 <p className="text-sm font-bold text-white">Master Controller</p>
             </div>
             <button onClick={() => auth.signOut()} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                 <LogOut size={18} className="text-rose-400"/>
             </button>
         </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-6 md:p-8">
        
        {/* --- SECTION 1: PORTAL NAVIGATION --- */}
        <div className="mb-10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Globe size={20} className="text-blue-500"/> Ecosystem Portals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PortalCard title="Admin Dashboard" description="Manage products, orders & sales." icon={LayoutDashboard} color="bg-violet-600" buttonText="Launch Admin Portal" onClick={() => navigate('/admindashboard')} />
                <PortalCard title="User Dashboard" description="Customer facing storefront view." icon={ShoppingBag} color="bg-emerald-600" buttonText="Visit Storefront" onClick={() => navigate('/userdashboard')} />
                <PortalCard title="User Management" description="Manage roles & permissions." icon={Users} color="bg-rose-600" buttonText="Manage Roles" onClick={() => setActiveTab('users')} />
            </div>
        </div>

        {/* --- SECTION 2: PLATFORM INSIGHTS (New!) --- */}
        {activeTab === 'overview' && (
            <div className="mb-10 animate-fade-in-up">
                 <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp size={20} className="text-rose-500"/> Platform Insights
                 </h2>

                 {/* Top Performer Cards */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    
                    {/* Highest Purchased Customer */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex items-center gap-6 shadow-xl">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Users size={120} /></div>
                        {insights.topCustomer ? (
                            <>
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-slate-800 p-1 border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                                        {insights.topCustomer.profileImage ? 
                                            <img src={insights.topCustomer.profileImage} alt="User" className="w-full h-full rounded-full object-cover"/> :
                                            <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400">{insights.topCustomer.firstName?.[0]}</div>
                                        }
                                    </div>
                                    <div className="absolute -top-2 -right-2 bg-amber-500 text-black p-1.5 rounded-full shadow-lg"><Crown size={14} fill="black"/></div>
                                </div>
                                <div>
                                    <p className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-1">Highest Spender</p>
                                    <h3 className="text-2xl font-bold text-white">{insights.topCustomer.firstName} {insights.topCustomer.lastName}</h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div><p className="text-xs text-slate-400">Total Spent</p><p className="text-lg font-bold text-emerald-400">₹{insights.topCustomer.spend.toLocaleString()}</p></div>
                                        <div className="w-px h-8 bg-slate-700"></div>
                                        <div><p className="text-xs text-slate-400">Orders</p><p className="text-lg font-bold text-white">{insights.topCustomer.orders}</p></div>
                                    </div>
                                </div>
                            </>
                        ) : <div className="text-slate-500 flex items-center gap-2"><Loader className="animate-spin"/> Calculating Top Customer...</div>}
                    </div>

                    {/* Highest Sales Product */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex items-center gap-6 shadow-xl">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><ShoppingBag size={120} /></div>
                        {insights.topProduct ? (
                            <>
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-xl bg-slate-800 border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] overflow-hidden">
                                        <img src={insights.topProduct.image} alt="Prod" className="w-full h-full object-cover"/>
                                    </div>
                                    <div className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg"><Award size={14}/></div>
                                </div>
                                <div>
                                    <p className="text-xs text-rose-500 font-bold uppercase tracking-widest mb-1">Best Selling Product</p>
                                    <h3 className="text-xl font-bold text-white line-clamp-1">{insights.topProduct.name}</h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div><p className="text-xs text-slate-400">Units Sold</p><p className="text-lg font-bold text-white">{insights.topProduct.qty}</p></div>
                                        <div className="w-px h-8 bg-slate-700"></div>
                                        <div><p className="text-xs text-slate-400">Revenue Generated</p><p className="text-lg font-bold text-emerald-400">₹{insights.topProduct.revenue.toLocaleString()}</p></div>
                                    </div>
                                </div>
                            </>
                        ) : <div className="text-slate-500 flex items-center gap-2"><Loader className="animate-spin"/> Calculating Top Product...</div>}
                    </div>

                 </div>

                 {/* Charts Section */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                        <h4 className="text-slate-300 font-bold mb-4 flex items-center gap-2"><DollarSign size={16} className="text-emerald-500"/> Total Revenue Trend</h4>
                        <div className="h-64">
                            <Line data={lineChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }} />
                        </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center">
                        <h4 className="text-slate-300 font-bold mb-4 w-full text-left flex items-center gap-2"><Users size={16} className="text-violet-500"/> User Distribution</h4>
                        <div className="h-56 w-56 relative">
                            <Doughnut data={roleDistribution} options={{ cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 10 } } } }} />
                        </div>
                    </div>
                 </div>
            </div>
        )}

        {/* --- SECTION 3: USER MANAGEMENT TABLE --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-fade-in-up mt-8">
            <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white">All System Users</h3>
                    <p className="text-xs text-slate-400">Search and manage platform access</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-rose-500 outline-none"
                        />
                    </div>
                    <button onClick={() => setShowAddAdminModal(true)} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors">
                        <UserPlus size={16}/> Add Super Admin
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-950/50 text-xs uppercase text-slate-400 font-semibold tracking-wider border-b border-slate-800">
                            <th className="p-4">User Details</th>
                            <th className="p-4">Role</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                        {loading ? <tr><td colSpan="3" className="p-8 text-center"><Loader className="animate-spin mx-auto text-rose-500"/></td></tr> : 
                        filteredUsers.length > 0 ? filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 overflow-hidden">
                                            {user.profileImage ? <img src={user.profileImage} alt="p" className="w-full h-full object-cover"/> : (user.firstName ? user.firstName[0] : user.email[0].toUpperCase())}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{user.firstName} {user.lastName}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase border ${
                                        user.role === 'super_admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                                        user.role === 'admin' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                                        'bg-slate-700/30 text-slate-400 border-slate-700'
                                    }`}>{user.role || 'Customer'}</span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {user.role !== 'super_admin' && <button onClick={() => { if(window.confirm(`Promote ${user.email} to Super Admin?`)) handleRoleUpdate(user.id, 'super_admin'); }} className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded border border-rose-500/20 transition-colors">Make Super Admin</button>}
                                        {user.role !== 'admin' && user.role !== 'super_admin' && <button onClick={() => handleRoleUpdate(user.id, 'admin')} className="text-xs bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 px-3 py-1.5 rounded border border-violet-500/20 transition-colors">Make Admin</button>}
                                        {(user.role === 'admin' || user.role === 'super_admin') && <button onClick={() => handleRoleUpdate(user.id, 'user')} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded transition-colors">Demote</button>}
                                    </div>
                                </td>
                            </tr>
                        )) : <tr><td colSpan="3" className="p-8 text-center text-slate-500 italic">No users found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>

      </div>

      {/* --- ADD SUPER ADMIN MODAL --- */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Add Super Admin</h3>
                    <button onClick={() => setShowAddAdminModal(false)}><XCircle className="text-slate-500 hover:text-white"/></button>
                </div>
                <form onSubmit={handlePromoteByEmail} className="p-6">
                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">User Email</label>
                        <input type="email" required placeholder="e.g. user@example.com" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-rose-500 outline-none" />
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowAddAdminModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-rose-900/20">Promote</button>
                    </div>
                </form>
             </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminDashboard;