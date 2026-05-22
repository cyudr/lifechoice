import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Trophy, RotateCcw, Dices } from 'lucide-react';
import { DecisionHistoryEntry } from '../types';

interface CoinFlipGameProps {
  onSaveDecision: (entry: Omit<DecisionHistoryEntry, 'id' | 'timestamp'>) => void;
}

export function CoinFlipGame({ onSaveDecision }: CoinFlipGameProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<'Heads' | 'Tails' | null>(null);
  const [rotation, setRotation] = useState(0);
  
  // Coin bias probability - randomized when entering / resetting
  const [headsProbability, setHeadsProbability] = useState(50);

  const randomizeCoinBias = () => {
    // Randomize Heads bias from 15% to 85% to keep it interesting but playable
    const rand = Math.round(15 + Math.random() * 70);
    setHeadsProbability(rand);
  };

  useEffect(() => {
    randomizeCoinBias();
  }, []);

  const playFlipSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gainSetting = ctx.createGain();
      osc.connect(gainSetting);
      gainSetting.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.3);
      gainSetting.gain.setValueAtTime(0.04, ctx.currentTime);
      gainSetting.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (_) {}
  };

  const playSuccessSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gainSetting = ctx.createGain();
      osc.connect(gainSetting);
      gainSetting.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      gainSetting.gain.setValueAtTime(0.02, ctx.currentTime);
      gainSetting.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (_) {}
  };

  const handleFlip = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setResult(null);
    playFlipSound();

    // Biased determination based on randomized headsProbability
    const randRoll = Math.random() * 100;
    const randomWinner = randRoll < headsProbability ? 'Heads' : 'Tails';
    
    // Rotate coin by a minimum of 4 full circles (1440 degrees) plus extra degrees based on Heads/Tails
    // Heads is face up (0 rotation), Tails is flipped (180 rotation).
    const isHeads = randomWinner === 'Heads';
    const extraSpins = 5 + Math.floor(Math.random() * 5); // 5 to 9 spins
    const finalAngle = (extraSpins * 360) + (isHeads ? 0 : 180);

    setRotation(finalAngle);

    setTimeout(() => {
      setIsFlipping(false);
      setResult(randomWinner);
      playSuccessSound();

      onSaveDecision({
        gameType: 'coin',
        title: 'Coin',
        result: `${randomWinner} (${randomWinner === 'Heads' ? headsProbability : 100 - headsProbability}% odds)`,
        options: [`Heads (${headsProbability}%)`, `Tails (${100 - headsProbability}%)`]
      });
    }, 1200); // matches the animation runtime in index.css
  };

  const handleResetOdds = () => {
    if (isFlipping) return;
    randomizeCoinBias();
    setResult(null);
    setRotation(0);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="text-center mb-4">
        <span className="font-sans font-semibold text-[11px] tracking-wider text-primary uppercase">Quick Spark</span>
        <h2 className="font-display font-bold text-2xl text-on-surface mt-0.5">Coin</h2>
        <p className="font-sans text-xs text-on-surface-variant max-w-md mx-auto mt-1 leading-relaxed">
          For instant Yes / No splits. Classic disk of gravity tuned with un-even randomized chances!
        </p>
      </div>

      {/* Probability visual density bar */}
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-[0px_4px_20px_rgba(15,23,42,0.03)] mb-4">
        <div className="flex justify-between text-[11px] font-sans font-black text-on-surface mb-1.5 uppercase">
          <span className="text-amber-600">HEADS ({headsProbability}%)</span>
          <span className="text-indigo-600">TAILS ({100 - headsProbability}%)</span>
        </div>
        
        {/* Visual progress bar bar */}
        <div className="w-full h-3 bg-indigo-100 rounded-full overflow-hidden flex shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-500 ease-out" 
            style={{ width: `${headsProbability}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] text-outline font-sans">
            * Probability is randomized on load!
          </span>
          <button
            onClick={handleResetOdds}
            disabled={isFlipping}
            className="text-[10px] font-semibold text-primary hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
          >
            <Dices className="w-3 h-3" />
            <span>Shuffle Odds</span>
          </button>
        </div>
      </div>

      {/* Tossing Arena */}
      <div className="relative flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-outline-variant/30 shadow-[0px_8px_30px_rgba(15,23,42,0.04)] mb-4 w-full max-w-sm">
        {/* Neon target marker background */}
        <div className="absolute inset-0 border border-dashed border-primary/20 m-4 rounded-2xl pointer-events-none"></div>

        {/* Dynamic 3D perspective wrapper - gently bobbing when idle */}
        <div className={`h-36 flex items-center justify-center mb-4 relative [perspective:1000px] ${isFlipping ? '' : 'animate-bento-float'}`}>
          {/* Pulsing neon glowing backplate */}
          <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400/25 to-pink-500/15 blur-xl animate-pulse pointer-events-none -z-10" />

          {/* Coin structure */}
          <div
            className="w-28 h-28 rounded-full [transform-style:preserve-3d] select-none cursor-pointer relative z-10"
            style={{
              transform: `rotateX(${rotation}deg)`,
              transition: isFlipping ? 'transform 1.2s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none',
            }}
            onClick={handleFlip}
          >
            {/* Front of coin (Heads) */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-300 border-4 border-amber-500 flex flex-col items-center justify-center shadow-lg [backface-visibility:hidden] select-none [transform:rotateY(0deg)]">
              <div className="w-20 h-20 rounded-full border border-amber-600/30 flex flex-col items-center justify-center">
                <span className="text-amber-700 text-2xl font-extrabold font-display">H</span>
                <span className="text-amber-800 text-[9px] font-sans font-extrabold tracking-widest mt-0.5">HEADS</span>
              </div>
            </div>

            {/* Back of coin (Tails) */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-400 border-4 border-amber-600 flex flex-col items-center justify-center shadow-lg [backface-visibility:hidden] select-none [transform:rotateX(180deg)]">
              <div className="w-20 h-20 rounded-full border border-amber-700/30 flex flex-col items-center justify-center">
                <span className="text-amber-800 text-2xl font-extrabold font-display">T</span>
                <span className="text-amber-900 text-[9px] font-sans font-extrabold tracking-widest mt-0.5">TAILS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic result tag */}
        {result && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl py-2 px-4 animate-float text-center flex items-center gap-1.5 mb-1.5 z-10 shadow-xs">
            <Trophy className="w-4 h-4 text-amber-600" />
            <div>
              <span className="text-[9px] font-bold text-amber-800/80 uppercase font-mono tracking-wider block">THE COIN CHOSE</span>
              <span className="font-display font-extrabold text-sm text-amber-950 font-sans tracking-wide">{result}!</span>
            </div>
          </div>
        )}

        <p className="text-[11px] text-outline text-center mt-1 select-none">
          {isFlipping ? 'Fate is rotating in the air...' : 'Click the gold coin or the button below to toss!'}
        </p>
      </div>

      {/* Button controls */}
      <div className="flex justify-center w-full max-w-xs">
        <button
          onClick={handleFlip}
          disabled={isFlipping}
          className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-amber-950 font-sans font-bold text-xs py-3 px-6 rounded-xl shadow-xs transition-all duration-300 flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 fill-amber-950" />
          <span>{isFlipping ? 'Flipping Coin...' : 'Flip it!'}</span>
        </button>
      </div>
    </div>
  );
}
