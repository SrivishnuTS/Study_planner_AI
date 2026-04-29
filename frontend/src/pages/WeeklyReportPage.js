import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Brain, CheckCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WeeklyReportPage() {
  const [rep, setRep] = useState(null);
  useEffect(() => { 
    api.get('/weekly-report').then(res => setRep(res.data)).catch(console.error); 
  }, []);

  if (!rep) return <div className="classic-card h-64 flex items-center justify-center text-text-secondary text-sm font-medium">Generating Custom AI Report...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-text font-serif">Weekly AI Synthesis</h1>
      </header>
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="classic-card bg-card border-t-4 border-t-primary p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-muted rounded-md border border-border"><Brain className="text-primary" size={24}/></div>
          <div><h2 className="text-xl font-bold text-text font-serif">Performance Digest</h2><p className="text-text-secondary text-sm font-medium">Generated from {rep.days_logged} logs</p></div>
        </div>

        <p className="text-lg text-text leading-relaxed max-w-3xl font-serif border-l-2 border-primary pl-5 mb-10 text-text-secondary">"{rep.summary}"</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-muted p-5 rounded-md border border-border">
            <CheckCircle className="text-[#166534] dark:text-[#4ade80] mb-3" size={24}/>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Consistency Index</p>
            <p className="text-2xl font-bold text-text">{rep.days_logged} <span className="text-sm text-text-secondary font-medium">Entries Found</span></p>
          </div>
          <div className="bg-muted p-5 rounded-md border border-border">
            <TrendingUp className="text-primary mb-3" size={24}/>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Average Focus</p>
            <p className="text-2xl font-bold text-text">{rep.avg_weekly_focus}<span className="text-sm text-text-secondary font-medium">/10</span></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
