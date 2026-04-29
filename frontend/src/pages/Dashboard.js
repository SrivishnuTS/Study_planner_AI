import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Clock,
  BarChart3,
  Calendar,
  ChevronRight,
  BrainCircuit,
  Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { StatCard } from '../components/UIComponents';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics');
      setData(res.data);
    } catch (e) {
      console.error("Dashboard Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-text-secondary font-medium font-serif">Aggregating Intelligence...</p>
      </div>
    </div>
  );

  if (!data || data.data_points === 0) return (
    <div className="max-w-4xl mx-auto text-center py-20">
      <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mx-auto mb-8">
        <Activity size={40} className="text-text-secondary" />
      </div>
      <h2 className="text-3xl font-bold font-serif text-text mb-4">No Study Data Detected</h2>
      <p className="text-text-secondary mb-10 max-w-md mx-auto">Your intelligence engine is currently cold. Generate your first prediction to activate real-time analytics and behavioral tracking.</p>
      <a href="/predict" className="btn-primary px-10 py-4 shadow-xl shadow-primary/20">Generate Initial Profile</a>
    </div>
  );

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e'];
  const barData = Object.keys(data.pattern_distribution || {}).map((k, i) => ({
    name: k,
    value: data.pattern_distribution[k],
    fill: COLORS[i % COLORS.length]
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-10">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em] mb-3">
            <Activity size={14} /> Executive Summary
          </div>
          <h1 className="text-5xl font-bold text-text tracking-tight font-serif">Cognitive Overview</h1>
        </div>
        <div className="flex items-center gap-4 px-6 py-3 bg-muted/30 border border-border rounded-2xl">
          <Calendar size={18} className="text-text-secondary" />
          <span className="text-sm font-bold text-text">Last 30 Days</span>
          <ChevronRight size={16} className="text-text-secondary" />
        </div>
      </header>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Avg Efficiency"
          value={data.avg_efficiency}
          icon={<Zap size={20} />}
          trend={data.trends?.avg_efficiency}
          color="primary"
        />
        <StatCard
          label="Intelligence Confidence"
          value={`${(data.avg_confidence * 100).toFixed(0)}%`}
          icon={<BrainCircuit size={20} />}
          color="accent"
        />
        <StatCard
          label="Optimal Pattern"
          value={data.most_common_pattern}
          icon={<Target size={20} />}
          color="primary"
        />
        <StatCard
          label="Data Integrity"
          value={`${data.data_points} Pts`}
          icon={<BarChart3 size={20} />}
          color="muted"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Longitudinal Efficiency Trend */}
        <div className="lg:col-span-8 classic-card">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-bold font-serif text-text">Longitudinal Performance</h3>
              <p className="text-xs text-text-secondary mt-1">Efficiency variance across your last 10 sessions</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-[10px] font-bold text-text-secondary uppercase">Efficiency</span>
              </div>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend_data}>
                <defs>
                  <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis
                  dataKey="timestamp"
                  hide={true}
                />
                <YAxis
                  stroke="var(--text-secondary)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="efficiency_score"
                  stroke="var(--primary)"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorEff)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Behavioral Distribution */}
        <div className="lg:col-span-4 classic-card">
          <div className="mb-10">
            <h3 className="text-xl font-bold font-serif text-text">Strategy Mix</h3>
            <p className="text-xs text-text-secondary mt-1">Allocation of recommended study patterns</p>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: -20 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="var(--text-secondary)"
                  fontSize={11}
                  fontWeight="bold"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
              <div className="flex items-center gap-3 text-primary font-bold text-xs uppercase mb-2">
                <Clock size={14} /> Recommendation Logic
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                The engine currently favors <span className="text-text font-bold">{data.most_common_pattern}</span> based on your historical focus levels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
