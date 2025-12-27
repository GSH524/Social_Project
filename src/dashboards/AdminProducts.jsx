import React, { useState } from 'react';
import { products } from '../data/dataUtils.js';

const AdminProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.product_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.product_category))];

  return (
    <div className="dashboard-section">
      <div className="admin-header-row">
        <h2>Products Inventory</h2>
        <div className="table-controls">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{width: '250px'}}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-control"
            style={{width: '200px', display: 'inline-block'}}
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <button className="btn-primary-custom">Add Product</button>
        </div>
      </div>

      <div className="admin-table-container">
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.slice(0, 50).map(product => (
                <tr key={product.product_id}>
                  <td className="text-muted">#{product.product_id}</td>
                  <td className="fw-bold">{product.product_name}</td>
                  <td>
                      <span className="badge bg-light text-dark border">
                          {product.product_category}
                      </span>
                  </td>
                  <td>₹{product.selling_unit_price.toFixed(2)}</td>
                  <td>
                      <span className={`badge ${product.product_stock_quantity < 10 ? 'bg-danger' : 'bg-success'} bg-opacity-10 text-${product.product_stock_quantity < 10 ? 'danger' : 'success'}`}>
                          {product.product_stock_quantity} in stock
                      </span>
                  </td>
                  <td className="text-end">
                    <button className="btn-action btn-view me-2">View</button>
                    <button className="btn-action btn-edit me-2">Edit</button>
                    <button className="btn-action btn-delete">Delete</button>
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

export default AdminProducts;