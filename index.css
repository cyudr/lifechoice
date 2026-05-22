import React, { useState } from 'react';
import { Send, FileText, AlertCircle, Copy, Check, MessageSquare, HelpCircle, ShieldQuestion } from 'lucide-react';
import { DecisionHistoryEntry } from '../types';

interface TextTellGameProps {
  onSaveDecision: (entry: Omit<DecisionHistoryEntry, 'id' | 'timestamp'>) => void;
  onRequestTextHelp?: (scenario: string, tone: string) => Promise<string[]>;
  isAiLoading?: boolean;
}

const PRESET_SCENARIOS = [
  {
    title: "Saying NO to plans",
    prompt: "A friend asked me to go to a concert tonight, but I am exhausted and just want to sleep.",
    presets: {
      casual: "Hey! Wish I could make it but I'm completely wiped out from this week. Have an amazing time though! 😴",
      direct: "I'd love to go another time, but I need to sit this one out and recharge tonight. Hope you have fun!",
      funny: "I am Currently in low-battery mode, and the charger is my couch. Please rock out twice as hard on my behalf! 🔋"
    }
  },
  {
    title: "Answering a weekend work ask",
    prompt: "My direct report or manager asked if I can check some urgent files on Saturday morning.",
    presets: {
      casual: "Sure, I can take a quick look around 10 AM, but I'll be off-grid for the rest of the day. Hope that works!",
      direct: "I'll review these first thing on Monday morning when I start my shift. Thank you!",
      funny: "Error 404: Saturday morning work capability not found. Just kidding—I'll handle this Monday!"
    }
  },
  {
    title: "Replying to dating follow-up",
    prompt: "We went on a nice coffee date yesterday and I want to send a cute but relaxed next day text.",
    presets: {
      casual: "Hey! Just wanted to say I had a great time yesterday. Let's grab coffee again sometime soon! ☕",
      direct: "Yesterday was wonderful. Let me know when you're free next week, I'd love to see you again.",
      funny: "My coffee was 10/10 yesterday, but the conversation was easily an 11/10. Let's repeat soon?"
    }
  }
];

