import React, { useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
// Import large data files
import { customers, orders, orderItems, orderReturns, products } from "../data/dataUtils.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import ProfileEdit from "../components/ProfileEdit";
import { 
  ShoppingCart, DollarSign, RotateCcw, Package, User, Edit, TrendingUp, Loader, Calendar 
} from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend 
} from 'chart.js';
import './UserDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('overview');
  const [editProfile, setEditProfile] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [firebaseProfile, setFirebaseProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  //  STRICT DATA LINKING LOGIC
  // ==========================================

  const matchedCustomer = user?.email 
    ? customers.find(c => c.customer_email.toLowerCase() === user.email.toLowerCase()) 
    : null;

  let userOrders = [];
  let userOrderItems = [];
  let userReturns = [];
  let topProducts = [];
  let productMap = new Map();

  if (matchedCustomer) {
    const customerId = matchedCustomer.customer_id;

    // A. Filter Orders
    userOrders = orders.filter(o => o.customer_id === customerId);

    // B. Create Set of Order IDs
    const userOrderIds = new Set(userOrders.map(o => o.order_id));

    // C. Filter Items
    userOrderItems = orderItems.filter(item => userOrderIds.has(item.order_id));

    // D. Create Product Map
    products.forEach(p => productMap.set(p.product_id, p));

    // E. Filter Returns
    const userOrderItemIds = new Set(userOrderItems.map(i => i.order_item_id));
    userReturns = orderReturns.filter(ret => userOrderItemIds.has(ret.order_item_id));

    // F. Calculate Top Products
    const productCount = {};
    userOrderItems.forEach(item => {
      productCount[item.product_id] = (productCount[item.product_id] || 0) + item.ordered_quantity;
    });

    topProducts = Object.entries(productCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, qty]) => {
        const prod = productMap.get(parseInt(id));
        return prod ? { ...prod, qty } : null;
      })
      .filter(Boolean);
  }

  const getProductDetails = (prodId) => productMap.get(prodId);

  // ==========================================
  //  CALCULATE REAL SPENDING (Minus Returns)
  // ==========================================

  // 1. Calculate Gross Spending (Total of all non-cancelled orders)
  const grossSpending = userOrders
    .filter(o => o.order_status !== "Cancelled")
    .reduce((sum, o) => sum + o.order_total_amount, 0);

  // 2. Calculate Value of Returns
  // We look at the returned list, find the matching item, and sum its total_amount
  const returnedAmount = userReturns.reduce((sum, ret) => {
    // Find the original item for this return
    const originalItem = userOrderItems.find(item => item.order_item_id === ret.order_item_id);
    // Add its value to the refund total
    return sum + (originalItem ? originalItem.total_amount : 0);
  }, 0);

  // 3. Final Net Spent
  const totalSpent = grossSpending - returnedAmount;


  // ==========================================
  //  FIREBASE & DISPLAY LOGIC
  // ==========================================

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      if (user?.uid) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setFirebaseProfile(docSnap.data());
          } else {
            const initialData = matchedCustomer ? {
                firstName: matchedCustomer.first_name,
                lastName: matchedCustomer.last_name,
                email: matchedCustomer.customer_email,
                address: matchedCustomer.customer_address,
                city: matchedCustomer.customer_city,
                country: matchedCustomer.customer_country,
                profileImage: matchedCustomer.customer_image_url
            } : {};
            setFirebaseProfile(initialData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, [user, matchedCustomer]);

  const displayData = {
    firstName: firebaseProfile?.firstName || matchedCustomer?.first_name || 'Guest',
    lastName: firebaseProfile?.lastName || matchedCustomer?.last_name || '',
    fullName: firebaseProfile?.fullName || `${firebaseProfile?.firstName || matchedCustomer?.first_name || ''} ${firebaseProfile?.lastName || matchedCustomer?.last_name || ''}`.trim(),
    email: firebaseProfile?.email || matchedCustomer?.customer_email || user?.email,
    address: firebaseProfile?.address || matchedCustomer?.customer_address || 'N/A',
    city: firebaseProfile?.city || matchedCustomer?.customer_city || '',
    country: firebaseProfile?.country || matchedCustomer?.customer_country || '',
    mobile: firebaseProfile?.mobile || '',
    profileImage: firebaseProfile?.profileImage || matchedCustomer?.customer_image_url || ''
  };

  // --- CHART CALCULATIONS ---

  const totalOrders = userOrders.length;

  const filteredOrders = userOrders.filter(o =>
    o.order_status !== "Cancelled" &&
    (!startDate || new Date(o.order_date) >= new Date(startDate)) &&
    (!endDate || new Date(o.order_date) <= new Date(endDate))
  );

  const monthlySpending = {};
  filteredOrders.forEach(order => {
    const date = new Date(order.order_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlySpending[key] = (monthlySpending[key] || 0) + order.order_total_amount;
  });
  
  const spendingLabels = Object.keys(monthlySpending).sort();
  const spendingData = spendingLabels.map(m => monthlySpending[m]);

  const categoryCount = {};
  const categorySpending = {};

  userOrderItems.forEach(item => {
    const parentOrder = userOrders.find(o => o.order_id === item.order_id);
    if (parentOrder && parentOrder.order_status !== 'Cancelled') {
      const prod = getProductDetails(item.product_id);
      if (prod) {
        categoryCount[prod.product_category] = (categoryCount[prod.product_category] || 0) + item.ordered_quantity;
        categorySpending[prod.product_category] = (categorySpending[prod.product_category] || 0) + (item.ordered_quantity * prod.selling_unit_price);
      }
    }
  });

  const categoryLabels = Object.keys(categoryCount);
  const categoryData = Object.values(categoryCount);
  const spendingCategoryLabels = Object.keys(categorySpending);
  const spendingCategoryData = Object.values(categorySpending);

  const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
    <div className="stat-card hover-scale">
      <div className="stat-info">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-growth">
          <TrendingUp size={14} className="me-1" /> 
          {matchedCustomer ? "Live Data" : "No Data Found"}
        </div>
      </div>
      <div className={`stat-icon ${bgClass}`}>
        <Icon size={24} className={colorClass} />
      </div>
    </div>
  );

  if (loading) return <div className="loader-container"><Loader size={40} className="animate-spin text-primary" /></div>;

  return (
    <div className="dashboard-redesign fade-in">
      <header className="dashboard-header">
        <div>
            <h2 className="dashboard-welcome">Hello, {displayData.fullName || displayData.firstName}</h2>
            <p className="dashboard-subtitle">
              {matchedCustomer 
                ? `Customer ID: #${matchedCustomer.customer_id} | ${displayData.city}, ${displayData.country}` 
                : "No linked customer account found."}
            </p>
        </div>
        <div className="tab-navigation">
          {['overview', 'profile', 'orders', 'payments'].map(tab => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {!matchedCustomer && activeTab === 'overview' && (
        <div className="alert alert-warning mb-4 mx-3" role="alert">
           Note: Your email ({user?.email}) does not match any records in our system.
        </div>
      )}

      {activeTab === 'overview' && (
        <main className="overview-section">
          <div className="kpi-grid">
            <StatCard title="Total Orders" value={totalOrders} icon={ShoppingCart} colorClass="text-primary" bgClass="bg-primary-soft" />
            <StatCard title="Net Spent" value={`₹${totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={DollarSign} colorClass="text-success" bgClass="bg-success-soft" />
            <StatCard title="Returns Value" value={`₹${returnedAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={RotateCcw} colorClass="text-danger" bgClass="bg-warning-soft" />
            <StatCard title="Unique Items" value={userOrderItems.length} icon={Package} colorClass="text-info" bgClass="bg-info-soft" />
          </div>

          <div className="filter-controls mb-4">
            <div className="d-flex gap-2 align-items-center">
                <Calendar size={18} />
                <input type="date" className="form-control form-control-sm" value={startDate} onChange={e=>setStartDate(e.target.value)} />
                <span>to</span>
                <input type="date" className="form-control form-control-sm" value={endDate} onChange={e=>setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="chart-grid">
            <div className="chart-card">
              <h5>Spending Trend</h5>
              {spendingData.length > 0 ? (
                <Line data={{
                  labels: spendingLabels,
                  datasets: [{
                    label: 'Spending (₹)',
                    data: spendingData,
                    borderColor: '#4f46e5',
                    fill: true,
                    backgroundColor: 'rgba(79,70,229,0.1)',
                    tension: 0.3
                  }]
                }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (val) => '₹' + val } } } }} />
              ) : <p className="text-center text-muted mt-5">No spending data available</p>}
            </div>
            <div className="chart-card">
              <h5>Order Status</h5>
              {userOrders.length > 0 ? (
                <Bar data={{
                    labels: ['Pending', 'Shipped', 'Delivered', 'Cancelled'],
                    datasets: [{
                    label: 'Orders',
                    data: [
                        userOrders.filter(o => o.order_status === 'Pending').length,
                        userOrders.filter(o => o.order_status === 'Shipped').length,
                        userOrders.filter(o => o.order_status === 'Delivered').length,
                        userOrders.filter(o => o.order_status === 'Cancelled').length
                    ],
                    backgroundColor: ['#f59e0b', '#0ea5e9', '#10b981', '#ef4444'],
                    borderRadius: 6,
                    barPercentage: 0.6
                    }]
                }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { display: false } } }} />
               ) : <p className="text-center text-muted mt-5">No orders found</p>}
            </div>
          </div>

          <div className="chart-grid">
            <div className="chart-card">
              <h5>Category Share (Qty)</h5>
              {categoryData.length > 0 ? (
                <Pie data={{
                    labels: categoryLabels,
                    datasets: [{
                    data: categoryData,
                    backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'],
                    borderWidth: 0
                    }]
                }} options={{ plugins: { legend: { position: 'bottom' } } }} />
               ) : <p className="text-center text-muted mt-5">No category data</p>}
            </div>
            <div className="chart-card">
              <h5>Spending by Category</h5>
              {spendingCategoryData.length > 0 ? (
                <Bar data={{
                    labels: spendingCategoryLabels,
                    datasets: [{
                    label: 'Total (₹)',
                    data: spendingCategoryData,
                    backgroundColor: '#3b82f6',
                    borderRadius: 6,
                    barThickness: 18
                    }]
                }} options={{ indexAxis: 'y', plugins: { legend: { display: false } } }} />
              ) : <p className="text-center text-muted mt-5">No category spending</p>}
            </div>
          </div>

          <div className="top-products-card">
            <h5>Top Products</h5>
            {topProducts.length > 0 ? topProducts.map((prod, idx) => (
              <div key={idx} className="product-item">
                <div className="d-flex align-items-center gap-3">
                    {prod.image_url && <img src={prod.image_url} alt="prod" style={{width:40, height:40, borderRadius:4, objectFit:'cover'}}/>}
                    <div>
                        <div className="fw-bold">{prod.product_name}</div>
                        <small className="text-muted">{prod.product_category}</small>
                    </div>
                </div>
                <div className="text-end">
                    <div className="fw-bold">₹{prod.selling_unit_price}</div>
                    <small>x{prod.qty} sold</small>
                </div>
              </div>
            )) : <p className="text-muted">No purchase data found.</p>}
          </div>
        </main>
      )}

      {activeTab === 'profile' && (
        <main className="profile-section">
          {editProfile ? <ProfileEdit initialData={{
            fullName: displayData.fullName,
            email: displayData.email,
            mobile: displayData.mobile,
            address: displayData.address,
            profileImage: displayData.profileImage
          }} onSave={async (updatedData) => {
            await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
            setFirebaseProfile(prev => ({ ...prev, ...updatedData }));
            setEditProfile(false);
          }} onCancel={() => setEditProfile(false)} /> : (
            <div className="profile-card hover-scale">
              {displayData.profileImage ? <img src={displayData.profileImage} alt="Profile" className="profile-img" /> : <User size={80} className="text-secondary" />}
              <h3>{displayData.fullName}</h3>
              <p className="text-muted">{displayData.email}</p>
              <div className="profile-details mt-3 text-start">
                 <p><strong>Mobile:</strong> {displayData.mobile || 'Not provided'}</p>
                 <p><strong>Address:</strong> {displayData.address}</p>
                 <p><strong>City/Country:</strong> {displayData.city}, {displayData.country}</p>
                 <p><strong>Customer ID:</strong> {matchedCustomer?.customer_id || 'Not Linked'}</p>
              </div>
              <button className="btn-edit mt-3" onClick={() => setEditProfile(true)}>
                <Edit size={16} /> Edit Profile
              </button>
            </div>
          )}
        </main>
      )}

      {activeTab === 'orders' && (
        <main className="orders-section">
          <h5>Order History</h5>
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr><th>Order ID</th><th>Date</th><th>Status</th><th className="text-end">Amount</th><th>Items</th></tr>
              </thead>
              <tbody>
                {userOrders.map(order => {
                   const itemCount = userOrderItems.filter(i => i.order_id === order.order_id).length;
                   return (
                    <tr key={order.order_id}>
                        <td>#{order.order_id}</td>
                        <td>{new Date(order.order_date).toLocaleDateString()}</td>
                        <td><span className={`status-badge status-${order.order_status.toLowerCase()}`}>{order.order_status}</span></td>
                        <td className="text-end">₹{order.order_total_amount.toFixed(2)}</td>
                        <td className="text-center">{itemCount}</td>
                    </tr>
                   );
                })}
                {userOrders.length === 0 && <tr><td colSpan="5" className="text-center p-4">No orders found.</td></tr>}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {activeTab === 'payments' && (
        <main className="payments-section">
          <h5>Payment History</h5>
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr><th>Reference</th><th>Date</th><th className="text-end">Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {userOrders.filter(o => o.order_status !== 'Cancelled').map(order => (
                  <tr key={order.order_id}>
                    <td className="font-monospace small">TXN-{order.order_id}</td>
                    <td>{new Date(order.order_date).toLocaleDateString()}</td>
                    <td className="text-end">₹{order.order_total_amount.toFixed(2)}</td>
                    <td className="text-center"><span className="badge-paid">Paid</span></td>
                  </tr>
                ))}
                {userOrders.length === 0 && <tr><td colSpan="4" className="text-center p-4">No payments found.</td></tr>}
              </tbody>
            </table>
          </div>
        </main>
      )}
    </div>
  );
};

export default UserDashboard;