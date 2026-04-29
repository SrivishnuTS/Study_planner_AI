import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';

export const StatCard = ({ label, value, icon: Icon, trend, color = 'primary' }) => {
  const isUp = trend?.direction === 'up';
  const colorMap = {
    primary: 'text-primary bg-primary/5 border-primary/10',
    accent: 'text-accent bg-accent/5 border-accent/10',
    muted: 'text-text-secondary bg-muted/20 border-border'
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }} 
      className={`classic-card p-6 border ${colorMap[color] || colorMap.primary} transition-all hover:shadow-xl hover:shadow-primary/5`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="p-2.5 bg-card rounded-xl shadow-sm border border-border">
          {Icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {isUp ? '↑' : '↓'} {trend.change_percent}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em] mb-1">{label}</p>
        <h3 className="text-3xl font-bold text-text font-serif tracking-tight">{value}</h3>
      </div>
    </motion.div>
  );
};

export const ProgressBar = ({ label, value, color = 'bg-primary' }) => (
  <div className="w-full">
    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text">{value}%</span>
    </div>
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border">
      <motion.div 
        initial={{ width: 0 }} 
        animate={{ width: `${value}%` }} 
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full rounded-full ${color}`} 
      />
    </div>
  </div>
);

export const ConfidenceRing = ({ score }) => (
  <div className="flex items-center justify-center bg-muted px-3 py-1.5 rounded-full border border-border">
    <span className="text-sm font-bold text-primary">Conf: {score}%</span>
  </div>
);

export const InsightCard = ({ pattern, confidence, rec, explanation, efficiency_label }) => {
  return (
    <div className="classic-card border-l-4 border-l-primary">
      <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-1 block">Optimal Strategy</span>
          <h2 className="text-2xl font-bold text-text font-serif">{pattern}</h2>
        </div>
        <ConfidenceRing score={confidence} />
      </div>
      <p className="text-text mb-4 font-medium leading-relaxed">{rec}</p>
      <div className="flex gap-3 items-start text-sm text-text-secondary bg-muted p-4 rounded-md border border-border">
        <Info size={18} className="shrink-0 text-primary mt-0.5"/> <p className="leading-snug">{explanation}</p>
      </div>
    </div>
  );
};

export const RiskAlert = ({ alerts }) => {
  if (!alerts?.length) return (
    <div className="flex items-center gap-3 p-4 rounded-md border bg-[#166534]/5 border-[#166534]/20 text-[#166534] dark:text-[#4ade80]">
      <CheckCircle2 size={18}/><span className="text-sm font-medium">Optimal parameters. No burnout risks detected.</span>
    </div>
  );
  return (
    <div className="flex flex-col gap-3 mt-4">
      {alerts.map((alertItem, i) => {
        const a = typeof alertItem === 'string' ? alertItem : alertItem.message;
        const severity = alertItem.severity || '';
        const isSevere = a.includes('Burnout') || a.includes('severely') || severity === 'high';
        const colorClass = isSevere ? 'bg-[#991B1B]/5 border-[#991B1B]/20 text-[#991B1B] dark:text-[#f87171]' : 'bg-[#B45309]/5 border-[#B45309]/20 text-[#B45309] dark:text-[#fbbf24]';
        return (
          <div key={i} className={`flex items-center gap-3 p-4 rounded-md border ${colorClass}`}>
            {isSevere ? <ShieldAlert size={18}/> : <AlertTriangle size={18}/>}
            <span className="text-sm font-medium">{a}</span>
          </div>
        );
      })}
    </div>
  );
};

export const FeatureImportanceBar = ({ label, value, max=100 }) => (
  <div className="mb-4">
    <div className="flex justify-between text-xs font-semibold mb-1.5"><span className="text-text-secondary">{label}</span><span className="text-text font-medium">{value}</span></div>
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden border border-border">
      <motion.div initial={{ width: 0 }} animate={{ width: `${(Math.min(value,max)/max)*100}%` }} className="h-1.5 rounded-full bg-primary" />
    </div>
  </div>
);
