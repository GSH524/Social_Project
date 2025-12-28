import React, { useState } from 'react';
import { Search, Mail, MapPin, Calendar, Plus, X, User, ShieldCheck, ShieldAlert, Loader } from 'lucide-react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AdminCustomers = ({ initialCustomers, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // New User Form Data
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', 
    mobile: '', city: '', country: '', address: '', role: 'user'
  });

  const filtered = initialCustomers.filter(c => c.customer_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCreateUser = async (e) => {
    e.preventDefault(); 
    setSaving(true);
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Save Profile to Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        mobile: formData.mobile,
        city: formData.city,
        country: formData.country,
        address: formData.address,
        role: 'user',
        createdAt: new Date(),
        profileImage: ''
      });

      alert("New User Account Created Successfully!"); 
      if(onUpdate) onUpdate(); 
      setIsModalOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', password: '', mobile: '', city: '', country: '', address: '', role: 'user' });

    } catch(e){ 
      console.error(e);
      alert("Error: " + e.message); 
    } finally{ 
      setSaving(false); 
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
        <h2 className="text-xl font-bold text-white px-2">Customers</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
                value={searchTerm} 
                onChange={e=>setSearchTerm(e.target.value)} 
                placeholder="Search users..." 
                className="w-full bg-black/20 border border-white/10 text-slate-200 pl-10 pr-4 py-2 rounded-xl focus:border-violet-500 outline-none transition-all"
            />
          </div>
          <button 
            onClick={()=>setIsModalOpen(true)} 
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg flex gap-2 items-center justify-center transition-all w-full sm:w-auto"
          >
            <Plus size={18}/> <span className="whitespace-nowrap">New User</span>
          </button>
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
                <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="p-5 font-semibold">User Profile</th>
                    <th className="p-5 font-semibold">Location</th>
                    <th className="p-5 font-semibold">Role</th>
                    <th className="p-5 font-semibold text-right">Joined</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.slice(0, 20).map(c => (
                <tr key={c.customer_id} className="hover:bg-white/5 transition-colors">
                  <td className="p-5 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-violet-300 font-bold border border-white/10 overflow-hidden shrink-0">
                            {c.customer_image_url ? <img src={c.customer_image_url} className="w-full h-full object-cover"/> : (c.customer_full_name?.[0] || 'U')}
                        </div>
                        <div>
                            <div className="text-white font-medium">{c.customer_full_name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10}/> {c.customer_email}</div>
                        </div>
                    </div>
                  </td>
                  <td className="p-5 text-sm text-slate-300 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-slate-500 shrink-0"/> 
                        <span className="truncate max-w-[150px]">{c.customer_city || 'Unknown'}, {c.customer_country}</span>
                    </div>
                  </td>
                  <td className="p-5 whitespace-nowrap">
                    {c.type === 'User' ? 
                        <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs border border-emerald-500/20 flex w-fit gap-1 items-center"><ShieldCheck size={12}/> Registered</span> : 
                        <span className="bg-slate-500/10 text-slate-400 px-3 py-1 rounded-full text-xs border border-slate-500/20 flex w-fit gap-1 items-center"><User size={12}/> Manual</span>}
                  </td>
                  <td className="p-5 text-right text-sm text-slate-400 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                        <Calendar size={12} className="inline"/> {c.customer_created_date}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD USER MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 animate-fade-in-up max-h-[90vh] overflow-y-auto scrollbar-none">
            
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <h3 className="text-xl font-bold text-white">Create New User Account</h3>
                <button onClick={()=>setIsModalOpen(false)} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                    placeholder="First Name" 
                    onChange={e=>setFormData({...formData, firstName:e.target.value})} 
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none transition-all placeholder-slate-500" 
                    required
                />
                <input 
                    placeholder="Last Name" 
                    onChange={e=>setFormData({...formData, lastName:e.target.value})} 
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none transition-all placeholder-slate-500" 
                    required
                />
              </div>
              
              <input 
                placeholder="Email Address" 
                type="email" 
                onChange={e=>setFormData({...formData, email:e.target.value})} 
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none transition-all placeholder-slate-500" 
                required
              />
              
              <input 
                placeholder="Password (Min 6 chars)" 
                type="password" 
                onChange={e=>setFormData({...formData, password:e.target.value})} 
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none transition-all placeholder-slate-500" 
                required
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                    placeholder="City" 
                    onChange={e=>setFormData({...formData, city:e.target.value})} 
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none transition-all placeholder-slate-500"
                />
                <input 
                    placeholder="Country" 
                    onChange={e=>setFormData({...formData, country:e.target.value})} 
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none transition-all placeholder-slate-500"
                />
              </div>
              
              <div className="pt-4">
                <button 
                    type="submit" 
                    disabled={saving} 
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-violet-900/20 transition-all flex justify-center items-center gap-2"
                >
                    {saving ? <Loader className="animate-spin" size={20}/> : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;