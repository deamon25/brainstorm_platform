/**
 * Brainstorm Platform Main Container
 * Orchestrates session management and screen navigation
 */
import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Plus,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
  LogOut,
  ChevronDown,
  Lightbulb,
  Brain,
  Layers,
  Edit3,
  Check,
  X,
  Zap,
  Activity,
  Mic,
} from 'lucide-react';
import useBrainstormStore from '../store/brainstormStore';
import { checkHealth, createSession, getSessions, getIdeas } from '../api/brainstormApi';
import IdeaCapture from '../components/IdeaCapture';
import PreviewMode from '../components/PreviewMode';
import BrainstormBoard from '../components/BrainstormBoard';
import AIClusteringView from '../components/AIClusteringView';

const BrainstormPlatformPage = ({ module }) => {
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [newSessionName, setNewSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [healthData, setHealthData] = useState(null);
  const [timer, setTimer] = useState(0);
  
  const {
    currentSession,
    currentScreen,
    ideas,
    setCurrentSession,
    setCurrentScreen,
    setIdeas,
  } = useBrainstormStore();

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const data = await checkHealth();
        setHealthData(data);
        setBackendStatus('connected');
      } catch (error) {
        console.error('Backend not available:', error);
        setBackendStatus('disconnected');
      }
    };
    checkBackend();
  }, []);

  // Fetch sessions when modal opens
  useEffect(() => {
    if (showSessionModal) {
      fetchSessions();
    }
  }, [showSessionModal]);

  // Timer for current session
  useEffect(() => {
    let interval;
    if (currentSession) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSession]);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    setSessionsError(null);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      const detail = error.response?.data?.detail;
      if (error.response?.status === 503) {
        setSessionsError('Database is currently unavailable. You can still use AI features — start a new session to continue brainstorming.');
      } else {
        setSessionsError(detail || 'Could not load sessions. Please try again.');
      }
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;
    
    setIsCreating(true);
    try {
      const session = await createSession({
        name: newSessionName.trim(),
        description: null,
        participant_ids: [],
      });
      setCurrentSession(session);
      setShowSessionModal(false);
      setNewSessionName('');
      setTimer(0);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSession = async (session) => {
    setCurrentSession(session);
    setShowSessionModal(false);
    setTimer(0);
    // Fetch existing ideas for this session
    try {
      const sessionIdeas = await getIdeas(session._id);
      setIdeas(sessionIdeas);
    } catch (error) {
      console.error('Error fetching ideas:', error);
    }
  };

  const handleLeaveSession = () => {
    setCurrentSession(null);
    setCurrentScreen('capture');
    setIdeas([]);
    setTimer(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Screen navigation tabs
  const navTabs = [
    { id: 'capture', label: 'Capture', icon: Edit3 },
    { id: 'board', label: 'Board', icon: Lightbulb },
    { id: 'clusters', label: 'Clusters', icon: Brain },
  ];

  const renderScreen = () => {
    switch (currentScreen) {
      case 'capture':
        return <IdeaCapture />;
      case 'preview':
        return <PreviewMode />;
      case 'board':
        return <BrainstormBoard />;
      case 'clusters':
        return <AIClusteringView />;
      default:
        return <IdeaCapture />;
    }
  };

  // Landing view when no session is active
  if (!currentSession) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl animate-fade-in">
          {/* Hero Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-navy-light rounded-full mb-6">
              <span className="font-mono text-xs font-medium text-brand-navy-mid tracking-wider">BRAINSTORM</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-navy-mid animate-pulse"></span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Where ideas come to
              <span className="bg-gradient-to-r from-brand-navy-mid to-brand-teal bg-clip-text text-transparent"> life</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
              AI-powered collaborative brainstorming with real-time hesitation detection, entity-preserving rephrasing, and intelligent idea clustering.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              { icon: Brain, text: 'Hesitation Detection', color: 'text-amber-600 bg-amber-50 border-amber-100' },
              { icon: Sparkles, text: 'AI Rephrasing', color: 'text-blue-600 bg-blue-50 border-blue-100' },
              { icon: Mic, text: 'Voice Input', color: 'text-rose-600 bg-rose-50 border-rose-100' },
              { icon: Layers, text: 'Smart Clustering', color: 'text-purple-600 bg-purple-50 border-purple-100' },
            ].map((f, i) => (
              <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${f.color} transition-all hover:shadow-sm`}>
                <f.icon size={15} />
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Main Card */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
              {/* Card Header */}
              <div className="relative overflow-hidden bg-gradient-to-r from-brand-navy to-brand-navy-mid px-8 py-10 text-center">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                  <div className="absolute top-4 left-8 w-24 h-24 border border-white/30 rounded-full"></div>
                  <div className="absolute bottom-2 right-12 w-32 h-32 border border-white/20 rounded-full"></div>
                  <div className="absolute top-8 right-24 w-8 h-8 bg-white/10 rounded-full"></div>
                </div>
                
                <div className="relative">
                  <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-5 ring-1 ring-white/20">
                    <Zap className="text-white" size={28} />
                  </div>
                  <h2 className="text-2xl font-semibold text-white mb-2">Start Brainstorming</h2>
                  <p className="text-blue-200 text-sm max-w-sm mx-auto">
                    Create a new session or join an existing one to begin capturing ideas
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-8">
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Create New Session */}
                  <button
                    onClick={() => setShowSessionModal(true)}
                    disabled={backendStatus !== 'connected'}
                    className="group relative p-5 bg-gradient-to-br from-brand-navy-light to-blue-50 rounded-xl border border-blue-200/60 hover:border-brand-navy-mid/30 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                  >
                    <div className="p-2.5 bg-white rounded-xl shadow-sm w-fit mb-3 group-hover:shadow-md transition-shadow">
                      <Plus className="text-brand-navy-mid" size={20} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-1">Create Session</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">Start a new brainstorming session for your team</p>
                    <ArrowRight size={16} className="absolute top-5 right-5 text-gray-300 group-hover:text-brand-navy-mid group-hover:translate-x-1 transition-all" />
                  </button>

                  {/* Join Existing */}
                  <button
                    onClick={() => setShowSessionModal(true)}
                    disabled={backendStatus !== 'connected'}
                    className="group relative p-5 bg-gradient-to-br from-brand-teal-light to-emerald-50 rounded-xl border border-emerald-200/60 hover:border-brand-teal/30 hover:shadow-lg hover:shadow-emerald-100/50 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                  >
                    <div className="p-2.5 bg-white rounded-xl shadow-sm w-fit mb-3 group-hover:shadow-md transition-shadow">
                      <Users className="text-brand-teal" size={20} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-1">Join Session</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">Collaborate with your team on an active session</p>
                    <ArrowRight size={16} className="absolute top-5 right-5 text-gray-300 group-hover:text-brand-teal group-hover:translate-x-1 transition-all" />
                  </button>
                </div>

                {/* Backend Status */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <div className={`flex items-center justify-center gap-2 text-xs font-medium ${
                    backendStatus === 'connected' 
                      ? 'text-brand-teal' 
                      : backendStatus === 'disconnected'
                        ? 'text-red-500'
                        : 'text-gray-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      backendStatus === 'connected' ? 'bg-brand-teal animate-pulse' : 
                      backendStatus === 'disconnected' ? 'bg-red-400' : 'bg-gray-300 animate-pulse'
                    }`}></span>
                    <span className="font-mono text-xs">
                      {backendStatus === 'connected' 
                        ? `Backend ready · ${healthData?.models_loaded ? Object.values(healthData.models_loaded).filter(Boolean).length : 'all'} models loaded` 
                        : backendStatus === 'disconnected' 
                          ? 'Backend offline — check server' 
                          : 'Connecting...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Session Modal */}
        {showSessionModal && (
          <SessionModal
            sessions={sessions}
            isLoading={isLoadingSessions}
            sessionsError={sessionsError}
            newSessionName={newSessionName}
            setNewSessionName={setNewSessionName}
            onClose={() => setShowSessionModal(false)}
            onCreate={handleCreateSession}
            onJoin={handleJoinSession}
            isCreating={isCreating}
          />
        )}
      </div>
    );
  }

  // Active session view
  return (
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
      {/* Session Header Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-2.5">
          <div className="flex items-center justify-between">
            {/* Left - Branding + Session Info */}
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs font-semibold text-brand-navy-mid tracking-widest hidden sm:block">BRAINSTORM</span>
              <div className="hidden sm:block w-px h-5 bg-gray-200"></div>
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-brand-navy-light/50 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse"></span>
                <span className="text-sm font-medium text-brand-navy truncate max-w-48">
                  {currentSession.session_name || currentSession.name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatTime(timer)}
                </span>
                <span className="flex items-center gap-1">
                  <Lightbulb size={12} />
                  {ideas.length}
                </span>
              </div>
            </div>

            {/* Center - Navigation */}
            <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5">
              {navTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentScreen(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium
                             transition-all duration-200
                             ${currentScreen === tab.id || (currentScreen === 'preview' && tab.id === 'capture')
                               ? 'bg-white text-brand-navy shadow-sm' 
                               : 'text-gray-500 hover:text-gray-700'
                             }`}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Right - Actions */}
            <button
              onClick={handleLeaveSession}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 
                         rounded-lg transition-all"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-5">
        {renderScreen()}
      </div>
    </div>
  );
};

// Session Modal Component
const SessionModal = ({
  sessions,
  isLoading,
  sessionsError,
  newSessionName,
  setNewSessionName,
  onClose,
  onCreate,
  onJoin,
  isCreating,
}) => {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-brand-navy-light rounded-lg">
                <MessageSquare size={16} className="text-brand-navy-mid" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">Sessions</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all
                         ${activeTab === 'create' 
                           ? 'bg-white text-brand-navy shadow-sm' 
                           : 'text-gray-500 hover:text-gray-700'}`}
            >
              Create New
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all
                         ${activeTab === 'join' 
                           ? 'bg-white text-brand-navy shadow-sm' 
                           : 'text-gray-500 hover:text-gray-700'}`}
            >
              Join Existing
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto max-h-[50vh]">
          {activeTab === 'create' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                  Session Name
                </label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g., Sprint 5 Planning Ideas"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm
                           focus:ring-2 focus:ring-brand-navy-mid/20 focus:border-brand-navy-mid/40 focus:bg-white
                           transition-all placeholder:text-gray-400 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && onCreate()}
                />
              </div>
              <button
                onClick={onCreate}
                disabled={!newSessionName.trim() || isCreating}
                className="w-full py-3 bg-brand-navy text-white
                           rounded-xl text-sm font-semibold shadow-lg shadow-brand-navy/20
                           hover:shadow-xl hover:shadow-brand-navy/30
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Create Session</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {sessionsError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 leading-relaxed">
                  {sessionsError}
                </div>
              )}
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="animate-spin text-brand-navy-mid" size={28} />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="text-gray-300" size={22} />
                  </div>
                  <p className="text-sm text-gray-400 mb-3">No active sessions found</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="text-xs text-brand-navy-mid font-medium hover:underline"
                  >
                    Create the first one
                  </button>
                </div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session._id || session.id}
                    onClick={() => onJoin(session)}
                    className="w-full p-3.5 bg-gray-50 rounded-xl border border-gray-100
                              hover:bg-brand-navy-light/30 hover:border-brand-navy-mid/20 transition-all
                              flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-gray-100 
                                     group-hover:border-brand-navy-mid/20 group-hover:shadow-sm transition-all">
                        <MessageSquare className="text-gray-400 group-hover:text-brand-navy-mid" size={14} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-medium text-gray-800">{session.session_name || session.name}</h4>
                        <p className="text-xs text-gray-400 font-mono">
                          {session.created_at ? new Date(session.created_at).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="text-gray-300 group-hover:text-brand-navy-mid group-hover:translate-x-0.5 transition-all" size={16} />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrainstormPlatformPage;
