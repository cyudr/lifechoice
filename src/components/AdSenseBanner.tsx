import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';

interface AdPreset {
  id: string;
  badge: string;
  title: string;
  ctaText: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon?: string;
  description?: string;
}

const FUNNY_ADS: AdPreset[] = [
  {
    id: 'florist',
    badge: 'Ad',
    title: 'Local Florists | Handpicked, customized, and beautiful premium bouquets.',
    ctaText: 'Shop Now',
    bgColor: 'bg-emerald-50/70',
    textColor: 'text-emerald-950',
    borderColor: 'border-emerald-200/50',
    icon: '🌸',
    description: 'Stop guessing how they feel! Spark a massive grin with a flawless bouquet today.'
  },
  {
    id: 'chill-beats',
    badge: 'Ad',
    title: 'Chill Beats Playlist | Upbeat, lo-fi rhythms to supercharge your study sessions.',
    ctaText: 'Listen Now',
    bgColor: 'bg-[#eaedff]',
    textColor: 'text-[#131b2e]',
    borderColor: 'border-outline-variant/30',
    icon: '🎵',
    description: 'Perfect ambient melodies to spark your genius ideas today.'
  },
  {
    id: 'delivery',
    badge: 'Ad',
    title: 'Mystery Feast Delivery | Delicious surprises from local chefs in one grand parcel.',
    ctaText: 'Order Random',
    bgColor: 'bg-rose-50/70',
    textColor: 'text-rose-950',
    borderColor: 'border-rose-200/50',
    icon: '🍔',
    description: 'Let our gourmet team choose a mystery snack for you. Open, feast, and enjoy the adventure!'
  },
  {
    id: 'planner',
    badge: 'Ad',
    title: 'Spark Calendars | Interactive journals featuring surprise daily playful challenges.',
    ctaText: 'Explore',
    bgColor: 'bg-purple-50/70',
    textColor: 'text-purple-950',
    borderColor: 'border-purple-200/50',
    icon: '📅',
    description: 'Banish boring routines. Elevate daily playfulness with cute layouts and stickers!'
  },
  {
    id: 'coin-insurance',
    badge: 'Ad',
    title: 'Silly Coin Guild | Get funny local vouchers when luck takes you by surprise.',
    ctaText: 'Get Vouchers',
    bgColor: 'bg-amber-50/70',
    textColor: 'text-amber-950',
    borderColor: 'border-amber-200/50',
    icon: '🪙',
    description: 'Join the guild today! Elevate your daily chance games with secret chocolate coupons.'
  }
];

export function AdSenseBanner({ category }: { category?: string }) {
  const [currentAd, setCurrentAd] = useState<AdPreset>(FUNNY_ADS[0]);

  useEffect(() => {
    // Select an ad randomly or match by category if helpful
    const filtered = category 
      ? FUNNY_ADS.filter(ad => ad.id === category)
      : [];
    
    if (filtered.length > 0) {
      setCurrentAd(filtered[0]);
    } else {
      const randomIndex = Math.floor(Math.random() * FUNNY_ADS.length);
      setCurrentAd(FUNNY_ADS[randomIndex]);
    }
  }, [category]);

  return (
    <div className={`w-full max-w-4xl mx-auto border ${currentAd.borderColor} ${currentAd.bgColor} rounded-xl p-4 shadow-sm transition-all duration-300 hover:shadow-md relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 py-1 px-3 bg-primary/10 rounded-bl-lg flex items-center gap-1">
        <span className="text-[10px] uppercase tracking-widest font-bold text-primary font-sans">Sponsored Space</span>
        <Sparkles className="w-2.5 h-2.5 text-primary animate-pulse" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm flex-shrink-0 group-hover:scale-115 transition-transform duration-300">
            {currentAd.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                {currentAd.badge}
              </span>
              <h4 className="font-sans font-semibold text-sm leading-tight text-on-surface">
                {currentAd.title.split('|')[0].trim()}
              </h4>
            </div>
            <p className="text-xs text-on-surface-variant font-sans mt-1">
              {currentAd.description || currentAd.title.split('|')[1]?.trim()}
            </p>
          </div>
        </div>

        <button 
          onClick={() => alert(`This is a playful ad for ${currentAd.title.split('|')[0].trim()}! No real trackers here.`)}
          className="flex-shrink-0 bg-white/80 hover:bg-white text-on-surface hover:text-[#4648d4] text-xs font-semibold py-2 px-4 rounded-lg shadow-sm border border-outline-variant/30 transition-all duration-200 flex items-center gap-1.5 self-end sm:self-center focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <span>{currentAd.ctaText}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
