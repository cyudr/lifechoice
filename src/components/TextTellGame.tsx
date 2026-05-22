import React, { useState, useEffect } from 'react';
import { 
  Send, 
  AlertCircle, 
  Copy, 
  Check, 
  MessageSquare, 
  Sparkles, 
  Sliders, 
  User, 
  Smile, 
  FileText, 
  RefreshCw,
  Clock,
  ThumbsUp,
  Flame,
  HelpCircle
} from 'lucide-react';
import { DecisionHistoryEntry } from '../types';

interface TextTellGameProps {
  onSaveDecision: (entry: Omit<DecisionHistoryEntry, 'id' | 'timestamp'>) => void;
  onRequestTextHelp?: (
    scenario: string,
    situation: string,
    tone: string,
    style: string,
    emoji: string,
    length: string
  ) => Promise<string[]>;
  isAiLoading?: boolean;
}

const PRESET_SCENARIOS = [
  {
    title: "Saying NO to plans 🙅",
    prompt: "A friend asked me to go to a concert tonight, but I am exhausted and just want to sleep.",
    presets: [
      "Hey! Wish I could make it but I'm completely wiped out from this week. Have an amazing time though! 😴",
      "I'd love to go another time, but I need to sit this one out and recharge tonight. Hope you have fun!",
      "I am Currently in low-battery mode, and the charger is my couch. Please rock out twice as hard on my behalf! 🔋"
    ]
  },
  {
    title: "Answering weekend work 💼",
    prompt: "My direct report or manager asked if I can check some urgent files on Saturday morning.",
    presets: [
      "Sure, I can take a quick look around 10 AM, but I'll be off-grid for the rest of the day. Hope that works!",
      "I'll review these first thing on Monday morning when I start my shift. Thank you!",
      "Error 404: Saturday morning work capability not found. Just kidding—I'll handle this Monday!"
    ]
  },
  {
    title: "Replying to coffee date ☕",
    prompt: "We went on a nice coffee date yesterday and I want to send a cute but relaxed next day text.",
    presets: [
      "Hey! Just wanted to say I had a great time yesterday. Let's grab coffee again sometime soon! ☕",
      "Yesterday was wonderful. Let me know when you're free next week, I'd love to see you again.",
      "My coffee was 10/10 yesterday, but the conversation was easily an 11/10. Let's repeat soon?"
    ]
  },
  {
    title: "Canceling gym session 🏋️",
    prompt: "My personal trainer is expecting me, but I have absolutely zero physical motivation today.",
    presets: [
      "Hey! I need to reschedule our session today—not feeling 100% and need some recovery time. Thanks for understanding!",
      "Hey coach, I can't make it to our training session today. Let me know of any times you have open tomorrow!",
      "Gravity is feeling about 10x stronger today. Let's push our session back so I can actually survive the reps! 💀"
    ]
  },
  {
    title: "Asking to split check 🍕",
    prompt: "We had a dinner for a group of 6 people, and one person put down their card but we need to split it.",
    presets: [
      "Hey! Thanks so much for picking up the dinner tab yesterday. Let me know what my cut is and I'll Venmo ya!",
      "Hey everyone, let's tally up the split for last night so we can get our card holder squared away. Thanks!",
      "Behold, the scroll of culinary debts! Let me know my damage from last night's feast so I can settle up! 💸"
    ]
  }
];

