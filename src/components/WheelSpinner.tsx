import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Plus, Trash2, RotateCcw, Award, Sparkles, 
  ChevronRight, Compass, Save, RefreshCw, Volume2, VolumeX 
} from 'lucide-react';
import { playTick, playSuccessChime, toggleMute, getMuteState } from '../lib/audio';
import { DecisionHistoryItem } from '../types';

interface WheelSpinnerProps {
  onAddHistory: (item: Omit<DecisionHistoryItem, 'id' | 'timestamp'>) => void;
  presetOptions?: string[];
  aiOptions?: string[];
  onTriggerAI: (category: string) => Promise<string[]>;
}

const DEFAULT_OPTIONS = [
  'Sushi',
  'Tacos & Quesadillas',
  'Italian Pasta',
  'Green Garden Salad',
  'Juicy Gourmet Burger',
  'Thai Spicy Curry',
  'Hot Pizza Slice',
  'Flavorful Ramen'
];

const PRESETS = [
  { name: "🍽️ What to Eat", options: ["Sushi", "Pizza", "Burgers", "Salad", "Pasta", "Tacos", "Thai", "Ramen"] },
  { name: "🍿 Movie Genre", options: ["Sci-Fi Adventure", "Comedy Gold", "Chilling Horror", "Sweet Romance", "Thrilling Action", "Documentary"] },
  { name: "🏋️ Exercise Today", options: ["30m Run", "Yoga & Stretch", "Full Body HIIT", "Weight Lifting", "Brisk Walk", "Rest Day"] },
  { name: "🧹 Quick Chores", options: ["Wash Dishes", "Vacuum Living Room", "Do Laundry", "Clean Bathroom", "Take Out Trash", "Dust Surfaces"] },
  { name: "🎮 Fun Activities", options: ["Play Video Games", "Read an Inspiring Book", "Watch a Classic Movie", "Go for a Hike", "Practice Hobby", "Meditation"] }
];

