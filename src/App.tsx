import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, HelpCircle, Dices, Sparkles, Layers,
  BarChart3, RefreshCw, Trash2, Calendar, History, Shield, Info 
} from 'lucide-react';
import { DecisionHistoryItem, Poll } from './types';
import WheelSpinner from './components/WheelSpinner';
import CoinFlipper from './components/CoinFlipper';
import DiceRoller from './components/DiceRoller';
import MagicBall from './components/MagicBall';
import DecisionCards from './components/DecisionCards';
import PollBuilder from './components/PollBuilder';

const SAMPLE_POLLS: Poll[] = [
  {
    id: "sample-1",
    title: "Friday Night Group Hangout",
    description: "Where should the team go this weekend? Vote or add your ideas!",
    createdAt: "5/22/2026",
    totalVotes: 42,
    options: [
      { id: "s1-o1", text: "Interactive Arcade & Bars", votes: 14 },
      { id: "s1-o2", text: "Rooftop Grill & Chill Lounge", votes: 19 },
      { id: "s1-o3", text: "VR escape room adventure", votes: 9 }
    ]
  },
  {
    id: "sample-2",
    title: "Next office pet choice",
    description: "Our workspace needs a sweet mascot. Cast your preferences!",
    createdAt: "5/21/2026",
    totalVotes: 32,
    options: [
      { id: "s2-o1", text: "Playful Golden Retriever", votes: 18 },
      { id: "s2-o2", text: "Chill British Shorthair Cat", votes: 11 },
      { id: "s2-o3", text: "Trio of Neon Guppy Fish", votes: 3 }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'wheel' | 'coin' | 'dice' | 'ball' | 'card' | 'poll'>('wheel');
  
  // Local states
  const [history, setHistory] = useState<DecisionHistoryItem[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    const cachedHistory = localStorage.getItem('choice_maker_history');
    if (cachedHistory) {
      try {
        setHistory(JSON.parse(cachedHistory));
      } catch (e) {
        console.warn("Could not read history caches", e);
      }
    }

    const cachedPolls = localStorage.getItem('choice_maker_polls');
    if (cachedPolls) {
      try {
        setPolls(JSON.parse(cachedPolls));
      } catch (e) {
        console.warn("Could not read polls caches", e);
        setPolls(SAMPLE_POLLS);
      }
    } else {
      setPolls(SAMPLE_POLLS);
    }
  }, []);

  // Sync to LocalStorage
  const handleSetPolls = (updatedPolls: Poll[]) => {
    setPolls(updatedPolls);
    localStorage.setItem('choice_maker_polls', JSON.stringify(updatedPolls));
  };

  const handleAddHistory = (item: Omit<DecisionHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: DecisionHistoryItem = {
      ...item,
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newItem, ...history].slice(0, 50); // cap at 50 logs
    setHistory(updated);
    localStorage.setItem('choice_maker_history', JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('choice_maker_history');
  };

  // AI option suggests proxy agent
  const handleTriggerAI = async (category: string): Promise<string[]> => {
    try {
      const res = await fetch('/api/suggest-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category })
      });
      if (!res.ok) {
        throw new Error("Proxy response failed");
      }
      const data = await res.json();
      return data.options || [];
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // AI Oracle Question Ask Proxy
  const handleAskAI = async (question: string): Promise<string> => {
    try {
      const res = await fetch('/api/magic8-ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
      });
      if (!res.ok) {
        throw new Error("Proxy celestial paths failed");
      }
      const data = await res.json();
      return data.answer || "Outlook unclear.";
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Switch Decider Icons Lookup
  const tabs = [
    { id: 'wheel', label: 'Decision Wheel', icon: Compass, color: 'text-indigo-500' },
    { id: 'coin', label: 'Coin Flipper', icon: HelpCircle, color: 'text-amber-500' },
    { id: 'dice', label: 'Dice Roller', icon: Dices, color: 'text-rose-500' },
    { id: 'ball', label: 'Magic Oracle', icon: Sparkles, color: 'text-indigo-400' },
    { id: 'card', label: 'Choice Cards', icon: Layers, color: 'text-sky-500' },
    { id: 'poll', label: 'Poll Dashboard', icon: BarChart3, color: 'text-emerald-500' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-850 selection:bg-indigo-500/10 selection:text-indigo-600 font-sans pb-16">
      
      {/* Top Header navbar */}
      <header id="app-main-header" className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-150/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-mono font-black text-lg shadow-sm">
              C
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 uppercase">Choice Maker</h1>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest font-mono">Decision Laboratory</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200/50 rounded-xl px-3.5 py-1.5 font-medium select-none">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Local Device Storage active
          </div>
        </div>
      </header>

      {/* Main app sandbox area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Quick Welcome Banner */}
        <div id="quick-banner-card" className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.015)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Break Daily Indecision Instantly</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
              Can't make up your mind? Try our interactive spinners, coin flips, dice sets, or craft full voting polls for your group. Connect Gemini to instantly brainstorm choices!
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-150">
              <Info className="w-3.5 h-3.5" />
              6 Decider Methods
            </div>
          </div>
        </div>

        {/* Dynamic Tool Tabs Selector */}
        <div id="deciders-nav-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-select-${tab.id}`}
                onClick={() => { setActiveTab(tab.id); }}
                className={`py-4 px-3 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all cursor-pointer font-semibold ${
                  isActive
                    ? 'bg-white border-slate-950/80 shadow-md text-slate-950 scale-102 translate-y-[-2px]'
                    : 'bg-white border-slate-100/90 text-slate-500 hover:text-slate-800 hover:border-slate-200 hover:shadow-sm scale-100 translate-y-0 active:scale-98'
                }`}
              >
                <Icon className={`w-5 h-5 ${tab.color}`} />
                <span className="text-xxs tracking-wider uppercase">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Primary Deciding Viewports */}
        <div id="active-viewport-card" className="bg-white rounded-3xl p-6 md:p-8 border border-slate-150/65 shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {activeTab === 'wheel' && (
                <WheelSpinner 
                  onAddHistory={handleAddHistory} 
                  onTriggerAI={handleTriggerAI} 
                />
              )}
              {activeTab === 'coin' && (
                <CoinFlipper 
                  onAddHistory={handleAddHistory} 
                />
              )}
              {activeTab === 'dice' && (
                <DiceRoller 
                  onAddHistory={handleAddHistory} 
                />
              )}
              {activeTab === 'ball' && (
                <MagicBall 
                  onAddHistory={handleAddHistory}
                  onAskAI={handleAskAI}
                />
              )}
              {activeTab === 'card' && (
                <DecisionCards 
                  onAddHistory={handleAddHistory} 
                />
              )}
              {activeTab === 'poll' && (
                <PollBuilder 
                  polls={polls} 
                  onSetPolls={handleSetPolls} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global Decision History Pane */}
        <div id="history-log-section" className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.015)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Decision Lab Logs
            </h3>
            {history.length > 0 && (
              <button
                id="clear-all-history-btn"
                onClick={handleClearHistory}
                className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Logs
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div id="history-empty-placeholder" className="text-center py-6 text-xs text-slate-400 italic">
              No decisions made in this session yet. Spin, flip or roll to start logging!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence>
                {history.map((item) => (
                  <motion.div
                    key={item.id}
                    layoutId={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-start gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/5 text-slate-600 font-bold uppercase tracking-wider">{item.type}</span>
                        <span className="text-[9px] text-slate-400 font-bold font-mono">{item.timestamp}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 break-words">{item.title}</p>
                      <p className="text-xs font-semibold text-indigo-650 truncate max-w-full">
                        Result: <span className="font-bold">"{item.result}"</span>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
