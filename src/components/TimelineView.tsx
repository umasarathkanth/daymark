import React, { useState } from 'react';
import { 
  History, 
  Sparkles, 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  ArrowRight, 
  Bookmark, 
  Quote, 
  Mic, 
  MessageSquare,
  Clock,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { JournalEntry, Memory, UserProfile } from '../types';

interface TimelineViewProps {
  userProfile: UserProfile | null;
  entries: JournalEntry[];
  memories: Memory[];
  onSelectEntryForReflection?: (entry: JournalEntry) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  userProfile,
  entries,
  memories,
  onSelectEntryForReflection
}) => {
  const [activeTab, setActiveTab] = useState<'entries' | 'memories'>('entries');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique moods & themes
  const allMoods = Array.from(
    new Set(entries.map((e) => e.analysis?.mood).filter(Boolean) as string[])
  );

  const allThemes = Array.from(
    new Set([
      ...entries.flatMap((e) => e.analysis?.themes || []).filter(Boolean),
      ...memories.flatMap((m) => m.themes || []).filter(Boolean)
    ])
  );

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesMood = selectedMood === 'all' || entry.analysis?.mood === selectedMood;
    const matchesTheme = selectedTheme === 'all' || entry.analysis?.themes?.some((t) => t.toLowerCase() === selectedTheme.toLowerCase());
    const matchesSearch = !searchQuery || 
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.analysis?.mood && entry.analysis.mood.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (entry.analysis?.themes && entry.analysis.themes.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesMood && matchesTheme && matchesSearch;
  });

  // Filter memories
  const filteredMemories = memories.filter((mem) => {
    const matchesTheme = selectedTheme === 'all' || mem.themes?.some((t) => t.toLowerCase() === selectedTheme.toLowerCase());
    const matchesSearch = !searchQuery || 
      mem.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.themes?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTheme && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-stone-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <History className="w-4 h-4 text-amber-600" />
            <span>Chronological Archive</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Timeline & Memories
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
            A chronological stream of your reflections, voice notes, and long-term semantic memory anchors preserved across time.
          </p>
        </div>

        {/* View Toggle Pill */}
        <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-xl border border-stone-200/60 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('entries')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'entries'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Journal Entries ({entries.length})
          </button>
          <button
            onClick={() => setActiveTab('memories')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'memories'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Memory Bank ({memories.length})
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs mb-8 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, emotions, themes..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Reset Filters */}
          {(selectedMood !== 'all' || selectedTheme !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedMood('all');
                setSelectedTheme('all');
                setSearchQuery('');
              }}
              className="text-xs text-stone-500 hover:text-stone-800 font-medium px-2 py-1"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Theme Pills Filter */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mr-1">
            Themes:
          </span>
          <button
            onClick={() => setSelectedTheme('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedTheme === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All
          </button>
          {allThemes.map((theme) => (
            <button
              key={theme}
              onClick={() => setSelectedTheme(theme)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedTheme === theme
                  ? 'bg-amber-800 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              #{theme}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW: JOURNAL ENTRIES STREAM */}
      {activeTab === 'entries' && (
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-12 text-center shadow-xs">
              <History className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-stone-800 mb-1">
                No matching journal entries found
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try clearing your search query or selecting "All Themes".
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const entryDate = new Date(entry.createdAt);
              const formattedDate = entryDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              const formattedTime = entryDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              });

              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs hover:border-stone-300 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span className="text-xs font-semibold text-stone-800">
                        {formattedDate}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="text-xs text-stone-500 font-mono">
                        {formattedTime}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {entry.inputMode === 'voice' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-950 text-[11px] font-semibold border border-emerald-200/60">
                          <Mic className="w-3 h-3" />
                          <span>Voice Note ({entry.voiceDurationSeconds || 60}s)</span>
                        </span>
                      )}

                      {entry.analysis?.mood && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[11px] font-bold border border-amber-200/60">
                          Mood: {entry.analysis.mood}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Entry text */}
                  <p className="text-sm text-stone-900 leading-relaxed mb-4">
                    "{entry.content}"
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {entry.analysis?.emotional_tone && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
                          {entry.analysis.emotional_tone}
                        </span>
                      )}
                      {entry.analysis?.themes?.map((t, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-stone-50 text-stone-600 border border-stone-200/60">
                          #{t}
                        </span>
                      ))}
                    </div>

                    {onSelectEntryForReflection && (
                      <button
                        onClick={() => onSelectEntryForReflection(entry)}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-800 hover:text-amber-900 hover:underline"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Reflect on this entry</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW: MEMORY BANK */}
      {activeTab === 'memories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMemories.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-stone-200/90 p-12 text-center shadow-xs">
              <Bookmark className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-stone-800 mb-1">
                No semantic memory anchors found
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Gemini automatically extracts permanent memory anchors from your reflections.
              </p>
            </div>
          ) : (
            filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">
                      Anchor • Imp {Math.round(mem.importance * 100)}%
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {new Date(mem.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-stone-800 leading-relaxed mb-3">
                    "{mem.content}"
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex flex-wrap gap-1">
                  {mem.themes?.map((t, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                      #{t}
                    </span>
                  ))}
                  {mem.behavioral_signals?.map((b, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/50">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
