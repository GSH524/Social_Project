import React, { useState, useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { ArrowUp, ArrowDown, Activity, Filter } from 'lucide-react';

const AdminAnalytics = () => {
  const [selectedMonth, setSelectedMonth] = useState('All');

  const { labels, salesData } = useMemo(() => {
    if (selectedMonth !== 'All') {
      return { 
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], 
        salesData: [5000, 7200, 4800, 8100] 
      };
    }
    return { 
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], 
        salesData: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 32000, 35000, 40000, 38000, 45000] 
    };
  }, [selectedMonth]);

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      
      {/* Header Section: Stacks on mobile, Row on Desktop */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
        <h2 className="text-xl md:text-2xl font-bold text-white px-2">Advanced Analytics</h2>
        
        {/* Filter Dropdown: Full width on mobile */}
        <div className="w-full md:w-auto flex items-center gap-3 bg-black/20 border border-white/10 p-1.5 rounded-xl shadow-lg">
            <div className="flex items-center px-3 text-slate-400 border-r border-white/10 text-sm whitespace-nowrap">
              <Filter size={14} className="mr-2"/> Period
            </div>
            
            <select 
                value={selectedMonth} 
                onChange={(e)=>setSelectedMonth(e.target.value)} 
                className="bg-transparent text-white text-sm outline-none cursor-pointer px-2 w-full md:w-auto"
            >
                <option value="All" className="bg-slate-900 text-slate-200">All Months</option>
                <option value="January" className="bg-slate-900 text-slate-200">January</option>
                <option value="February" className="bg-slate-900 text-slate-200">February</option>
            </select>
        </div>
      </div>

      {/* KPI Cards: 1 col mobile -> 2 col tablet -> 3 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        
        <div className="bg-white/5 border border-white/5 p-5 md:p-6 rounded-3xl shadow-xl flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-sm font-medium">Growth</p>
            <h3 className="text-2xl md:text-3xl font-bold text-white mt-1">+24.5%</h3>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400"><ArrowUp size={24}/></div>
        </div>

        <div className="bg-white/5 border border-white/5 p-5 md:p-6 rounded-3xl shadow-xl flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-sm font-medium">Bounce Rate</p>
            <h3 className="text-2xl md:text-3xl font-bold text-white mt-1">12.3%</h3>
          </div>
          <div className="bg-rose-500/10 p-3 rounded-xl text-rose-400"><ArrowDown size={24}/></div>
        </div>

        {/* This card spans full width on tablet (sm) if odd number, or stays in grid */}
        <div className="bg-white/5 border border-white/5 p-5 md:p-6 rounded-3xl shadow-xl flex justify-between items-center sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-slate-400 text-sm font-medium">Active Sessions</p>
            <h3 className="text-2xl md:text-3xl font-bold text-white mt-1">1,432</h3>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400"><Activity size={24}/></div>
        </div>

      </div>

      {/* Charts Section */}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Chart */}
        <div className="bg-white/5 border border-white/5 p-4 md:p-8 rounded-3xl backdrop-blur-sm shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">Financial Overview</h3>
          <div className="h-60 md:h-72 w-full">
            <Bar 
              data={{ 
                labels, 
                datasets: [{ label: 'Revenue', data: salesData, backgroundColor: '#8b5cf6', borderRadius: 4 }] 
              }} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                  x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }, 
                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } } 
                },
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>

        {/* User Growth Chart */}
        
        <div className="bg-white/5 border border-white/5 p-4 md:p-8 rounded-3xl backdrop-blur-sm shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">User Growth</h3>
          <div className="h-60 md:h-72 w-full">
            <Line 
              data={{ 
                labels, 
                datasets: [{ label: 'New Users', data: salesData.map(v=>v/100), borderColor: '#10b981', tension: 0.4, fill: true, backgroundColor: 'rgba(16, 185, 129, 0.1)' }] 
              }} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                  x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }, 
                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } } 
                }, 
                plugins: { legend: { display: false } } 
              }} 
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminAnalytics;