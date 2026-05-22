import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Dices,
  HelpCircle,
  History,
  User,
  ArrowLeft,
  Flame,
  Heart,
  Users,
  Compass,
  Volume2,
  VolumeX,
  Bot
} from 'lucide-react';

import { GameType, DecisionHistoryEntry } from './types';
import { AdSenseBanner } from './components/AdSenseBanner';
import { SpinWheelGame } from './components/SpinWheelGame';
import { CoinFlipGame } from './components/CoinFlipGame';
import { FlowerPeelGame } from './components/FlowerPeelGame';
import { VibeCheckGame } from './components/VibeCheckGame';
import { LunchPollGame } from './components/LunchPollGame';
import { TextTellGame } from './components/TextTellGame';
import { HistoryPanel } from './components/HistoryPanel';
import { ProfileLayout } from './components/ProfileLayout';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<GameType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<DecisionHistoryEntry[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('decision_studio_history_v1');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Could not parse local history", e);
    }
  }, []);

  // Sync back to localStorage when history shifts
  const saveHistory = (newList: DecisionHistoryEntry[]) => {
    setHistory(newList);
    try {
      localStorage.setItem('decision_studio_history_v1', JSON.stringify(newList));
    } catch (e) {
      console.error("Could not write history to local storage", e);
    }
  };

  const handleSaveDecision = (entry: Omit<DecisionHistoryEntry, 'id' | 'timestamp'>) => {
    const formattedEntry: DecisionHistoryEntry = {
      ...entry,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [formattedEntry, ...history];
    saveHistory(updated);
  };

  const handleClearHistory = () => {
    saveHistory([]);
  };

  const handleClearAllUserData = () => {
    setHistory([]);
    localStorage.removeItem('decision_studio_history_v1');
    setActiveScreen('dashboard');
  };

  // Call server-side helper for Gemini completions
  const handleRequestAiSuggestions = async (promptType: string, count: number): Promise<string[]> => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptType, count })
      });
      const data = await res.json();
      if (data && data.options) {
        return data.options;
      }
      throw new Error("No suggestion field returned");
    } catch (e) {
      console.warn("API completions offline. Supplying offline standard options.");
      // Standard local backup fallback
      return ['Order Sushi 🍣', 'Have Tacos 🌮', 'Bake Pasta 🍝', 'Cook Burgers 🍔', 'Green Salad 🥗'];
    } finally {
      setAiLoading(false);
    }
  };

  // Call server-side helper for Gemini smart message reply
  const handleRequestTextHelp = async (scenario: string, tone: string): Promise<string[]> => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/texts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, tone })
      });
      const data = await res.json();
      if (data && data.texts) {
        return data.texts;
      }
      throw new Error("No replies suggestions field returned");
    } catch (e) {
      console.warn("API completions offline. Supplying templates.");
      return [
        "Hey! Wish I could make it but I'm completely wiped out. Enjoy! 😴",
        "Really wish I could go but I have to catch up on sleep tonight. Let's hang soon!",
        "Low battery alert! Tucking myself in with hot herbal tea. Have massive fun! 🔋"
      ];
    } finally {
      setAiLoading(false);
    }
  };

  // Sidebar or dashboard cards metadata
  const gameCards = [
    {
      id: 'wheel',
      title: 'Wheel',
      desc: 'For dividing custom choices.',
      icon: '🎡',
      tag: 'Wheel'
    },
    {
      id: 'coin',
      title: 'Coin',
      desc: 'For instant Yes / No splits.',
      icon: '🪙',
      tag: 'Coin'
    },
    {
      id: 'flower',
      title: 'Flower',
      desc: 'For validating internal hopes.',
      icon: '🌸',
      tag: 'Flower'
    },
    {
      id: 'text',
      title: 'Chat',
      desc: 'For drafting witty message replies.',
      icon: '💬',
      tag: 'Chat'
    },
    {
      id: 'vibe',
      title: 'Vibe',
      desc: 'For matching your energy styling.',
      icon: '🔮',
      tag: 'Vibe'
    },
    {
      id: 'poll',
      title: 'Poll',
      desc: 'For resolving team munchie wars.',
      icon: '🍔',
      tag: 'Poll'
    }
  ];

  // Filtering based on search queries
  const filteredGrid = gameCards.filter(card =>
    card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-surface text-on-surface font-sans min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-white pb-16 md:pb-6">
      
      {/* Dynamic Header Block */}
      <header className="fixed top-0 w-full h-14 z-50 backdrop-blur-md bg-surface/80 border-b border-outline-variant/10 flex items-center justify-between px-6 md:px-12 py-2 shadow-xs">
        <div className="flex items-center gap-3">
          {activeScreen !== 'dashboard' && (
            <button
              onClick={() => setActiveScreen('dashboard')}
              className="text-primary hover:bg-[#4648d4]/5 p-2 rounded-full transition-colors focus:outline-none"
              title="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveScreen('dashboard')}>
            <span className="w-6 h-6 rounded bg-primary flex items-center justify-center text-xs text-white uppercase tracking-wider font-display font-black shadow-xs">S</span>
            <span className="font-display font-extrabold text-[#131b2e] tracking-tight text-base">Arcade</span>
          </div>
        </div>

        {/* Responsive Desktop nav options - Icons + One-word text only */}
        <nav className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setActiveScreen('dashboard')}
            className={`flex items-center gap-1 font-sans font-extrabold text-xs py-1.5 px-3 rounded-xl transition-all ${
              activeScreen === 'dashboard' 
                ? 'bg-primary-container/10 text-primary' 
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Playground</span>
          </button>
          <button
            onClick={() => setActiveScreen('history')}
            className={`flex items-center gap-1 font-sans font-extrabold text-xs py-1.5 px-3 rounded-xl transition-all ${
              activeScreen === 'history' 
                ? 'bg-primary-container/10 text-primary' 
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
          <button
            onClick={() => setActiveScreen('profile')}
            className={`flex items-center gap-1 font-sans font-extrabold text-xs py-1.5 px-3 rounded-xl transition-all ${
              activeScreen === 'profile' 
                ? 'bg-primary-container/10 text-primary' 
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </nav>
      </header>

      {/* Main Canvas layout container */}
      <main className="flex-grow pt-16 px-6 md:px-12 max-w-2xl mx-auto w-full flex flex-col justify-between">
        
        {/* Render View Controller switcher */}
        <div className="w-full h-full flex flex-col justify-center">
          {activeScreen === 'dashboard' && (
            <div className="space-y-4 pb-4 transition-opacity duration-300">
              
              {/* Cover Banner title */}
              <div className="text-center py-1">
                <span className="font-sans font-semibold text-[10px] tracking-wider text-primary uppercase flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-[#4648d4] animate-pulse" />
                  <span>Interactive Chance Engine</span>
                </span>
                <h1 className="font-display font-black text-2xl text-[#131b2e] leading-tight tracking-tight mt-0.5">
                  Spark Arcade
                </h1>
                <p className="font-sans text-xs text-on-surface-variant max-w-md mx-auto mt-0.5 leading-relaxed">
                  Beautiful probability dashboards, magical coin models, and biometric scanning algorithms in a high-density, click-focused playground.
                </p>
                
                {/* Search bar alignment option */}
                <div className="relative max-w-xs mx-auto mt-2.5">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search arcade..."
                    className="w-full bg-white border border-outline-variant/30 rounded-full py-1.5 pl-8 pr-4 font-sans text-xs text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none shadow-xs transition-shadow"
                  />
                </div>
              </div>

              {/* Bento Compartment list groups - Icon Grid Form only, minimize scrolling, one-word titles */}
              {searchQuery && filteredGrid.length === 0 ? (
                <div className="text-center py-6 p-4 bg-white border border-dashed border-outline-variant/30 rounded-2xl">
                  <HelpCircle className="w-5 h-5 text-outline mx-auto mb-1" />
                  <h4 className="font-display font-semibold text-xs text-on-surface">No apps found</h4>
                </div>
              ) : (
                <div className="bg-white border border-outline-variant/20 rounded-3xl p-6 shadow-xs">
                  <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
                    {filteredGrid.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => setActiveScreen(card.id as any)}
                        className="flex flex-col items-center justify-center group cursor-pointer text-center"
                        title={card.desc}
                      >
                        {/* Circle Icon Container */}
                        <div className="w-16 h-16 rounded-full bg-surface-container-low border-2 border-outline-variant/10 group-hover:border-primary/30 group-hover:bg-[#eaedff] flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 shadow-xs transition-all duration-300">
                          {card.icon}
                        </div>
                        
                        {/* One-word Title */}
                        <span className="font-display font-black text-xs text-[#131b2e] group-hover:text-primary mt-2 transition-colors">
                          {card.tag}
                        </span>

                        {/* High-density visual indicator of mini-app role */}
                        <span className="text-[9px] text-outline font-sans mt-0.5 line-clamp-1 max-w-[80px] opacity-75">
                          {card.desc.split(" ").slice(-2).join(" ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Intertwined elegant AdSense slot to minimize scrolling */}
              <div className="py-1">
                <AdSenseBanner />
              </div>

            </div>
          )}

          {activeScreen === 'wheel' && (
            <SpinWheelGame
              onSaveDecision={handleSaveDecision}
              onRequestSuggestions={handleRequestAiSuggestions}
              isAiLoading={aiLoading}
            />
          )}

          {activeScreen === 'coin' && (
            <CoinFlipGame onSaveDecision={handleSaveDecision} />
          )}

          {activeScreen === 'flower' && (
            <FlowerPeelGame onSaveDecision={handleSaveDecision} />
          )}

          {activeScreen === 'vibe' && (
            <VibeCheckGame onSaveDecision={handleSaveDecision} />
          )}

          {activeScreen === 'poll' && (
            <LunchPollGame onSaveDecision={handleSaveDecision} />
          )}

          {activeScreen === 'text' && (
            <TextTellGame
              onSaveDecision={handleSaveDecision}
              onRequestTextHelp={handleRequestTextHelp}
              isAiLoading={aiLoading}
            />
          )}

          {activeScreen === 'history' && (
            <HistoryPanel
              history={history}
              onClearHistory={handleClearHistory}
              onSelectGame={(g) => setActiveScreen(g)}
            />
          )}

          {activeScreen === 'profile' && (
            <ProfileLayout
              history={history}
              onClearAllUserData={handleClearAllUserData}
            />
          )}
        </div>

        {/* Dynamic Ad Placement Block at footer bottom */}
        {activeScreen !== 'dashboard' && (
          <div className="mt-12 w-full pt-12 border-t border-outline-variant/10">
            <AdSenseBanner />
          </div>
        )}
      </main>

      {/* Persistent Bottom Nav Menu from JSON (Mobile viewports only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2.5 px-4 bg-white/80 border-t border-outline-variant/20 z-50 backdrop-blur-md shadow-[0px_-4px_20px_rgba(15,23,42,0.04)]">
        <button
          onClick={() => setActiveScreen('dashboard')}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all duration-200 active:scale-95 ${
            activeScreen === 'dashboard' || (activeScreen !== 'history' && activeScreen !== 'profile')
              ? 'bg-primary/10 text-primary'
              : 'text-outline hover:text-on-surface'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="font-sans font-bold text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setActiveScreen('history')}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all duration-200 active:scale-95 ${
            activeScreen === 'history'
              ? 'bg-primary/10 text-primary'
              : 'text-outline hover:text-on-surface'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="font-sans font-bold text-[10px] mt-0.5">History</span>
        </button>

        <button
          onClick={() => setActiveScreen('profile')}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all duration-200 active:scale-95 ${
            activeScreen === 'profile'
              ? 'bg-primary/10 text-primary'
              : 'text-outline hover:text-on-surface'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="font-sans font-bold text-[10px] mt-0.5">Profile</span>
        </button>
      </nav>
    </div>
  );
}
