/**
 * AI Clustering View Component (Screen 4)
 * DEMO VERSION - Hardcoded data to show how clustering works
 */
import React, { useState, useEffect } from 'react';
import {
  Layers,
  Lightbulb,
  Zap,
  Users,
  TrendingUp,
  Settings,
  Star,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Brain,
  FileText,
  Copy,
  Check,
  Download,
  ThumbsUp,
  Clock,
} from 'lucide-react';
import useBrainstormStore from '../store/brainstormStore';

// ============================================================
// HARDCODED DEMO DATA - Shows how clustering feature works
// ============================================================

const DEMO_CLUSTERS = [
  {
    id: 'innovation',
    name: 'Innovation & Features',
    icon: Lightbulb,
    color: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500', badge: 'bg-amber-100' },
    summary: 'Ideas focused on new features and creative improvements to enhance user experience.',
    ideas: [
      { id: '1', text: 'Add AI-powered autocomplete suggestions to speed up idea entry', votes: 12, author: 'Alice', time: '5m ago', tags: ['AI', 'UX'] },
      { id: '2', text: 'Implement real-time collaboration with cursor presence indicators', votes: 8, author: 'Bob', time: '12m ago', tags: ['collaboration', 'real-time'] },
      { id: '3', text: 'Create a mobile app version for brainstorming on the go', votes: 15, author: 'Carol', time: '18m ago', tags: ['mobile'] },
      { id: '4', text: 'Add voice-to-text feature for hands-free idea capture', votes: 6, author: 'David', time: '25m ago', tags: ['voice', 'accessibility'] },
    ],
  },
  {
    id: 'teamwork',
    name: 'Team Collaboration',
    icon: Users,
    color: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-500', badge: 'bg-green-100' },
    summary: 'Suggestions for improving team dynamics and collaborative workflows.',
    ideas: [
      { id: '5', text: 'Weekly team sync meetings to align on sprint goals', votes: 10, author: 'Emma', time: '8m ago', tags: ['meetings', 'sprint'] },
      { id: '6', text: 'Create shared knowledge base for onboarding new members', votes: 7, author: 'Frank', time: '15m ago', tags: ['knowledge', 'onboarding'] },
      { id: '7', text: 'Implement anonymous feedback system for psychological safety', votes: 14, author: 'Grace', time: '22m ago', tags: ['feedback', 'culture'] },
    ],
  },
  {
    id: 'technical',
    name: 'Technical Improvements',
    icon: Settings,
    color: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: 'text-slate-500', badge: 'bg-slate-100' },
    summary: 'Backend optimizations and technical debt reduction initiatives.',
    ideas: [
      { id: '8', text: 'Migrate database to PostgreSQL for better query performance', votes: 9, author: 'Henry', time: '10m ago', tags: ['database'] },
      { id: '9', text: 'Implement caching layer to reduce API response times', votes: 11, author: 'Ivy', time: '20m ago', tags: ['caching', 'API'] },
      { id: '10', text: 'Add comprehensive error logging and monitoring dashboard', votes: 5, author: 'Jack', time: '30m ago', tags: ['logging', 'monitoring'] },
    ],
  },
  {
    id: 'quality',
    name: 'Quality & Testing',
    icon: Star,
    color: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'text-indigo-500', badge: 'bg-indigo-100' },
    summary: 'Quality assurance practices and testing infrastructure improvements.',
    ideas: [
      { id: '11', text: 'Increase unit test coverage to 80% minimum across all modules', votes: 8, author: 'Kate', time: '7m ago', tags: ['testing', 'coverage'] },
      { id: '12', text: 'Set up automated E2E testing pipeline with CI/CD integration', votes: 13, author: 'Leo', time: '14m ago', tags: ['E2E', 'automation'] },
    ],
  },
  {
    id: 'performance',
    name: 'Performance Goals',
    icon: Zap,
    color: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500', badge: 'bg-blue-100' },
    summary: 'Speed and efficiency optimization targets for the platform.',
    ideas: [
      { id: '13', text: 'Reduce initial page load time to under 2 seconds globally', votes: 16, author: 'Mike', time: '3m ago', tags: ['load time', 'performance'] },
      { id: '14', text: 'Optimize image assets with lazy loading and WebP format', votes: 7, author: 'Nina', time: '11m ago', tags: ['images', 'optimization'] },
    ],
  },
];

