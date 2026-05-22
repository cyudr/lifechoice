export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  createdAt: string;
  totalVotes: number;
  userVotedId?: string; // id of the option user voted on in this browser session
}

export interface WheelPreset {
  id: string;
  title: string;
  icon: string; // lucide icon name
  options: string[];
}

export interface DecisionHistoryItem {
  id: string;
  type: 'wheel' | 'coin' | 'dice' | 'card' | 'ball';
  title: string;
  result: string;
  timestamp: string;
}

export interface AISuggestionResponse {
  title: string;
  options: string[];
}
