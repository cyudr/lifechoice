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

  // Helper colors for wheel rendering
  const segmentColors = [
    '#eaedff', '#dae2fd', '#c0c1ff', '#e1e0ff',
    '#f2f3ff', '#eef0ff', '#d0bcff', '#e9ddff'
  ];

  // Dynamic conic-gradient string
  const getConicGradient = () => {
    if (options.length === 0) return 'conic-gradient(#eaedff 0 360deg)';
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
        <span className="font-sans font-semibold text-[11px] tracking-wider text-primary uppercase">Quick Spark</span>
        <h2 className="font-display font-bold text-2xl text-on-surface mt-0.5">Wheel</h2>
        <p className="font-sans text-xs text-on-surface-variant max-w-md mx-auto mt-1 leading-relaxed">
          For dividing custom choices. Type your items, see their assigned randomized chances, tap spin, and watch fortune settle!
        </p>
      </div>

      {/* Inputs approach */}
      <div className="w-full bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-[0px_4px_20px_rgba(15,23,42,0.03)] mb-4 transition-all duration-300 hover:shadow-md">
        <h3 className="font-display font-bold text-xs text-on-surface mb-2.5 flex items-center justify-between">
          <span>Add your playful options!</span>
          <span className="text-[10px] font-mono font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full">
            {options.length} {options.length === 1 ? 'choice' : 'choices'} active
          </span>
        </h3>

        <form onSubmit={(e) => { e.preventDefault(); handleAddOption(); }} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              <Plus className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              className="w-full bg-surface-container-low border-0 outline-none rounded-xl py-2 pl-9 pr-3 font-sans text-xs text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-white transition-all duration-300"
              placeholder="Add custom option..., e.g., Watch Sci-fi"
            />
          </div>
          <button
            type="submit"
            className="bg-primary hover:bg-tertiary active:scale-95 text-white font-sans font-semibold text-xs px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-1 shadow-sm"
          >
            <span>Add</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2 gap-y-3 mt-3">
          <button
            onClick={handleLoadPresets}
            className="text-[10px] font-semibold text-outline hover:text-primary transition-colors flex items-center gap-1 py-0.5 px-2 rounded-lg hover:bg-primary/5 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Load Eat Demo</span>
          </button>
          
          <button
            type="button"
            onClick={handleShuffleWeights}
            className="text-[10px] font-semibold text-outline hover:text-[#4648d4] transition-colors flex items-center gap-1 py-0.5 px-2 rounded-lg hover:bg-primary/5 cursor-pointer"
            title="Randomize slice portions with uneven probabilities"
          >
            <Dices className="w-3 h-3 text-[#4648d4]" />
            <span>Shuffle Portions 🎲</span>
          </button>
          
          {onRequestSuggestions && (
            <button
              type="button"
              disabled={isAiLoading}
              onClick={handleSuggestAiOptions}
              className="text-[10px] font-semibold text-outline hover:text-tertiary transition-colors flex items-center gap-1 py-0.5 px-2 rounded-lg hover:bg-tertiary/5 disabled:opacity-50 cursor-pointer"
            >
              <Wand2 className="w-3 h-3" />
              <span>{isAiLoading ? 'AI Suggesting...' : 'Suggest AI Options'}</span>
            </button>
          )}

          <button
            onClick={handleClearAll}
            className="text-[10px] font-semibold text-outline hover:text-error transition-colors ml-auto py-0.5 px-2 border border-dashed border-outline-variant/50 rounded-lg hover:bg-error/5 cursor-pointer"
          >
            Clear All
          </button>
        </div>

        {aiError && (
          <div className="mt-2.5 py-1.5 px-2 bg-red-50 text-red-700 text-[11px] rounded-lg flex items-center gap-1.5 w-full">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span>{aiError}</span>
          </div>
        )}
      </div>

      {/* Wheel Visual Section */}
      <div className="relative flex flex-col items-center justify-center mb-4">
        {/* Pointer pointing down from top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-on-surface rotate-45 z-20 rounded-sm shadow-md flex items-center justify-center border-t border-l border-white/10">
          <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
        </div>

        {/* The Wheel */}
        <div className="p-3 bg-white rounded-full shadow-[0px_16px_40px_rgba(70,72,212,0.12)] relative">
          <div
            ref={wheelRef}
            className="w-[240px] h-[240px] md:w-[280px] md:h-[280px] rounded-full wheel-shadow overflow-hidden relative flex items-center justify-center"
            style={{
              background: getConicGradient(),
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 3.5s cubic-bezier(0.15, 0.85, 0.15, 1)' : 'none',
              willChange: 'transform'
            }}
          >
            {/* Display Labels relative to segment slices */}
            {options.map((option, index) => {
              // Calculate cumulative midpoint angle based on un-even slice widths
              let prevDegrees = 0;
              for (let i = 0; i < index; i++) {
                prevDegrees += (((weights[i] || 0) / 100) * 360);
              }
              const currentDegrees = (((weights[index] || 0) / 100) * 360);
              const angle = prevDegrees + (currentDegrees / 2);

              return (
                <div
                  key={index}
                  className="absolute origin-center w-1/2 text-right pr-4 pointer-events-none text-on-surface font-sans font-bold text-[9px] md:text-[10px] select-none truncate"
                  style={{
                    left: '50%',
                    top: '50%',
                    transformOrigin: '0% 0%',
                    transform: `translate(-100%, -50%) rotate(${angle}deg)`,
                    maxWidth: '100px'
                  }}
                >
                  <span className="inline-block bg-white/80 px-1 py-0.5 rounded shadow-[0_1px_2px_rgba(0,0,0,0.1)] text-[#131b2e] rotate-[-9deg] max-w-[70px] truncate" title={`${option} (${weights[index]}%)`}>
                    {option} ({weights[index]}%)
                  </span>
                </div>
              );
            })}

            {/* Hub structure */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full z-10 shadow-md border-4 border-surface-container flex items-center justify-center">
              <div className="w-4 h-4 bg-gradient-to-br from-primary to-tertiary rounded-full shadow-inner animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Shadow base floor */}
        <div className="w-[180px] md:w-[240px] h-3 bg-on-surface/5 rounded-[100%] mt-4 blur-xs mix-blend-multiply"></div>
      </div>

      {/* Active Options Chips display */}
      {options.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 max-w-xl mb-4">
          {options.map((option, idx) => (
            <div
              key={idx}
              className="bg-[#eaedff] hover:bg-[#dae2fd] text-on-surface text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs border border-outline-variant/10 transition-all duration-200"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <span className="truncate max-w-[120px]">{option} ({weights[idx]}%)</span>
              <button
                type="button"
                onClick={() => handleRemoveOption(idx)}
                className="text-outline hover:text-error transition-colors p-0.5 focus:outline-none cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs">
        <button
          onClick={handleSpin}
          disabled={isSpinning || options.length < 2}
          className="w-full flex-1 bg-gradient-to-r from-primary to-primary-container disabled:from-outline/30 disabled:to-outline/30 text-white font-sans font-bold text-xs py-3 rounded-xl shadow-[0px_4px_12px_rgba(70,72,212,0.15)] hover:shadow-md disabled:shadow-none hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 relative overflow-hidden group"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>{isSpinning ? 'Spinnin...' : 'Spin the Wheel!'}</span>
        </button>

        <button
          onClick={handleReset}
          disabled={isSpinning}
          className="w-full sm:w-auto px-4 py-3 border border-outline-variant/50 hover:border-primary text-outline bg-transparent hover:bg-primary/5 font-sans font-bold text-xs rounded-xl transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none"
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
