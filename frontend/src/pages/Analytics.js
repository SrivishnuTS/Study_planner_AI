import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  useEffect(() => { 
    api.get('/analytics').then(res => setData(res.data)).catch(console.error); 
  }, []);

  if (!data) return <div className="classic-card h-64 flex items-center justify-center text-text-secondary text-sm font-medium">Loading...</div>;

  const chartData = Object.keys(data.pattern_distribution || {}).map(k => ({ name: k.split('+')[0], val: data.pattern_distribution[k] }));

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold font-serif text-text">Advanced Analytics</h1>
      </header>
      <div className="classic-card h-[400px] mb-6">
        <h3 className="text-lg font-bold font-serif mb-6 text-text">Historical Pattern Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{top: 20, right: 20, left: 0, bottom: 20}}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
            <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{backgroundColor: 'var(--card)', borderRadius:'6px', borderColor:'var(--border)', color:'var(--text)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}/>
            <Bar dataKey="val" fill="var(--primary)" radius={[4,4,0,0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
