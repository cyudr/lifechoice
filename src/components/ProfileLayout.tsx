import React, { useState } from 'react';
import { 
  User, 
  Activity, 
  ToggleLeft, 
  ToggleRight, 
  Sparkles, 
  Sliders, 
  Calendar, 
  Trash2, 
  Coins, 
  Lock, 
  Link2, 
  CheckCircle, 
  Database, 
  Clipboard, 
  Wallet,
  ShieldCheck,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { DecisionHistoryEntry } from '../types';
import { 
  UserWalletProfile, 
  supabase, 
  signInAsGuest, 
  signInWithEmail, 
  signOutUser,
  SUPABASE_SQL_CREATION_SNIPPET 
} from '../lib/supabase';

interface ProfileLayoutProps {
  history: DecisionHistoryEntry[];
  userEmail?: string;
  localTime?: string;
  onClearAllUserData: () => void;
  walletProfile?: UserWalletProfile;
  onSaveProfile?: (updated: Partial<UserWalletProfile>) => Promise<void>;
  dbWarning?: string | null;
  syncLoading?: boolean;
  sessionUser?: any | null;
}

export function ProfileLayout({ 
  history, 
  userEmail, 
  onClearAllUserData,
  walletProfile,
  onSaveProfile,
  dbWarning,
  syncLoading,
  sessionUser
}: ProfileLayoutProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [smartHelpEnabled, setSmartHelpEnabled] = useState(true);

  // Local state for profile inputs
  const [editWalletEmail, setEditWalletEmail] = useState(walletProfile?.walletEmail || 'guest@arcade.local');
  const [editPublisherId, setEditPublisherId] = useState(walletProfile?.publisherId || 'ca-pub-xaxnsazkrnwvzdrfbrsk');
  const [editAdSlotId, setEditAdSlotId] = useState(walletProfile?.adSlotId || '1092837482');

  // Interactive local login form
  const [emailInput, setEmailInput] = useState('');
  const [loginMsg, setLoginMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [payoutStatus, setPayoutStatus] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  const totalSparks = history.length;
  
  // Decide title based on historical spins count
  const getSillyTitle = () => {
    if (totalSparks === 0) return { title: "Instant Lucky Star ⭐", desc: "No second guessing logged. Your choices shine with absolute cosmic joy!" };
    if (totalSparks <= 3) return { title: "Happy Explorer of Luck 🍀", desc: "A few moments guided by pure destiny. Keeping the spirit high!" };
    if (totalSparks <= 8) return { title: "Charming Spark Spinner 🎡", desc: "You love a bit of mystery and excitement! The playground is always here to spin." };
    return { title: "Supreme Adventurer of Chance 🌌", desc: "Master of destiny and supreme captain of the wheel! The arcade fuels your awesome day!" };
  };

  const currentLevel = getSillyTitle();

  const handleApplyChanges = async () => {
    if (onSaveProfile) {
      await onSaveProfile({
        walletEmail: editWalletEmail,
        publisherId: editPublisherId,
        adSlotId: editAdSlotId
      });
      alert('AdSense settings and Target Wallet linked successfully!');
    }
  };

  const handleRequestPayout = () => {
    if ((walletProfile?.balance || 0) < 0.10) {
      alert('Threshold not met: Mindset minimum payout is $0.10. Click some ads in the banner to accrue direct balance!');
      return;
    }

    setPayoutStatus('processing');
    setTimeout(() => {
      setPayoutStatus('done');
      if (onSaveProfile) {
        onSaveProfile({ balance: 0.00 });
      }
      setTimeout(() => {
        setPayoutStatus(null);
      }, 5000);
    }, 2800);
  };

  // Perform anonymous login
  const handleAnonymousSignIn = async () => {
    setAuthLoading(true);
    setLoginMsg(null);
    const { user, error } = await signInAsGuest();
    setAuthLoading(false);
    if (error) {
      setLoginMsg({ text: `Failed to initiate anonymous session: ${error}`, error: true });
    } else {
      setLoginMsg({ text: `Signed in as Guest User ${user?.id.slice(0,8)}... 🎉`, error: false });
    }
  };


  // Perform Email sign-in / signup via Magic Link
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    
    setAuthLoading(true);
    setLoginMsg(null);
    const { error } = await signInWithEmail(emailInput.trim());
    setAuthLoading(false);
    if (error) {
      setLoginMsg({ text: `Magic link dispatch failed: ${error}`, error: true });
    } else {
      setLoginMsg({ text: "Magic Sign-In link successfully sent to your inbox! Check your spam folder.", error: false });
      setEmailInput('');
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    await signOutUser();
    setAuthLoading(false);
    setLoginMsg({ text: "Signed out successfully.", error: false });
  };

  const handleResetUser = () => {
    if (confirm("Are you sure you want to clear your local arcade logs and state?")) {
      onClearAllUserData();
      alert("Sparks completely wiped clean!");
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_CREATION_SNIPPET);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="text-center mb-4">
        <span className="font-sans font-semibold text-[11px] tracking-wider text-primary uppercase">Personalized cockpit</span>
        <h2 className="font-display font-bold text-2xl text-on-surface mt-0.5">My Profile & Ad Dashboard</h2>
        <p className="font-sans text-xs text-on-surface-variant max-w-md mx-auto mt-1 leading-relaxed">
          Manage your guest sessions, link real AdSense credentials to monetize impressions, and connect earnings directly to your Google Wallet account.
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4 text-left">
        
        {/* Supabase authentication profile details */}
        <div className="w-full bg-white border border-outline-variant/30 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
            <h4 className="font-display font-extrabold text-xs text-outline uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#131b2e]" />
              <span>Authentication Status</span>
            </h4>
            
            {sessionUser ? (
              <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                {sessionUser.is_anonymous ? 'GUEST SESSION' : 'VERIFIED'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
                <Lock className="w-3 h-3 text-amber-600 animate-pulse" />
                LOCAL GUEST
              </span>
            )}
          </div>

          {sessionUser ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-xl shadow-xs">
                  {sessionUser.is_anonymous ? '🐱' : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-800 truncate">
                    {sessionUser.email || `Local Anonymous Guest`}
                  </h5>
                  <p className="text-[9px] font-mono text-slate-400 mt-0.5 truncate">
                    User UUID: {sessionUser.id}
                  </p>
                </div>
              </div>

              {sessionUser.is_anonymous && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-[11px] text-indigo-950 font-sans leading-relaxed">
                  <strong>💡 Secure Guest Earnings:</strong> Convert your current anonymous session to a permanent account below to prevent losing your accumulated wallet balance.
                </div>
              )}

              <button
                onClick={handleSignOut}
                disabled={authLoading}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {authLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                <span>Sign Out Active Session</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                Connect your session to Supabase instantly! Run guest/anonymous setups to accumulate balance on multiple spins, or sign in to save data permanently.
              </p>

              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-[11px] text-indigo-950 font-sans leading-relaxed">
                <strong>🔒 Safe Local Sandbox:</strong> When continuing as a Guest, all of your logged choices, cumulative spins, ad views, and settings stay stored 100% locally inside your browser's local cache / cookie storage. You don't need a formal profile to enjoy the full arcade experience!
              </div>


              {/* Instant dynamic guest button */}
              <button
                type="button"
                onClick={handleAnonymousSignIn}
                disabled={authLoading}
                className="w-full py-2.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-800 font-sans font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {authLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>👤</span>}
                <span>Initiate Anonymous Guest Session</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[9px] font-bold text-outline font-mono">OR EMAIL MAGIC LINK</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Email register/login form */}
              <form onSubmit={handleEmailSignIn} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    disabled={authLoading}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-400 font-sans"
                    placeholder="Enter email e.g. you@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={authLoading || !emailInput}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-sans font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {authLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                    <span>Send Login Link</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {loginMsg && (
            <div className={`p-3 rounded-xl border text-xs font-sans ${
              loginMsg.error ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              {loginMsg.text}
            </div>
          )}
        </div>

        {/* Play history details and clear logic */}
        <div className="w-full bg-white border border-outline-variant/30 rounded-3xl p-5 flex flex-col gap-3">
          <h4 className="font-display font-extrabold text-xs text-outline uppercase tracking-wider font-sans mb-0.5 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[#131b2e]" />
            <span>App Preferences</span>
          </h4>

          {/* Sound toggle item */}
          <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant/10">
            <div>
              <h5 className="font-display font-bold text-xs text-on-surface">Delightful Sound Effects</h5>
              <p className="text-[10px] text-outline font-sans">Plays beautiful synthetic clicks and chimes upon spark completion.</p>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-primary hover:opacity-85 transition-opacity"
            >
              {soundEnabled ? (
                <ToggleRight className="w-8 h-8 stroke-1 fill-primary-container text-white" />
              ) : (
                <ToggleLeft className="w-8 h-8 stroke-1 text-outline" />
              )}
            </button>
          </div>

          {/* intelligent fallback toggle item */}
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-display font-bold text-xs text-on-surface">Gemini Copilot Advice</h5>
              <p className="text-[10px] text-outline font-sans">Enables real-time prompt advice from the friendly AI genie.</p>
            </div>
            <button
              onClick={() => setSmartHelpEnabled(!smartHelpEnabled)}
              className="text-primary hover:opacity-85 transition-opacity"
            >
              {smartHelpEnabled ? (
                <ToggleRight className="w-8 h-8 stroke-1 fill-primary-container text-white" />
              ) : (
                <ToggleLeft className="w-8 h-8 stroke-1 text-outline" />
              )}
            </button>
          </div>
        </div>

        {/* Wipe data */}
        <button
          onClick={handleResetUser}
          className="w-full py-2.5 border border-dashed border-error/55 hover:border-error text-error hover:bg-error/5 font-sans font-extrabold text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 focus:outline-none"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Wipe All Local Arcade History</span>
        </button>

      </div>
    </div>
  );
}
