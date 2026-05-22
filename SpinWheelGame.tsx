import React, { useState } from 'react';
import { Utensils, Compass, Layers, CheckCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { PollOption, DecisionHistoryEntry } from '../types';

interface LunchPollGameProps {
  onSaveDecision: (entry: Omit<DecisionHistoryEntry, 'id' | 'timestamp'>) => void;
}

const DEFAULT_POLL_OPTIONS: PollOption[] = [
  { id: '1', name: "The Rustic Spoon", category: "Italian", priceClass: "$$", distance: "0.5 miles", votes: 4, icon: "🍕" },
  { id: '2', name: "Ocean Catch", category: "Seafood", priceClass: "$$$", distance: "1.2 miles", votes: 6, icon: "🦞" },
  { id: '3', name: "Slice of Heaven", category: "Pizza", priceClass: "$", distance: "0.2 miles", votes: 3, icon: "🍕" },
  { id: '4', name: "Zen Noodle Bar", category: "Asian Fusion", priceClass: "$$", distance: "0.8 miles", votes: 5, icon: "🍜" }
];

export function LunchPollGame({ onSaveDecision }: LunchPollGameProps) {
  const [options, setOptions] = useState<PollOption[]>(DEFAULT_POLL_OPTIONS);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const totalVotes = options.reduce((sum, item) => sum + item.votes, 0);

  const handleVoteSelect = (id: string) => {
    if (votedOptionId) return; // single vote lock
    setVotedOptionId(id);
    
    // Increment votes
    const updated = options.map(opt => {
      if (opt.id === id) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });
    setOptions(updated);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (_) {}
  };

  const handleRevealResults = () => {
    if (!votedOptionId) return;
    setRevealed(true);

    const winner = [...options].sort((a,b) => b.votes - a.votes)[0];

    onSaveDecision({
      gameType: 'poll',
      title: 'Lunch Roulette',
      result: `${winner.name} winning with ${winner.votes} votes`,
      options: options.map(o => `${o.name} (${o.votes} votes)`)
    });
  };

  const handleResetPoll = () => {
    setOptions(DEFAULT_POLL_OPTIONS.map(opt => ({ ...opt, votes: Math.floor(Math.random() * 5) + 2 })));
    setVotedOptionId(null);
    setRevealed(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="text-center mb-4">
        <span className="font-sans font-semibold text-[11px] tracking-wider text-primary uppercase">Crew Playground</span>
        <h2 className="font-display font-bold text-2xl text-on-surface mt-0.5">Lunch Roulette</h2>
        <p className="font-sans text-xs text-on-surface-variant max-w-md mx-auto mt-1 leading-relaxed">
          Can't agree on where to go with your crew? Skip the endless debate! Throw a vote here, tap and let mathematical destiny choose your lunch spot!
        </p>
      </div>

      <div className="w-full bg-white rounded-3xl p-4 md:p-5 border border-outline-variant/30 shadow-[0px_4px_25px_rgba(15,23,42,0.03)] flex flex-col gap-4 max-w-md mb-4">
        
        {/* Topic Header banner summary */}
        <div className="text-center pb-2.5 border-b border-outline-variant/10">
          <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest font-mono">FRIDAY TRADITION</span>
          <h3 className="font-display font-extrabold text-sm text-[#131b2e] mt-0.5 leading-tight">
            Where should we go for the team lunch next Friday?
          </h3>
          <p className="text-[10px] text-outline font-sans mt-1">
            Cast your vote to unlock the secret community results!
          </p>
        </div>

        {/* Custom options grid list matching mockup visuals exactly */}
        <div className="flex flex-col gap-2">
          {options.map((option) => {
            const isSelected = votedOptionId === option.id;
            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            
            return (
              <div
                key={option.id}
                onClick={() => handleVoteSelect(option.id)}
                className={`relative overflow-hidden cursor-pointer rounded-2xl p-3 border border-outline-variant/20 flex items-center justify-between shadow-xs transition-all duration-300 transform select-none ${
                  isSelected 
                    ? 'border-primary bg-gradient-to-r from-primary/5 to-tertiary/5 -translate-y-0.5 shadow-xs'
                    : 'bg-white hover:bg-neutral-50 hover:-translate-y-0.5'
                }`}
              >
                {/* Voting visual distribution ratio bar when revealed */}
                {revealed && (
                  <div
                    className="absolute left-0 top-0 h-full bg-primary/10 transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                  ></div>
                )}

                <div className="flex items-center gap-2.5 relative z-10">
                  {/* Category icon overlay */}
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-lg shadow-inner border border-white">
                    {option.icon}
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-xs text-[#131b2e]">
                      {option.name}
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-sans">
                      {option.category} · {option.priceClass} · {option.distance}
                    </p>
                  </div>
                </div>

                {/* Status indicator radio bubbles */}
                <div className="flex items-center gap-1.5 relative z-10">
                  {revealed ? (
                    <span className="font-sans font-bold text-[10px] text-primary font-mono pr-1.5">
                      {percentage}% ({option.votes})
                    </span>
                  ) : null}

                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-primary bg-primary text-white scale-110'
                      : 'border-outline-variant bg-transparent text-transparent'
                  }`}>
                    <CheckCircle className="w-3 h-3 text-glow" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button trigger */}
        <div className="flex flex-col gap-2 pt-1">
          {!revealed ? (
            <button
              onClick={handleRevealResults}
              disabled={!votedOptionId}
              className={`w-full py-3 rounded-xl font-sans font-bold text-xs transition-all flex items-center justify-center gap-1 focus:outline-none ${
                votedOptionId
                  ? 'bg-primary text-white shadow-xs active:scale-98 hover:brightness-105 cursor-pointer'
                  : 'bg-neutral-100 text-neutral-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Reveal Results</span>
            </button>
          ) : (
            <button
              onClick={handleResetPoll}
              className="w-full bg-[#f1f5f9] hover:bg-neutral-200 text-on-surface font-sans font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1 transition-colors focus:outline-none"
            >
              <RefreshCw className="w-3.5 h-3.5 text-outline" />
              <span>Restart New Poll</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
