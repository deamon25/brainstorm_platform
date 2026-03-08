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
  Settings,
  ChevronDown,
  Lightbulb,
  Brain,
  Layers,
  Edit3,
  Check,
  X,
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
        await checkHealth();
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
    { id: 'capture', label: 'Capture', icon: Edit3, color: 'blue' },
    { id: 'board', label: 'Board', icon: Lightbulb, color: 'indigo' },
    { id: 'clusters', label: 'Clusters', icon: Brain, color: 'purple' },
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
      <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg shadow-blue-500/30">
              <MessageSquare className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{module?.name || 'Brainstorm Platform'}</h1>
              <p className="text-gray-600 mt-1">AI-powered collaborative idea generation</p>
            </div>
          </div>

          {/* Backend Status */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8
                         ${backendStatus === 'connected' 
                           ? 'bg-green-100 text-green-700' 
                           : backendStatus === 'disconnected'
                             ? 'bg-red-100 text-red-700'
                             : 'bg-gray-100 text-gray-600'}`}>
            <span className={`w-2 h-2 rounded-full ${
              backendStatus === 'connected' ? 'bg-green-500' : 
              backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-gray-400'
            }`}></span>
            {backendStatus === 'connected' ? 'Backend Connected' : 
             backendStatus === 'disconnected' ? 'Backend Offline' : 'Checking...'}
          </div>

          {/* Main CTA */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-12 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="text-white" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Start a Brainstorming Session</h2>
              <p className="text-blue-100 max-w-md mx-auto">
                Create or join a session to start capturing ideas with AI-powered enhancements
              </p>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Create New Session */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl 
                               border border-blue-200 hover:shadow-lg transition-shadow">
                  <div className="p-3 bg-blue-100 rounded-xl w-fit mb-4">
                    <Plus className="text-blue-600" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Create New Session</h3>
                  <p className="text-gray-600 text-sm mb-4">Start a fresh brainstorming session for your team</p>
                  <button
                    onClick={() => setShowSessionModal(true)}
                    disabled={backendStatus !== 'connected'}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white
                               rounded-xl font-semibold shadow-lg shadow-blue-500/25
                               hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105
                               disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                               transition-all duration-200"
                  >
                    Create Session
                  </button>
                </div>

                {/* Join Existing */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl 
                               border border-purple-200 hover:shadow-lg transition-shadow">
                  <div className="p-3 bg-purple-100 rounded-xl w-fit mb-4">
                    <Users className="text-purple-600" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Join Existing Session</h3>
                  <p className="text-gray-600 text-sm mb-4">Collaborate with your team on an active session</p>
                  <button
                    onClick={() => setShowSessionModal(true)}
                    disabled={backendStatus !== 'connected'}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white
                               rounded-xl font-semibold shadow-lg shadow-purple-500/25
                               hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105
                               disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                               transition-all duration-200"
                  >
                    Browse Sessions
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {[
              { icon: Lightbulb, title: 'AI Enhancement', desc: 'Get suggestions to improve your ideas' },
              { icon: Layers, title: 'Auto Clustering', desc: 'Ideas grouped by theme automatically' },
              { icon: Brain, title: 'Hesitation Support', desc: 'AI detects and helps overcome doubt' },
            ].map((feature, idx) => (
              <div key={idx} className="p-4 bg-white rounded-xl border border-gray-100 flex items-center gap-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <feature.icon className="text-blue-500" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{feature.title}</h4>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              </div>
            ))}
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
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Session Header Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Session Info */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                <MessageSquare className="text-white" size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">{currentSession.session_name || currentSession.name}</h2>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {formatTime(timer)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Lightbulb size={14} />
                    {ideas.length} ideas
                  </span>
                </div>
              </div>
            </div>

            {/* Center - Navigation */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              {navTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentScreen(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                             transition-all duration-200
                             ${currentScreen === tab.id || (currentScreen === 'preview' && tab.id === 'capture')
                               ? 'bg-white text-blue-600 shadow-sm' 
                               : 'text-gray-600 hover:text-gray-800'
                             }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Right - Actions */}
            <button
              onClick={handleLeaveSession}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 
                         rounded-xl transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Leave Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto p-6">
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">Brainstorm Sessions</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors
                         ${activeTab === 'create' 
                           ? 'bg-blue-100 text-blue-700' 
                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Create New
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors
                         ${activeTab === 'join' 
                           ? 'bg-blue-100 text-blue-700' 
                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Join Existing
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'create' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Name
                </label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g., Sprint 5 Retrospective Ideas"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && onCreate()}
                />
              </div>
              <button
                onClick={onCreate}
                disabled={!newSessionName.trim() || isCreating}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white
                           rounded-xl font-semibold shadow-lg shadow-blue-500/25
                           hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Create Session
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessionsError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  {sessionsError}
                </div>
              )}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="text-gray-400" size={24} />
                  </div>
                  <p className="text-gray-500">No active sessions found</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 text-blue-600 font-medium hover:text-blue-800"
                  >
                    Create the first one
                  </button>
                </div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session._id || session.id}
                    onClick={() => onJoin(session)}
                    className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200
                              hover:bg-blue-50 hover:border-blue-200 transition-all
                              flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-gray-200 
                                     group-hover:border-blue-200 group-hover:bg-blue-50">
                        <MessageSquare className="text-gray-500 group-hover:text-blue-500" size={18} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-800">{session.session_name || session.name}</h4>
                        <p className="text-sm text-gray-500">
                          Created {session.created_at ? new Date(session.created_at).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="text-gray-400 group-hover:text-blue-500" size={18} />
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