export function TextTellGame({ onSaveDecision, onRequestTextHelp, isAiLoading }: TextTellGameProps) {
  const [selectedScenario, setSelectedScenario] = useState(PRESET_SCENARIOS[0]);
  const [customScenario, setCustomScenario] = useState("");
  const [activeTone, setActiveTone] = useState<'casual' | 'direct' | 'funny'>('casual');
  const [decidedText, setDecidedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleSelectScenario = (preset: typeof PRESET_SCENARIOS[0]) => {
    setSelectedScenario(preset);
    setDecidedText(preset.presets[activeTone]);
    setCustomScenario("");
    setAiSuggestions(null);
    setAiError(null);
  };

  const handleToneChange = (tone: 'casual' | 'direct' | 'funny') => {
    setActiveTone(tone);
    if (!aiSuggestions) {
      setDecidedText(selectedScenario.presets[tone]);
    } else {
      const idx = tone === 'casual' ? 0 : tone === 'direct' ? 1 : 2;
      setDecidedText(aiSuggestions[idx % aiSuggestions.length]);
    }
  };

  const handleGenerateAiText = async () => {
    if (!onRequestTextHelp) return;
    setAiError(null);
    setAiSuggestions(null);

    const textToSubmit = customScenario.trim() || selectedScenario.prompt;
    try {
      const suggestions = await onRequestTextHelp(textToSubmit, activeTone);
      if (suggestions && suggestions.length > 0) {
        setAiSuggestions(suggestions);
        const idx = activeTone === 'casual' ? 0 : activeTone === 'direct' ? 1 : 2;
        setDecidedText(suggestions[idx % suggestions.length]);
        
        onSaveDecision({
          gameType: 'text',
          title: `Text solver: "${textToSubmit.substring(0, 30)}..."`,
          result: suggestions[idx % suggestions.length],
          options: suggestions
        });
      }
    } catch (e: any) {
      setAiError("AI suggestion failed. Falling back to preloaded templates.");
    }
  };

  const handleCopyText = () => {
    const textToCopy = decidedText || selectedScenario.presets[activeTone];
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gainSetting = ctx.createGain();
      osc.connect(gainSetting);
      gainSetting.connect(ctx.destination);
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gainSetting.gain.setValueAtTime(0.01, ctx.currentTime);
      gainSetting.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (_) {}
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center flex-grow">
      <div className="text-center mb-4">
        <span className="font-sans font-semibold text-[11px] tracking-wider text-primary uppercase">Instant Playful Mojo</span>
        <h2 className="font-display font-bold text-2xl text-on-surface mt-0.5">Chat Sparker</h2>
        <p className="font-sans text-xs text-on-surface-variant max-w-md mx-auto mt-1 leading-relaxed">
          Stuck on finding the perfect funny reply? Pick a scenario or write yours, choose a vibe, and let's craft instant text mojo for you!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl items-start mb-4">
        
        {/* Scenarios selection */}
        <div className="md:col-span-1 bg-white border border-outline-variant/30 rounded-2xl p-3 flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider font-sans mb-0.5">Pop Scenarios</span>
          {PRESET_SCENARIOS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectScenario(preset)}
              className={`text-left p-2.5 rounded-xl font-sans text-xs font-semibold leading-snug transition-all ${
                selectedScenario.title === preset.title && !customScenario
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-surface hover:bg-neutral-100 text-on-surface border border-transparent'
              }`}
            >
              {preset.title}
            </button>
          ))}
          
          <div className="border-t border-outline-variant/10 pt-2 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider font-sans">Custom situation</span>
            <textarea
              value={customScenario}
              onChange={(e) => setCustomScenario(e.target.value)}
              placeholder="e.g., Canceling gym session because my dog wants to cuddle..."
              className="w-full bg-surface-container-low border-0 outline-none rounded-xl p-2 font-sans text-xs text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-white resize-none h-14"
            />
            {onRequestTextHelp && (
              <button
                disabled={isAiLoading}
                onClick={handleGenerateAiText}
                className="w-full py-1.5 bg-gradient-to-r from-primary to-primary-container disabled:opacity-50 text-white font-sans font-bold text-[10px] uppercase tracking-wide rounded-lg flex items-center justify-center gap-1 shadow-xs focus:outline-none"
              >
                {isAiLoading ? 'AI Composing...' : 'Consult Chat Genie'}
              </button>
            )}
          </div>
        </div>

        {/* Tone and output panel */}
        <div className="md:col-span-2 bg-white border border-outline-variant/30 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/10">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="font-display font-bold text-xs text-on-surface">Mojo Generator</span>
            </div>
            
            {/* Tone pills switcher */}
            <div className="flex gap-1 bg-surface rounded-lg p-0.5 border border-outline-variant/20">
              {(['casual', 'direct', 'funny'] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => handleToneChange(tone)}
                  className={`text-[9px] font-bold font-sans uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${
                    activeTone === tone
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt context display */}
          <div className="p-2.5 bg-neutral-50 rounded-xl border border-outline-variant/10 flex items-start gap-2">
            <ShieldQuestion className="w-3.5 h-3.5 text-outline mt-0.5 animate-bounce" />
            <div>
              <span className="text-[10px] font-mono font-bold text-outline uppercase block">Current Context</span>
              <p className="text-[11px] text-on-surface-variant font-sans mt-0.5 leading-relaxed italic">
                "{customScenario.trim() || selectedScenario.prompt}"
              </p>
            </div>
          </div>

          {/* text code display output board */}
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex flex-col gap-2 relative group">
            <span className="text-[9px] font-bold text-primary tracking-widest uppercase font-mono">Suggested Reply</span>
            <p className="font-sans font-semibold text-xs leading-relaxed text-on-surface pr-8">
              {decidedText || selectedScenario.presets[activeTone]}
            </p>

            <button
              onClick={handleCopyText}
              className="absolute top-3 right-3 p-1.5 bg-white border border-outline-variant/30 hover:border-primary text-outline hover:text-primary rounded-lg shadow-xs transition-all active:scale-90"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {aiError && (
            <div className="p-2 bg-red-50 text-red-700 text-[11px] rounded-xl flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" />
              <span>{aiError}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-outline font-sans leading-relaxed">
              "No actual cell phones are connected here. Simply click, modify, and delight your crew!"
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
