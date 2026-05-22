import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Plus, Trash2, HelpCircle as CardIcon, RefreshCw, Eye } from 'lucide-react';
import { playTick, playSuccessChime } from '../lib/audio';
import { DecisionHistoryItem } from '../types';

interface DecisionCardsProps {
  onAddHistory: (item: Omit<DecisionHistoryItem, 'id' | 'timestamp'>) => void;
}

const SHIELD_COLORS = ['indigo', 'emerald', 'amber', 'rose', 'sky'];

export default function DecisionCards({ onAddHistory }: DecisionCardsProps) {
  const [options, setOptions] = useState<string[]>(['Pizza Night', 'Watch Comedy', 'Read Science Book']);
  const [newOption, setNewOption] = useState('');
  const [cards, setCards] = useState<{ value: string; isFlipped: boolean; index: number }[]>(() => 
    ['Pizza Night', 'Watch Comedy', 'Read Science Book'].map((v, i) => ({ value: v, isFlipped: false, index: i }))
  );
  const [revealedResult, setRevealedResult] = useState<string | null>(null);

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOption.trim()) {
      const updated = [...options, newOption.trim()];
      setOptions(updated);
      setNewOption('');
      scrambleCards(updated);
    }
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length > 2) {
      const updated = options.filter((_, i) => i !== idx);
      setOptions(updated);
      scrambleCards(updated);
    }
  };

  const scrambleCards = (activeOpts = options) => {
    setRevealedResult(null);
    // Shuffle algorithm
    const shuffled = [...activeOpts]
      .map((value, originalIndex) => ({ value, sort: Math.random(), originalIndex }))
      .sort((a, b) => a.sort - b.sort)
      .map((item, idx) => ({
        value: item.value,
        isFlipped: false,
        index: idx
      }));

    playTick();
    setCards(shuffled);
  };

  const handleFlipCard = (index: number) => {
    if (revealedResult || cards[index].isFlipped) return;

    // Flip chosen card
    const updated = [...cards];
    updated[index].isFlipped = true;
    setCards(updated);
    
    const wonValue = cards[index].value;
    setRevealedResult(wonValue);
    playSuccessChime();

    onAddHistory({
      type: 'card',
      title: 'Secret Card Draw',
      result: wonValue
    });
  };

  return (
    <div id="decision-cards-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Panel: Options Editor */}
      <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <CardIcon className="w-4.5 h-4.5 text-indigo-500" />
          Assign Card Choices
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Type the custom options below. They will be scrambled face-down. You pick one to reveal the surprise!
        </p>

        <form onSubmit={handleAddOption} className="flex gap-2">
          <input
            type="text"
            id="card-option-input"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            placeholder="Add card value..."
            maxLength={26}
            className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            id="add-card-option-btn"
            disabled={!newOption.trim()}
            className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-40 transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
          {options.map((option, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 group-card"
            >
              <span className="text-xs font-semibold text-slate-700 truncate">{option}</span>
              <button
                type="button"
                id={`remove-card-option-${idx}`}
                onClick={() => handleRemoveOption(idx)}
                disabled={options.length <= 2}
                className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:hidden transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <button
          id="reshuffle-cards-btn"
          onClick={() => scrambleCards()}
          className="w-full py-2.5 border border-slate-200 text-slate-500 hover:text-slate-850 active:scale-98 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Shuffle & Reset Cards
        </button>
      </div>

      {/* Right Panel: Cards Matrix */}
      <div className="lg:col-span-8 flex flex-col items-center justify-center bg-slate-50/60 rounded-3xl p-6 border border-slate-100/80 min-h-[400px]">
        
        {/* Shuffle & draw dashboard area */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-6 w-full max-w-lg">
          <AnimatePresence mode="popLayout text-center">
            {cards.map((card, idx) => {
              const themeColor = SHIELD_COLORS[card.index % SHIELD_COLORS.length];
              
              return (
                <motion.div
                  key={`${card.value}-${idx}`}
                  layout
                  className="w-28 h-40 [perspective:1000px] cursor-pointer"
                  onClick={() => handleFlipCard(idx)}
                  whileHover={!revealedResult ? { y: -6 } : {}}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                >
                  <div
                    className="relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform shadow-md rounded-2xl"
                    style={{
                      transform: card.isFlipped ? 'rotateY(180deg)' : 'none'
                    }}
                  >
                    {/* CARD FACE DOWN: Radiant Indigo or colors with luxury symbols */}
                    <div 
                      style={{ backfaceVisibility: 'hidden' }}
                      className="absolute inset-0 bg-gradient-to-br from-indigo-550 via-indigo-600 to-indigo-700 border-4 border-white/90 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center p-3 select-none text-white overflow-hidden"
                    >
                      {/* Artistic watermarks */}
                      <div className="absolute top-1 right-2 opacity-10 text-3xl font-black">?</div>
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-indigo-200/45 flex items-center justify-center bg-indigo-500/10">
                        <CardIcon className="w-5 h-5 animate-pulse text-indigo-150" />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider mt-3 text-indigo-200">Draw Card</span>
                    </div>

                    {/* CARD FACE UP: White background with custom response content */}
                    <div 
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                      className="absolute inset-0 bg-white border-4 border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center p-3 text-slate-800"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2">
                        <Eye className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Chosen Response</span>
                      <p className="text-xs font-bold text-slate-750 line-clamp-3 mt-1.5 break-words">
                        "{card.value}"
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Dynamic status helper */}
        <div className="mt-8 text-center">
          {revealedResult ? (
            <div id="cards-winner-feedback" className="text-center">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-1">We Drawn This Secret Card!</span>
              <p className="text-lg font-bold text-slate-800">
                "{revealedResult}"
              </p>
              <button
                id="reset-drawn-cards"
                onClick={() => scrambleCards()}
                className="mt-4 px-6 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Shuffle & Try Again
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400">All choices scrambled face-down. Click on any card to flip and randomise!</p>
          )}
        </div>
      </div>
    </div>
  );
}
