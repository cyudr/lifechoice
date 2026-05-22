import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, HelpCircle, Save, ToggleLeft, HelpCircle as CoinIcon } from 'lucide-react';
import { playCoinFlip, playSuccessChime } from '../lib/audio';
import { DecisionHistoryItem } from '../types';

interface CoinFlipperProps {
  onAddHistory: (item: Omit<DecisionHistoryItem, 'id' | 'timestamp'>) => void;
}

export default function CoinFlipper({ onAddHistory }: CoinFlipperProps) {
  const [headsOption, setHeadsOption] = useState('YES');
  const [tailsOption, setTailsOption] = useState('NO');
  const [coinSide, setCoinSide] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [spinRotation, setSpinRotation] = useState({ x: 0, y: 0 });
  const [winner, setWinner] = useState<string | null>(null);

  const flip = () => {
    if (isFlipping) return;

    setIsFlipping(true);
    setWinner(null);
    playCoinFlip();

    // Randomize winning side
    const resultSide = Math.random() > 0.5 ? 'heads' : 'tails';
    
    // Add multiple spins for dramatic effects
    const extraRotations = Math.floor(Math.random() * 4) + 6; // 6 to 9 full spins
    const targetX = resultSide === 'heads' 
      ? extraRotations * 360 
      : (extraRotations * 360) + 180;
    
    // Slight random deviation in Y axis for natural look
    const targetY = (Math.random() - 0.5) * 60;

    setSpinRotation({ x: targetX, y: targetY });

    setTimeout(() => {
      setCoinSide(resultSide);
      setIsFlipping(false);
      
      const wonOption = resultSide === 'heads' ? headsOption : tailsOption;
      setWinner(wonOption);
      playSuccessChime();

      onAddHistory({
        type: 'coin',
        title: 'Coin Flipper',
        result: `${resultSide.toUpperCase()} (${wonOption})`
      });
    }, 1200);
  };

  const handleReset = () => {
    setHeadsOption('YES');
    setTailsOption('NO');
    setWinner(null);
    setSpinRotation({ x: 0, y: 0 });
    setCoinSide('heads');
  };

  return (
    <div id="coin-flipper-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[460px]">
      {/* Left panel: Coin label editors */}
      <div className="lg:col-span-4 space-y-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <CoinIcon className="w-4.5 h-4.5 text-amber-500" />
          Assign Coin Faces
        </h3>
        <p className="text-xs text-slate-500">
          Set custom options for Heads and Tails. Leave/reset to YES or NO for general choices.
        </p>
        
        <div className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Heads Face (Front)
            </label>
            <input
              type="text"
              id="heads-input"
              value={headsOption}
              onChange={(e) => { setHeadsOption(e.target.value.substring(0, 18)); setWinner(null); }}
              placeholder="e.g. Yes"
              disabled={isFlipping}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Tails Face (Back)
            </label>
            <input
              type="text"
              id="tails-input"
              value={tailsOption}
              onChange={(e) => { setTailsOption(e.target.value.substring(0, 18)); setWinner(null); }}
              placeholder="e.g. No"
              disabled={isFlipping}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <button
          id="reset-coin-labels"
          onClick={handleReset}
          disabled={isFlipping}
          className="w-full py-2.5 border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-45 text-xs font-semibold rounded-xl active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Face Labels
        </button>
      </div>

      {/* Right panel: Dramatic 3D flipping canvas */}
      <div className="lg:col-span-8 flex flex-col items-center justify-center bg-slate-50/60 rounded-3xl p-6 border border-slate-100/80 min-h-[400px]">
        
        {/* The 3D Coin element */}
        <div className="relative w-48 h-48 [perspective:1000px] flex items-center justify-center mb-10 mt-4 select-none">
          <motion.div
            id="coin-3d-renderer"
            className="w-40 h-40 relative [transform-style:preserve-3d] cursor-pointer"
            animate={{
              rotateX: spinRotation.x,
              rotateY: spinRotation.y
            }}
            transition={{
              duration: isFlipping ? 1.2 : 0,
              ease: "easeOut"
            }}
            onClick={flip}
          >
            {/* Front Head layout */}
            <div 
              style={{ backfaceVisibility: 'hidden' }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 border-[8px] border-amber-200 shadow-[inset_0_4px_10px_rgba(255,255,255,0.4),0_8px_20px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center text-center p-3 select-none"
            >
              <div className="w-24 h-24 rounded-full border-4 border-dashed border-amber-200/50 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-amber-900/80 tracking-tight">H</span>
                <span className="text-[9px] uppercase font-mono tracking-widest text-amber-900/60 mt-0.5 min-w-0 max-w-full px-1 truncate font-semibold">
                  {headsOption}
                </span>
              </div>
            </div>

            {/* Back Tail layout */}
            <div 
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateX(180deg)'
              }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 border-[8px] border-slate-300 shadow-[inset_0_4px_10px_rgba(255,255,255,0.4),0_8px_20px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center text-center p-3 select-none"
            >
              <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-300/50 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-slate-100 tracking-tight">T</span>
                <span className="text-[9px] uppercase font-mono tracking-widest text-slate-200 mt-0.5 min-w-0 max-w-full px-1 truncate font-semibold">
                  {tailsOption}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action controls */}
        <div className="text-center space-y-4">
          <button
            id="flip-coin-trigger"
            onClick={flip}
            disabled={isFlipping}
            className="px-10 py-3.5 bg-slate-900 hover:bg-slate-850 active:scale-95 disabled:opacity-40 text-sm font-semibold text-white rounded-full transition shadow-lg shadow-slate-900/15 cursor-pointer font-mono uppercase tracking-wider flex items-center gap-2"
          >
            Flip Coin
          </button>
        </div>

        {/* Instant Winner banner overlay */}
        <AnimatePresence>
          {winner && (
            <motion.div
              id="coin-winner-card"
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="mt-6 bg-white rounded-2xl px-6 py-4 border border-indigo-100 shadow-xl flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Coin Landed On</div>
                <div className="text-sm font-bold text-slate-800">
                  {coinSide.toUpperCase()}: <span className="text-indigo-600 font-extrabold">"{winner}"</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
