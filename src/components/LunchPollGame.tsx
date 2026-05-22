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

  // AI-customization States
  const [pollTitle, setPollTitle] = useState('Where should we go for team lunch next Friday?');
  const [preferences, setPreferences] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

  // Connected AI Generator function
  const handleGenerateAIPoll = async (themeTopic: string, userPrefs: string) => {
    setAiLoading(true);
    setStatusMessage(null);
    try {
      const payloadTopic = userPrefs.trim() 
        ? `${themeTopic} (Preferences/User Profile: ${userPrefs})`
        : themeTopic;

      const res = await fetch('/api/gemini/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptType: payloadTopic, count: 4 })
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();
      if (data.options && Array.isArray(data.options)) {
        const mapped: PollOption[] = data.options.map((item: string, index: number) => {
          // Regular expression to match any emoji inside the string
          const emojiMatch = item.match(/[\p{Emoji_Presentation}\p{Emoji}\u2600-\u27BF]/u);
          const icon = emojiMatch ? emojiMatch[0] : '✨';
          const nameClean = emojiMatch ? item.replace(emojiMatch[0], '').trim() : item;

          const distanceChoices = ['0.3 mi', '0.7 mi', '1.2 mi', '2.5 mi', 'Walkable'];
          const priceChoices = ['$', '$$', '$$$'];
          const categoryChoices = ['AI Spark', 'Hot Choice', 'Special', 'Vibe Fav'];

          return {
            id: `ai-poll-${index}-${Date.now()}`,
            name: nameClean || item,
            category: categoryChoices[index % categoryChoices.length],
            priceClass: priceChoices[Math.floor(Math.random() * priceChoices.length)],
            distance: distanceChoices[Math.floor(Math.random() * distanceChoices.length)],
            votes: Math.floor(Math.random() * 8) + 2, // Simulates realistic crew votes
            icon
          };
        });

        setOptions(mapped);
        setVotedOptionId(null);
        setRevealed(false);
        setStatusMessage('Successfully aligned options using Gemini! 🌸');
      } else {
        throw new Error('Invalid format');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Vibe check failed, keeping standard options.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyPreset = (prefixTitle: string) => {
    setPollTitle(prefixTitle);
    handleGenerateAIPoll(prefixTitle, preferences);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="text-center mb-4">
        <span className="font-sans font-semibold text-[11px] tracking-wider text-primary uppercase">Crew Playground</span>
        <h2 className="font-display font-bold text-2xl text-on-surface mt-0.5">Crew Poll Roulette</h2>
        <p className="font-sans text-xs text-on-surface-variant max-w-md mx-auto mt-1 leading-relaxed">
          Can't agree on what to do, what to eat, or what movie to put on? Pick a predefined topic, customized profiles, or prompt your own and let AI settle it!
        </p>
      </div>

      <div className="w-full bg-white rounded-3xl p-4 md:p-5 border border-outline-variant/30 shadow-[0px_4px_25px_rgba(15,23,42,0.03)] flex flex-col gap-4 max-w-md mb-4 animate-fade-in">
        
        {/* Dynamic Header banner of current Poll */}
        <div className="text-center pb-2.5 border-b border-outline-variant/10">
          <div className="flex justify-center items-center gap-1.5 mb-1.5">
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold font-mono tracking-wider">
              {aiLoading ? 'GENERATING OPTIONS...' : 'ACTIVE AI POLL'}
            </span>
          </div>
          <h3 className="font-display font-extrabold text-sm text-[#131b2e] leading-tight px-3">
            {pollTitle}
          </h3>
          {statusMessage && (
            <p className="text-[10px] text-emerald-600 font-sans mt-1.5 font-medium">
              {statusMessage}
            </p>
          )}
        </div>

        {/* Custom options grid list matching mockup visuals exactly */}
        <div className="flex flex-col gap-2 relative min-h-[120px] justify-center">
          {aiLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2.5">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              <p className="text-[11px] text-outline font-sans animate-pulse font-medium">Drawing creative answers from Gemini...</p>
            </div>
          ) : (
            options.map((option) => {
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
            })
          )}
        </div>

        {/* Action Button trigger */}
        <div className="flex flex-col gap-2 pt-1 border-t border-outline-variant/10">
          {!revealed ? (
            <button
              onClick={handleRevealResults}
              disabled={!votedOptionId || aiLoading}
              className={`w-full py-3 rounded-xl font-sans font-bold text-xs transition-all flex items-center justify-center gap-1 focus:outline-none ${
                votedOptionId && !aiLoading
                  ? 'bg-[#1e293b] text-white shadow-xs active:scale-98 hover:bg-slate-800 cursor-pointer'
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
              <span>Reset Default Count</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Controls and customization Board */}
      <div className="w-full max-w-md bg-[#faf8ff] rounded-3xl p-5 border border-purple-100 flex flex-col gap-3.5 mb-10 text-left">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-mono">GEMINI MAGIC CONTROL</span>
          <h4 className="font-display font-extrabold text-sm text-[#131b2e] mt-0.5">Customize Poll Theme & Preferences</h4>
          <p className="text-[11px] text-outline font-sans mt-0.5">Write anything and let Gemini align brand new poll entries dynamically!</p>
        </div>

        {/* Topic Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#475569] font-sans">POLL FOCUS / THEME</label>
          <input
            type="text"
            className="w-full bg-white border border-outline-variant/20 rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-indigo-400 font-sans font-medium"
            placeholder="e.g. Unique dessert places nearby, board games for 4 players"
            value={pollTitle}
            onChange={(e) => setPollTitle(e.target.value)}
          />
        </div>

        {/* Preferences / User data input */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#475569] font-sans">USER PROFILE / DIETARY PREFERENCES (OPTIONAL)</label>
          <input
            type="text"
            className="w-full bg-white border border-outline-variant/20 rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-indigo-400 font-sans font-medium"
            placeholder="e.g. We love spicy Asian food, are budget conscious, under 1 mile"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
          />
        </div>

        {/* Generate options action */}
        <button
          onClick={() => handleGenerateAIPoll(pollTitle, preferences)}
          disabled={aiLoading || !pollTitle}
          className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-pink-500 hover:brightness-105 active:scale-98 text-white rounded-xl font-sans font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all focus:outline-none cursor-pointer disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
          <span>Ask Gemini AI to Populate Poll ✨</span>
        </button>

        {/* Presets and shortcut links */}
        <div>
          <span className="text-[9px] font-bold text-outline font-mono tracking-wider uppercase block mb-1.5">PRESETS INSPIRATIONS</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '🍕 Friday Munchies', query: 'Indie fast food munchies' },
              { label: '🏕️ Weekend Trips', query: 'Scenic natural weekend trip getaways' },
              { label: '🎮 Board Games', query: 'Immersive cooperative tabletop board games' },
              { label: '🍿 Friday Movies', query: 'Amazing thriller or sci-fi movie genres' },
              { label: '🧁 Dessert Treats', query: 'Cozy desserts, boba teas, or sweets' }
            ].map((preset, index) => (
              <button
                key={index}
                onClick={() => handleApplyPreset(preset.query)}
                disabled={aiLoading}
                className="text-[10px] font-semibold bg-white border border-neutral-200 hover:border-indigo-300 text-slate-700 px-2.5 py-1 rounded-lg transition-colors focus:outline-none cursor-pointer flex-shrink-0"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
