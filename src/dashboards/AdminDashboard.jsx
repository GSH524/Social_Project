import React, { useState, useEffect, useCallback } from "react";
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { 
  LayoutDashboard, ShoppingBag, Users, Package, Settings, FileText, 
  BarChart2, Menu, X, LogOut, User, Camera, Loader, Bell
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; 
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";

// Static Data
import { customers as initialCustomers, orders as initialOrders, products as initialProducts } from "../data/dataUtils.js";

// Components
import AdminOrders from './AdminOrders';
import AdminProducts from './AdminProducts';
import AdminCustomers from './AdminCustomers';
import AdminAnalytics from './AdminAnalytics';
import AdminReports from './AdminReports';
import AdminSettings from './AdminSettings';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // ✅ State for Mobile Menu
  
  // Profile & Data State
  const [adminProfile, setAdminProfile] = useState({ firstName: '', lastName: '', email: '', role: 'Admin', profileImage: '' });
  const [editFormData, setEditFormData] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [customers, setCustomers] = useState(initialCustomers);
  const [loadingData, setLoadingData] = useState(true);

  const navigate = useNavigate();

  // --- DATA SYNC ---
  const fetchAllData = useCallback(async () => {
    setLoadingData(true);
    try {
      // Products
      const prodSnap = await getDocs(collection(db, "products"));
      const dbProds = prodSnap.docs.map(d => ({ ...d.data(), product_id: parseInt(d.id) || d.id }));
      const dbProdIds = new Set(dbProds.map(p => p.product_id));
      setProducts([...dbProds, ...initialProducts.filter(p => !dbProdIds.has(p.product_id))]);

      // Orders
      const ordSnap = await getDocs(collection(db, "orders"));
      const dbOrds = ordSnap.docs.map(d => ({ ...d.data(), order_id: parseInt(d.id) || d.id }));
      const dbOrdIds = new Set(dbOrds.map(o => o.order_id));
      setOrders([...dbOrds, ...initialOrders.filter(o => !dbOrdIds.has(o.order_id))].sort((a,b) => new Date(b.order_date) - new Date(a.order_date)));

      // Customers
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

  const totalRevenue = orders.filter(o => o.order_status !== "Cancelled").reduce((sum, o) => sum + (Number(o.order_total_amount) || 0), 0);
  const statusCount = orders.reduce((acc, o) => { acc[o.order_status] = (acc[o.order_status] || 0) + 1; return acc; }, {});

  // Navigation Items Array
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'orders', icon: ShoppingBag, label: 'Orders' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'customers', icon: Users, label: 'Customers' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics' },
    { id: 'reports', icon: FileText, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  // --- UI RENDER ---
  return (
    <div className="flex flex-col h-screen w-full font-sans text-slate-200 overflow-hidden bg-[#0f172a] selection:bg-violet-500/30">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]"/>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]"/>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="sticky h-20 bg-black/20 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-10  shrink-0 relative">
        
        {/* Left: Logo & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="lg:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <h2 className="text-2xl font-bold tracking-tight text-white">GSH&nbsp;<span className="text-violet-500">Admin</span></h2>
        </div>

        {/* Center: Desktop Navigation (Hidden on Mobile) */}
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

        {/* Right: Profile & Actions */}
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>

          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { setEditFormData(adminProfile); setShowProfileModal(true); }}
          >
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold text-white group-hover:text-violet-400 transition-colors">{adminProfile.firstName}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">{adminProfile.role}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                {adminProfile.profileImage ? (
                  <img src={adminProfile.profileImage} className="w-full h-full object-cover" alt="p"/>
                ) : (
                  <span className="font-bold text-white text-sm">{adminProfile.firstName?.[0]}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- MOBILE MENU OVERLAY (Visible only when open on small screens) --- */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full h-[calc(100vh-80px)] bg-slate-900/95 backdrop-blur-2xl z-40 border-t border-white/5 flex flex-col p-6 animate-fade-in-up">
            <div className="space-y-2">
                {navItems.map((item) => (
                    <button
                    key={item.id}
                    onClick={() => { setActiveSection(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 font-medium ${
                        activeSection === item.id 
                        ? 'bg-violet-600 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                    >
                    <item.icon size={20} />
                    <span className="text-lg">{item.label}</span>
                    </button>
                ))}
                
                <div className="w-full h-px bg-white/10 my-4"></div>
            </div>
        </div>
      )}

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative z-10">
        {loadingData ? (
          <div className="flex h-full items-center justify-center flex-col gap-4 text-slate-500 animate-pulse">
            <Loader className="animate-spin text-violet-500" size={40}/> <span className="text-sm tracking-widest uppercase">Syncing Database...</span>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {activeSection === 'dashboard' && (
              <div className="space-y-8 animate-fade-in-up">
                <div className="mb-6 lg:mb-8">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">Welcome back, {adminProfile.firstName}</h1>
                  <p className="text-slate-400 mt-1 text-sm lg:text-base">Here's what's happening with your store today.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {[
                    { label: 'Total Orders', value: orders.length, color: 'text-blue-400', from: 'from-blue-600/20', to: 'to-blue-900/5', icon: ShoppingBag },
                    { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, color: 'text-emerald-400', from: 'from-emerald-600/20', to: 'to-emerald-900/5', icon: BarChart2 },
                    { label: 'Customers', value: customers.length, color: 'text-violet-400', from: 'from-violet-600/20', to: 'to-violet-900/5', icon: Users },
                    { label: 'Products', value: products.length, color: 'text-amber-400', from: 'from-amber-600/20', to: 'to-amber-900/5', icon: Package },
                  ].map((stat, idx) => (
                    <div key={idx} className="relative overflow-hidden bg-white/5 border border-white/5 p-6 rounded-3xl group hover:border-white/10 transition-all duration-300 hover:-translate-y-1 shadow-xl">
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.from} ${stat.to} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}/>
                      <div className="relative z-10 flex justify-between items-start">
                        <div>
                          <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
                          <h3 className={`text-2xl lg:text-3xl font-bold ${stat.color} drop-shadow-sm`}>{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-2xl bg-white/5 ${stat.color} ring-1 ring-white/5 shadow-inner`}> <stat.icon size={22}/> </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white/5 border border-white/5 rounded-3xl p-6 lg:p-8 backdrop-blur-sm relative overflow-hidden shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6">Revenue Overview</h3>
                    <div className="h-60 lg:h-72 w-full">
                      <Line data={{ 
                        labels: ['J','F','M','A','M','J'], 
                        datasets: [{ 
                          label: 'Revenue', 
                          data: [12000,19000,15000,25000,22000,30000], 
                          borderColor: '#8b5cf6', 
                          backgroundColor: 'rgba(139, 92, 246, 0.1)', 
                          fill: true, tension: 0.4, pointBackgroundColor: '#8b5cf6' 
                        }] 
                      }} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false, 
                        plugins: { legend: { display: false } }, 
                        scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } 
                      }} />
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-3xl p-6 lg:p-8 backdrop-blur-sm relative shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6">Order Status</h3>
                    <div className="h-64 flex justify-center">
                      <Pie data={{ 
                        labels: Object.keys(statusCount), 
                        datasets: [{ 
                          data: Object.values(statusCount), 
                          backgroundColor: ['#fbbf24', '#3b82f6', '#10b981', '#f43f5e'], 
                          borderWidth: 0 
                        }] 
                      }} 
                      options={{ 
                        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', usePointStyle: true, padding: 20 } } } 
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'products' && <AdminProducts initialProducts={products} onUpdate={fetchAllData} />}
            {activeSection === 'orders' && <AdminOrders initialOrders={orders} onUpdate={fetchAllData} />}
            {activeSection === 'customers' && <AdminCustomers initialCustomers={customers} onUpdate={fetchAllData} />}
            {activeSection === 'analytics' && <AdminAnalytics orders={orders} />}
            {activeSection === 'reports' && <AdminReports orders={orders} products={products} customers={customers} />}
            {activeSection === 'settings' && <AdminSettings />}
          </div>
        )}
      </main>

      {/* MODAL: PROFILE EDIT */}
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
              <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-violet-900/20 transition-all">
                {isSavingProfile ? <Loader className="animate-spin m-auto" size={20}/> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

