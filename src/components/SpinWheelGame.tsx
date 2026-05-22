import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, RotateCcw, Play, CheckCircle2, AlertTriangle, Sparkles, Wand2, Dices } from 'lucide-react';
import { DecisionHistoryEntry } from '../types';

interface SpinWheelGameProps {
  onSaveDecision: (entry: Omit<DecisionHistoryEntry, 'id' | 'timestamp'>) => void;
  onRequestSuggestions?: (prompt: string, count: number) => Promise<string[]>;
  isAiLoading?: boolean;
}

const PRESET_OPTIONS = ['Eat Italian', 'Order Sushi', 'Bake Pizza', 'Cook Ramen', 'Grab Burgers', 'Make a Salad'];

export function SpinWheelGame({ onSaveDecision, onRequestSuggestions, isAiLoading }: SpinWheelGameProps) {
  const [options, setOptions] = useState<string[]>(['Option A', 'Option B', 'Option C']);
  const [weights, setWeights] = useState<number[]>([33, 33, 34]);
  const [newOption, setNewOption] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const wheelRef = useRef<HTMLDivElement>(null);
  const soundCooldown = useRef(false);

  const generateRandomWeights = (count: number): number[] => {
    if (count <= 0) return [];
    if (count === 1) return [100];
    // Generate random values ranging from 0.2 to 1.0 to avoid extremely microscopic slices
    let values = Array.from({ length: count }, () => Math.random() * 0.8 + 0.2);
    const sum = values.reduce((a, b) => a + b, 0);
    // Convert to percentages that sum exactly to 100
    let rounded = values.map(v => Math.round((v / sum) * 100));
    let diff = 100 - rounded.reduce((a, b) => a + b, 0);
    rounded[0] += diff;
    return rounded;
  };

  // Re-randomize weights when options list changes
  useEffect(() => {
    if (options.length > 0 && weights.length !== options.length) {
      setWeights(generateRandomWeights(options.length));
    }
  }, [options]);

  const handleShuffleWeights = () => {
    if (options.length < 2) return;
    setWeights(generateRandomWeights(options.length));
    playTickSound(700);
  };

  // Play a beautiful synthetic click sound for wheel ticks
  const playTickSound = (freq = 800) => {
    if (soundCooldown.current) return;
    soundCooldown.current = true;
    setTimeout(() => { soundCooldown.current = false; }, 40);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gainSetting = ctx.createGain();
      osc.connect(gainSetting);
      gainSetting.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gainSetting.gain.setValueAtTime(0.02, ctx.currentTime);
      gainSetting.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (_) {}
  };

  const playSuccessSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      const playNote = (freq: number, delay: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, now + delay);
        gainNode.gain.setValueAtTime(0.04, now + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
        osc.start(now + delay);
        osc.stop(now + delay + dur);
      };

      playNote(523.25, 0, 0.15); // C5
      playNote(659.25, 0.1, 0.15); // E5
      playNote(783.99, 0.2, 0.15); // G5
      playNote(1046.50, 0.3, 0.4); // C6
    } catch (_) {}
  };

  const handleAddOption = (textInput = newOption) => {
    const trimmed = textInput.trim();
    if (!trimmed) return;
    if (options.includes(trimmed)) return;
    const nextOptions = [...options, trimmed];
    setOptions(nextOptions);
    setWeights(generateRandomWeights(nextOptions.length));
    if (textInput === newOption) setNewOption('');
    playTickSound(600);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      alert("You need at least 2 options to spin the magical wheel!");
      return;
    }
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    setWeights(generateRandomWeights(updated.length));
    playTickSound(300);
  };

  const handleClearAll = () => {
    setOptions([]);
    setWeights([]);
    setWinningIndex(null);
    setShowResult(false);
  };

  const handleLoadPresets = () => {
    const loaded = PRESET_OPTIONS;
    setOptions(loaded);
    setWeights(generateRandomWeights(loaded.length));
    setWinningIndex(null);
    setShowResult(false);
  };

  const handleSuggestAiOptions = async () => {
    if (!onRequestSuggestions) return;
    setAiError(null);
    try {
      const suggestions = await onRequestSuggestions("dinner varieties or generic choices", 5);
      if (suggestions && suggestions.length > 0) {
        setOptions(suggestions);
        setWeights(generateRandomWeights(suggestions.length));
        setShowResult(false);
        setWinningIndex(null);
      }
    } catch (e: any) {
      setAiError("Could not retrieve AI options. Try standard ideas!");
    }
  };

  const handleSpin = () => {
    if (options.length < 2) {
      alert("Please enter at least 2 options first!");
      return;
    }
    if (isSpinning) return;

    setIsSpinning(true);
    setShowResult(false);
    setWinningIndex(null);

    // Audio tick ticking simulations when wheel is spinning
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      if (tickCount < 18) {
        playTickSound(800 + tickCount * 15);
        tickCount++;
      } else {
        clearInterval(tickInterval);
      }
    }, 130);

    // Pick a winner using weighted probabilities!
    const r = Math.random() * 100;
    let accumulated = 0;
    let selectedWinner = 0;
    for (let i = 0; i < weights.length; i++) {
      accumulated += weights[i] || 0;
      if (r <= accumulated) {
        selectedWinner = i;
        break;
      }
    }

    // Determine target location degrees for this slice.
    // The conic-gradient segments are stacked up index-by-index clockwise.
    // So targetSliceCenter is: SUM_OF(all previous slice degrees) + half of chosen slice degree.
    let prevDegrees = 0;
    for (let i = 0; i < selectedWinner; i++) {
      prevDegrees += (((weights[i] || 0) / 100) * 360);
    }
    const currentDegrees = (((weights[selectedWinner] || 0) / 100) * 360);
    const targetSliceCenter = prevDegrees + (currentDegrees / 2);
    
    // Add micro-random shift inside slice boundaries
    const randomShift = (Math.random() - 0.5) * (currentDegrees * 0.4);
    const landingAngle = 360 - targetSliceCenter + randomShift;
    
    const extraSpins = 5 + Math.floor(Math.random() * 4); // 5 to 8 spins
    const totalNewRotation = rotation + (extraSpins * 360) + (landingAngle - (rotation % 360));

    setRotation(totalNewRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinningIndex(selectedWinner);
      setShowResult(true);
      playSuccessSound();

      // Save to history
      onSaveDecision({
        gameType: 'wheel',
        title: 'Wheel',
        result: `${options[selectedWinner]} (${weights[selectedWinner]}% odds)`,
        options: options.map((opt, id) => `${opt} (${weights[id]}%)`)
      });
    }, 3500); // 3.5s matches CSS transition runtime
  };

  const handleReset = () => {
    setIsSpinning(false);
    setShowResult(false);
    setWinningIndex(null);
    setRotation(0);
    const defaultOpts = ['Option A', 'Option B', 'Option C'];
    setOptions(defaultOpts);
    setWeights([33, 33, 34]);
  };

  // Helper colors for wheel rendering - gorgeous soft pastel shades for handdrawn cartoon aesthetic
  const segmentColors = [
    '#ffdfdf', // Pastel Rose
    '#dfffd6', // Pastel Mint
    '#ffeeb3', // Pastel Sunny Yellow
    '#dfebff', // Pastel Sky Blue
    '#f4dfff', // Pastel Lilac
    '#ffdff4', // Pastel Pink Blossom
    '#d6fff5', // Pastel Aquamarine
    '#ffe6cc'  // Pastel Peach
  ];

  // Dynamic conic-gradient string
  const getConicGradient = () => {
    if (options.length === 0) return 'conic-gradient(#fdfbf7 0 360deg)';
    let accumulatedDegrees = 0;
    const slices = options.map((_, index) => {
      const startDeg = accumulatedDegrees;
      const optionWeight = weights[index] || (100 / options.length);
      accumulatedDegrees += (optionWeight / 100) * 360;
      const color = segmentColors[index % segmentColors.length];
      return `${color} ${startDeg}deg ${accumulatedDegrees}deg`;
    });
    return `conic-gradient(${slices.join(', ')})`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="text-center mb-4">
        <span className="font-sans font-bold text-xs tracking-wider text-primary uppercase">Quick Spark</span>
        <h2 className="font-display font-black text-3xl text-on-surface mt-1">Wheel of Fortune</h2>
        <p className="font-sans text-sm text-on-surface-variant max-w-md mx-auto mt-1 leading-relaxed">
          For dividing custom choices. Type your items, see their assigned randomized chances, tap spin, and watch fortune settle!
        </p>
      </div>

      {/* Inputs approach */}
      <div className="w-full bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-[0px_4px_22px_rgba(15,23,42,0.03)] mb-4 transition-all duration-300 hover:shadow-md">
        <h3 className="font-display font-bold text-sm text-on-surface mb-3 flex items-center justify-between">
          <span>Add your playful options!</span>
          <span className="text-[11px] font-mono font-medium text-primary bg-primary/5 px-2.5 py-1 rounded-full">
            {options.length} {options.length === 1 ? 'choice' : 'choices'} active
          </span>
        </h3>

        <form onSubmit={(e) => { e.preventDefault(); handleAddOption(); }} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
              <Plus className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              className="w-full bg-surface-container-low border-0 outline-none rounded-xl py-2.5 pl-10 pr-3.5 font-sans text-xs text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-white transition-all duration-300"
              placeholder="Add custom option..., e.g., Watch Sci-fi"
            />
          </div>
          <button
            type="submit"
            className="bg-primary hover:bg-tertiary active:scale-95 text-white font-sans font-bold text-xs px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-1 shadow-sm"
          >
            <span>Add</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2 gap-y-3 mt-3.5">
          <button
            onClick={handleLoadPresets}
            className="text-[11px] font-bold text-outline hover:text-primary transition-colors flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-primary/5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Eat Demo</span>
          </button>
          
          <button
            type="button"
            onClick={handleShuffleWeights}
            className="text-[11px] font-bold text-outline hover:text-[#4648d4] transition-colors flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-primary/5 cursor-pointer"
            title="Randomize slice portions with uneven probabilities"
          >
            <Dices className="w-3.5 h-3.5 text-[#4648d4]" />
            <span>Shuffle Portions 🎲</span>
          </button>
          
          {onRequestSuggestions && (
            <button
              type="button"
              disabled={isAiLoading}
              onClick={handleSuggestAiOptions}
              className="text-[11px] font-bold text-outline hover:text-tertiary transition-colors flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-tertiary/5 disabled:opacity-50 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isAiLoading ? 'AI Suggesting...' : 'Suggest AI Options'}</span>
            </button>
          )}

          <button
            onClick={handleClearAll}
            className="text-[11px] font-bold text-outline hover:text-error transition-colors ml-auto py-1 px-2.5 border border-dashed border-outline-variant/50 rounded-lg hover:bg-error/5 cursor-pointer"
          >
            Clear All
          </button>
        </div>

        {aiError && (
          <div className="mt-3 py-2 px-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2 w-full">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{aiError}</span>
          </div>
        )}
      </div>

      {/* Wheel Visual Section (Handdrawn & Cartoonized Board style) */}
      <div className="relative flex flex-col items-center justify-center mb-6">
        
        {/* Playful cartoon hand-drawn indicator needle pointing down from top */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center select-none pointer-events-none transition-transform hover:scale-110">
          <svg className="w-10 h-10 drop-shadow-[0_4px_6px_rgba(139,92,26,0.12)] animate-bounce" style={{ animationDuration: '2.5s' }} viewBox="0 0 24 24">
            <path
              d="M12 22L4 6C4 6 8 3 12 3C16 3 20 6 20 6L12 22Z"
              fill="#fb7185" /* Pastel coral red */
              stroke="#be123c" /* Deep rose marker outline */
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
          <div className="w-3.5 h-3.5 rounded-full bg-[#fef08a] border-2 border-amber-700/40 -mt-2.5 shadow-xs" />
        </div>

        {/* Tactical Cardboard/Paper Sketch Plate Outer Rim - using wobbly borders and warm light shades */}
        <div className="p-4 bg-[#fefbf6] rounded-[52%_48%_51%_49%] shadow-[0_12px_36px_rgba(139,92,26,0.06)] relative border-4 border-dashed border-amber-700/30 flex items-center justify-center self-center transition-all duration-300">
          
          {/* Cute cartoon star and blossom studs around the perimeter */}
          {Array.from({ length: 12 }).map((_, i) => (
            <React.Fragment key={i}>
              <div
                className="absolute left-1/2 top-1/2 text-sm z-10 select-none pointer-events-none origin-center"
                style={{
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-166px)`,
                }}
              >
                <span className="inline-block animate-pulse text-amber-400" style={{ animationDelay: `${i * 120}ms` }}>
                  {i % 2 === 0 ? '🌸' : '⭐'}
                </span>
              </div>
            </React.Fragment>
          ))}

          {/* The Spinning Wheel Core with handdrawn feel and border */}
          <div
            ref={wheelRef}
            className="w-[264px] h-[264px] md:w-[308px] md:h-[308px] rounded-[49%_51%_48%_52%] overflow-hidden relative flex items-center justify-center border-4 border-amber-800/30 shadow-[inset_0_4px_12px_rgba(139,92,26,0.05),_0_5px_15px_rgba(139,92,26,0.04)] bg-amber-50/20"
            style={{
              background: getConicGradient(),
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 3.5s cubic-bezier(0.15, 0.85, 0.15, 1)' : 'none',
              willChange: 'transform'
            }}
          >
            {/* Visual Wedge slice dividing lines styled like soft pencil traces */}
            {options.map((_, index) => {
              let accumulatedDegrees = 0;
              for (let i = 0; i <= index; i++) {
                accumulatedDegrees += ((weights[i] || 0) / 100) * 360;
              }
              return (
                <div
                  key={`div-${index}`}
                  className="absolute left-1/2 bottom-1/2 w-[2px] bg-amber-900/10 border-l border-dashed border-white/50 origin-bottom pointer-events-none"
                  style={{
                    height: '50%',
                    transformOrigin: 'bottom center',
                    transform: `translateX(-50%) rotate(${accumulatedDegrees}deg)`
                  }}
                />
              );
            })}

            {/* Display Labels designed as handwritten stickers */}
            {options.map((option, index) => {
              let prevDegrees = 0;
              for (let i = 0; i < index; i++) {
                prevDegrees += (((weights[i] || 0) / 100) * 360);
              }
              const currentDegrees = (((weights[index] || 0) / 100) * 360);
              // Calculate radial bisector angle
              const angle = prevDegrees + (currentDegrees / 2);

              return (
                <div
                  key={index}
                  className="absolute pointer-events-none select-none text-amber-900 font-sans font-extrabold text-[10px] md:text-[11px] truncate flex items-center justify-end"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: '45%',
                    height: '24px',
                    transformOrigin: 'left center',
                    transform: `rotate(${angle - 90}deg) translateY(-50%)`
                  }}
                >
                  <span className="inline-block bg-white/95 border-2 border-amber-700/20 px-2 py-1.5 rounded-xl shadow-xs text-amber-900 font-sans font-bold max-w-[85px] md:max-w-[100px] truncate" title={`${option} (${weights[index]}%)`}>
                    ✏️ {option}
                  </span>
                </div>
              );
            })}

            {/* Adorable Cozy Pastel Button Center Pin with stitch detail */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-tr from-[#ffe4e6] to-[#ffd1d5] rounded-[49%_51%_48%_52%] z-20 shadow-[0_4px_8px_rgba(139,92,26,0.12)] border-2 border-amber-700/25 flex items-center justify-center">
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-800/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-800/40" />
              </div>
            </div>
          </div>
        </div>

        {/* Soft handdrawn-looking shadow reflection base */}
        <div className="w-[198px] md:w-[264px] h-3.5 bg-amber-900/5 rounded-[100%] mt-4.5 blur-xs mix-blend-multiply"></div>
      </div>

      {/* Active Options Chips display (With 10% elevated text sizes) */}
      {options.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 max-w-xl mb-4.5">
          {options.map((option, idx) => (
            <div
              key={idx}
              className="bg-[#eaedff] hover:bg-[#dae2fd] text-on-surface text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs border border-outline-variant/10 transition-all duration-200"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
              <span className="truncate max-w-[130px]">{option} ({weights[idx]}%)</span>
              <button
                type="button"
                onClick={() => handleRemoveOption(idx)}
                className="text-outline hover:text-error transition-colors p-0.5 focus:outline-none cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
        <button
          onClick={handleSpin}
          disabled={isSpinning || options.length < 2}
          className="w-full flex-1 bg-gradient-to-r from-primary to-primary-container disabled:from-outline/30 disabled:to-outline/30 text-white font-sans font-bold text-xs py-3.5 rounded-xl shadow-[0px_4px_14px_rgba(70,72,212,0.18)] hover:shadow-md disabled:shadow-none hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 relative overflow-hidden group cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{isSpinning ? 'Spinnin...' : 'Spin the Wheel!'}</span>
        </button>

        <button
          onClick={handleReset}
          disabled={isSpinning}
          className="w-full sm:w-auto px-5 py-3.5 border border-outline-variant/50 hover:border-primary text-outline bg-transparent hover:bg-primary/5 font-sans font-bold text-xs rounded-xl transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          Reset
        </button>
      </div>


      {/* Winner Overlay drawer */}
      {showResult && winningIndex !== null && (
        <div className="w-full max-w-sm mt-4 bg-gradient-to-br from-white to-[#faf8ff] rounded-2xl p-5 border-2 border-primary/20 shadow-md animate-float flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-tertiary to-secondary"></div>
          
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <span className="text-[10px] font-bold text-outline uppercase tracking-widest font-mono">FATE CHOSE</span>
          <h4 className="font-display font-extrabold text-xl text-primary mt-0.5 px-3 leading-tight">
            {options[winningIndex]}
          </h4>
          
          <p className="text-[11px] text-on-surface-variant font-sans mt-1.5 max-w-xs px-2 leading-relaxed">
            "The magical wheel has spoken! Embrace the mystery and enjoy the ride with zero overthinking!"
          </p>

          <button
            onClick={() => setShowResult(false)}
            className="mt-3 bg-primary/10 hover:bg-primary/20 text-primary px-3.5 py-1 rounded-lg text-[11px] font-semibold transition-colors focus:outline-none"
          >
            Accept Fate
          </button>
        </div>
      )}
    </div>
  );
}
