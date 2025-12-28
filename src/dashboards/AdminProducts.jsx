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
  
  // Initialize form with default empty values
  const [formData, setFormData] = useState({
    product_name: '',
    product_brand: '',
    product_category: '',
    product_department: '',
    selling_unit_price: '',
    cost_unit_price: '',
    product_margin: 0,
    product_margin_percent: 0,
    product_short_description: '',
    image_url: '',
    is_product_active: true
  });

  const filtered = initialProducts.filter(p => (p.product_name?.toLowerCase().includes(searchTerm.toLowerCase())) && (!categoryFilter || p.product_category === categoryFilter));
  const categories = [...new Set(initialProducts.map(p => p.product_category).filter(Boolean))];

  // --- HANDLE INPUT & AUTO-CALCULATE MARGINS ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    let updatedData = { ...formData, [name]: val };

    // Auto-calculate margins if price changes
    if (name === 'selling_unit_price' || name === 'cost_unit_price') {
      const sell = parseFloat(name === 'selling_unit_price' ? val : formData.selling_unit_price) || 0;
      const cost = parseFloat(name === 'cost_unit_price' ? val : formData.cost_unit_price) || 0;
      
      if (sell !== 0) { // Avoid division by zero
        const margin = sell - cost;
        const marginPercent = margin / sell;
        
        updatedData.product_margin = parseFloat(margin.toFixed(2));
        updatedData.product_margin_percent = parseFloat(marginPercent.toFixed(3));
      }
    }

    setFormData(updatedData);
  };

  // --- SAVE TO FIREBASE ---
  const handleSave = async (e) => {
    e.preventDefault(); 
    setSaving(true);
    
    // Generate Random ID (number) if new
    const prodId = currentProduct ? currentProduct.product_id : Math.floor(Math.random() * 900000) + 100000;
    
    try {
      // Construct exact payload based on your requirement
      const payload = {
        product_id: Number(prodId),
        product_name: formData.product_name,
        product_brand: formData.product_brand,
        product_category: formData.product_category,
        product_department: formData.product_department,
        selling_unit_price: Number(formData.selling_unit_price),
        cost_unit_price: Number(formData.cost_unit_price),
        product_margin: Number(formData.product_margin),
        product_margin_percent: Number(formData.product_margin_percent),
        product_short_description: formData.product_short_description,
        image_url: formData.image_url,
        is_product_active: Boolean(formData.is_product_active)
      };

      // Save to 'products' collection
      await setDoc(doc(db, "products", String(prodId)), payload, { merge: true });

      if(onUpdate) onUpdate(); 
      setIsModalOpen(false);
    } catch(err){ 
      console.error(err); 
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

  // Helpers
  const openAdd = () => {
    setCurrentProduct(null);
    setFormData({
      product_name: '', product_brand: '', product_category: '', product_department: 'Unisex',
      selling_unit_price: '', cost_unit_price: '', product_margin: 0, product_margin_percent: 0,
      product_short_description: '', image_url: '', is_product_active: true
    });
    setIsModalOpen(true);
  };

  const openEdit = (p) => {
    setCurrentProduct(p);
    setFormData({
        ...p,
        // Ensure defaults if fields are missing
        product_department: p.product_department || 'Unisex',
        is_product_active: p.is_product_active ?? true
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
        <h2 className="text-xl font-bold text-white px-2">Products</h2>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none"><Search className="absolute left-3 top-2.5 text-slate-500" size={16}/><input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search..." className="bg-black/20 border border-white/10 text-slate-200 pl-10 pr-4 py-2 rounded-xl focus:border-violet-500 outline-none w-full"/></div>
          
          <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="bg-black/20 border border-white/10 text-slate-200 px-4 py-2 rounded-xl outline-none cursor-pointer focus:border-violet-500">
            <option value="" className="bg-slate-900">All Categories</option>
            {categories.map(c=><option key={c} value={c} className="bg-slate-900">{c}</option>)}
          </select>

          <button onClick={openAdd} className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl font-semibold shadow-lg shadow-violet-900/20 flex items-center gap-2"><Plus size={18}/> Add</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider"><th className="p-5">Product</th><th className="p-5">Category</th><th className="p-5">Price</th><th className="p-5">Status</th><th className="p-5 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.slice(0, 50).map(p => (
                <tr key={p.product_id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-5"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden">{p.image_url?<img src={p.image_url} className="w-full h-full object-cover"/>:<Tag className="m-auto text-slate-600"/>}</div><span className="font-medium text-white group-hover:text-violet-300 transition-colors">{p.product_name}</span></div></td>
                  <td className="p-5 text-sm text-slate-400">{p.product_category}</td>
                  <td className="p-5 font-semibold text-emerald-400">${p.selling_unit_price}</td>
                  <td className="p-5">{p.is_product_active?<span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs border border-emerald-500/20">Active</span>:<span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs border border-red-500/20">Inactive</span>}</td>
                  <td className="p-5 text-right"><button onClick={()=>openEdit(p)} className="text-blue-400 p-2 hover:bg-blue-500/10 rounded-lg"><Edit size={16}/></button><button onClick={()=>handleDelete(p.product_id)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg"><Trash2 size={16}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center"><h3 className="text-xl font-bold text-white">{currentProduct?'Edit':'New'} Product</h3><button onClick={()=>setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X/></button></div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
              
              {/* Row 1 */}
              <div className="flex gap-4">
                <input name="product_name" placeholder="Product Name" value={formData.product_name||''} onChange={handleInputChange} className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none" required/>
                <label className="flex items-center gap-2 cursor-pointer bg-black/20 px-4 rounded-xl border border-white/10">
                    <input type="checkbox" name="is_product_active" checked={formData.is_product_active} onChange={handleInputChange} className="w-5 h-5 rounded bg-white/10 border-white/20"/>
                    <span className="text-slate-300 text-sm">Active</span>
                </label>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input name="product_brand" placeholder="Brand" value={formData.product_brand||''} onChange={handleInputChange} className="bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none" required/>
                <input name="product_category" placeholder="Category" value={formData.product_category||''} onChange={handleInputChange} className="bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none" required/>
                <select name="product_department" value={formData.product_department||'Unisex'} onChange={handleInputChange} className="bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none">
                    <option value="Unisex" className="bg-slate-900">Unisex</option>
                    <option value="Men" className="bg-slate-900">Men</option>
                    <option value="Women" className="bg-slate-900">Women</option>
                    <option value="Kids" className="bg-slate-900">Kids</option>
                </select>
              </div>

              {/* Pricing Section (Auto Calculated) */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2"><DollarSign size={14}/> Pricing & Margins</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Selling Price</label>
                        <input name="selling_unit_price" type="number" placeholder="0.00" value={formData.selling_unit_price} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-emerald-400 focus:border-emerald-500 outline-none" required/>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Cost Price</label>
                        <input name="cost_unit_price" type="number" placeholder="0.00" value={formData.cost_unit_price} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-rose-400 focus:border-rose-500 outline-none" required/>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Margin</label>
                        <input readOnly value={formData.product_margin} className="w-full bg-transparent border-none p-2 text-slate-300 font-mono"/>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Margin %</label>
                        <input readOnly value={formData.product_margin_percent} className="w-full bg-transparent border-none p-2 text-slate-300 font-mono"/>
                    </div>
                </div>
              </div>

              <input name="image_url" placeholder="Image URL" value={formData.image_url||''} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none"/>
              <textarea name="product_short_description" placeholder="Short Description..." value={formData.product_short_description||''} onChange={handleInputChange} rows="2" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none"/>

              <div className="pt-4"><button type="submit" disabled={saving} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-violet-900/20">{saving?<Loader className="animate-spin m-auto"/>:'Save Product'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminProducts;