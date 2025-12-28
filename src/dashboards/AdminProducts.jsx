import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, X, Tag, Loader, DollarSign } from 'lucide-react';
import { db } from "../firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

const AdminProducts = ({ initialProducts, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    product_name: '', product_brand: '', product_category: '',
    product_department: '', selling_unit_price: '', cost_unit_price: '',
    product_margin: 0, product_margin_percent: 0,
    product_short_description: '', image_url: '', is_product_active: true
  });

  const filtered = initialProducts.filter(p => 
    (p.product_name?.toLowerCase().includes(searchTerm.toLowerCase())) && 
    (!categoryFilter || p.product_category === categoryFilter)
  );

  const categories = [...new Set(initialProducts.map(p => p.product_category).filter(Boolean))];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    let updatedData = { ...formData, [name]: val };

    if (name === 'selling_unit_price' || name === 'cost_unit_price') {
      const sell = parseFloat(name === 'selling_unit_price' ? val : formData.selling_unit_price) || 0;
      const cost = parseFloat(name === 'cost_unit_price' ? val : formData.cost_unit_price) || 0;
      if (sell !== 0) {
        const margin = sell - cost;
        updatedData.product_margin = parseFloat(margin.toFixed(2));
        updatedData.product_margin_percent = parseFloat((margin / sell).toFixed(3));
      }
    }
    setFormData(updatedData);
  };

  const handleSave = async (e) => {
    e.preventDefault(); 
    setSaving(true);
    const prodId = currentProduct ? currentProduct.product_id : Math.floor(Math.random() * 900000) + 100000;
    
    try {
      const payload = {
        ...formData,
        product_id: Number(prodId),
        selling_unit_price: Number(formData.selling_unit_price),
        cost_unit_price: Number(formData.cost_unit_price),
      };
      await setDoc(doc(db, "products", String(prodId)), payload, { merge: true });
      if(onUpdate) onUpdate(); 
      setIsModalOpen(false);
    } catch(err){ 
      alert("Error saving product: " + err.message); 
    } finally{ 
      setSaving(false); 
    }
  };

  const handleDelete = async (id) => { 
    if(window.confirm("Delete this product?")) { 
      try { 
        await deleteDoc(doc(db, "products", String(id))); 
        if(onUpdate) onUpdate(); 
      } catch(e){ console.error(e); } 
    } 
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      {/* Header System - Responsive Stack */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/5 p-4 md:p-6 rounded-3xl border border-white/5 backdrop-blur-md">
        <h2 className="text-2xl font-bold text-white px-2">Inventory Management</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3 w-full lg:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
            <input 
              value={searchTerm} 
              onChange={e=>setSearchTerm(e.target.value)} 
              placeholder="Search products..." 
              className="w-full lg:w-64 bg-black/20 border border-white/10 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:border-violet-500 outline-none transition-all"
            />
          </div>
          
          <select 
            value={categoryFilter} 
            onChange={e=>setCategoryFilter(e.target.value)} 
            className="bg-black/20 border border-white/10 text-slate-200 px-4 py-2.5 rounded-xl outline-none cursor-pointer focus:border-violet-500"
          >
            <option value="" className="bg-slate-900">All Categories</option>
            {categories.map(c=><option key={c} value={c} className="bg-slate-900">{c}</option>)}
          </select>

          <button 
            onClick={() => { setCurrentProduct(null); setFormData({ product_department: 'Unisex', is_product_active: true }); setIsModalOpen(true); }} 
            className="sm:col-span-2 lg:col-auto bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Plus size={20}/> Add Product
          </button>
        </div>
      </div>

      {/* Table System - Horizontal Scroll on Mobile */}
      <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-widest bg-white/5">
                <th className="p-5">Product Info</th>
                <th className="p-5">Category</th>
                <th className="p-5">Pricing</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(p => (
                <tr key={p.product_id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                        {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" alt={p.product_name}/> : <Tag className="m-auto mt-3 text-slate-600"/>}
                      </div>
                      <div className="max-w-[200px]">
                        <p className="font-semibold text-white truncate group-hover:text-violet-300 transition-colors">{p.product_name}</p>
                        <p className="text-xs text-slate-500 uppercase">{p.product_brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-sm text-slate-400">{p.product_category}</td>
                  <td className="p-5">
                    <p className="font-bold text-emerald-400">${p.selling_unit_price}</p>
                    <p className="text-[10px] text-slate-500">Cost: ${p.cost_unit_price}</p>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${p.is_product_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {p.is_product_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="p-5 text-right space-x-2">
                    <button onClick={()=>{setCurrentProduct(p); setFormData(p); setIsModalOpen(true)}} className="text-blue-400 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"><Edit size={18}/></button>
                    <button onClick={()=>handleDelete(p.product_id)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal System - Responsive Sizing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{currentProduct ? 'Edit Product' : 'New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 ml-1">Product Name</label>
                  <input name="product_name" placeholder="Enter name..." value={formData.product_name || ''} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none" required/>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer bg-black/20 p-3 rounded-xl border border-white/10 w-full">
                    <input type="checkbox" name="is_product_active" checked={formData.is_product_active} onChange={handleInputChange} className="w-5 h-5 accent-violet-600"/>
                    <span className="text-slate-300 text-sm font-medium">Product Active</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                   <label className="text-xs text-slate-400 ml-1">Brand</label>
                   <input name="product_brand" placeholder="Brand" value={formData.product_brand || ''} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none" required/>
                </div>
                <div className="space-y-2">
                   <label className="text-xs text-slate-400 ml-1">Category</label>
                   <input name="product_category" placeholder="Category" value={formData.product_category || ''} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none" required/>
                </div>
                <div className="space-y-2">
                   <label className="text-xs text-slate-400 ml-1">Department</label>
                   <select name="product_department" value={formData.product_department || 'Unisex'} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none">
                      <option value="Unisex" className="bg-slate-900">Unisex</option>
                      <option value="Men" className="bg-slate-900">Men</option>
                      <option value="Women" className="bg-slate-900">Women</option>
                      <option value="Kids" className="bg-slate-900">Kids</option>
                   </select>
                </div>
              </div>

              {/* Advanced Pricing Table View */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-sm uppercase tracking-widest">
                  <DollarSign size={16}/> Pricing & Financials
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Sale Price ($)</label>
                    <input name="selling_unit_price" type="number" step="0.01" value={formData.selling_unit_price} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-emerald-400 font-bold focus:border-emerald-500 outline-none" required/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Cost Price ($)</label>
                    <input name="cost_unit_price" type="number" step="0.01" value={formData.cost_unit_price} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-rose-400 font-bold focus:border-rose-500 outline-none" required/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Net Margin</label>
                    <div className={`p-2.5 rounded-xl bg-black/20 font-mono text-center border border-white/5 ${formData.product_margin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formData.product_margin}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Margin %</label>
                    <div className={`p-2.5 rounded-xl bg-black/20 font-mono text-center border border-white/5 ${formData.product_margin_percent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {(formData.product_margin_percent * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 ml-1">Product Media URL</label>
                <input name="image_url" placeholder="Paste image link here..." value={formData.image_url || ''} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none"/>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 ml-1">Product Description</label>
                <textarea name="product_short_description" placeholder="Technical specifications or details..." value={formData.product_short_description || ''} onChange={handleInputChange} rows="3" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none resize-none"/>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98]">
                  {saving ? <Loader className="animate-spin m-auto" size={24}/> : 'Complete Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;