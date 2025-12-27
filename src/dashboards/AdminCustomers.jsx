import React, { useState } from 'react';
import { customers } from '../data/dataUtils.js';

const AdminCustomers = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-section">
      <div className="admin-header-row">
        <h2>Customer Database</h2>
        <div className="table-controls">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{width: '300px'}}
          />
          <button className="btn-primary-custom">Add Customer</button>
        </div>
      </div>

      <div className="admin-table-container">
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Contact</th>
                <th>Location</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.slice(0, 50).map(customer => (
                <tr key={customer.customer_id}>
                  <td className="text-muted">#{customer.customer_id}</td>
                  <td>
                      <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{width: 30, height: 30, fontSize: 12}}>
                              {customer.customer_name.charAt(0)}
                          </div>
                          <span className="fw-semibold">{customer.customer_name}</span>
                      </div>
                  </td>
                  <td>{customer.customer_email}</td>
                  <td>{customer.customer_mobile}</td>
                  <td>{customer.customer_address}</td>
                  <td className="text-end">
                    <button className="btn-action btn-view me-2">Profile</button>
                    <button className="btn-action btn-edit">Edit</button>
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

export default AdminCustomers;