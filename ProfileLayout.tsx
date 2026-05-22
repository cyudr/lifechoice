import React from 'react';
import { History, Trash2, Calendar, Star, MessageSquare, Play, HelpCircle, UserCheck } from 'lucide-react';
import { DecisionHistoryEntry } from '../types';

interface HistoryPanelProps {
  history: DecisionHistoryEntry[];
  onClearHistory: () => void;
  onSelectGame: (game: any) => void;
}

export function HistoryPanel({ history, onClearHistory, onSelectGame }: HistoryPanelProps) {
  
  const getGameIcon = (type: string) => {
    switch (type) {
      case 'wheel': return '🎡';
      case 'coin': return '🪙';
      case 'flower': return '🌸';
      case 'poll': return '📊';
      case 'vibe': return '🔮';
      case 'text': return '💬';
      default: return '❓';
    }
  };

  const getGameTitle = (type: string) => {
    switch (type) {
      case 'wheel': return 'Wheel of Wonder';
      case 'coin': return 'Coin of Fate';
      case 'flower': return 'Magic Flower Daisy';
      case 'poll': return 'Lunch Roulette';
      case 'vibe': return 'Vibe Scanner';
      case 'text': return 'Chat Sparker';
      default: return 'Lucky spark';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="text-center mb-4">
        <span className="font-sans font-semibold text-[11px] tracking-wider text-primary uppercase font-sans">Resolved Ledger</span>
        <h2 className="font-display font-bold text-2xl text-on-surface mt-0.5">My Adventure Log</h2>
        <p className="font-sans text-xs text-on-surface-variant max-w-sm mx-auto mt-1 leading-relaxed">
          Your playful ledger of past sparks. Relive all the legendary choices chance has generated for you!
        </p>
      </div>

      <div className="w-full bg-white rounded-3xl p-5 border border-outline-variant/30 shadow-[0px_4px_25px_rgba(15,23,42,0.02)] max-w-md">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10 mb-3">
          <div className="flex items-center gap-1.5">
            <History className="w-4 h-4 text-primary" />
            <h3 className="font-display font-extrabold text-xs text-on-surface uppercase tracking-wider">Past Sparks Resolved</h3>
          </div>
          
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[10px] font-bold text-error hover:text-red-700 hover:bg-red-50 py-1 px-2.5 rounded-lg transition-all duration-200 flex items-center gap-1 focus:outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-11 h-11 bg-surface-container rounded-full flex items-center justify-center text-primary text-lg mx-auto mb-3 border-2 border-white shadow-inner">
              ⚙️
            </div>
            <h4 className="font-display font-bold text-xs text-on-surface">No adventure logs yet</h4>
            <p className="text-[11px] text-outline font-sans mt-1 max-w-xs mx-auto">
              Your log of luck is waiting! Roll some wheels, flip some coins, or scan your vibe to see your log populate.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-surface rounded-2xl border border-outline-variant/20 hover:border-primary/20 flex gap-3.5 transition-all duration-300 relative group"
              >
                <div className="w-11 h-11 rounded-xl bg-white border border-outline-variant/10 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-xs">
                  {getGameIcon(entry.gameType)}
                </div>

                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-primary bg-primary/5 uppercase font-mono tracking-wider px-2 py-0.5 rounded">
                      {getGameTitle(entry.gameType)}
                    </span>
                    <span className="text-[10px] text-outline flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      {entry.timestamp}
                    </span>
                  </div>

                  <h4 className="font-display font-extrabold text-sm text-on-surface mt-2 truncate">
                    Resolved To: <span className="text-glow text-primary">{entry.result}</span>
                  </h4>

                  {entry.options && entry.options.length > 0 && (
                    <p className="text-[10px] text-outline font-sans truncate mt-1">
                      Options evaluated: {entry.options.join(', ')}
                    </p>
                  )}
                </div>

                {/* Back Link to retry */}
                <button
                  onClick={() => onSelectGame(entry.gameType)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white hover:bg-primary/5 rounded-full border border-outline-variant/30 text-outline hover:text-primary transition-all active:scale-90 opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Play this tool again"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