export function TextTellGame({ onSaveDecision, onRequestTextHelp, isAiLoading }: TextTellGameProps) {
  const [selectedScenario, setSelectedScenario] = useState(PRESET_SCENARIOS[0]);
  const [customScenario, setCustomScenario] = useState("");
  
  // Mojo modifiers from generator
  const [activeTone, setActiveTone] = useState<'casual' | 'direct' | 'funny' | 'snarky' | 'flirty' | 'polite'>('casual');
  const [activeStyle, setActiveStyle] = useState<'normal' | 'gen_z' | 'corporate' | 'bro' | 'shakespearean'>('normal');
  const [activeEmoji, setActiveEmoji] = useState<'none' | 'few' | 'expressive'>('few');
  const [activeLength, setActiveLength] = useState<'short' | 'standard' | 'detailed'>('standard');

  const [decidedText, setDecidedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Sync initial text when preset changes or is loaded
  useEffect(() => {
    if (!aiSuggestions) {
      const idx = activeTone === 'casual' ? 0 : activeTone === 'direct' ? 1 : 2;
      setDecidedText(selectedScenario.presets[idx % selectedScenario.presets.length]);
    }
  }, [selectedScenario, activeTone]);

  const handleSelectScenario = (preset: typeof PRESET_SCENARIOS[0]) => {
    setSelectedScenario(preset);
    setCustomScenario("");
    setAiSuggestions(null);
    setAiError(null);
    setSaved(false);
    
    // Default draft
    const idx = activeTone === 'casual' ? 0 : activeTone === 'direct' ? 1 : 2;
    setDecidedText(preset.presets[idx % preset.presets.length]);
  };

  const handleGenerateAiText = async () => {
    if (!onRequestTextHelp) return;
    setAiError(null);
    setSaved(false);

    const txtScenario = selectedScenario.title;
    const txtSituation = customScenario.trim() || selectedScenario.prompt;

    try {
      const suggestions = await onRequestTextHelp(
        txtScenario,
        txtSituation,
        activeTone,
        activeStyle,
        activeEmoji,
        activeLength
      );
      if (suggestions && suggestions.length > 0) {
        setAiSuggestions(suggestions);
        setDecidedText(suggestions[0]); // Select first generated draft by default
      } else {
        throw new Error("Empty return array from Gemini");
      }
    } catch (e: any) {
      setAiError("AI composition is temporarily offline. Enjoying local models instead.");
      // Soft local presets fallback update based on activeTone
      const idx = activeTone === 'casual' ? 0 : activeTone === 'direct' ? 1 : 2;
      setDecidedText(selectedScenario.presets[idx % selectedScenario.presets.length]);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(decidedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Cute retro audio click
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch (_) {}
  };

  const handleSaveToLog = () => {
    if (!decidedText) return;

    onSaveDecision({
      gameType: 'text',
      title: `Reply: ${selectedScenario.title.split(' ')[0]} - "${(customScenario.trim() || selectedScenario.prompt).substring(0, 32)}..."`,
      result: decidedText,
      options: aiSuggestions || selectedScenario.presets
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);

    // Success sound chime
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.3);
        osc2.stop(ctx.currentTime + 0.3);
      }
    } catch (_) {}
  };

  return (
    <div id="mojo-layout-wrapper" className="w-full max-w-4xl mx-auto flex flex-col items-center flex-grow">
      
      {/* Visual Component Header */}
      <div className="text-center mb-6">
        <span className="font-sans font-extrabold text-[10px] tracking-wider text-primary uppercase bg-[#4648d4]/10 text-primary px-3 py-1 rounded-full inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 animate-spin" />
          <span>Gemini-Powered Chat Sparker</span>
        </span>
        <h2 className="font-display font-black text-2xl text-[#131b2e] mt-1.5">Chat Sparker Laboratory</h2>
        <p className="font-sans text-xs text-on-surface-variant max-w-md mx-auto mt-1 leading-relaxed">
          Overcoming texting paralysis instantly! Customize scenarios, tweak specific modifiers, and let Google Gemini compose highly witty or professional replies instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        
        {/* Left Column: Preset Selector & Custom Input details */}
        <div className="lg:col-span-4 bg-white border border-outline-variant/25 rounded-2xl p-4 flex flex-col gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
          
          {/* Preset list headers */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider font-sans block">1. Select Scenario Category</span>
            <div className="flex flex-col gap-1.5">
              {PRESET_SCENARIOS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectScenario(preset)}
                  className={`text-left p-2.5 rounded-xl font-sans text-xs font-semibold leading-snug transition-all flex items-center justify-between border ${
                    selectedScenario.title === preset.title && !customScenario
                      ? 'bg-primary/5 text-primary border-primary/35 shadow-xs'
                      : 'bg-surface hover:bg-slate-50 text-[#131b2e] border-outline-variant/10'
                  }`}
                >
                  <span>{preset.title}</span>
                  {selectedScenario.title === preset.title && !customScenario && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-outline-variant/10 pt-4 space-y-2">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider font-sans block">Or Describe Your Personal Spot</span>
            <textarea
              value={customScenario}
              onChange={(e) => {
                setCustomScenario(e.target.value);
                setSaved(false);
              }}
              placeholder="e.g. Cancelling lunch with my cousin last-minute because my cat needs a nail-trim appointment..."
              className="w-full bg-slate-50 border border-outline-variant/20 rounded-xl p-3 font-sans text-xs text-on-surface placeholder:text-outline/70 focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none resize-none h-20 transition-all"
            />
          </div>

          {/* Core AI request trigger */}
          <button
            disabled={isAiLoading}
            onClick={handleGenerateAiText}
            className="w-full py-3 bg-[#131b2e] hover:bg-black text-white font-sans font-bold text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            {isAiLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Gemini is Composing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Generate Smart replies 🚀</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Key Modifiers & Real-time suggestion board */}
        <div className="lg:col-span-8 bg-white border border-outline-variant/25 rounded-2xl p-5 shadow-xs flex flex-col gap-5">
          
          {/* Mojo Generator Modifiers Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/10">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-primary" />
                <span className="font-display font-extrabold text-xs uppercase tracking-wider text-[#131b2e]">Mojo Tone & Vibe Modifiers</span>
              </div>
            </div>

            {/* Modifier Row 1: Tone Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-outline uppercase tracking-widest font-mono">Tone Mood</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{activeTone}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-slate-50 p-1.5 border border-outline-variant/15 rounded-xl">
                {(['casual', 'direct', 'funny', 'snarky', 'flirty', 'polite'] as const).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => {
                      setActiveTone(tone);
                      setSaved(false);
                    }}
                    className={`text-[9.5px] font-bold font-sans uppercase tracking-wider py-1.5 rounded-lg transition-all ${
                      activeTone === tone
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-outline hover:text-[#131b2e] hover:bg-white/40'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Modifier Row 2: Vibe Style */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-outline uppercase tracking-widest font-mono">Slang Style</span>
                <span className="text-[10px] bg-[#eaedff] text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">{activeStyle.replace('_', ' ')}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-50 p-1.5 border border-outline-variant/15 rounded-xl">
                {([
                  { id: 'normal', label: 'Standard' },
                  { id: 'gen_z', label: 'Gen-Z Cap' },
                  { id: 'corporate', label: 'Corp Bandwidth' },
                  { id: 'bro', label: 'Surfer Bro' },
                  { id: 'shakespearean', label: 'Shakespear' }
                ] as const).map((sty) => (
                  <button
                    key={sty.id}
                    onClick={() => {
                      setActiveStyle(sty.id);
                      setSaved(false);
                    }}
                    className={`text-[9.5px] font-bold font-sans uppercase tracking-wider py-1.5 rounded-lg transition-all ${
                      activeStyle === sty.id
                        ? 'bg-[#131b2e] text-white shadow-xs'
                        : 'text-outline hover:text-[#131b2e] hover:bg-white/40'
                    }`}
                  >
                    {sty.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modifier Row 3: Emoji Quantity & Length limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Emoji Intensity */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-outline uppercase tracking-widest font-mono block">Emoji Intensity</span>
                <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 border border-outline-variant/15 rounded-xl">
                  {([
                    { id: 'none', label: 'None ❌' },
                    { id: 'few', label: 'Few 👍' },
                    { id: 'expressive', label: 'Expressive 🔥' }
                  ] as const).map((em) => (
                    <button
                      key={em.id}
                      onClick={() => {
                        setActiveEmoji(em.id);
                        setSaved(false);
                      }}
                      className={`text-[9.5px] font-bold font-sans py-1.5 rounded-lg transition-all ${
                        activeEmoji === em.id
                          ? 'bg-white border text-primary font-extrabold border-outline-variant/20 shadow-xxs'
                          : 'text-outline hover:text-[#131b2e]'
                      }`}
                    >
                      {em.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length Limit */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-outline uppercase tracking-widest font-mono block">Response Length</span>
                <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 border border-outline-variant/15 rounded-xl">
                  {([
                    { id: 'short', label: 'Short ⚡' },
                    { id: 'standard', label: 'Standard 📝' },
                    { id: 'detailed', label: 'Detailed 💬' }
                  ] as const).map((len) => (
                    <button
                      key={len.id}
                      onClick={() => {
                        setActiveLength(len.id);
                        setSaved(false);
                      }}
                      className={`text-[9.5px] font-bold font-sans py-1.5 rounded-lg transition-all ${
                        activeLength === len.id
                          ? 'bg-white border text-primary font-extrabold border-outline-variant/20 shadow-xxs'
                          : 'text-outline hover:text-[#131b2e]'
                      }`}
                    >
                      {len.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Current Live Context Display */}
          <div className="p-3 bg-neutral-50/70 border border-slate-100 rounded-xl flex items-start gap-2.5">
            <span className="text-[10px] font-extrabold text-[#131b2e] bg-slate-150 px-1.5 py-0.5 rounded uppercase font-mono tracking-wider shrink-0 mt-0.5">Context</span>
            <p className="text-[11px] text-[#4f5b76] font-medium font-sans leading-relaxed italic line-clamp-2">
              "{customScenario.trim() || selectedScenario.prompt}"
            </p>
          </div>

          {/* Gemini Suggested Output display wrapper */}
          <div className="space-y-4">
            
            {/* Primary Suggested Response board */}
            <div className="bg-[#4648d4]/5 rounded-2xl p-5 border border-primary/10 flex flex-col gap-2 relative group min-h-[90px] justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-bold text-primary tracking-widest uppercase font-mono flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                  <span>Primary Suggested Reply</span>
                </span>
                
                {aiSuggestions && (
                  <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    Composed by Gemini
                  </span>
                )}
              </div>

              <p className="font-sans font-extrabold text-sm leading-relaxed text-[#131b2e] pr-20 my-2 transition-all">
                {decidedText}
              </p>

              {/* Action Buttons inside target */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleCopyText}
                  className="px-3.5 py-2 bg-white text-[#131b2e] border border-outline-variant/30 hover:border-primary/50 text-[10.5px] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xxs cursor-pointer"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-primary" />
                      <span>Copy Reply</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSaveToLog}
                  className={`px-3.5 py-2 text-[10.5px] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xxs cursor-pointer ${
                    saved 
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-[#131b2e] text-white hover:bg-black'
                  }`}
                  title="Save reply to lab history log"
                >
                  {saved ? (
                    <>
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Saved in Log!</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>Log Decision</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Alternating drafts selection block */}
            {aiSuggestions && aiSuggestions.length > 1 && (
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider block">Alternative compositions of this mojo</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aiSuggestions.slice(1).map((suggestion, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setDecidedText(suggestion);
                        setSaved(false);
                      }}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-150/60 rounded-xl cursor-pointer transition-all hover:border-primary/25 hover:shadow-xxs relative flex flex-col justify-between"
                    >
                      <p className="font-sans font-semibold text-xs text-[#2e3c54] leading-relaxed select-all">
                        "{suggestion}"
                      </p>
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/40 text-[9px] text-[#8494b1] font-bold uppercase tracking-wider">
                        <span>Draft Version {idx + 2}</span>
                        <span className="text-primary hover:underline">Select as primary</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiError && (
              <div className="p-3 bg-red-50 text-red-700 text-[11px] rounded-xl flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
