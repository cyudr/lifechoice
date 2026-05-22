export type GameType =
  | 'dashboard'
  | 'wheel'
  | 'coin'
  | 'flower'
  | 'poll'
  | 'vibe'
  | 'text'
  | 'history'
  | 'profile';

export interface DecisionHistoryEntry {
  id: string;
  gameType: GameType;
  title: string;
  result: string;
  timestamp: string;
  options?: string[];
}

export interface PollOption {
  id: string;
  name: string;
  category: string;
  priceClass: string; // e.g. '$', '$$', '$$$'
  distance: string;
  votes: number;
  icon: string;
}

export interface VibeResult {
  title: string;
  subValue: string;
  metrics: {
    label: string;
    percentage: number;
    rating: number; // 0 to 5 stars
  }[];
  bubbles: {
    label: string;
    percentage: number;
    colorClass: string;
  }[];
}
