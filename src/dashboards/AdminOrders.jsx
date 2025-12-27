import React, { useState } from 'react';
import { orders } from '../data/dataUtils.js';

const AdminOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOrders = orders.filter(order => 
    order.order_id.toString().includes(searchTerm) ||
    order.order_status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-section">
      <div className="admin-header-row">
        <h2>Recent Orders</h2>
        <div className="table-controls">
             <input
                type="text"
                placeholder="Search Order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
             />
        </div>
      </div>

      <div className="admin-table-container">
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer ID</th>
                <th>Status</th>
                <th>Total</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.slice(0, 50).map(order => (
                <tr key={order.order_id}>
                  <td className="fw-bold text-primary">#{order.order_id}</td>
                  <td>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td>Customer #{order.customer_id}</td>
                  <td>
                    <span className={`badge rounded-pill ${
                        order.order_status === 'Delivered' ? 'bg-success' : 
                        order.order_status === 'Pending' ? 'bg-warning' : 
                        order.order_status === 'Cancelled' ? 'bg-danger' : 'bg-info'
                    } text-dark bg-opacity-25 px-3 py-2`}>
                        {order.order_status}
                    </span>
                  </td>
                  <td className="fw-bold">₹{order.order_total_amount.toFixed(2)}</td>
                  <td className="text-end">
                    <button className="btn-action btn-view">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;