const DEMO_SUMMARY = {
  overview: 'Your team has generated 14 ideas across 5 themes in this brainstorming session.',
  insights: [
    { icon: '📊', text: 'Performance Goals has the highest engagement with 23 total votes' },
    { icon: '💡', text: 'Innovation & Features contains the most ideas (4), showing strong creative energy' },
    { icon: '⚖️', text: 'The team shows balanced focus between technical and collaborative improvements' },
  ],
  recommendations: [
    'Prioritize "Reduce initial page load time" - highest voted idea (16 votes)',
    'Schedule a follow-up discussion on Innovation cluster ideas',
    'Assign owners to Quality & Testing initiatives before next sprint',
  ],
};

// ============================================================
// COMPONENT
// ============================================================

const AIClusteringView = () => {
  const [expandedClusters, setExpandedClusters] = useState({ innovation: true, teamwork: true });
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  
  const { setCurrentScreen } = useBrainstormStore();

  // Simulate AI processing animation
  useEffect(() => {
    const timer = setTimeout(() => setIsGenerating(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const toggleCluster = (clusterId) => {
    setExpandedClusters(prev => ({
      ...prev,
      [clusterId]: !prev[clusterId],
    }));
  };

  const handleCopySummary = () => {
    const textSummary = `${DEMO_SUMMARY.overview}\n\nKey Insights:\n${DEMO_SUMMARY.insights.map(i => '• ' + i.text).join('\n')}\n\nRecommendations:\n${DEMO_SUMMARY.recommendations.map((r, i) => (i + 1) + '. ' + r).join('\n')}`;
    navigator.clipboard.writeText(textSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleExport = () => {
    const exportData = {
      summary: DEMO_SUMMARY,
      clusters: DEMO_CLUSTERS.map(c => ({
        name: c.name,
        summary: c.summary,
        ideas: c.ideas.map(i => ({ text: i.text, votes: i.votes, author: i.author })),
      })),
      generated_at: new Date().toISOString(),
      total_ideas: DEMO_CLUSTERS.reduce((acc, c) => acc + c.ideas.length, 0),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brainstorm-clusters-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate stats from demo data
  const totalIdeas = DEMO_CLUSTERS.reduce((acc, c) => acc + c.ideas.length, 0);
  const totalVotes = DEMO_CLUSTERS.reduce((acc, c) => acc + c.ideas.reduce((a, i) => a + i.votes, 0), 0);
  const topCluster = DEMO_CLUSTERS.reduce((max, c) => {
    const votes = c.ideas.reduce((a, i) => a + i.votes, 0);
    return votes > max.votes ? { name: c.name, votes } : max;
  }, { name: '', votes: 0 });

  // Loading state
  if (isGenerating) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                <Brain className="text-purple-500 animate-pulse" size={40} />
              </div>
              <Sparkles className="absolute -top-2 -right-2 text-purple-400 animate-bounce" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">AI is Analyzing Ideas...</h3>
              <p className="text-gray-500 mt-2">Clustering by themes and generating insights</p>
            </div>
            <div className="flex gap-2 mt-4">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Sparkles className="text-amber-600" size={20} />
        </div>
        <div>
          <p className="font-medium text-amber-800">Demo Mode - Hardcoded Clusters</p>
          <p className="text-sm text-amber-600">This shows how AI clustering will organize your team's ideas</p>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Brain className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">AI Clustering & Insights</h2>
                <p className="text-purple-100 text-sm mt-0.5">
                  {totalIdeas} ideas organized into {DEMO_CLUSTERS.length} themes
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentScreen('board')}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl
                         hover:bg-white/30 transition-colors text-white font-medium"
            >
              <ArrowLeft size={18} />
              <span>Back to Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Lightbulb className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalIdeas}</p>
              <p className="text-sm text-gray-500">Total Ideas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ThumbsUp className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalVotes}</p>
              <p className="text-sm text-gray-500">Total Votes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Layers className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{DEMO_CLUSTERS.length}</p>
              <p className="text-sm text-gray-500">Themes Found</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 truncate">{topCluster.name}</p>
              <p className="text-sm text-gray-500">Top Theme ({topCluster.votes} votes)</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
              <FileText className="text-purple-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">AI-Generated Summary</h3>
              <p className="text-sm text-gray-500">Key insights from your brainstorming session</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              {copiedSummary ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              <span>{copiedSummary ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 space-y-4">
          <p className="text-gray-700 font-medium">{DEMO_SUMMARY.overview}</p>
          
          <div>
            <p className="font-semibold text-purple-800 mb-2">Key Insights:</p>
            <div className="space-y-2">
              {DEMO_SUMMARY.insights.map((insight, i) => (
                <p key={i} className="text-gray-700 flex items-start gap-2">
                  <span>{insight.icon}</span>
                  <span>{insight.text}</span>
                </p>
              ))}
            </div>
          </div>
          
          <div>
            <p className="font-semibold text-purple-800 mb-2">Recommended Actions:</p>
            <ol className="space-y-1">
              {DEMO_SUMMARY.recommendations.map((rec, i) => (
                <li key={i} className="text-gray-700 ml-4">{i + 1}. {rec}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Theme Clusters */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Layers size={20} className="text-purple-500" />
          Theme Clusters
        </h3>
        
        {DEMO_CLUSTERS.map((cluster) => {
          const IconComponent = cluster.icon;
          const isExpanded = expandedClusters[cluster.id];
          const clusterVotes = cluster.ideas.reduce((acc, i) => acc + i.votes, 0);

          return (
            <div
              key={cluster.id}
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-lg"
            >
              {/* Cluster Header */}
              <button
                onClick={() => toggleCluster(cluster.id)}
                className={`w-full px-5 py-4 flex items-center justify-between ${cluster.color.bg} 
                           border-b ${cluster.color.border} hover:brightness-95 transition-all`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 bg-white rounded-xl border ${cluster.color.border} shadow-sm`}>
                    <IconComponent className={cluster.color.icon} size={22} />
                  </div>
                  <div className="text-left">
                    <h4 className={`font-semibold ${cluster.color.text} text-lg`}>{cluster.name}</h4>
                    <p className="text-sm text-gray-600 mt-0.5">{cluster.summary}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 ${cluster.color.badge} border ${cluster.color.border} rounded-full 
                                    text-sm font-medium ${cluster.color.text}`}>
                      {cluster.ideas.length} idea{cluster.ideas.length !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <ThumbsUp size={14} />
                      {clusterVotes}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="text-gray-400" size={20} />
                  ) : (
                    <ChevronRight className="text-gray-400" size={20} />
                  )}
                </div>
              </button>

              {/* Cluster Ideas */}
              {isExpanded && (
                <div className="p-4 space-y-3 bg-gray-50/50">
                  {cluster.ideas.map((idea) => (
                    <div
                      key={idea.id}
                      className="p-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 
                                 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-gray-800 leading-relaxed">{idea.text}</p>
                          <div className="flex items-center gap-4 mt-3 flex-wrap">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Users size={14} />
                              {idea.author}
                            </span>
                            <span className="text-sm text-gray-400 flex items-center gap-1">
                              <Clock size={14} />
                              {idea.time}
                            </span>
                            {idea.tags && idea.tags.length > 0 && (
                              <div className="flex gap-1.5 flex-wrap">
                                {idea.tags.map((tag, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                                          ${cluster.color.bg} ${cluster.color.text} border ${cluster.color.border}`}>
                            <ThumbsUp size={14} />
                            {idea.votes}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <Sparkles size={14} className="inline mr-1 text-purple-500" />
          Clusters are automatically generated using AI based on idea content and themes
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentScreen('capture')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Add More Ideas
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium
                       shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all"
          >
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIClusteringView;
