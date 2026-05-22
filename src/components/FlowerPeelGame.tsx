import React, { useState, useEffect } from 'react';
import { Sparkles, HelpCircle, RefreshCw, Layers, Dices } from 'lucide-react';
import { DecisionHistoryEntry } from '../types';

interface FlowerPeelGameProps {
  onSaveDecision: (entry: Omit<DecisionHistoryEntry, 'id' | 'timestamp'>) => void;
}

const DEFAULT_QUESTIONS = [
  "Should I buy this bag?",
  "Should I text them first?",
  "Should I go out tonight?",
  "Should I adopt a puppy?",
  "Is it a good day to start?",
];

export function FlowerPeelGame({ onSaveDecision }: FlowerPeelGameProps) {
  const [question, setQuestion] = useState("Should I go out tonight?");
  const [petals, setPetals] = useState<{ id: number; angle: number; peeled: boolean; value: 'Yes' | 'No' }[]>([]);
  const [peelCount, setPeelCount] = useState(0);
  const [totalPetals, setTotalPetals] = useState(10); // Standard Daisy
  const [gamePhrase, setGamePhrase] = useState("Tap a petal to peel!");
  const [choiceOutcome, setChoiceOutcome] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [yesProbability, setYesProbability] = useState(50); // Assigned YES petal probability matching randomized setups

  // Setup petals on game start / reset
  const setupFlower = (numPetals = 10) => {
    // Generate a beautiful randomized YES percentage from 20% to 80% (multiples of 10)
    const possiblePercentages = [20, 30, 40, 50, 60, 70, 80];
    const chosenPercent = possiblePercentages[Math.floor(Math.random() * possiblePercentages.length)];
    setYesProbability(chosenPercent);

    const yesTargetCount = Math.round((chosenPercent / 100) * numPetals);
    
    // Fill up secret values pool
    const valuesPool: ('Yes' | 'No')[] = [];
    for (let i = 0; i < numPetals; i++) {
      valuesPool.push(i < yesTargetCount ? 'Yes' : 'No');
    }

    // Shuffle secret values pool to make placement entirely random
    for (let i = valuesPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [valuesPool[i], valuesPool[j]] = [valuesPool[j], valuesPool[i]];
    }

    const list = Array.from({ length: numPetals }, (_, i) => ({
      id: i,
      angle: (360 / numPetals) * i,
      peeled: false,
      value: valuesPool[i]
    }));
    
    setPetals(list);
    setPeelCount(0);
    setIsDone(false);
    setChoiceOutcome(null);
    setGamePhrase("A brand new daisy! Tap any petal to luck!");
  };

  useEffect(() => {
    setupFlower(totalPetals);
  }, [totalPetals]);

  const playPeelSound = (pitch = 600) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  };

  const playFinalSound = (isYes: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      if (isYes) {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      } else {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(440.00, now + 0.12); // A4
        osc.frequency.setValueAtTime(349.23, now + 0.24); // F4
      }
      
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc.start();
      osc.stop(now + 0.45);
    } catch (_) {}
  };

  const handlePeelPetal = (id: number) => {
    if (isDone) return;
    
    // Find the targeted petal reference
    const currentPetal = petals.find(p => p.id === id);
    if (!currentPetal || currentPetal.peeled) return;

    const list = petals.map(p => {
      if (p.id === id) {
        return { ...p, peeled: true };
      }
      return p;
    });

    const nextPeelCount = peelCount + 1;
    setPeelCount(nextPeelCount);
    playPeelSound(520 + nextPeelCount * 45);

    const plukValue = currentPetal.value;
    const isYesPluk = plukValue === 'Yes';
    
    // Calculate how many YES and NO keys are left
    const remainingPetals = list.filter(p => !p.peeled);
    const remainingCount = remainingPetals.length;

    if (remainingCount === 0) {
      setIsDone(true);
      const isGrandWinnerYes = isYesPluk;
      const finalOutcome = isGrandWinnerYes ? "YES! EMPOWER IT!" : "NO. PAUSE IT!";
      setChoiceOutcome(finalOutcome);
      playFinalSound(isGrandWinnerYes);
      
      onSaveDecision({
        gameType: 'flower',
        title: 'Flower',
        result: `${finalOutcome} (Resolved on final pluck: ${plukValue})`,
        options: [`Aura of YES (${yesProbability}%)`, `Aura of NO (${100 - yesProbability}%)`]
      });
    } else {
      const remainingYes = remainingPetals.filter(p => p.value === 'Yes').length;
      const remainingNo = remainingPetals.filter(p => p.value === 'No').length;
      const reactionWord = isYesPluk ? "Plucked a YES petal! 🌸" : "Plucked a NO petal... ❄️";
      setGamePhrase(`${reactionWord} (${remainingYes} YES, ${remainingNo} NO left!)`);
    }

    setPetals(list);
  };

  const handleRandomizeQuestion = () => {
    const filters = DEFAULT_QUESTIONS.filter(q => q !== question);
    const randomIdx = Math.floor(Math.random() * filters.length);
    setQuestion(filters[randomIdx]);
    setupFlower(totalPetals);
  };

  // Helper remaining counts for status display
  const activeRemainingCount = petals.filter(p => !p.peeled).length;
  const activeRemainingYes = petals.filter(p => !p.peeled && p.value === 'Yes').length;
  const activeRemainingNo = petals.filter(p => !p.peeled && p.value === 'No').length;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="text-center mb-4">
        <span className="font-sans font-semibold text-[11px] tracking-wider text-primary uppercase">Charming Magic</span>
        <h2 className="font-display font-bold text-2xl text-on-surface mt-0.5">Flower</h2>
        <p className="font-sans text-xs text-on-surface-variant max-w-sm mx-auto mt-1 leading-relaxed">
          Peel real petals of luck. Set your query, pick a size, and peel away. The flower is generated with custom randomized luck density!
        </p>
      </div>

      {/* Flower Aura probability meter */}
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-[0px_4px_20px_rgba(15,23,42,0.03)] mb-4">
        <div className="flex justify-between text-[11px] font-sans font-black text-on-surface mb-1.5 uppercase">
          <span className="text-pink-600">AURA YES ({yesProbability}%)</span>
          <span className="text-sky-600">AURA NO ({100 - yesProbability}%)</span>
        </div>
        
        {/* Visual progress bar matching the coin flip bias meter exactly */}
        <div className="w-full h-3 bg-sky-100 rounded-full overflow-hidden flex shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-pink-400 to-rose-300 transition-all duration-500 ease-out" 
            style={{ width: `${yesProbability}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center mt-2.5">
          <span className="text-[10px] text-outline font-sans">
            {isDone ? (
              <span className="font-semibold text-green-600">Fully resolved. Regrow below!</span>
            ) : (
              <span>Petal counts left: <strong className="text-pink-600">{activeRemainingYes}🌸</strong> / <strong className="text-sky-600">{activeRemainingNo}❄️</strong></span>
            )}
          </span>
          <button
            onClick={() => setupFlower(totalPetals)}
            disabled={isDone === false && activeRemainingCount < totalPetals && activeRemainingCount > 0}
            className="text-[10px] font-semibold text-primary hover:text-pink-600 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            title="Shed current flower and re-bias cosmic daisy alignment"
          >
            <Dices className="w-3 h-3" />
            <span>Shuffle Chance</span>
          </button>
        </div>
      </div>

      {/* Question setup */}
      <div className="w-full max-w-xs bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-3 shadow-xs flex items-center gap-2 mb-4">
        <HelpCircle className="w-4 h-4 text-outline flex-shrink-0" />
        <input
          type="text"
          value={question}
          onChange={(e) => { setQuestion(e.target.value); setupFlower(totalPetals); }}
          className="flex-1 bg-transparent border-0 outline-none font-sans font-semibold text-xs text-on-surface placeholder:text-outline focus:ring-0 p-0"
          placeholder="What are you wondering?"
        />
        <button
          onClick={handleRandomizeQuestion}
          className="p-1 px-1.5 text-primary hover:bg-primary/5 rounded-lg transition-colors focus:outline-none cursor-pointer"
          title="Pick a random query"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* The Interactive Flower */}
      <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] bg-gradient-to-br from-indigo-50/20 via-white to-purple-50/25 rounded-3xl border border-outline-variant/10 shadow-inner flex items-center justify-center mb-4 overflow-hidden select-none">
        
        {/* Sky glow effect */}
        <div className="absolute w-32 h-32 bg-gradient-to-tr from-primary/5 to-tertiary/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Outer instructions tag */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 border border-outline-variant/25 font-sans font-bold text-[10px] px-4 py-1.5 rounded-full shadow-xs text-on-surface-variant flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
          <span>{choiceOutcome ? "The magic daisy has spoken." : gamePhrase}</span>
        </div>

        {/* Flower assembly - slow infinite spinning rotation */}
        <div className="relative w-36 h-36 flex items-center justify-center animate-slow-spin">
          
          {/* Render individual petals */}
          {petals.map((petal) => {
            const petalColors = [
              { from: '#ffd8e2', to: '#fff1f4', border: '#fda4af' }, // Soft Rose
              { from: '#fae8ff', to: '#fdf4ff', border: '#f0abfc' }, // Pastel Orchid/Lilac
              { from: '#ffedd5', to: '#fff7ed', border: '#fed7aa' }, // Sunny Peach
              { from: '#fef9c3', to: '#fefef2', border: '#fef08a' }, // Soft Sun Bloom
              { from: '#e0e7ff', to: '#f5f7ff', border: '#c7d2fe' }, // Baby blue
              { from: '#ccfbf1', to: '#f0fdfa', border: '#99f6e4' }, // Pastel foam green
              { from: '#ffdbe8', to: '#ffeff5', border: '#fda4af' }  // Pink Blossom
            ];
            const color = petalColors[petal.id % petalColors.length];

            return (
              <div
                key={petal.id}
                onClick={() => handlePeelPetal(petal.id)}
                className="absolute origin-bottom transition-all duration-700 ease-out cursor-pointer select-none"
                style={{
                  height: '95px',
                  width: '38px',
                  left: '50%',
                  bottom: '50%',
                  transformOrigin: '50% 100%',
                  transform: `translateX(-50%) rotate(${petal.angle}deg) ${
                    petal.peeled ? 'translateY(-170px) rotate(48deg) scale(0)' : 'translateY(0) scale(1)'
                  }`,
                  opacity: petal.peeled ? 0 : 1,
                  pointerEvents: petal.peeled ? 'none' : 'auto',
                }}
              >
                {/* Visual SVG of a highly flowery, handdrawn organic petal */}
                <svg
                  viewBox="0 0 100 240"
                  className="w-full h-full drop-shadow-[0_4px_6px_rgba(139,92,26,0.06)] hover:scale-105 duration-200"
                >
                  {/* Organic floral petal body shape */}
                  <path
                    d="M 50 240 C 18 180, 2 110, 8 50 C 12 15, 36 6, 50 18 C 64 6, 88 15, 92 50 C 98 110, 82 180, 50 240 Z"
                    fill={`url(#gp-gradient-${petal.id})`}
                    stroke={color.border}
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  {/* Delicate petal lines / veins */}
                  <path
                    d="M 50 215 Q 50 115 50 35 M 50 165 Q 32 135 25 115 M 50 145 Q 68 115 75 95 M 50 105 Q 35 85 28 70 M 50 85 Q 65 67 72 52"
                    fill="none"
                    stroke={color.border}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="1 1"
                    className="opacity-75"
                  />
                  
                  {/* Define radial/linear gradient on local SVG definitions */}
                  <defs>
                    <linearGradient id={`gp-gradient-${petal.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={color.to} />
                      <stop offset="100%" stopColor={color.from} />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            );
          })}

          {/* Handdrawn happy smiley Center Hub representing Daisy center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-13 h-13 bg-gradient-to-tr from-amber-300 via-amber-400 to-yellow-300 rounded-[50%_52%_48%_50%] z-10 shadow-[0_4px_10px_rgba(217,119,6,0.18)] border-3 border-amber-700/50 flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-8 h-8 opacity-60">
              <circle cx="20" cy="20" r="14" fill="none" stroke="#78350f" strokeWidth="2" strokeDasharray="3 3" />
              <circle cx="20" cy="20" r="8" fill="none" stroke="#78350f" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="16" cy="18" r="1.5" fill="#78350f" />
              <circle cx="24" cy="18" r="1.5" fill="#78350f" />
              <path d="M 17 23 Q 20 26 23 23" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Result cards */}
      {isDone && choiceOutcome && (
        <div className="w-full max-w-sm bg-gradient-to-br from-white to-[#faf8ff] border border-primary/20 p-4 rounded-2xl shadow-xs flex flex-col items-center text-center animate-float mb-4">
          <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-bold text-outline font-mono tracking-widest uppercase">THE DAISY CHOSE</span>
          <h4 className="font-display font-extrabold text-lg text-on-surface mt-0.5">
            {choiceOutcome}
          </h4>
          <p className="text-[11px] text-on-surface-variant font-sans mt-0.5 max-w-xs leading-relaxed">
            "The magic daisy petal has whispered: <span className="font-semibold italic text-primary">'{question}'</span> was resolved by a {yesProbability}% positive vibration aura!"
          </p>
        </div>
      )}

      {/* Daisy Config controller */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 border border-outline-variant/30 rounded-xl px-3 py-1.5 bg-white shadow-xs">
          <Layers className="w-3.5 h-3.5 text-outline" />
          <span className="text-[11px] font-sans font-semibold text-on-surface">Size:</span>
          <select
            value={totalPetals}
            onChange={(e) => setTotalPetals(parseInt(e.target.value))}
            className="border-0 bg-transparent text-[11px] text-primary font-bold focus:ring-0 outline-none p-0 cursor-pointer"
          >
            <option value="6">6 Petals</option>
            <option value="10">10 Petals</option>
            <option value="14">14 Petals</option>
          </select>
        </div>

        <button
          onClick={() => setupFlower(totalPetals)}
          className="text-[11px] font-semibold text-primary hover:text-tertiary flex items-center gap-1 px-3 py-1.5 hover:bg-primary/5 rounded-xl transition-all duration-200 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Regrow Daisy</span>
        </button>
      </div>
    </div>
  );
}
