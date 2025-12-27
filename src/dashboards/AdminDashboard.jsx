import React, { useState } from "react";
import "./AdminDashboard.css";
import { customers as customer, orders, orderItems, products } from "../data/dataUtils.js";
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { LayoutDashboard, ShoppingBag, Users, Package, Settings, FileText, BarChart2, Search, Bell } from 'lucide-react';

import AdminOrders from './AdminOrders';
import AdminProducts from './AdminProducts';
import AdminCustomers from './AdminCustomers';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // --- STATS CALCULATION ---
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(o => o.order_status !== "Cancelled")
    .reduce((sum, o) => sum + o.order_total_amount, 0);
  const totalCustomers = customer.length;
  const totalProducts = products.length;

  // Monthly orders
  const monthlyOrders = {};
  orders
    .filter(o => (!startDate || new Date(o.order_year, o.order_month - 1) >= new Date(startDate)) && (!endDate || new Date(o.order_year, o.order_month - 1) <= new Date(endDate)))
    .forEach(order => {
      const key = `${order.order_year}-${String(order.order_month).padStart(2, '0')}`;
      monthlyOrders[key] = (monthlyOrders[key] || 0) + 1;
    });
  const orderLabels = Object.keys(monthlyOrders).sort();
  const orderData = orderLabels.map(month => monthlyOrders[month]);

  // Monthly revenue
  const monthlyRevenue = {};
  orders
    .filter(o => o.order_status !== "Cancelled" && (!startDate || new Date(o.order_year, o.order_month - 1) >= new Date(startDate)) && (!endDate || new Date(o.order_year, o.order_month - 1) <= new Date(endDate)))
    .forEach(order => {
      const key = `${order.order_year}-${String(order.order_month).padStart(2, '0')}`;
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + order.order_total_amount;
    });
  const revenueLabels = Object.keys(monthlyRevenue).sort();
  const revenueData = revenueLabels.map(month => monthlyRevenue[month]);

  // Status Distribution
  const statusCount = {};
  orders.forEach(o => statusCount[o.order_status] = (statusCount[o.order_status] || 0) + 1);
  
  // Top Products
  const productSales = {};
  orderItems.forEach(item => productSales[item.product_id] = (productSales[item.product_id] || 0) + item.ordered_quantity);
  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([id, qty]) => {
      const prod = products.find(p => p.product_id === parseInt(id));
      return prod ? { ...prod, qty } : null;
    }).filter(Boolean);

  const topProductLabels = topProducts.map(p => p.product_name);
  const topProductData = topProducts.map(p => p.qty);

  // --- COMPONENT RENDER ---
  return (
    <div className="admin-container">

      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">Vajra<span>Admin</span></h2>
        <ul className="menu">
          <li className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => setActiveSection('dashboard')}>
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </li>
          <li className={activeSection === 'orders' ? 'active' : ''} onClick={() => setActiveSection('orders')}>
            <ShoppingBag size={20} /> <span>Orders</span>
          </li>
          <li className={activeSection === 'products' ? 'active' : ''} onClick={() => setActiveSection('products')}>
            <Package size={20} /> <span>Products</span>
          </li>
          <li className={activeSection === 'customers' ? 'active' : ''} onClick={() => setActiveSection('customers')}>
            <Users size={20} /> <span>Customers</span>
          </li>
          <li><BarChart2 size={20} /> <span>Analytics</span></li>
          <li><FileText size={20} /> <span>Reports</span></li>
          <li><Settings size={20} /> <span>Settings</span></li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="d-flex align-items-center gap-2">
            <Search size={20} className="text-muted"/>
            <input type="text" placeholder="Search anything..." className="search-input" />
          </div>
          <div className="d-flex align-items-center gap-4">
            <div className="position-relative">
              <Bell size={22} className="text-secondary cursor-pointer"/>
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize: '0.6rem'}}>3</span>
            </div>
            <div className="profile-badge">Admin User</div>
          </div>
        </header>

        {/* Dynamic Content */}
        <section className="dashboard-content">
          
          {activeSection === 'dashboard' && (
            <div className="dashboard-section">
              
              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card blue">
                  <h4>Total Orders</h4>
                  <p>{totalOrders.toLocaleString()}</p>
                </div>
                <div className="stat-card green">
                  <h4>Revenue</h4>
                  <p>₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="stat-card red">
                  <h4>Customers</h4>
                  <p>{totalCustomers.toLocaleString()}</p>
                </div>
                <div className="stat-card yellow">
                  <h4>Products</h4>
                  <p>{totalProducts.toLocaleString()}</p>
                </div>
              </div>

              {/* Filters */}
              <div className="chart-card p-3 mb-4 d-flex gap-3 align-items-center flex-wrap">
                <span className="fw-bold text-secondary">Date Filter:</span>
                <input type="date" className="form-control w-auto" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span className="text-muted">-</span>
                <input type="date" className="form-control w-auto" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                <button className="btn btn-sm btn-outline-secondary" onClick={() => { setStartDate(''); setEndDate(''); }}>Clear</button>
              </div>

              {/* Charts Row 1 */}
              <div className="row">
                <div className="col-lg-8 mb-4">
                  <div className="chart-card h-100">
                    <h3>Revenue Analytics</h3>
                    <div style={{ height: '300px' }}>
                      <Line
                        data={{
                          labels: revenueLabels,
                          datasets: [{
                            label: 'Revenue (₹)',
                            data: revenueData,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.4
                          }]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } } } }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-4 mb-4">
                  <div className="chart-card h-100">
                    <h3>Order Status</h3>
                    <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
                      <Pie
                        data={{
                          labels: Object.keys(statusCount),
                          datasets: [{
                            data: Object.values(statusCount),
                            backgroundColor: ['#f59e0b', '#0ea5e9', '#10b981', '#ef4444'],
                            borderWidth: 0
                          }]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="row">
                <div className="col-lg-6 mb-4">
                  <div className="chart-card">
                    <h3>Monthly Orders Trend</h3>
                    <div style={{ height: '250px' }}>
                       <Line
                          data={{
                            labels: orderLabels,
                            datasets: [{
                              label: 'Orders',
                              data: orderData,
                              borderColor: '#4f46e5',
                              backgroundColor: 'rgba(79, 70, 229, 0.1)',
                              fill: true,
                              tension: 0.4
                            }]
                          }}
                          options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } } } }}
                        />
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 mb-4">
                   <div className="chart-card">
                    <h3>Top Products</h3>
                    <div style={{ height: '250px' }}>
                      <Bar
                        data={{
                          labels: topProductLabels,
                          datasets: [{
                            label: 'Qty Sold',
                            data: topProductData,
                            backgroundColor: '#6366f1',
                            borderRadius: 4
                          }]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } }}
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeSection === 'orders' && <AdminOrders />}
          {activeSection === 'products' && <AdminProducts />}
          {activeSection === 'customers' && <AdminCustomers />}

        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;