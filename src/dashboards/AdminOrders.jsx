import React, { useState } from 'react';
import { Search, ChevronDown, Calendar, User, Filter, Loader2 } from 'lucide-react';
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

const AdminOrders = ({ initialOrders, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isUpdating, setIsUpdating] = useState(null);

  const filteredOrders = (initialOrders || []).filter(order => {
    const sTerm = searchTerm.toLowerCase();
    const idMatch = order.order_id?.toString().toLowerCase().includes(sTerm);
    const statusMatch = statusFilter === 'All' || order.order_status === statusFilter;
    return idMatch && statusMatch;
  });

  const handleStatusChange = async (id, newStatus, isFirebase) => {
    // Only attempt to update Firebase if the order actually exists there
    if (!isFirebase) {
      alert("This is a demo order. Changes won't persist to the database.");
      return;
    }

    setIsUpdating(id);
    try {
      // 🔹 UPDATE: Pointing to 'OrderItems' collection with 'orderStatus' field
      await updateDoc(doc(db, "OrderItems", String(id)), { orderStatus: newStatus });
      
      // Trigger parent refresh
      if (onUpdate) await onUpdate();
      
    } catch (e) { 
      console.error(e);
      alert("Failed to update status. Check console for details."); 
    } finally {
      setIsUpdating(null);
    }
  };

  const getStatusColor = (s) => {
    switch(s) {
      case 'Delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Processing': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Shipped': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in px-2 sm:px-0">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">Order Management</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
            <input 
              value={searchTerm} 
              onChange={e=>setSearchTerm(e.target.value)} 
              placeholder="Search Order ID..." 
              className="bg-slate-900 border border-slate-700 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl w-full sm:w-64 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <select 
              value={statusFilter} 
              onChange={e=>setStatusFilter(e.target.value)} 
              className="bg-slate-900 border border-slate-700 text-slate-200 pl-4 pr-10 py-2.5 rounded-xl outline-none cursor-pointer appearance-none w-full sm:w-auto focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
                <th className="p-5 font-semibold">ID</th>
                <th className="p-5 font-semibold">Date</th>
                <th className="p-5 font-semibold">Customer</th>
                <th className="p-5 font-semibold">Status</th>
                <th className="p-5 font-semibold text-right">Total</th>
                <th className="p-5 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(o => (
                  <tr key={o.order_id} className="hover:bg-slate-800/30 transition-all group">
                    <td className="p-5">
                      <span className="text-violet-400 font-mono font-bold text-xs">
                        #{String(o.order_id).substring(0, 8)}...
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="text-slate-300 text-sm flex items-center gap-2">
                        <Calendar size={14} className="text-slate-500"/> {o.order_date}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="text-slate-300 text-sm flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                          <User size={14} className="text-slate-500"/>
                        </div>
                        <span className="truncate max-w-[120px]" title={o.customer_id}>{o.customer_id}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border tracking-wide uppercase ${getStatusColor(o.order_status)}`}>
                        {o.order_status}
                      </span>
                    </td>
                    <td className="p-5 text-right font-bold text-white font-mono">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(o.order_total_amount))}
                    </td>
                    <td className="p-5 text-center">
                      <div className="relative inline-block w-32 group/select">
                        {isUpdating === o.order_id ? (
                          <div className="flex items-center justify-center py-1.5 bg-slate-800 rounded-lg">
                            <Loader2 size={16} className="text-violet-500 animate-spin" />
                          </div>
                        ) : (
                          <>
                            <select 
                              value={o.order_status} 
                              onChange={(e) => handleStatusChange(o.order_id, e.target.value, o.isFirebase)} 
                              className="w-full appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none cursor-pointer focus:border-violet-500 transition-colors"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover/select:text-violet-400 transition-colors"/>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-500 italic">
                    No orders found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;