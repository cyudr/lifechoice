import React, { useState } from 'react';
import { User, Activity, ToggleLeft, ToggleRight, Sparkles, Sliders, Calendar, Trash2 } from 'lucide-react';
import { DecisionHistoryEntry } from '../types';

interface ProfileLayoutProps {
  history: DecisionHistoryEntry[];
  userEmail?: string;
  localTime?: string;
  onClearAllUserData: () => void;
}

export function ProfileLayout({ history, userEmail, localTime, onClearAllUserData }: ProfileLayoutProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [smartHelpEnabled, setSmartHelpEnabled] = useState(true);

  const totalSparks = history.length;
  
  // Decide overthinking title based on historical spins count
  const getSillyTitle = () => {
    if (totalSparks === 0) return { title: "Instant Lucky Star ⭐", desc: "No second guessing logged. Your choices shine with absolute cosmic joy!" };
    if (totalSparks <= 3) return { title: "Happy Explorer of Luck 🍀", desc: "A few moments guided by pure destiny. Keeping the spirit high!" };
    if (totalSparks <= 8) return { title: "Charming Spark Spinner 🎡", desc: "You love a bit of mystery and excitement! The playground is always here to spin." };
    return { title: "Supreme Adventurer of Chance 🌌", desc: "Master of destiny and supreme captain of the wheel! The arcade fuels your awesome day!" };
  };

  const currentLevel = getSillyTitle();

  // Find most played tools count
  const getMostUsedTool = () => {
    if (history.length === 0) return "None yet!";
    const counts = history.reduce((acc, entry) => {
      acc[entry.gameType] = (acc[entry.gameType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    const toolAliases: Record<string, string> = {
      wheel: 'Wheel of Wonder',
      coin: 'Coin of Fate',
      flower: 'Magic Flower Daisy',
      poll: 'Lunch Roulette',
      vibe: 'Vibe Scanner',
      text: 'Chat Sparker'
    };
    return toolAliases[sorted[0][0]] || sorted[0][0];
  };

  const handleResetUser = () => {
    if (confirm("Are you sure you want to clear your local arcade logs and state?")) {
      onClearAllUserData();
      alert("Sparks completely wiped clean!");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="text-center mb-4">
        <span className="font-sans font-semibold text-[11px] tracking-wider text-primary uppercase">Personalized cockpit</span>
        <h2 className="font-display font-bold text-2xl text-on-surface mt-0.5">My Vibe Meter</h2>
        <p className="font-sans text-xs text-on-surface-variant max-w-sm mx-auto mt-1 leading-relaxed">
          Keep track of your play history, check your favorite mini-games, and customize preferences in your playground!
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        
        {/* Profile Card Summary */}
        <div className="w-full bg-white border border-outline-variant/30 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-tertiary to-[#ff7eb3] border-4 border-surface-container flex items-center justify-center text-white text-xl shadow-md">
            🐱
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h3 className="font-display font-extrabold text-[#131b2e] text-sm select-all">
              {userEmail || "anonymous_overthinker@gmail.com"}
            </h3>
            <p className="text-[11px] text-outline font-sans flex items-center justify-center sm:justify-start gap-1 mt-0.5">
              <span>Ready for some serious fun!</span>
            </p>
          </div>
        </div>

        {/* Silly overthinking meter card */}
        <div className="w-full bg-gradient-to-br from-white to-[#faf8ff] border-2 border-primary/20 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider font-mono">My Spark Record</span>
            <Activity className="w-4 h-4 text-primary animate-pulse" />
          </div>

          <h4 className="font-display font-black text-sm text-primary font-sans leading-tight">
            {currentLevel.title}
          </h4>
          <p className="text-[11px] text-on-surface-variant font-sans mt-1 max-w-md leading-relaxed">
            {currentLevel.desc}
          </p>

          {/* Meter progress bar visualizer */}
          <div className="relative h-2 bg-neutral-100 rounded-full overflow-hidden mt-4 border border-neutral-200/20">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary via-tertiary to-[#ff56a7] transition-all duration-1000 ease-out"
              style={{ width: `${Math.min((totalSparks / 14) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-[9px] text-outline font-mono mt-1.5">
            <span>MERRY SPINNER</span>
            <span>CHANCE EXPLORER</span>
            <span>LEGENDARY CHANGER</span>
          </div>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white border border-outline-variant/30 rounded-2xl shadow-xs">
            <span className="text-[9px] font-bold text-outline uppercase font-mono tracking-wider block">Sparks Ignited</span>
            <span className="font-display font-extrabold text-xl text-primary mt-0.5 font-mono">{totalSparks}</span>
          </div>

          <div className="p-3 bg-white border border-outline-variant/30 rounded-2xl shadow-xs">
            <span className="text-[9px] font-bold text-outline uppercase font-mono tracking-wider block">Fav Game</span>
            <span className="font-display font-extrabold text-xs text-[#131b2e] mt-1.5 block truncate">{getMostUsedTool()}</span>
          </div>
        </div>

        {/* Preferences Toggle lists */}
        <div className="w-full bg-white border border-outline-variant/30 rounded-3xl p-5 flex flex-col gap-3">
          <h4 className="font-display font-extrabold text-xs text-outline uppercase tracking-wider font-sans mb-0.5 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[#131b2e]" />
            <span>Preferences</span>
          </h4>

          {/* Sound toggle item */}
          <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant/10">
            <div>
              <h5 className="font-display font-bold text-xs text-on-surface">Delightful Sound Effects</h5>
              <p className="text-[10px] text-outline font-sans">Plays beautiful synthetic clicks and chimes upon spark completion.</p>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-primary hover:opacity-85 transition-opacity"
            >
              {soundEnabled ? (
                <ToggleRight className="w-8 h-8 stroke-1 fill-primary-container text-white" />
              ) : (
                <ToggleLeft className="w-8 h-8 stroke-1 text-outline" />
              )}
            </button>
          </div>

          {/* intelligent fallback toggle item */}
          <div className="flex items-center justify-between pb-2.5">
            <div>
              <h5 className="font-display font-bold text-xs text-on-surface">Gemini Copilot Advice</h5>
              <p className="text-[10px] text-outline font-sans">Enables real-time prompt advice from the friendly AI genie.</p>
            </div>
            <button
              onClick={() => setSmartHelpEnabled(!smartHelpEnabled)}
              className="text-primary hover:opacity-85 transition-opacity"
            >
              {smartHelpEnabled ? (
                <ToggleRight className="w-8 h-8 stroke-1 fill-primary-container text-white" />
              ) : (
                <ToggleLeft className="w-8 h-8 stroke-1 text-outline" />
              )}
            </button>
          </div>
        </div>

        {/* Clean data button */}
        <button
          onClick={handleResetUser}
          className="w-full py-2.5 border border-dashed border-error/55 hover:border-error text-error hover:bg-error/5 font-sans font-extrabold text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 focus:outline-none"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Wipe All Arcade History</span>
        </button>

      </div>
    </div>
  );
}
