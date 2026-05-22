import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, AlertCircle, Coins, CheckCircle2 } from 'lucide-react';
import { UserWalletProfile } from '../lib/supabase';

interface AdSenseBannerProps {
  category?: string;
  walletProfile?: UserWalletProfile;
  onAddRevenue?: (amount: number, isClick: boolean) => void;
}

export function AdSenseBanner({ walletProfile, onAddRevenue }: AdSenseBannerProps) {
  // Use user's real publisher client ID or default with full support
  const pubId = walletProfile?.publisherId || 'ca-pub-8369709738621970';
  const slotId = walletProfile?.adSlotId || '1092837482';
  
  const [justSupported, setJustSupported] = useState(false);
  const [loadedFromClient, setLoadedFromClient] = useState(false);
  const adsTriggered = useRef(false);

  useEffect(() => {
    // 1. Set simple client-side load flag
    setLoadedFromClient(true);
    
    // 2. Programmatically verify or inject Google AdSense initialization scripts
    const doc = window.document;
    const existingScript = doc.querySelector(`script[src*="adsbygoogle.js"]`);
    if (!existingScript) {
      const script = doc.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      doc.head.appendChild(script);
    }

    // 3. Prevent duplicate adsbygoogle push queues
    if (!adsTriggered.current) {
      try {
        if (typeof window !== 'undefined') {
          const adsbygoogle = (window as any).adsbygoogle || [];
          adsbygoogle.push({});
          adsTriggered.current = true;
        }
      } catch (err) {
        console.warn('AdSense tag push initialized gracefully:', err);
      }
    }

    // 4. Trigger standard baseline ad impressions/views log
    const timer = setTimeout(() => {
      if (onAddRevenue) {
        onAddRevenue(0.0025, false); // $0.0025 per loaded view session
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [pubId, slotId, onAddRevenue]);

  // Support instantly reloading free spins with 1-click sponsor support
  const handleSupportAdRecharge = () => {
    if (justSupported) return;
    setJustSupported(true);
    
    if (onAddRevenue) {
      // Instantly resets spins and rewards user pocket
      onAddRevenue(0.18, true);
    }

    setTimeout(() => {
      setJustSupported(false);
    }, 3500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-3.5 font-sans">
      {/* 1. REAL GOOGLE ADSENSE ELEMENT MOUNTED DIRECTLY */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm relative overflow-hidden transition-all hover:border-slate-300">
        
        {/* AdSense Verification Header */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-4 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="font-extrabold uppercase tracking-wider text-indigo-950 font-sans">
              Google AdSense Live Unit
            </span>
          </div>
          <span className="font-mono bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">
            {pubId}
          </span>
        </div>

        {/* Ad Placement Mounting Frame */}
        <div className="w-full overflow-hidden flex flex-col items-center justify-center min-h-[95px] rounded-2xl relative bg-radial from-slate-50 to-white/10 p-3">
          {loadedFromClient && (
            <ins 
              className="adsbygoogle"
              style={{ display: 'block', minHeight: '90px', width: '100%', height: 'auto', textAlign: 'center' }}
              data-ad-client={pubId}
              data-ad-slot={slotId}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          )}
        </div>

        {/* Informative Subtitle Bar with Interactive Recharge Trigger */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3.5 text-[10px] text-slate-400">
          <div className="flex items-center gap-2 text-left">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="font-sans leading-normal">
              Fully verifiable AdSense tag. Banner ads are customized dynamically by the Google Ad Network.
            </span>
          </div>

          <button
            onClick={handleSupportAdRecharge}
            disabled={justSupported}
            className={`shrink-0 font-bold px-4 py-2 rounded-2xl transition-all cursor-pointer flex items-center gap-1 ${
              justSupported 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 animate-pulse'
                : 'bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/60 text-indigo-600'
            }`}
          >
            {justSupported ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>⚡ Energy Fully Reloaded!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>⚡ Auto-Reload Free Spin Coins</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
