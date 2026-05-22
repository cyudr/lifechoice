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
import { 
  supabase, 
  signInAsGuest, 
  signInWithEmail, 
  signOutUser, 
  syncWalletProfileToSupabase, 
  fetchWalletProfileFromSupabase, 
  UserWalletProfile, 
  DEFAULT_PROFILE,
  SUPABASE_SQL_CREATION_SNIPPET 
} from './lib/supabase';
import { SpinWheelGame } from './components/SpinWheelGame';
import { CoinFlipGame } from './components/CoinFlipGame';
import { FlowerPeelGame } from './components/FlowerPeelGame';
import { VibeCheckGame } from './components/VibeCheckGame';
import { LunchPollGame } from './components/LunchPollGame';
import { TextTellGame } from './components/TextTellGame';
import { HistoryPanel } from './components/HistoryPanel';
import { ProfileLayout } from './components/ProfileLayout';
import { TribeForum } from './components/TribeForum';

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

// Smooth and graceful shimmering heartbeat helper
function getCartoonHeartbeatScale(): number {
  const t = (Date.now() / 1000) * 2.2; // elegant slow breathing speed
  return 1.0 + Math.sin(t) * 0.12;
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<GameType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<DecisionHistoryEntry[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Choice maker and AI limit states (5 usages limit)
  const [usageCount, setUsageCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('decision_studio_usage_count_v2');
      return stored ? parseInt(stored, 10) : 0;
    } catch (e) {
      return 0;
    }
  });
  
  const [usageTimer, setUsageTimer] = useState<number>(() => {
    try {
      const storedTime = localStorage.getItem('decision_studio_limit_hit_timestamp_v2');
      if (storedTime) {
        const elapsed = Math.floor((Date.now() - parseInt(storedTime, 10)) / 1000);
        if (elapsed < 60) {
          return 60 - elapsed;
        }
      }
    } catch (e) {}
    return 0;
  });

  // Supabase Auth and Google Wallet States
  const [sessionUser, setSessionUser] = useState<any | null>(null);

  const [walletProfile, setWalletProfile] = useState<UserWalletProfile>({
    userId: 'guest-local-' + Math.random().toString(36).substring(2, 9),
    isAnonymous: true,
    walletEmail: 'cyudreamz@gmail.com',
    publisherId: 'ca-pub-8369709738621970',
    adSlotId: '1092837482',
    balance: 0.00,
    clicks: 0,
    impressions: 0
  });
  const [dbWarning, setDbWarning] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);

  // Filtering based on search queries
  const filteredGrid = gameCards.filter(card =>
    card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // States & Refs for the slowly bouncing spark and spark dust
  const [sparkPos, setSparkPos] = useState({ x: 100, y: 120 });
  const [sparkDust, setSparkDust] = useState<{ id: number; x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[]>([]);
  const [poppedCards, setPoppedCards] = useState<Record<string, boolean>>({});

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const posRef = React.useRef({ x: 100, y: 120 });
  const velRef = React.useRef({ x: 1.1, y: 0.8 }); // perfect slow steady velocity
  const dustsRef = React.useRef<{ id: number; x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[]>([]);
  const cardLayoutsRef = React.useRef<{ id: string; cx: number; cy: number; r: number }[]>([]);

  // Calculate coordinates of card icon bubbles inside viewport
  const updateLayouts = () => {
    const layouts = filteredGrid.map((card) => {
      const el = document.getElementById(`dashboard-card-${card.id}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        return {
          id: card.id,
          cx: rect.left + rect.width / 2,
          cy: rect.top + rect.height / 2,
          r: Math.max(rect.width / 2, 38), // interaction sphere radius
        };
      }
      return null;
    }).filter((x): x is { id: string; cx: number; cy: number; r: number } => x !== null);
    cardLayoutsRef.current = layouts;
  };

  useEffect(() => {
    if (activeScreen !== 'dashboard') return;

    // Small delay to let initial layout mount and stabilize
    const timer = setTimeout(() => {
      updateLayouts();
    }, 300);

    window.addEventListener('resize', updateLayouts);
    window.addEventListener('scroll', updateLayouts, { passive: true });

    let animFrameId: number;
    let frameCount = 0;
    const collisionCooldowns: Record<string, number> = {};

    const loop = () => {
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;

      if (containerWidth <= 0 || containerHeight <= 0) {
        animFrameId = requestAnimationFrame(loop);
        return;
      }

      // 1. Gently nudge velocity vector for random continuous drift look
      frameCount++;
      const driftPower = 0.05;
      velRef.current.x += (Math.random() - 0.5) * driftPower;
      velRef.current.y += (Math.random() - 0.5) * driftPower;

      // Periodically add larger organic redirections to guarantee traveling active zones
      if (frameCount % 80 === 0) {
        const angle = Math.random() * Math.PI * 2;
        velRef.current.x += Math.cos(angle) * 0.45;
        velRef.current.y += Math.sin(angle) * 0.45;
      }

      // Constrain velocity magnitude to keep it slow, steady, and exciting
      const SPEED = 1.35;
      const mag = Math.sqrt(velRef.current.x * velRef.current.x + velRef.current.y * velRef.current.y);
      if (mag > 0) {
        velRef.current.x = (velRef.current.x / mag) * SPEED;
        velRef.current.y = (velRef.current.y / mag) * SPEED;
      }

      // Physics slow movement step
      posRef.current.x += velRef.current.x;
      posRef.current.y += velRef.current.y;

      // Wall reflections with padding relative to viewport boundaries
      const pad = 24;
      if (posRef.current.x < pad) {
        posRef.current.x = pad;
        velRef.current.x = Math.abs(velRef.current.x);
      } else if (posRef.current.x > containerWidth - pad) {
        posRef.current.x = containerWidth - pad;
        velRef.current.x = -Math.abs(velRef.current.x);
      }

      if (posRef.current.y < pad) {
        posRef.current.y = pad;
        velRef.current.y = Math.abs(velRef.current.y);
      } else if (posRef.current.y > containerHeight - pad) {
        posRef.current.y = containerHeight - pad;
        velRef.current.y = -Math.abs(velRef.current.y);
      }

      const now = Date.now();

      // Circular sensor collision reflection physics
      for (const card of cardLayoutsRef.current) {
        const dx = posRef.current.x - card.cx;
        const dy = posRef.current.y - card.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < card.r) {
          const nx = dx / dist;
          const ny = dy / dist;
          const dot = velRef.current.x * nx + velRef.current.y * ny;

          // If moving towards each other, reflect!
          if (dot < 0) {
            velRef.current.x = velRef.current.x - 2 * dot * nx;
            velRef.current.y = velRef.current.y - 2 * dot * ny;

            // Re-normalize speed
            const currentSpeed = Math.sqrt(velRef.current.x * velRef.current.x + velRef.current.y * velRef.current.y);
            if (currentSpeed > 0) {
              velRef.current.x = (velRef.current.x / currentSpeed) * SPEED;
              velRef.current.y = (velRef.current.y / currentSpeed) * SPEED;
            }

            // Pop reaction
            const lastCollision = collisionCooldowns[card.id] || 0;
            if (now - lastCollision > 350) {
              collisionCooldowns[card.id] = now;
              setPoppedCards(prev => ({ ...prev, [card.id]: true }));
              setTimeout(() => {
                setPoppedCards(prev => ({ ...prev, [card.id]: false }));
              }, 300);
            }
          }
        }
      }

      // Shed sparkling trail / dust particles
      if (frameCount % 3 === 0) {
        const colors = ['#fbbf24', '#f59e0b', '#ff56a7', '#ffda79', '#ffffff', '#ffd085', '#06b6d4', '#ec4899'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        dustsRef.current.push({
          id: Math.random(),
          x: posRef.current.x,
          y: posRef.current.y,
          vx: (Math.random() - 0.5) * 0.45 - velRef.current.x * 0.18, // blow backward slightly
          vy: (Math.random() - 0.5) * 0.45 - velRef.current.y * 0.18 + 0.08, // sink down slightly
          size: Math.random() * 5 + 3,
          alpha: 1.0,
          color: randomColor,
        });
      }

      // Update particle decay
      dustsRef.current = dustsRef.current
        .map(dp => ({
          ...dp,
          x: dp.x + dp.vx,
          y: dp.y + dp.vy,
          alpha: dp.alpha - 0.022,
          size: Math.max(0, dp.size - 0.06),
        }))
        .filter(dp => dp.alpha > 0.05 && dp.size > 0.4);

      if (dustsRef.current.length > 50) {
        dustsRef.current.shift();
      }

      setSparkDust([...dustsRef.current]);
      setSparkPos({ x: posRef.current.x, y: posRef.current.y });
      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateLayouts);
      window.removeEventListener('scroll', updateLayouts);
      cancelAnimationFrame(animFrameId);
    };
  }, [activeScreen, filteredGrid.length]);

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

  // Sync usage count and limit values to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('decision_studio_usage_count_v2', usageCount.toString());
      if (usageCount >= 5 && usageTimer > 0) {
        const storedTime = localStorage.getItem('decision_studio_limit_hit_timestamp_v2');
        if (!storedTime) {
          localStorage.setItem('decision_studio_limit_hit_timestamp_v2', Date.now().toString());
        }
      } else if (usageCount < 5) {
        localStorage.removeItem('decision_studio_limit_hit_timestamp_v2');
      }
    } catch (e) {}
  }, [usageCount, usageTimer]);

  // Handle auto timer activation if user reaches 5/5
  useEffect(() => {
    if (usageCount >= 5 && usageTimer === 0) {
      setUsageTimer(60);
      localStorage.setItem('decision_studio_limit_hit_timestamp_v2', Date.now().toString());
    }
  }, [usageCount]);

  // Manage Countdown timer interval
  useEffect(() => {
    if (usageTimer > 0) {
      const interval = setInterval(() => {
        setUsageTimer(prev => {
          if (prev <= 1) {
            setUsageCount(0);
            localStorage.removeItem('decision_studio_limit_hit_timestamp_v2');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [usageTimer]);

  // Auto-clear usage count if elapsed cross-refresh
  useEffect(() => {
    try {
      const storedTime = localStorage.getItem('decision_studio_limit_hit_timestamp_v2');
      if (storedTime) {
        const elapsed = Math.floor((Date.now() - parseInt(storedTime, 10)) / 1000);
        if (elapsed >= 60) {
          setUsageCount(0);
          setUsageTimer(0);
          localStorage.removeItem('decision_studio_limit_hit_timestamp_v2');
        }
      }
    } catch (e) {}
  }, []);

  // Sync profile details from Supabase & manage sessions
  const loadUserProfile = async (userId: string, isAnon: boolean, email?: string) => {
    setSyncLoading(true);
    setDbWarning(null);
    try {
      const res = await fetchWalletProfileFromSupabase(userId);
      if (res.dbWarning) {
        setDbWarning(res.error);
        // Table missing! Use localStorage profiles
        const localProfile = localStorage.getItem('ad_revenue_local_profile_v2');
        if (localProfile) {
          try {
            const parsed = JSON.parse(localProfile);
            setWalletProfile({
              ...parsed,
              userId,
              isAnonymous: isAnon
            });
          } catch (e) {}
        } else {
          setWalletProfile(prev => ({
            ...prev,
            userId,
            isAnonymous: isAnon,
            walletEmail: email || prev.walletEmail
          }));
        }
      } else if (res.data) {
        setWalletProfile(res.data);
      } else {
        // Initial setup for new user
        const newProf: UserWalletProfile = {
          userId,
          isAnonymous: isAnon,
          walletEmail: email || 'cyudreamz@gmail.com',
          publisherId: 'ca-pub-8369709738621970',
          adSlotId: '1092837482',
          balance: 0.00,
          clicks: 0,
          impressions: 0
        };
        const syncRes = await syncWalletProfileToSupabase(newProf);
        if (syncRes.dbWarning) {
          setDbWarning(syncRes.error);
        }
        setWalletProfile(newProf);
        localStorage.setItem('ad_revenue_local_profile_v2', JSON.stringify(newProf));
      }
    } catch (err) {
      console.error("Error loading profile", err);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSaveProfile = async (updated: Partial<UserWalletProfile>) => {
    const newProfile = {
      ...walletProfile,
      ...updated
    };
    setWalletProfile(newProfile);
    localStorage.setItem('ad_revenue_local_profile_v2', JSON.stringify(newProfile));

    try {
      const res = await syncWalletProfileToSupabase(newProfile);
      if (res.dbWarning) {
        setDbWarning(res.error);
      } else if (res.success) {
        setDbWarning(null);
      }
    } catch (err) {
      console.error("Error updates profile", err);
    }
  };

  const handleAddAdRevenue = async (amount: number, isClick: boolean) => {
    if (isClick) {
      setUsageCount(0);
      setUsageTimer(0);
      localStorage.removeItem('decision_studio_limit_hit_timestamp_v2');
      alert("⚡ Thanks for supporting Spark Arcade! Your 5 free choice session tokens have been instantly fully reloaded! Keep spinning!");
    }

    const newProfile = {
      ...walletProfile,
      balance: Number((walletProfile.balance + amount).toFixed(4)),
      clicks: walletProfile.clicks + (isClick ? 1 : 0),
      impressions: walletProfile.impressions + (isClick ? 0 : 1)
    };
    setWalletProfile(newProfile);
    localStorage.setItem('ad_revenue_local_profile_v2', JSON.stringify(newProfile));

    try {
      const res = await syncWalletProfileToSupabase(newProfile);
      if (res.dbWarning) {
        setDbWarning(res.error);
      } else {
        setDbWarning(null);
      }
    } catch (err) {
      console.error("Error adding ad revenue", err);
    }
  };

  // Auth Listener configuration
  useEffect(() => {
    let authSubscription: any = null;

    const setupAuth = async () => {
      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionUser(session.user);
        await loadUserProfile(session.user.id, !!session.user.is_anonymous, session.user.email);
      } else {
        // Automatically make guest anonymous session the default, triggering anonymous sign-in on boot
        const { user, error } = await signInAsGuest();
        if (user) {
          setSessionUser(user);
          await loadUserProfile(user.id, true, user.email);
        } else {
          // Robust local fallback if Supabase anonymous auth fails or isn't responsive
          setSessionUser(null);
          const localUserId = localStorage.getItem('ad_revenue_local_userid') || 'guest-local-' + Math.random().toString(36).substring(2, 9);
          localStorage.setItem('ad_revenue_local_userid', localUserId);

          const localProfile = localStorage.getItem('ad_revenue_local_profile_v2');
          if (localProfile) {
            try {
              setWalletProfile(JSON.parse(localProfile));
            } catch (e) {}
          } else {
            setWalletProfile({
              userId: localUserId,
              isAnonymous: true,
              walletEmail: 'cyudreamz@gmail.com',
              publisherId: 'ca-pub-8369709738621970',
              adSlotId: '1092837482',
              balance: 0.00,
              clicks: 0,
              impressions: 0
            });
          }
        }
      }

      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setSessionUser(session.user);
          await loadUserProfile(session.user.id, !!session.user.is_anonymous, session.user.email);
        } else {
          // Instantly re-establish a guest session to satisfy default guest session requirement
          const { user } = await signInAsGuest();
          if (user) {
            setSessionUser(user);
            await loadUserProfile(user.id, true, user.email);
          } else {
            setSessionUser(null);
            const localUserId = localStorage.getItem('ad_revenue_local_userid') || 'guest-local-' + Math.random().toString(36).substring(2, 9);
            setWalletProfile(prev => ({
              ...prev,
              userId: localUserId,
              isAnonymous: true
            }));
          }
        }
      });
      authSubscription = data;
    };

    setupAuth();

    return () => {
      if (authSubscription?.subscription?.unsubscribe) {
        authSubscription.subscription.unsubscribe();
      }
    };
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
    if (usageCount >= 5) {
      alert("Usage limit met! Close this box, scroll down and click on any sponsored banner layout to instantly recharge your 5 free sessions!");
      return;
    }
    
    setUsageCount(prev => prev + 1);

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
    if (usageCount >= 5) {
      alert("Usage limit met! Scroll down and click any sponsored banner to instantly reload your energy!");
      return [];
    }
    setUsageCount(prev => prev + 1);

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
  const handleRequestTextHelp = async (
    scenario: string,
    situation: string,
    tone: string,
    style: string,
    emoji: string,
    length: string
  ): Promise<string[]> => {
    if (usageCount >= 5) {
      alert("Usage limit met! Scroll down and click any sponsored banner to instantly reload your energy!");
      return [];
    }
    setUsageCount(prev => prev + 1);

    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/texts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, situation, tone, style, emoji, length })
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

  // Call server-side helper for Gemini biometric/aura vibe analysis
  const handleRequestVibeAnalysis = async (customInput?: string): Promise<any> => {
    if (usageCount >= 5) {
      alert("Usage limit met! Scroll down and click any sponsored banner to instantly reload your energy!");
      return null;
    }
    setUsageCount(prev => prev + 1);

    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/vibe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customInput })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn("API vibe analysis offline. Using local backup vibe profiles.");
      return {
        title: "You're channeling cozy vintage dreamland ☕",
        subValue: "Soft, artistic, thoughtful, and slightly mysterious. You resemble a character from a French indie movie.",
        metrics: [
          { label: "Casual", percentage: 75, rating: 4 },
          { label: "Trendy", percentage: 60, rating: 3 },
          { label: "Elegant", percentage: 78, rating: 4 },
          { label: "Bohemian", percentage: 92, rating: 5 }
        ],
        bubbles: [
          { label: "Artistic", percentage: 92 },
          { label: "Thoughtful", percentage: 87 },
          { label: "Chill", percentage: 90 }
        ]
      };
    } finally {
      setAiLoading(false);
    }
  };



  return (
    <div className="bg-surface text-on-surface font-sans min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-white pb-16 md:pb-6 relative overflow-x-hidden">
      
      {/* Soft, warm background nodes for a clean non-distracting vibe */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[15%] left-[8%] w-80 h-80 rounded-full bg-gradient-to-tr from-primary/3 to-[#ff56a7]/2 blur-3xl"></div>
        <div className="absolute bottom-[25%] right-[8%] w-96 h-96 rounded-full bg-gradient-to-tr from-[#6b38d4]/3 to-primary/2 blur-3xl"></div>
        <div className="absolute top-[50%] right-[15%] w-72 h-72 rounded-full bg-gradient-to-tr from-amber-200/2 to-[#ff56a7]/2 blur-3xl"></div>
      </div>
      
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
            onClick={() => setActiveScreen('tribe')}
            className={`flex items-center gap-1 font-sans font-extrabold text-xs py-1.5 px-3 rounded-xl transition-all ${
              activeScreen === 'tribe' 
                ? 'bg-primary-container/10 text-primary' 
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tribe</span>
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
            <div
              ref={containerRef}
              className="space-y-4 pb-4 transition-opacity duration-300 relative z-10 min-h-[500px]"
            >
              {/* FIXED Viewport Soft Spark and Dust Overlay */}
              <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                {/* Soft Spark Dust Particles Trail */}
                {sparkDust.map((dust) => {
                  const isStar = dust.id % 2 < 1.0;
                  return (
                    <div
                      key={dust.id}
                      className="absolute pointer-events-none z-40 transition-none"
                      style={{
                        left: `${dust.x}px`,
                        top: `${dust.y}px`,
                        width: `${dust.size * 1.8}px`,
                        height: `${dust.size * 1.8}px`,
                        opacity: dust.alpha * 0.85,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {isStar ? (
                        <svg viewBox="0 0 24 24" className="w-full h-full" style={{ color: dust.color }}>
                          <path
                            d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                            fill="currentColor"
                          />
                        </svg>
                      ) : (
                        <div
                          className="w-full h-full rounded-full"
                          style={{
                            backgroundColor: dust.color,
                            boxShadow: `0 0 4px ${dust.color}, inset 1px 1px 1px rgba(255,255,255,0.4)`,
                          }}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Animated Gorgeous Light Glow Spark */}
                <div
                  className="absolute z-50 pointer-events-none flex items-center justify-center transition-none"
                  style={{
                    left: `${sparkPos.x}px`,
                    top: `${sparkPos.y}px`,
                    transform: `translate(-50%, -50%) scale(${getCartoonHeartbeatScale().toFixed(3)})`,
                    width: '42px',
                    height: '42px',
                  }}
                >
                  {/* Subtle golden/pastel rose bloom behind spark */}
                  <div className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-amber-300/30 to-pink-300/30 blur-md pointer-events-none animate-pulse" />
                  <div className="absolute w-6 h-6 rounded-full bg-white/60 blur-xs pointer-events-none" />

                  {/* Outer Main Yellow Starburst with elegant drop shadow */}
                  <svg
                    className="w-8 h-8 text-amber-300 opacity-95 animate-spin"
                    style={{ animationDuration: '9s' }}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z"
                      fill="#fcd34d"
                    />
                  </svg>

                  {/* Counter-rotating white interior star accent for core glitter */}
                  <svg
                    className="absolute w-4.5 h-4.5 text-white opacity-90 animate-spin"
                    style={{ animationDuration: '4s', animationDirection: 'reverse' }}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 4L13.8 10.2L20 12L13.8 13.8L12 20L10.2 13.8L4 12L10.2 10.2L12 4Z"
                      fill="#ffffff"
                    />
                  </svg>

                  {/* Spark core highlight light */}
                  <div className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                </div>
              </div>

              {/* Cover Banner title with hyper-appealing layout for teens & young at heart */}
              <div className="text-center py-2 relative z-10">
                <span className="font-sans font-black text-[10px] sm:text-[11px] tracking-wider text-primary bg-primary/10 px-3 pl-2.5 py-1 rounded-full uppercase inline-flex items-center gap-1.5 shadow-[0_2px_8px_rgba(70,72,212,0.12)]">
                  <Flame className="w-4 h-4 text-[#4648d4] animate-bounce" />
                  <span className="animate-pulse">Active Instant Choice Playground ⚡</span>
                </span>
                <h1 className="font-display font-black text-3xl sm:text-4xl text-[#131b2e] leading-tight tracking-tight mt-3 text-glow">
                  Spark <span className="bg-gradient-to-r from-primary via-[#ff56a7] to-tertiary bg-clip-text text-transparent">Arcade</span>
                </h1>
                
                {/* Punchy 4-word trigger to make people use the app */}
                <p className="font-sans text-xs text-indigo-600 font-black tracking-wider uppercase mt-1.5 animate-pulse">
                  ⚡ Overthink less, spin now! ⚡
                </p>

                {/* Visual energy credit tracker */}
                <div className="max-w-xs mx-auto mt-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl p-2.5 flex items-center justify-between text-left shadow-xs relative overflow-hidden group">
                  <div className="flex items-center gap-2">
                    <span className="text-sm animate-bounce" style={{ animationDuration: '3s' }}>⚡</span>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase font-mono block tracking-wider leading-none">Arcade Energy</span>
                      <span className="text-xs font-extrabold text-slate-700 block mt-0.5">
                        {usageCount >= 5 ? 'RECHARGING...' : `${5 - usageCount} of 5 spins left`}
                      </span>
                    </div>
                  </div>
                  {usageCount >= 5 ? (
                    <div className="bg-amber-100 border border-amber-300 text-amber-900 font-mono text-[9px] font-bold px-2 py-0.5 rounded-md animate-pulse">
                      RELOAD: {usageTimer}s
                    </div>
                  ) : (
                    <div className="flex gap-1 shrink-0">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <div 
                          key={idx} 
                          className={`w-2.5 h-4.5 rounded-sm transition-all duration-300 ${
                            idx <= (5 - usageCount) 
                              ? 'bg-gradient-to-t from-indigo-500 to-indigo-400 border-b-2 border-indigo-700' 
                              : 'bg-slate-200 border-b-2 border-slate-300'
                          }`} 
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Search bar alignment option */}
                <div className="relative max-w-xs mx-auto mt-3.5">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search arcade tools..."
                    className="w-full bg-white border border-outline-variant/30 rounded-full py-1.5 pl-8 pr-4 font-sans text-xs text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none shadow-xs transition-shadow-all"
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
                <div
                  className="bg-white/80 border border-outline-variant/20 rounded-3xl p-6 shadow-md backdrop-blur-md relative overflow-hidden"
                >
                  {/* Floating playful star decoration markers */}
                  <div className="absolute top-2 right-4 text-xs animate-pulse opacity-40">✨</div>
                  <div className="absolute bottom-3 left-4 text-xs animate-bounce opacity-30">⭐</div>

                  <div className="grid grid-cols-3 gap-6 max-w-sm sm:max-w-md mx-auto relative z-10">
                    {filteredGrid.map((card, index) => (
                      <div
                        key={card.id}
                        onClick={() => setActiveScreen(card.id as any)}
                        className="flex flex-col items-center justify-center group cursor-pointer text-center"
                        title={card.desc}
                      >
                        {/* Interactive floating bubble */}
                        <div className="relative group">
                          {/* Circle Icon Container - reactive pop animation and custom coordinates anchor ID */}
                          <div
                            id={`dashboard-card-${card.id}`}
                            className={`w-16 h-16 rounded-full bg-surface-container-low border-2 flex items-center justify-center text-3xl shadow-xs transition-all duration-300 relative z-10 
                              ${poppedCards[card.id]
                                ? 'scale-125 rotate-12 border-primary bg-[#e1e0ff] shadow-[0_0_20px_rgba(70,72,212,0.4)] ring-4 ring-[#4648d4]/10'
                                : 'border-outline-variant/15 group-hover:scale-115 group-hover:rotate-12 group-hover:border-[#ff56a7]/40 group-hover:bg-[#eaedff] group-hover:shadow-[0_8px_20px_rgba(70,72,212,0.18)]'
                              }`}
                          >
                            {card.icon}
                          </div>
                          
                          {/* Light beam circle backup */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/10 to-secondary/15 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300 -z-0"></div>
                        </div>
                        
                        {/* One-word Title */}
                        <span className="font-display font-black text-xs text-[#131b2e] group-hover:text-primary mt-2.5 transition-colors">
                          {card.tag}
                        </span>

                        {/* High-density visual indicator of mini-app role */}
                        <span className="text-[10px] text-outline font-sans font-bold mt-0.5 line-clamp-1 max-w-[80px] opacity-75">
                          {card.desc.split(" ").slice(-2).join(" ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Intertwined elegant AdSense slot to minimize scrolling */}
              <div className="py-1">
                <AdSenseBanner walletProfile={walletProfile} onAddRevenue={handleAddAdRevenue} />
              </div>

            </div>
          )}

          {['wheel', 'coin', 'flower', 'vibe', 'poll', 'text'].includes(activeScreen) && usageCount >= 5 ? (
            <div className="w-full max-w-md mx-auto bg-white border border-outline-variant/30 rounded-3xl p-6.5 text-center shadow-lg relative overflow-hidden my-6 animate-fade-in">
              <div className="absolute top-0 right-0 py-1.5 px-3 bg-indigo-600 text-white select-none text-[9px] uppercase font-black font-mono tracking-widest rounded-bl-2xl">
                Cool-down Active 🧊
              </div>
              
              <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-2xl mx-auto mb-4 animate-bounce" style={{ animationDuration: '3s' }}>
                🔋
              </div>
              
              <h3 className="font-display font-black text-base text-slate-800 leading-tight">
                Arcade Energy Depleted
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-2 max-w-xs mx-auto leading-relaxed">
                Guest sessions are limited to 5 spins per cool-down to ensure fair access for everyone!
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 my-4 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold font-mono tracking-wider block">Time Remaining for Free Auto-Reload</span>
                <span className="font-mono font-black text-3xl text-indigo-600 block mt-1 tracking-widest">
                  00:{usageTimer < 10 ? `0${usageTimer}` : usageTimer}
                </span>
              </div>

              <div className="bg-gradient-to-tr from-indigo-50/50 to-white border border-indigo-100 rounded-2xl p-4 text-left font-sans">
                <h4 className="font-sans font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>Instant Recharge with Supported Ads</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 font-sans leading-relaxed">
                  Avoid the wait entirely! **Click and view any sponsored banner ad below** to instantly restore your 5 free choice game sessions. Thanks for supporting our indie servers!
                </p>
              </div>
            </div>
          ) : (
            <>
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
                <VibeCheckGame
                  onSaveDecision={handleSaveDecision}
                  onRequestVibe={handleRequestVibeAnalysis}
                  isAiLoading={aiLoading}
                />
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
            </>
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
              userEmail={sessionUser?.email || walletProfile.walletEmail}
              onClearAllUserData={handleClearAllUserData}
              walletProfile={walletProfile}
              onSaveProfile={handleSaveProfile}
              dbWarning={dbWarning}
              syncLoading={syncLoading}
              sessionUser={sessionUser}
            />
          )}

          {activeScreen === 'tribe' && (
            <TribeForum />
          )}
        </div>

        {/* Dynamic Ad Placement Block at footer bottom */}
        {activeScreen !== 'dashboard' && (
          <div className="mt-12 w-full pt-12 border-t border-outline-variant/10">
            <AdSenseBanner walletProfile={walletProfile} onAddRevenue={handleAddAdRevenue} />
          </div>
        )}
      </main>

      {/* Persistent Bottom Nav Menu from JSON (Mobile viewports only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center py-2.5 px-2 bg-white/80 border-t border-outline-variant/20 z-50 backdrop-blur-md shadow-[0px_-4px_20px_rgba(15,23,42,0.04)]">
        <button
          onClick={() => setActiveScreen('dashboard')}
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-95 ${
            activeScreen === 'dashboard' || (activeScreen !== 'history' && activeScreen !== 'profile' && activeScreen !== 'tribe')
              ? 'bg-primary/10 text-primary'
              : 'text-outline hover:text-on-surface'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="font-sans font-bold text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setActiveScreen('tribe')}
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-95 ${
            activeScreen === 'tribe'
              ? 'bg-primary/10 text-primary'
              : 'text-outline hover:text-on-surface'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="font-sans font-bold text-[10px] mt-0.5">Tribe</span>
        </button>

        <button
          onClick={() => setActiveScreen('history')}
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-95 ${
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
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-95 ${
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
