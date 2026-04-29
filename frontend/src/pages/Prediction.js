import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  BrainCircuit, 
  Settings2, 
  ChevronRight, 
  Info, 
  Lightbulb, 
  Target, 
  AlertCircle,
  Save,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { StatCard, ProgressBar, InsightCard, RiskAlert, FeatureImportanceBar } from '../components/UIComponents';
import { motion } from 'framer-motion';

export default function PredictPage() {
  const [form, setForm] = useState({
    study_hours: 3.5,
    break_time: 0.5,
    sleep_hours: 7.0,
    focus_score: 8.0,
    distraction_level: 'medium',
    day_of_week: 'Monday',
    previous_score: 75,
    goal_score: 85,
    course_name: 'General',
    course_difficulty: 'medium',
    study_goal_type: 'Concept Learning',
    energy_level: 'Medium',
    time_of_day: 'Afternoon'
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState(null);
  const [typing, setTyping] = useState(false);

  // Debounced simulation for real-time feel
  useEffect(() => {
    setTyping(true);
    const timer = setTimeout(() => {
      handlePredict(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [form]);

  const handlePredict = async (isSave = false) => {
    const endpoint = isSave ? '/predict-and-save' : '/predict';
    if (isSave) setSaveLoading(true);
    else setLoading(true);
    setTyping(false);

    try {
      const res = await api.post(endpoint, form);
      setPrediction(res.data);
      if (isSave) {
        setFeedbackStatus(null);
        alert("Prediction saved to your intelligence history!");
      }
    } catch (e) {
      console.error("Prediction Error:", e);
    } finally {
      setLoading(false);
      setSaveLoading(false);
    }
  };

  const handleFeedback = async (rating) => {
    try {
      await api.post('/feedback', {
        prediction_id: prediction.prediction_id,
        rating: rating
      });
      setFeedbackStatus(rating);
    } catch (e) {
      console.error("Feedback Error:", e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
        <div>
          <h1 className="text-4xl font-bold text-text tracking-tight font-serif mb-2 flex items-center gap-3">
            <BrainCircuit className="text-primary" size={32}/> Pattern Modeler
          </h1>
          <p className="text-text-secondary text-base">Configure your behavioral profile to compute your optimal study strategy.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => handlePredict(true)} 
            disabled={loading || saveLoading}
            className="btn-primary px-8 py-2.5 flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            {saveLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18}/>}
            {saveLoading ? 'Saving Intelligence...' : 'Predict & Save'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Profile Configuration */}
        <div className="lg:col-span-4 space-y-8">
          <div className="classic-card">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-3">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <SlidersHorizontal size={14}/> Behavioral Profile
              </h3>
              {typing && <span className="text-[10px] text-primary animate-pulse font-bold">RECALCULATING...</span>}
            </div>
            
            <div className="space-y-6">
              {['focus_score', 'previous_score', 'goal_score'].map(k => (
                <div key={k}>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-text capitalize">{k.replace('_',' ')}</label>
                    <span className="text-primary font-bold">{form[k]}</span>
                  </div>
                  <input 
                    type="range" min="1" max="100" step="1"
                    value={form[k]}
                    onChange={e => setForm({...form, [k]: parseFloat(e.target.value)})}
                    className="w-full accent-primary h-1 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase mb-1.5 block">Sleep (h)</label>
                  <input 
                    type="number" step="0.5" value={form.sleep_hours}
                    onChange={e => setForm({...form, sleep_hours: parseFloat(e.target.value)})}
                    className="input-classic w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-secondary uppercase mb-1.5 block">Distraction</label>
                  <select 
                    value={form.distraction_level}
                    onChange={e => setForm({...form, distraction_level: e.target.value})}
                    className="input-classic w-full text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <label className="text-[10px] font-bold text-text-secondary uppercase mb-3 block">Contextual Factors</label>
                <div className="grid grid-cols-1 gap-4">
                  <select 
                    value={form.course_name}
                    onChange={e => setForm({...form, course_name: e.target.value})}
                    className="input-classic w-full text-xs"
                  >
                    {['General', 'Data Structures', 'Algorithms', 'DBMS', 'Machine Learning'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="flex gap-4">
                    <select 
                      value={form.course_difficulty}
                      onChange={e => setForm({...form, course_difficulty: e.target.value})}
                      className="input-classic w-full text-xs"
                    >
                      <option value="low">Low Diff</option>
                      <option value="medium">Med Diff</option>
                      <option value="high">High Diff</option>
                    </select>
                    <select 
                      value={form.energy_level}
                      onChange={e => setForm({...form, energy_level: e.target.value})}
                      className="input-classic w-full text-xs"
                    >
                      <option value="Low">Low Energy</option>
                      <option value="Medium">Med Energy</option>
                      <option value="High">High Energy</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Results */}
        <div className="lg:col-span-8 space-y-8">
          {prediction ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="classic-card bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary rounded-lg text-white shadow-lg shadow-primary/30">
                      <Target size={20}/>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Optimal Strategy</p>
                      <h2 className="text-2xl font-bold text-text font-serif">{prediction.predicted_pattern}</h2>
                    </div>
                  </div>
                  <ProgressBar 
                    label="Model Confidence" 
                    value={prediction.confidence} 
                    color="bg-primary"
                  />
                </div>

                <div className="classic-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-accent rounded-lg text-white shadow-lg shadow-accent/30">
                      <Sparkles size={20}/>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Efficiency Forecast</p>
                      <h2 className="text-2xl font-bold text-text font-serif">{prediction.efficiency_score}</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-tight">
                    <CheckCircle2 size={14}/> 
                    Validated High Productivity Window
                  </div>
                </div>
              </div>

              {/* Structured Recommendation Section */}
              <div className="classic-card border-primary/20 bg-primary/[0.02]">
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Info size={14}/> Intelligence Breakdown
                </h4>
                
                {prediction.recommendation_details ? (
                  <div className="space-y-8">
                    <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2 block">Contextual Summary</span>
                      <p className="text-sm text-text leading-relaxed font-medium">{prediction.recommendation_details.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div>
                        <h5 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                          <BrainCircuit size={12}/> Logic Rationale
                        </h5>
                        <ul className="space-y-3">
                          {prediction.recommendation_details.why_this_pattern_works.map((item, i) => (
                            <li key={i} className="text-xs text-text flex gap-3 leading-normal">
                              <ChevronRight size={14} className="text-primary shrink-0"/> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Settings2 size={12}/> Action Plan
                        </h5>
                        <ul className="space-y-3">
                          {prediction.recommendation_details.execution_plan.map((item, i) => (
                            <li key={i} className="text-xs text-text flex gap-3 leading-normal">
                              <span className="text-primary font-black shrink-0">{i+1}.</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-border">
                      <div>
                        <h5 className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Lightbulb size={12}/> Optimization
                        </h5>
                        <ul className="space-y-2">
                          {prediction.recommendation_details.optimization_tips.map((item, i) => (
                            <li key={i} className="text-xs text-text-secondary flex gap-2 italic">
                              <span className="text-emerald-500">✦</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <AlertCircle size={12}/> Risk Mitigation
                        </h5>
                        <ul className="space-y-2">
                          {prediction.recommendation_details.risk_alerts.map((item, i) => (
                            <li key={i} className="text-xs text-red-500/80 flex gap-2">
                              <span className="font-bold">!</span> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-text-secondary py-10 justify-center animate-pulse">
                    <BrainCircuit size={20}/>
                    <p className="text-sm font-medium">Computing structured guidance...</p>
                  </div>
                )}
              </div>

              {/* Feedback Loop */}
              {prediction.prediction_id && (
                <div className="mt-8 flex items-center justify-between p-8 bg-muted/20 border border-border rounded-[2rem] backdrop-blur-sm">
                  <div>
                    <h4 className="text-lg font-bold text-text font-serif">Strategy Validation</h4>
                    <p className="text-xs text-text-secondary mt-1">Is this model capturing your current study state accurately?</p>
                  </div>
                  <div className="flex gap-4">
                    {feedbackStatus === null ? (
                      <>
                        <button 
                          onClick={() => handleFeedback(1)}
                          className="p-4 bg-card border border-border hover:border-emerald-500 rounded-2xl transition-all hover:scale-110 shadow-sm"
                        >
                          <ThumbsUp size={20} className="text-emerald-500"/>
                        </button>
                        <button 
                          onClick={() => handleFeedback(0)}
                          className="p-4 bg-card border border-border hover:border-red-500 rounded-2xl transition-all hover:scale-110 shadow-sm"
                        >
                          <ThumbsDown size={20} className="text-red-500"/>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 text-emerald-500 font-bold text-sm bg-emerald-500/10 px-5 py-2.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 size={18}/> Intelligence Loop Updated
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="h-[600px] classic-card flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mb-8 animate-bounce">
                <BrainCircuit size={40} className="text-primary"/>
              </div>
              <h3 className="text-2xl font-bold text-text font-serif mb-3">Model Awaiting Profile</h3>
              <p className="text-text-secondary max-w-sm mx-auto leading-relaxed">
                Configure your behavioral parameters and context on the left to activate the AI pattern generator.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
