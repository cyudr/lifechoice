import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Dices, ChevronRight } from 'lucide-react';
import { playDiceRoll, playSuccessChime } from '../lib/audio';
import { DecisionHistoryItem } from '../types';

interface DiceRollerProps {
  onAddHistory: (item: Omit<DecisionHistoryItem, 'id' | 'timestamp'>) => void;
}

export default function DiceRoller({ onAddHistory }: DiceRollerProps) {
  const [diceCount, setDiceCount] = useState<1 | 2>(1);
  const [rolls, setRolls] = useState<number[]>([1]);
  const [isRolling, setIsRolling] = useState(false);
  const [rollingOffsets, setRollingOffsets] = useState<{ x: number; y: number; r: number }[]>([{ x: 0, y: 0, r: 0 }]);

  const roll = () => {
    if (isRolling) return;

    setIsRolling(true);
    
    // Animate shaking by scheduling mini-vibrations
    const intervalTime = 60;
    const duration = 900;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const shakeInterval = setInterval(() => {
      playDiceRoll();
      // Random offsets for each active die to simulate bouncy roll
      const offsets = Array.from({ length: diceCount }).map(() => ({
        x: (Math.random() - 0.5) * 45,
        y: (Math.random() - 0.5) * 45,
        r: (Math.random() - 0.5) * 120
      }));
      setRollingOffsets(offsets);
      
      // Scramble intermediate faces
      const fakeRolls = Array.from({ length: diceCount }).map(() => Math.floor(Math.random() * 6) + 1);
      setRolls(fakeRolls);

      currentStep++;
      if (currentStep >= steps) {
        clearInterval(shakeInterval);
        
        // Final roll values
        const finalRolls = Array.from({ length: diceCount }).map(() => Math.floor(Math.random() * 6) + 1);
        setRolls(finalRolls);
        setRollingOffsets(Array.from({ length: diceCount }).map(() => ({ x: 0, y: 0, r: 0 })));
        setIsRolling(false);
        playSuccessChime();

        const sum = finalRolls.reduce((a, b) => a + b, 0);
        const resultString = diceCount === 1 ? `Rolled a ${sum}` : `Rolled ${finalRolls.join(' & ')} (Sum: ${sum})`;

        onAddHistory({
          type: 'dice',
          title: diceCount === 1 ? 'Dice Roller (1 Die)' : 'Dice Roller (2 Dice)',
          result: resultString
        });
      }
    }, intervalTime);
  };

  // DOTS alignment lookup for 1 to 6
  // Standard dice layout using grid areas
  const getDotPositions = (val: number) => {
    switch (val) {
      case 1:
        return [4]; // center
      case 2:
        return [0, 8]; // top-left, bottom-right
      case 3:
        return [0, 4, 8]; // top-left, center, bottom-right
      case 4:
        return [0, 2, 6, 8]; // corners
      case 5:
        return [0, 2, 4, 6, 8]; // corners + center
      case 6:
        return [0, 2, 3, 5, 6, 8]; // corners + middle edges
      default:
        return [];
    }
  };

  const renderDie = (val: number, index: number) => {
    const dots = getDotPositions(val);
    const offset = rollingOffsets[index] || { x: 0, y: 0, r: 0 };

    return (
      <motion.div
        key={index}
        animate={{
          x: offset.x,
          y: offset.y,
          rotate: offset.r,
        }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
        style={{ transformOrigin: 'center' }}
        className="w-28 h-28 bg-white border-2 border-slate-150 rounded-2xl shadow-[0_12px_28px_rgba(0,0,0,0.08),inset_0_-8px_16px_rgba(0,0,0,0.05)] p-4 flex items-center justify-center cursor-pointer relative"
        onClick={roll}
      >
        {/* Highlight sheen lines */}
        <div className="absolute top-1.5 left-1.5 right-1.5 h-6 bg-gradient-to-b from-slate-50/70 to-transparent rounded-t-xl" />

        {/* Outer red pip for dice design */}
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-2 p-1.5">
          {Array.from({ length: 9 }).map((_, pipIdx) => {
            const hasDot = dots.includes(pipIdx);
            return (
              <div key={pipIdx} className="flex items-center justify-center">
                {hasDot && (
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className={`rounded-full shrink-0 ${
                      val === 1 
                        ? 'w-6 h-6 bg-rose-500 shadow-md shadow-rose-500/10' 
                        : 'w-3.5 h-3.5 bg-slate-850'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const sum = rolls.reduce((a, b) => a + b, 0);

  return (
    <div id="dice-roller-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[460px]">
      {/* Left panel: Die options */}
      <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Dices className="w-4.5 h-4.5 text-rose-500 animate-bounce" />
          Rolling Options
        </h3>
        
        <div className="space-y-3">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Select Dice Quantity
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="set-one-die-btn"
              onClick={() => { setDiceCount(1); setRolls([1]); }}
              disabled={isRolling}
              className={`py-2.5 px-4 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                diceCount === 1
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Single Die (1)
            </button>
            <button
              id="set-two-dice-btn"
              onClick={() => { setDiceCount(2); setRolls([1, 1]); }}
              disabled={isRolling}
              className={`py-2.5 px-4 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                diceCount === 2
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Double Dice (2)
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Roll the dice to pick numbers, resolve turns, or make simple double-odds choices.
        </p>
      </div>

      {/* Right panel: Live physics roll */}
      <div className="lg:col-span-8 flex flex-col items-center justify-center bg-slate-50/60 rounded-3xl p-6 border border-slate-100/80 min-h-[400px]">
        {/* Loaded Dice Graphics */}
        <div className="flex gap-6 items-center justify-center min-h-[160px] select-none">
          {rolls.map((rollVal, idx) => renderDie(rollVal, idx))}
        </div>

        {/* Actions triggering */}
        <div className="mt-10 text-center space-y-4">
          <button
            id="roll-dice-trigger"
            onClick={roll}
            disabled={isRolling}
            className="px-10 py-3.5 bg-slate-900 hover:bg-slate-850 active:scale-95 disabled:opacity-40 text-sm font-semibold text-white rounded-full transition shadow-lg shadow-slate-900/15 cursor-pointer font-mono uppercase tracking-wider flex items-center gap-2"
          >
            Roll Dice
          </button>
        </div>

        {/* Aggregated sums */}
        <AnimatePresence>
          {!isRolling && (
            <motion.div
              id="dice-result-sum-card"
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="mt-6 bg-white rounded-2xl px-6 py-4 border border-indigo-100 shadow-xl flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                <ChevronRight className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Roll Outcome</div>
                <div className="text-sm font-bold text-slate-850">
                  {diceCount === 2 ? (
                    <span>Sum: <span className="text-rose-500 font-extrabold">{sum}</span> ({rolls.join(' + ')})</span>
                  ) : (
                    <span>Landed On: <span className="text-rose-500 font-extrabold">{sum}</span></span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
