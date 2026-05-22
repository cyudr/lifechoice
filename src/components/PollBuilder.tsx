import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, ChartBar, Vote, Award, Calendar, Users, Eye, Shuffle } from 'lucide-react';
import { playTick, playSuccessChime } from '../lib/audio';
import { Poll, PollOption } from '../types';

interface PollBuilderProps {
  polls: Poll[];
  onSetPolls: (polls: Poll[]) => void;
}

export default function PollBuilder({ polls, onSetPolls }: PollBuilderProps) {
  const [pollTitle, setPollTitle] = useState('');
  const [pollDescription, setPollDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [activeTab, setActiveTab] = useState<'create' | 'browse'>('browse');

  const handleAddOptionField = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
      playTick();
    }
  };

  const handleRemoveOptionField = (idx: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = pollTitle.trim();
    if (!cleanTitle) return;

    // Filter filled choices
    const cleanOptions: PollOption[] = options
      .map((opt, i) => ({ id: `opt-${i}-${Date.now()}`, text: opt.trim(), votes: 0 }))
      .filter((opt) => opt.text !== '');

    if (cleanOptions.length < 2) {
      alert("A poll needs at least 2 non-empty choices.");
      return;
    }

    const newPoll: Poll = {
      id: `poll-${Date.now()}`,
      title: cleanTitle,
      description: pollDescription.trim() || undefined,
      options: cleanOptions,
      createdAt: new Date().toLocaleDateString(),
      totalVotes: 0
    };

    const updatedPolls = [newPoll, ...polls];
    onSetPolls(updatedPolls);
    playSuccessChime();

    // Reset Creation State
    setPollTitle('');
    setPollDescription('');
    setOptions(['', '']);
    setActiveTab('browse');
  };

  const handleVote = (pollId: string, optionId: string) => {
    const updated = polls.map((poll) => {
      if (poll.id === pollId) {
        // Prevent double voting on the same poll
        if (poll.userVotedId) return poll;

        const updatedOpts = poll.options.map((opt) => {
          if (opt.id === optionId) {
            return { ...opt, votes: opt.votes + 1 };
          }
          return opt;
        });

        playSuccessChime();
        return {
          ...poll,
          options: updatedOpts,
          totalVotes: poll.totalVotes + 1,
          userVotedId: optionId
        };
      }
      return poll;
    });

    onSetPolls(updated);
  };

  // Fun simulated voting to populate graphs and mimic actual user pools
  const handleSimulateVotes = (pollId: string) => {
    const updated = polls.map((poll) => {
      if (poll.id === pollId) {
        let additionalVotes = 0;
        const updatedOpts = poll.options.map((opt) => {
          // Add 5 to 25 random votes per choice
          const randomIncrement = Math.floor(Math.random() * 20) + 5;
          additionalVotes += randomIncrement;
          return { ...opt, votes: opt.votes + randomIncrement };
        });

        playSuccessChime();
        return {
          ...poll,
          options: updatedOpts,
          totalVotes: poll.totalVotes + additionalVotes
        };
      }
      return poll;
    });

    onSetPolls(updated);
  };

  const handleDeletePoll = (pollId: string) => {
    onSetPolls(polls.filter((p) => p.id !== pollId));
  };

  return (
    <div id="polls-module-root" className="space-y-6">
      <div className="flex border-b border-slate-200">
        <button
          id="poll-browse-tab"
          onClick={() => setActiveTab('browse')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
            activeTab === 'browse'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Polls ({polls.length})
        </button>
        <button
          id="poll-create-tab"
          onClick={() => setActiveTab('create')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
            activeTab === 'create'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Create New Poll
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'create' ? (
          <motion.form
            key="poll-create-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onSubmit={handleCreatePoll}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-5"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Craft a Custom Poll</h3>
              <p className="text-xs text-slate-500">Form questions, add choices, and let viewers cast standard votes.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Poll Question / Topic
                </label>
                <input
                  type="text"
                  id="poll-title-input"
                  required
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  placeholder="e.g. Which team outing looks best next week?"
                  maxLength={120}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Description / Context (Optional)
                </label>
                <textarea
                  id="poll-desc-input"
                  value={pollDescription}
                  onChange={(e) => setPollDescription(e.target.value)}
                  placeholder="Add details, criteria or guidelines..."
                  rows={2}
                  maxLength={300}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Options / Choices (Min 2, Max 8)
                </label>
                
                <div className="space-y-2">
                  {options.map((option, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <div className="w-6 text-xs font-bold text-slate-400 text-center font-mono">#{idx+1}</div>
                      <input
                        type="text"
                        id={`poll-option-${idx}`}
                        value={option}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Choice #${idx + 1}`}
                        maxLength={40}
                        className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          id={`delete-option-field-${idx}`}
                          onClick={() => handleRemoveOptionField(idx)}
                          className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 8 && (
                  <button
                    type="button"
                    id="add-poll-option-field"
                    onClick={handleAddOptionField}
                    className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition text-xs font-semibold text-slate-500 rounded-xl cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Another Choice
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              id="poll-submit-create"
              className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-xs font-bold uppercase tracking-wider text-white rounded-xl transition cursor-pointer"
            >
              Launch Custom Poll
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="poll-browse-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {polls.length === 0 ? (
              <div id="polls-empty-card" className="bg-white border border-slate-100 rounded-3xl p-12 text-center max-w-md mx-auto">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChartBar className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">No Custom Polls Exist</h4>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  Be the first to create an interactive choice poll or randomizer survey on this device!
                </p>
                <button
                  id="empty-go-create-poll-btn"
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-semibold text-xs text-white rounded-xl shadow-lg shadow-indigo-500/10 cursor-pointer"
                >
                  Create Custom Poll
                </button>
              </div>
            ) : (
              <div id="polls-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {polls.map((poll) => {
                  const alreadyVoted = !!poll.userVotedId;

                  return (
                    <div
                      key={poll.id}
                      id={`poll-card-${poll.id}`}
                      className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                    >
                      {/* Card Header information */}
                      <div className="space-y-1.5 relative">
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-[#6366f1] bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Vote className="w-2.5 h-2.5" />
                            Live Poll
                          </span>
                          <button
                            id={`delete-poll-btn-${poll.id}`}
                            onClick={() => handleDeletePoll(poll.id)}
                            className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="text-sm font-bold text-slate-850 leading-snug break-words pr-6">
                          {poll.title}
                        </h4>
                        {poll.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed break-words">
                            {poll.description}
                          </p>
                        )}
                      </div>

                      {/* Vote choices matrix */}
                      <div className="space-y-2 mt-4">
                        {poll.options.map((opt) => {
                          const percentage = poll.totalVotes > 0 
                            ? Math.round((opt.votes / poll.totalVotes) * 100) 
                            : 0;
                          const isUserVoteChoice = poll.userVotedId === opt.id;

                          return (
                            <div key={opt.id} className="relative group">
                              {alreadyVoted ? (
                                // Results reveal state
                                <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between overflow-hidden relative">
                                  {/* Dynamic progress fill bar */}
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className={`absolute top-0 left-0 bottom-0 ${
                                      isUserVoteChoice ? 'bg-indigo-500/10' : 'bg-slate-200/40'
                                    }`}
                                  />

                                  <div className="relative z-10 flex justify-between items-center text-xs font-semibold">
                                    <span className="text-slate-700 truncate pr-4 flex items-center gap-1.5 font-bold">
                                      {opt.text}
                                      {isUserVoteChoice && (
                                        <span className="text-[9px] text-indigo-500 bg-indigo-50 px-1 py-0.5 rounded uppercase font-black tracking-wider shrink-0">Your Vote</span>
                                      )}
                                    </span>
                                    <span className="text-slate-600 font-mono font-bold shrink-0">{percentage}% ({opt.votes})</span>
                                  </div>
                                </div>
                              ) : (
                                // Cast standard vote state
                                <button
                                  id={`cast-vote-${poll.id}-${opt.id}`}
                                  onClick={() => handleVote(poll.id, opt.id)}
                                  className="w-full text-left text-xs text-slate-700 border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/15 font-semibold p-3 rounded-xl transition cursor-pointer"
                                >
                                  {opt.text}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary metadata footer */}
                      <div className="flex items-center justify-between border-t border-slate-100/85 pt-3.5 mt-4 text-[10px] text-slate-400 font-bold">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {poll.totalVotes} Votes Cast
                          </span>
                        </div>
                        
                        {/* Simulation trigger */}
                        <div className="flex items-center gap-1.5">
                          <button
                            id={`simulate-poll-btn-${poll.id}`}
                            onClick={() => handleSimulateVotes(poll.id)}
                            className="text-[9px] text-slate-400 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 px-2 py-1 rounded bg-slate-50 flex items-center gap-1 cursor-pointer transition"
                            title="Mock other users voting to view results distribution"
                          >
                            <Shuffle className="w-2.5 h-2.5" />
                            Mock Votes
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
