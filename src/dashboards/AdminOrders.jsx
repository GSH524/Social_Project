import React, { useState } from 'react';
import { Search, ChevronDown, Calendar, User, Filter } from 'lucide-react';
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

const AdminOrders = ({ initialOrders, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredOrders = (initialOrders || []).filter(order => {
    const sTerm = searchTerm.toLowerCase();
    const idMatch = order.order_id?.toString().includes(sTerm);
    const statusMatch = statusFilter === 'All' || order.order_status === statusFilter;
    return idMatch && statusMatch;
  });

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", String(id)), { order_status: newStatus });
      if (onUpdate) onUpdate();
    } catch (e) { alert("Failed to update status."); }
  };

  const getStatusColor = (s) => {
    if(s==='Delivered') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if(s==='Pending') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if(s==='Cancelled') return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Order Management</h2>
        <div className="flex gap-3">
          <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-500" size={16}/><input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search Order ID..." className="bg-slate-900 border border-slate-700 text-slate-200 pl-10 pr-4 py-2 rounded-lg w-full sm:w-64 outline-none"/></div>
          <div className="relative"><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-200 pl-4 pr-10 py-2 rounded-lg outline-none cursor-pointer appearance-none"><option>All</option><option>Pending</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select><Filter size={16} className="absolute right-3 top-2.5 text-slate-500 pointer-events-none"/></div>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800"><th className="p-4">ID</th><th className="p-4">Date</th><th className="p-4">Customer</th><th className="p-4">Status</th><th className="p-4 text-right">Total</th><th className="p-4 text-center">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.slice(0, 20).map(o => (
                <tr key={o.order_id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-violet-400 font-bold">#{o.order_id}</td>
                  <td className="p-4"><div className="text-white text-sm flex items-center gap-2"><Calendar size={14}/> {o.order_date}</div></td>
                  <td className="p-4 text-slate-300 text-sm"><User size={14} className="inline mr-1"/> {o.customer_id}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(o.order_status)}`}>{o.order_status}</span></td>
                  <td className="p-4 text-right font-bold text-white">${Number(o.order_total_amount).toFixed(2)}</td>
                  <td className="p-4 text-center"><div className="relative inline-block w-32"><select value={o.order_status} onChange={(e) => handleStatusChange(o.order_id, e.target.value)} className="w-full appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none cursor-pointer"><option>Pending</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select><ChevronDown size={12} className="absolute right-2 top-2.5 text-slate-500 pointer-events-none"/></div></td>
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