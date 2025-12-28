import React, { useState, useEffect } from 'react';
import { Save, Globe, Monitor, Loader, CheckCircle } from 'lucide-react';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const AdminSettings = () => {
  const [settings, setSettings] = useState({ siteName: 'Vajra Store', maintenanceMode: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "global"));
        if(snap.exists()) setSettings(snap.data());
      } catch(e) { console.error(e); }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "global"), settings, { merge: true });
      setMsg('Saved successfully!');
      setTimeout(()=>setMsg(''), 3000);
    } catch(e) { alert("Failed"); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
      {msg && <div className="fixed top-24 right-8 bg-emerald-500/20 text-emerald-200 px-4 py-2 rounded-xl flex items-center gap-2 border border-emerald-500/50 animate-bounce"><CheckCircle size={16}/> {msg}</div>}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex gap-2"><Globe size={18} className="text-blue-400"/> General</h3>
          <div><label className="text-sm text-slate-400 block mb-1">Store Name</label><input value={settings.siteName} onChange={e=>setSettings({...settings, siteName: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-blue-500"/></div>
        </div>
        <div className={`border p-6 rounded-2xl shadow-xl ${settings.maintenanceMode ? 'bg-amber-950/10 border-amber-500/30' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex justify-between items-center">
            <div><h4 className={`font-bold ${settings.maintenanceMode?'text-amber-400':'text-white'}`}>Maintenance Mode</h4><p className="text-xs text-slate-500">Hide store from public view.</p></div>
            <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={settings.maintenanceMode} onChange={()=>setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} className="sr-only peer"/><div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div></label>
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-4"><button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg">{saving?<Loader className="animate-spin" size={18}/>:<Save size={18}/>} Save Changes</button></div>
    </div>
  );
};

export default AdminSettings;