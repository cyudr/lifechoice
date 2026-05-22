import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { playDiceRoll, playSuccessChime } from '../lib/audio';
import { DecisionHistoryItem } from '../types';

interface MagicBallProps {
  onAddHistory: (item: Omit<DecisionHistoryItem, 'id' | 'timestamp'>) => void;
  onAskAI: (question: string) => Promise<string>;
}

const CLASSIC_ANSWERS = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful."
];

export default function MagicBall({ onAddHistory, onAskAI }: MagicBallProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const askBall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsShaking(true);
    setAnswer(null);
    setErrorMsg(null);
    
    // Play multiple roll-ticks as liquid shaking sounds
    const playShakeInterval = setInterval(() => {
      playDiceRoll();
    }, 120);

    // Stop shaking sound after 900ms
    setTimeout(() => {
      clearInterval(playShakeInterval);
    }, 900);

    if (useAI) {
      setLoading(true);
      try {
        // Run shake animation for at least 1 second while loading AI
        const [aiResult] = await Promise.all([
          onAskAI(question),
          new Promise((resolve) => setTimeout(resolve, 1200)) // delay to align animations
        ]);
        
        setAnswer(aiResult);
        playSuccessChime();
        setIsShaking(false);
        setLoading(false);

        onAddHistory({
          type: 'ball',
          title: 'Magic Oracle',
          result: `Asked: "${question}" -> Answer: "${aiResult}"`
        });
      } catch (err: any) {
        console.error("Failed asking AI:", err);
        // Fall back gracefully to classic
        const randomIndex = Math.floor(Math.random() * CLASSIC_ANSWERS.length);
        const fallbackAnswer = CLASSIC_ANSWERS[randomIndex];
        setAnswer(fallbackAnswer);
        setErrorMsg("Could not reach Cosmic AI. Fell back to Classic Oracle.");
        playSuccessChime();
        setIsShaking(false);
        setLoading(false);

        onAddHistory({
          type: 'ball',
          title: 'Magic Oracle (Classic Fallback)',
          result: `Asked: "${question}" -> Answer: "${fallbackAnswer}"`
        });
      }
    } else {
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * CLASSIC_ANSWERS.length);
        const resultAnswer = CLASSIC_ANSWERS[randomIndex];
        setAnswer(resultAnswer);
        playSuccessChime();
        setIsShaking(false);

        onAddHistory({
          type: 'ball',
          title: 'Magic Oracle (Classic)',
          result: `Asked: "${question}" -> Answer: "${resultAnswer}"`
        });
      }, 1200);
    }
  };

  return (
    <div id="magic-ball-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[460px]">
      {/* Left panel: Input controls */}
      <form onSubmit={askBall} className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-4.5 h-4.5 text-indigo-500" />
          Consult the Oracle
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Type any yes/no question. Traditional 8-Balls provide pre-set responses, while the AI smart oracle delivers clever, custom guidance.
        </p>

        <div className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Ask Your Yes/No Question
            </label>
            <input
              type="text"
              id="oracle-question-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Should I travel this weekend?"
              maxLength={100}
              disabled={isShaking || loading}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-[11px] font-bold text-slate-700">AI Cosmic Insights</span>
              <span className="text-[10px] text-slate-400 truncate">Sassy, custom responses using Gemini</span>
            </div>
            <button
              type="button"
              id="toggle-ai-oracle"
              onClick={() => setUseAI(!useAI)}
              disabled={isShaking || loading}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                useAI ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform duration-200 ${
                  useAI ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          type="submit"
          id="oracle-submit"
          disabled={isShaking || loading || !question.trim()}
          className="w-full text-xs font-semibold bg-slate-900 hover:bg-slate-850 py-3 px-4 rounded-xl text-white transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-45"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Sifting Cosms...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Shake Oracle Ball
            </>
          )}
        </button>

        {errorMsg && (
          <div className="flex items-start gap-2 text-amber-600 bg-amber-50 rounded-xl p-3 border border-amber-105">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="text-[10.5px] leading-relaxed font-semibold">{errorMsg}</span>
          </div>
        )}
      </form>

      {/* Right panel: Mystic floating 8-Ball */}
      <div className="lg:col-span-8 flex flex-col items-center justify-center bg-slate-950 rounded-3xl p-6 relative min-h-[400px] overflow-hidden">
        {/* Particle/glowing orb backing */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          id="magic-8ball-sphere"
          className="relative w-64 h-64 md:w-72 md:h-72 rounded-full bg-gradient-to-br from-slate-800 via-slate-950 to-neutral-900 border border-slate-800/80 shadow-[inset_0_20px_40px_rgba(255,255,255,0.15),0_15px_35px_rgba(0,0,0,0.6)] flex items-center justify-center select-none"
          animate={isShaking ? {
            x: [0, -12, 12, -8, 8, -5, 5, 0],
            y: [0, 8, -8, 6, -6, 4, -4, 0]
          } : {
            y: [0, -6, 0] // subtle floating hover effect
          }}
          transition={isShaking ? {
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut"
          } : {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Sphere light sheen highlight */}
          <div className="absolute top-4 left-10 right-10 h-10 bg-gradient-to-b from-white/20 to-transparent rounded-full filter blur-[1px]" />

          {/* Inner viewing window */}
          <div className="w-36 h-36 rounded-full bg-gradient-to-b from-slate-900 to-black border-[5px] border-slate-800 flex items-center justify-center overflow-hidden shadow-inner relative">
            
            <AnimatePresence mode="wait">
              {isShaking ? (
                // Shaking liquid bubble
                <motion.div
                  key="shaking"
                  className="w-16 h-16 rounded-full bg-indigo-500/10 filter blur-sm"
                  animate={{ scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 0.4, repeat: Infinity }}
                />
              ) : answer ? (
                // The glowing triangular oracle answer
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="w-full h-full flex items-center justify-center p-4 text-center relative"
                >
                  <svg className="absolute inset-0 w-full h-full p-2 text-indigo-650 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" viewBox="0 0 100 100" fill="currentColor">
                    <polygon points="50,15 90,80 10,80" />
                  </svg>
                  <div className="relative z-10 text-white font-bold leading-tight px-1 text-[11px] max-w-[85px] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex items-center justify-center h-full pt-4">
                    {answer}
                  </div>
                </motion.div>
              ) : (
                // Standard '8' face when idle
                <motion.div
                  key="idle-face"
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="text-3xl font-black text-slate-950 font-mono">8</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Outer instruction text */}
        <div className="mt-6 text-center text-slate-500 text-xs">
          {isShaking ? (
            <span className="animate-pulse flex items-center gap-1">✨ Sifting cosmic pathways...</span>
          ) : (
            <span>Ask a question and shake the 8-Ball to reveal your answers.</span>
          )}
        </div>
      </div>
    </div>
  );
}
