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
    <div className="max-w-6xl mx-auto">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <LayoutGrid className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Brainstorm Board</h2>
                <p className="text-blue-100 text-sm mt-0.5">
                  {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? 's' : ''} shared by the team
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
                title="Refresh ideas"
              >
                <RefreshCw className={`text-white ${isRefreshing ? 'animate-spin' : ''}`} size={20} />
              </button>
              <button
                onClick={handleViewClusters}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl
                           hover:bg-white/30 transition-colors text-white font-medium"
              >
                <Layers size={18} />
                <span>View Clusters</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { id: 'all', label: 'All Ideas' },
                { id: 'mine', label: 'My Ideas' },
                { id: 'top', label: 'Top Voted' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                             ${filter === id 
                               ? 'bg-white text-blue-600 shadow-sm' 
                               : 'text-gray-600 hover:text-gray-800'
                             }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleNewIdea}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500
                       text-white rounded-xl font-medium shadow-lg shadow-blue-500/25
                       hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-200"
          >
            <Plus size={18} />
            <span>Add Idea</span>
          </button>
        </div>
      </div>

      {/* Ideas Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-blue-500" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No ideas yet!</h3>
          <p className="text-gray-500 mb-6">Be the first to share your brilliant idea with the team.</p>
          <button
            onClick={handleNewIdea}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500
                       text-white rounded-xl font-semibold shadow-lg hover:shadow-xl
                       hover:scale-105 transition-all duration-200"
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
        className="fixed bottom-6 right-6 md:hidden p-4 bg-gradient-to-r from-blue-500 to-indigo-500
                   text-white rounded-full shadow-2xl hover:scale-110 transition-transform"
      >
        <Plus size={24} />
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
    <div className={`bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden
                     hover:shadow-lg hover:-translate-y-1 transition-all duration-200
                     ${isOwner ? 'ring-2 ring-blue-200' : ''}`}>
      {/* Card Header */}
      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <User size={14} />
          <span>{idea.participant_id ? `User ${idea.participant_id.slice(-4)}` : 'Anonymous'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock size={12} />
          <span>{getTimeAgo(idea.created_at)}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        <p className="text-gray-800 leading-relaxed mb-3">
          {showOriginal ? idea.original_text : (idea.rephrased_text || idea.original_text)}
        </p>

        {/* Show AI badge if rephrased */}
        {idea.rephrased_text && idea.rephrased_text !== idea.original_text && (
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800"
          >
            {showOriginal ? (
              <>
                <Sparkles size={12} />
                <span>Show AI Enhanced</span>
              </>
            ) : (
              <>
                <Eye size={12} />
                <span>Show Original</span>
              </>
            )}
          </button>
        )}

        {/* Entities Tags */}
        {idea.entities && idea.entities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {idea.entities.slice(0, 3).map((entity, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium"
              >
                {entity.text}
              </span>
            ))}
            {idea.entities.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                +{idea.entities.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
        <button
          onClick={handleVoteClick}
          disabled={hasVoted}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                     transition-all duration-200
                     ${hasVoted 
                       ? 'bg-blue-100 text-blue-600 cursor-default' 
                       : 'bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-600 border border-gray-200'
                     }`}
        >
          <ThumbsUp size={16} className={hasVoted ? 'fill-current' : ''} />
          <span>{idea.votes || 0}</span>
        </button>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                           bg-white border border-gray-200 text-gray-600 hover:bg-gray-50
                           hover:text-gray-800 transition-colors">
            <MessageCircle size={16} />
            <span>{idea.comments?.length || 0}</span>
          </button>

          {idea.is_hesitant && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-medium"
                  title="This idea was submitted with some hesitation - supported by AI">
              AI Assisted
            </span>
          )}
        </div>
      </div>

      {/* Owner Badge */}
      {isOwner && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
          You
        </div>
      )}
    </div>
  );
};

export default BrainstormBoard;
