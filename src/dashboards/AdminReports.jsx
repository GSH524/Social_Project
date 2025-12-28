import React, { useState } from 'react';
import { FileText, Download, Printer, Filter, Search } from 'lucide-react';

const AdminReports = ({ orders = [], products = [], customers = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calculate Metrics for Report
  const totalRevenue = orders.filter(o => o.order_status !== "Cancelled").reduce((sum, o) => sum + (parseFloat(o.order_total_amount) || 0), 0);
  const activeProducts = products.filter(p => p.is_product_active).length;

  // Mock Chart Data for Report
  const chartDataSummary = `
  Jan: $12,000 | Feb: $19,000 | Mar: $15,000 
  Apr: $25,000 | May: $22,000 | Jun: $30,000`;

  const generateReport = () => {
    return `
    VAJRA E-COMMERCE - EXECUTIVE REPORT
    -----------------------------------
    Generated: ${new Date().toLocaleString()}

    1. KEY PERFORMANCE INDICATORS
    -----------------------------
    • Total Revenue:       $${totalRevenue.toLocaleString()}
    • Total Orders:        ${orders.length}
    • Total Customers:     ${customers.length}
    • Active Products:     ${activeProducts} / ${products.length}
    • Total Growth:        +24.5% (Est)
    • Bounce Rate:         12.3%
    • Active Sessions:     1,432

    2. REVENUE CHART DATA (YTD)
    ---------------------------
    ${chartDataSummary}

    3. RECENT ORDERS (SNAPSHOT)
    ---------------------------
    ID      | Status      | Amount
    ${orders.slice(0, 5).map(o => `#${o.order_id}   | ${o.order_status.padEnd(10)} | $${o.order_total_amount}`).join('\n    ')}

    -----------------------------------
    End of Report
    `;
  };

  const handleDownload = (name) => {
    const blob = new Blob([generateReport()], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const handlePrint = () => {
    const win = window.open('','','height=600,width=800');
    win.document.write(`<html><body style="font-family:monospace;white-space:pre-wrap;">${generateReport()}</body></html>`);
    win.document.close();
    win.print();
  };

  const reports = [
    { id: 1, name: 'Full System Overview', date: 'Live', size: '2 KB', type: 'TXT' },
    { id: 2, name: 'Sales Performance', date: 'Q3 2025', size: '4 KB', type: 'PDF' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Reports</h2>
        <div className="flex gap-2">
            <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={16}/><input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search..." className="bg-slate-800 text-slate-200 border border-slate-700 pl-9 pr-3 py-2 rounded-lg outline-none"/></div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"><Filter size={16}/> Filter</button>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center"><h3 className="text-lg font-semibold text-white">Available Reports</h3><button onClick={handlePrint} className="text-violet-400 text-sm font-medium hover:text-violet-300 flex items-center gap-1"><Printer size={14}/> Print Summary</button></div>
        <div className="divide-y divide-slate-800">
          {reports.filter(r=>r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
            <div key={r.id} className="p-4 flex justify-between items-center hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400"><FileText size={20}/></div>
                <div><h4 className="text-white font-medium">{r.name}</h4><p className="text-xs text-slate-500">{r.date} • {r.size}</p></div>
              </div>
              <button onClick={()=>handleDownload(r.name)} className="flex items-center gap-2 px-3 py-2 text-violet-400 hover:bg-violet-600 hover:text-white rounded-lg transition-colors border border-violet-500/30"><Download size={16}/> Download</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;