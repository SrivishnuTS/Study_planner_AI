import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, Clock, Target, Zap } from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    api.get('/history')
      .then(res => { setHistory(res.data); setLoading(false); })
      .catch(() => setLoading(false)); 
  }, []);

  if (loading) return <div className="classic-card h-64 flex items-center justify-center text-text-secondary text-sm font-medium">Retrieving logs...</div>;
  if (!history.length) return <div className="classic-card text-center p-12"><p className="text-xl font-bold text-text font-serif mb-2">No History Yet</p><p className="text-text-secondary text-sm">Run the simulator to generate your first AI prediction.</p></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-text tracking-tight font-serif">Execution Ledger</h1>
      </header>
      <div className="classic-card !p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-widest text-text-secondary font-bold border-b border-border">
            <tr><th className="p-4">Timestamp</th><th className="p-4">Optimal Pattern</th><th className="p-4">AI Conf</th><th className="p-4">State</th><th className="p-4"></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {history.map(r => {
              const isExpanded = expandedId === r.id;
              return (
                <React.Fragment key={r.id}>
                  <tr onClick={() => setExpandedId(isExpanded ? null : r.id)} className={`cursor-pointer transition-colors ${isExpanded ? 'bg-[#F3F4F680] dark:bg-[#27324480]' : 'hover:bg-[#F3F4F64D] dark:hover:bg-[#2732444D]'}`}>
                    <td className="p-4 text-text-secondary">{new Date(r.timestamp).toLocaleString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                    <td className="p-4 font-semibold text-text">{r.predicted_pattern}</td>
                    <td className="p-4 font-medium text-text-secondary">{r.confidence_score}%</td>
                    <td className="p-4"><span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${r.efficiency_label === 'High' ? 'bg-[#166534]/10 text-[#166534] dark:bg-[#4ade80]/10 dark:text-[#4ade80]' : r.efficiency_label === 'Medium' ? 'bg-[#1E3A8A1A] text-primary' : 'bg-[#991B1B]/10 text-[#991B1B] dark:bg-[#f87171]/10 dark:text-[#f87171]'}`}>{r.efficiency_label}</span></td>
                    <td className="p-4 text-right text-text-secondary">{isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</td>
                  </tr>
                  <AnimatePresence>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="p-0">
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-[#F3F4F64D] dark:bg-[#2732444D] border-b border-border overflow-hidden">
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Input Parameters</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm text-text bg-card border border-border p-4 rounded-md">
                                  <p className="text-text-secondary">Study: <span className="font-semibold text-text">{r.study_hours}h</span></p>
                                  <p className="text-text-secondary">Sleep: <span className="font-semibold text-text">{r.sleep_hours}h</span></p>
                                  <p className="text-text-secondary">Focus: <span className="font-semibold text-text">{r.focus_score}/10</span></p>
                                  <p className="text-text-secondary">Distract: <span className="font-semibold text-text capitalize">{r.distraction_level}</span></p>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">AI Reasoning</h4>
                                <p className="text-sm text-text leading-relaxed mb-3 bg-card border border-border p-4 rounded-md">"{r.explanation}"</p>
                                {r.alerts?.map((a,i)=><p key={i} className="text-xs flex items-center gap-2 text-[#991B1B] bg-[#991B1B]/5 p-2 rounded-md border border-[#991B1B]/20 mt-2"><AlertTriangle size={14}/> {a.message || a}</p>)}
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
