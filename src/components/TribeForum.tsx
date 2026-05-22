import React, { useState } from 'react';
import { DiscussionEmbed } from 'disqus-react';
import { 
  MessageSquare, 
  Sparkles, 
  HelpCircle, 
  Flame, 
  Dices,
  Share2,
  Users
} from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  url: string;
}

export function TribeForum() {
  // Pre-configured forum streams in Spark Arcade so that clicking an icon launches a unique board
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://spark-arcade.com';
  
  const topics: Topic[] = [
    {
      id: 'general-lobby',
      title: 'General Lobby',
      desc: 'Connect with other arcade players, share high scores, and hang out.',
      icon: <Users className="w-5 h-5 text-indigo-500" />,
      url: `${origin}/tribe/lobby`
    },
    {
      id: 'chance-probability',
      title: 'Chance & Odds Talk',
      desc: 'Discuss coin flip formulas, spin wheel parameters, and decision strategies.',
      icon: <Dices className="w-5 h-5 text-pink-500" />,
      url: `${origin}/tribe/probability`
    },
    {
      id: 'aura-vibes',
      title: 'Aura & Bio-Vibe Chat',
      desc: 'Share your biometric energy scans and neural alignment scores with the tribe.',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      url: `${origin}/tribe/auras`
    },
    {
      id: 'hot-debates',
      title: 'Lunch Poll Debates',
      desc: 'Settle legendary lunch debates. Burger vs. Salad? Pizza vs. Sushi?',
      icon: <Flame className="w-5 h-5 text-rose-500" />,
      url: `${origin}/tribe/debates`
    },
    {
      id: 'qa-feedback',
      title: 'Help & Q/A Hub',
      desc: 'Request new interactive mini-games, report webcam bugs, or ask for guidance.',
      icon: <HelpCircle className="w-5 h-5 text-emerald-500" />,
      url: `${origin}/tribe/help`
    }
  ];

  const [activeTopic, setActiveTopic] = useState<Topic>(topics[0]);

  return (
    <div className="w-full flex flex-col gap-6 p-1 animate-fade-in">
      
      {/* Intro visual header */}
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-xs mb-3">
          <MessageSquare className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="font-display font-black text-xl text-[#131b2e] tracking-tight">
          Arcade Tribe Discussion
        </h3>
        <p className="font-sans text-xs text-on-surface-variant max-w-sm mx-auto mt-1 leading-relaxed">
          The official interactive bulletin board. Click a topic capsule icon to launch its live chat thread!
        </p>
      </div>

      {/* Quick Select Grid (Visual Capsule Buttons with precise icons described as "can be reached by a icon click") */}
      <div className="bg-white border border-outline-variant/30 rounded-3xl p-4 shadow-xs">
        <p className="text-[10px] font-sans font-bold text-outline tracking-wider uppercase mb-3 text-center">
          Active Channels
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {topics.map((topic) => {
            const isSelected = activeTopic.id === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic)}
                className={`p-2.5 rounded-2xl flex items-center gap-2.5 transition-all outline-hidden cursor-pointer ${
                  isSelected 
                    ? 'bg-neutral-900 text-white shadow-xs scale-102 border-transparent' 
                    : 'bg-neutral-50 hover:bg-neutral-100 text-on-surface border border-outline-variant/10'
                }`}
                title={topic.desc}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isSelected ? 'bg-white/10 text-white' : 'bg-white text-on-surface border border-neutral-100'}`}>
                  {topic.icon}
                </div>
                <div className="text-left">
                  <span className="block font-display font-bold text-xs">
                    {topic.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Channel Information */}
      <div className="border border-outline-variant/20 rounded-3xl bg-white p-5 shadow-xs flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              {activeTopic.icon}
            </span>
            <div>
              <h4 className="font-display font-black text-sm text-[#131b2e]">{activeTopic.title}</h4>
              <p className="text-[11px] text-on-surface-variant font-sans mt-0.5">{activeTopic.desc}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Spark Arcade - ${activeTopic.title}`,
                  url: activeTopic.url
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(activeTopic.url);
                alert("Topic link copied to clipboard! 📋");
              }
            }}
            className="p-2 rounded-xl hover:bg-neutral-50 border border-outline-variant/10 text-outline hover:text-indigo-600 transition-colors cursor-pointer"
            title="Share channel link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Disqus Embed block */}
        <div className="mt-4 border-t border-dashed border-outline-variant/35 pt-4">
          <div className="bg-neutral-50/70 p-3 rounded-2xl border border-neutral-100 mb-4 transition-all">
            <p className="font-mono text-[9px] text-[#ff56a7] uppercase tracking-widest text-center">
              💬 Disqus Secure Channel Bridge
            </p>
            <p className="text-[10px] text-neutral-500 font-sans mt-0.5 text-center">
              Thread: <span className="font-semibold text-neutral-700">{activeTopic.id}</span> | traditional Chinese language alignment (zh_TW)
            </p>
          </div>

          <div className="disqus-container min-h-[300px]">
            <DiscussionEmbed
              shortname="tribes"
              config={{
                url: activeTopic.url,
                identifier: activeTopic.id,
                title: activeTopic.title,
                language: 'zh_TW'
              }}
            />
          </div>
        </div>
      </div>

      <div className="p-3 bg-indigo-50/40 border border-indigo-100/40 rounded-2xl flex items-start gap-2 text-[10px] text-indigo-900 leading-normal">
        <span className="text-sm">💡</span>
        <span>
          Disqus comments are real-time, sandboxed, and fully moderateable. Sign in using your standard Disqus, Google, Twitter, or Facebook accounts inside the embed interface to join other players immediately.
        </span>
      </div>

    </div>
  );
}