export default function WheelSpinner({ onAddHistory, onTriggerAI }: WheelSpinnerProps) {
  const [options, setOptions] = useState<string[]>(DEFAULT_OPTIONS);
  const [newOption, setNewOption] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [muted, setMuted] = useState(getMuteState());
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCategory, setAiCategory] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const wheelRef = useRef<SVGSVGElement>(null);
  const prevAngleRef = useRef(0);

  // Audio mute toggle
  const handleToggleMute = () => {
    const newState = toggleMute();
    setMuted(newState);
  };

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOption.trim()) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
      setWinner(null);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const updated = options.filter((_, i) => i !== index);
      setOptions(updated);
      setWinner(null);
    }
  };

  const handleLoadPreset = (presetOptions: string[]) => {
    setOptions(presetOptions);
    setWinner(null);
  };

  // AI Generation Proxy Client
  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiCategory.trim()) return;
    setAiLoading(true);
    try {
      const suggestions = await onTriggerAI(aiCategory);
      if (suggestions && suggestions.length > 0) {
        setOptions(suggestions);
        setWinner(null);
        setAiCategory('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // Sound triggering during spinning
  useEffect(() => {
    if (!isSpinning) return;

    let animationFrameId: number;
    const totalDuration = 5000; // 5 seconds spin matching transition
    const startTime = performance.now();
    const finalAngle = rotation;
    const startAngle = prevAngleRef.current;
    const diff = finalAngle - startAngle;

    const tickAngle = 360 / options.length;
    let lastTickIndex = Math.floor(startAngle / tickAngle);

    // Easing cubicOut to simulate friction deceleration
    function easeOutCubic(t: number): number {
      return 1 - Math.pow(1 - t, 3);
    }

    const checkTicker = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      const currentAngle = startAngle + diff * easeOutCubic(progress);

      const currentTickIndex = Math.floor(currentAngle / tickAngle);
      if (currentTickIndex !== lastTickIndex) {
        playTick();
        lastTickIndex = currentTickIndex;
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(checkTicker);
      }
    };

    animationFrameId = requestAnimationFrame(checkTicker);
    return () => cancelAnimationFrame(animationFrameId);
  }, [rotation, isSpinning, options.length]);

  const spin = () => {
    if (isSpinning || options.length === 0) return;

    setIsSpinning(true);
    setWinner(null);
    setShowConfetti(false);

    // Ensure audio gesture initialization
    playTick();

    const minSpins = 5;
    const maxSpins = 8;
    const additionalDegrees = Math.random() * 360;
    const totalSpinDegrees = (Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins) * 360 + additionalDegrees;
    
    const targetRotation = rotation + totalSpinDegrees;
    prevAngleRef.current = rotation % 360;
    setRotation(targetRotation);

    setTimeout(() => {
      setIsSpinning(false);
      
      // Calculate selected segment
      // The spinner needle points globally at the top (270 degrees)
      const finalNormalizedAngle = (360 - (targetRotation % 360)) % 360;
      const segmentAngle = 360 / options.length;
      
      // Offset by half segment to index alignment
      const winningIndex = Math.floor(((finalNormalizedAngle + 90) % 360) / segmentAngle);
      const wonOption = options[winningIndex] || options[0];
      
      setWinner(wonOption);
      setShowConfetti(true);
      playSuccessChime();

      // Add to global decision history
      onAddHistory({
        type: 'wheel',
        title: 'Spin the Wheel',
        result: wonOption
      });
    }, 5000);
  };

  const getSlicePath = (total: number) => {
    const radius = 150;
    const cx = 150;
    const cy = 150;
    const angleRad = (360 / total) * (Math.PI / 180);
    
    const startAngle = -angleRad / 2;
    const endAngle = angleRad / 2;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    // If slice angle > 180 (like N = 1), set largeArcFlag
    const largeArcFlag = angleRad > Math.PI ? 1 : 0;

    return `M ${cx},${cy} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2} Z`;
  };

  // Color generator
  const getSliceColor = (index: number, total: number) => {
    const hues = [210, 140, 330, 45, 15, 275, 190, 80];
    const hue = hues[index % hues.length];
    // Warm refined visual tone
    return `hsl(${hue}, 85%, 62%)`;
  };

  return (
    <div id="wheel-spinner-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left panel: Customizer & presets */}
      <div className="lg:col-span-4 space-y-6">
        {/* Preset selections */}
        <div id="wheel-presets-card" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-500" />
            Decision Themes
          </h3>
          <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                id={`preset-btn-${preset.name.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => handleLoadPreset(preset.options)}
                disabled={isSpinning}
                className="text-xs text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 active:scale-98 transition-all font-medium text-slate-700 flex items-center justify-between group"
              >
                <span>{preset.name}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        {/* AI Suggestions Box */}
        <div id="wheel-ai-card" className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-sm font-semibold flex items-center gap-2 text-indigo-400 mb-2">
            <Sparkles className="w-4 h-4" />
            AI Smart Suggestions
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">
            Stuck? Let Gemini craft a curated set of choices for you instantly.
          </p>
          <form onSubmit={handleAIGenerate} className="space-y-2">
            <div className="relative">
              <input
                type="text"
                id="ai-category-input"
                value={aiCategory}
                onChange={(e) => setAiCategory(e.target.value)}
                placeholder="e.g. Unique team outings, Chill games..."
                disabled={aiLoading || isSpinning}
                className="w-full text-xs bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 px-3 block focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
              />
            </div>
            <button
              type="submit"
              id="ai-generate-submit"
              disabled={aiLoading || !aiCategory.trim() || isSpinning}
              className="w-full text-xs font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white py-2.5 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2 active:scale-98 cursor-pointer shadow-lg shadow-indigo-500/20 disabled:shadow-none"
            >
              {aiLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  Crafting Choices...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate with Gemini
                </>
              )}
            </button>
          </form>
        </div>

        {/* Active Options Editor */}
        <div id="wheel-options-card" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-500" />
              Customize Wheel ({options.length})
            </h3>
            <button
              id="clear-wheel-btn"
              onClick={() => { setOptions([]); setWinner(null); }}
              disabled={isSpinning || options.length <= 2}
              className="text-[11px] text-slate-400 hover:text-red-500 disabled:opacity-50 transition cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>

          <form onSubmit={handleAddOption} className="flex gap-2">
            <input
              type="text"
              id="custom-option-input"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="Add choice..."
              maxLength={24}
              disabled={isSpinning}
              className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300"
            />
            <button
              type="submit"
              id="add-option-btn"
              disabled={isSpinning || !newOption.trim()}
              className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-40 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
            {options.map((option, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 group hover:shadow-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: getSliceColor(idx, options.length) }}
                  />
                  <span className="text-xs font-semibold text-slate-700 truncate">{option}</span>
                </div>
                <button
                  type="button"
                  id={`remove-option-${idx}`}
                  onClick={() => handleRemoveOption(idx)}
                  disabled={isSpinning || options.length <= 2}
                  className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:hidden transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel: Wheel Render & Winner Result */}
      <div className="lg:col-span-8 flex flex-col items-center justify-center min-h-[500px] border border-slate-100/80 bg-slate-50/60 rounded-3xl p-6 relative">
        {/* Toggle Sound */}
        <button
          id="toggle-mute-wheel"
          onClick={handleToggleMute}
          className="absolute top-4 right-4 p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition active:scale-95 cursor-pointer shadow-sm"
          title={muted ? "Unmute" : "Mute Sound"}
        >
          {muted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
        </button>

        {/* The Spin Needle/Pointer & Circle */}
        <div className="relative w-80 h-80 flex items-center justify-center md:w-[350px] md:h-[350px]">
          {/* Wheel Shadow Cover */}
          <div className="absolute inset-0 rounded-full border-[10px] border-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] pointer-events-none z-10" />

          {/* Pointer needle indicator */}
          <div className="absolute top-[-14px] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <svg width="28" height="34" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Distinct red marker */}
              <path d="M14 34L28 6C28 2.68629 25.3137 0 22 0H6C2.68629 0 0 2.68629 0 6L14 34Z" fill="#ef4444" />
              <circle cx="14" cy="10" r="4" fill="white" />
            </svg>
          </div>

          {/* Wheel Graphic */}
          <motion.svg
            ref={wheelRef}
            id="wheel-svg-canvas"
            viewBox="0 0 300 300"
            className="w-full h-full rounded-full origin-center cursor-pointer select-none"
            style={{ transformOrigin: '150px 150px' }}
            animate={{ rotate: rotation }}
            transition={{
              duration: isSpinning ? 5 : 0,
              ease: [0.15, 0.85, 0.35, 1], // satisfying frictionless crawl-to-halt
            }}
            onClick={spin}
          >
            {options.map((option, idx) => {
              const angle = 360 / options.length;
              return (
                <g
                  key={idx}
                  transform={`rotate(${idx * angle}, 150, 150)`}
                  className="origin-center"
                >
                  <path
                    d={getSlicePath(options.length)}
                    fill={getSliceColor(idx, options.length)}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {/* Option Text Placement */}
                  <g transform={`rotate(${angle / 2}, 150, 150)`}>
                    <text
                      x="230"
                      y="153"
                      transform={`rotate(180, 230, 153)`}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontWeight="bold"
                      fontSize={options.length > 8 ? "9px" : "11px"}
                      className="select-none tracking-wide"
                      style={{ filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.4))" }}
                    >
                      {option.length > 15 ? `${option.substring(0, 13)}...` : option}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Hub design */}
            <circle cx="150" cy="150" r="22" fill="#ffffff" shadow-sm="true" />
            <circle cx="150" cy="150" r="16" fill="#1e293b" />
            <circle cx="150" cy="150" r="4" fill="#ffffff" />
          </motion.svg>
        </div>

        {/* Spin Instruction/Trigger */}
        <div className="mt-8 text-center">
          <button
            id="spin-wheel-trigger"
            onClick={spin}
            disabled={isSpinning || options.length === 0}
            className="px-8 py-3.5 bg-slate-900 hover:bg-slate-850 active:scale-95 disabled:opacity-40 text-sm font-semibold text-white rounded-full transition shadow-lg shadow-slate-900/15 cursor-pointer flex items-center gap-2 font-mono uppercase tracking-wider"
          >
            <Play className="w-4.5 h-4.5" />
            Spin the Wheel
          </button>
        </div>

        {/* Decisive Winner Popup */}
        <AnimatePresence>
          {winner && (
            <motion.div
              id="winner-overlay-card"
              initial={{ scale: 0.85, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 15 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 shadow-2xl border border-slate-100/90 text-center max-w-sm w-[90%] z-30"
            >
              <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3">
                <Award className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">
                The Wheel Has Decided
              </p>
              <h4 className="text-xl font-bold text-slate-800 break-words mb-4 px-2">
                "{winner}"
              </h4>
              <div className="flex gap-2">
                <button
                  id="winner-dismiss-btn"
                  onClick={() => setWinner(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 outline-none text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl transition"
                >
                  Dismiss
                </button>
                <button
                  id="winner-respin-btn"
                  onClick={() => { setWinner(null); spin(); }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 outline-none text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-500/10 transition"
                >
                  Spin Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
