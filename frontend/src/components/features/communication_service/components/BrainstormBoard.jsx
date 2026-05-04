/**
 * Brainstorm Board Component (Screen 3)
 * Collaborative pool displaying all team ideas with voting
 */
import React, { useEffect, useState } from 'react';
import {
  LayoutGrid,
  ThumbsUp,
  MessageCircle,
  Plus,
  Clock,
  User,
  Sparkles,
  Filter,
  Layers,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import useBrainstormStore from '../store/brainstormStore';
import { getIdeas, updateIdea } from '../api/brainstormApi';
import { getHesitationBadgeClass } from '../utils/hesitationBadge';

const BrainstormBoard = () => {
  const [filter, setFilter] = useState('all'); // all, mine, top
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    ideas,
    currentSession,
    participantId,
    isAnonymous,
    isLoading,
    setIdeas,
    setIsLoading,
    setCurrentScreen,
    updateIdeaInStore,
  } = useBrainstormStore();

  // Fetch ideas on mount
  useEffect(() => {
    console.log('BrainstormBoard mounted, currentSession:', currentSession);
    if (currentSession?._id || currentSession?.id) {
      fetchIdeas();
      // Set up polling for real-time updates
      const interval = setInterval(fetchIdeas, 10000);
      return () => clearInterval(interval);
    }
  }, [currentSession]);

  const fetchIdeas = async () => {
    const sessionId = currentSession?._id || currentSession?.id;
    if (!sessionId) {
      console.log('No session ID, skipping fetch');
      return;
    }
    try {
      console.log('Fetching ideas for session:', sessionId);
      const fetchedIdeas = await getIdeas(sessionId);
      console.log('Fetched ideas:', fetchedIdeas);
      setIdeas(Array.isArray(fetchedIdeas) ? fetchedIdeas : []);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      setIdeas([]);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchIdeas();
    setIsRefreshing(false);
  };

  const handleVote = async (idea) => {
    try {
      const updatedIdea = {
        ...idea,
        votes: (idea.votes || 0) + 1,
      };
      await updateIdea(idea._id, updatedIdea);
      updateIdeaInStore(updatedIdea);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleNewIdea = () => {
    setCurrentScreen('capture');
  };

  const handleViewClusters = () => {
    setCurrentScreen('clusters');
  };

  const getFilteredIdeas = () => {
    const allIdeas = ideas || [];
    switch (filter) {
      case 'mine':
        return allIdeas.filter(idea => idea.participant_id === participantId);
      case 'top':
        return [...allIdeas].sort((a, b) => (b.votes || 0) - (a.votes || 0));
      default:
        return allIdeas;
    }
  };

  const filteredIdeas = getFilteredIdeas();

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-navy-light rounded-xl">
            <LayoutGrid className="text-brand-navy-mid" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Idea Board</h2>
            <p className="text-xs text-gray-400">
              {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? 's' : ''} shared
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Filters */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'mine', label: 'Mine' },
              { id: 'top', label: 'Top' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                           ${filter === id 
                             ? 'bg-white text-brand-navy shadow-sm' 
                             : 'text-gray-500 hover:text-gray-700'
                           }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 text-gray-400 hover:text-brand-navy-mid hover:bg-brand-navy-light rounded-lg transition-all"
            title="Refresh"
          >
            <RefreshCw className={`${isRefreshing ? 'animate-spin' : ''}`} size={15} />
          </button>

          <button
            onClick={handleViewClusters}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-lg text-xs font-medium
                       text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-all"
          >
            <Layers size={13} />
            <span>Clusters</span>
          </button>

          <button
            onClick={handleNewIdea}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-navy text-brand-navy-light
                       rounded-lg text-xs font-semibold shadow-md shadow-brand-navy/15
                       hover:shadow-lg hover:shadow-brand-navy/25 transition-all"
          >
            <Plus size={14} />
            <span>Add Idea</span>
          </button>
        </div>
      </div>

      {/* Ideas Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-brand-navy-mid" size={32} />
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 p-16 text-center shadow-sm">
          <div className="w-14 h-14 bg-brand-navy-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-brand-navy-mid" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No ideas yet</h3>
          <p className="text-sm text-gray-400 mb-6">Be the first to share a brilliant idea with the team.</p>
          <button
            onClick={handleNewIdea}
            className="px-5 py-2.5 bg-brand-navy text-brand-navy-light rounded-xl text-sm font-semibold
                       shadow-lg shadow-brand-navy/15 hover:shadow-xl transition-all"
          >
            Share Your First Idea
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea._id}
              idea={idea}
              onVote={() => handleVote(idea)}
              isOwner={idea.participant_id === participantId}
              getTimeAgo={getTimeAgo}
            />
          ))}
        </div>
      )}

      {/* Floating action for mobile */}
      <button
        onClick={handleNewIdea}
        className="fixed bottom-6 right-6 md:hidden p-4 bg-brand-navy
                   text-white rounded-full shadow-2xl shadow-brand-navy/30 hover:scale-110 transition-transform"
      >
        <Plus size={22} />
      </button>
    </div>
  );
};

// Individual Idea Card Component
const IdeaCard = ({ idea, onVote, isOwner, getTimeAgo }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVoteClick = () => {
    if (!hasVoted) {
      onVote();
      setHasVoted(true);
    }
  };



  return (
    <div className={`relative bg-white rounded-xl border border-gray-200/60 overflow-hidden shadow-sm
                     hover:shadow-md hover:-translate-y-0.5 transition-all duration-200
                     ${isOwner ? 'ring-2 ring-brand-navy-mid/20' : ''}`}>
      {/* Owner Badge */}
      {isOwner && (
        <div className="absolute top-3 right-3 bg-brand-navy text-white text-xs font-mono px-2 py-0.5 rounded-md z-10">
          You
        </div>
      )}

      {/* Card Header */}
      <div className="px-4 py-2.5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <User size={12} />
          <span className="font-mono">{idea.participant_id ? `${idea.participant_id.slice(-4)}` : 'anon'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-300 font-mono">
          <Clock size={11} />
          <span>{getTimeAgo(idea.created_at)}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        <p className="text-sm text-gray-800 leading-relaxed mb-3">
          {showOriginal ? idea.original_text : (idea.rephrased_text || idea.original_text)}
        </p>

        {/* Show AI badge if rephrased */}
        {idea.rephrased_text && idea.rephrased_text !== idea.original_text && (
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="inline-flex items-center gap-1.5 text-xs text-brand-navy-mid hover:text-brand-navy font-medium"
          >
            {showOriginal ? (
              <><Sparkles size={11} /><span>Show Enhanced</span></>
            ) : (
              <><Eye size={11} /><span>Show Original</span></>
            )}
          </button>
        )}

        {/* Entity Tags */}
        {idea.entities && idea.entities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {idea.entities.slice(0, 3).map((entity, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-brand-navy-light text-brand-navy-mid rounded font-mono text-xs"
              >
                {entity.text}
              </span>
            ))}
            {idea.entities.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded font-mono text-xs">
                +{idea.entities.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-4 py-2.5 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
        <button
          onClick={handleVoteClick}
          disabled={hasVoted}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     transition-all duration-200
                     ${hasVoted 
                       ? 'bg-brand-navy-light text-brand-navy-mid cursor-default' 
                       : 'bg-white hover:bg-brand-navy-light text-gray-500 hover:text-brand-navy-mid border border-gray-200'
                     }`}
        >
          <ThumbsUp size={13} className={hasVoted ? 'fill-current' : ''} />
          <span className="font-mono">{idea.votes || 0}</span>
        </button>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs
                           bg-white border border-gray-200 text-gray-400 hover:bg-gray-50
                           hover:text-gray-600 transition-colors">
            <MessageCircle size={12} />
            <span className="font-mono">{idea.comments?.length || 0}</span>
          </button>

          {idea.is_hesitant && (
            <span className={`px-2 py-1 rounded-md text-xs font-mono font-medium ${getHesitationBadgeClass(idea.hesitation_score || 0)}`}>
              AI Assisted
            </span>
          )}
        </div>
      </div>
    </div>
  );
};


export default BrainstormBoard;
