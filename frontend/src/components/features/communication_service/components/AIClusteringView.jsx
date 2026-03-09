/**
 * AI Clustering View Component (Screen 4)
 * Dynamically clusters session ideas via the backend Groq LLM endpoint.
 */
import React, { useState, useEffect, useCallback } from 'react';
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
  Clock,
  AlertCircle,
  RefreshCw,
  Shield,
} from 'lucide-react';
import useBrainstormStore from '../store/brainstormStore';
import { clusterIdeas } from '../api/brainstormApi';

// Map icon name strings (from backend) to lucide-react components
const ICON_MAP = {
  Lightbulb,
  Users,
  Settings,
  Star,
  Zap,
  TrendingUp,
  Layers,
  Shield,
};

const AIClusteringView = () => {
  const [expandedClusters, setExpandedClusters] = useState({});
  const [copiedSummary, setCopiedSummary] = useState(false);

  const { currentSession, setCurrentScreen, clustering, setClustering, resetClustering } =
    useBrainstormStore();

  const { clusters, summary, totalIdeas, totalClusters, isLoading, error } = clustering;

  // Fetch clusters from the backend
  const fetchClusters = useCallback(async () => {
    const sessionId = currentSession?._id || currentSession?.id;
    if (!sessionId) return;

    setClustering({ isLoading: true, error: null });

    try {
      const data = await clusterIdeas(sessionId);
      // Auto-expand the first two clusters
      const initialExpanded = {};
      (data.clusters || []).slice(0, 2).forEach((c) => {
        initialExpanded[c.id] = true;
      });
      setExpandedClusters(initialExpanded);

      setClustering({
        clusters: data.clusters || [],
        summary: data.summary || null,
        totalIdeas: data.total_ideas || 0,
        totalClusters: data.total_clusters || 0,
        isLoading: false,
      });
    } catch (err) {
      console.error('Clustering failed:', err);
      const message =
        err?.response?.data?.detail || err.message || 'Clustering failed. Please try again.';
      setClustering({ isLoading: false, error: message });
    }
  }, [currentSession, setClustering]);

  useEffect(() => {
    resetClustering();
    fetchClusters();
  }, []);

  const toggleCluster = (clusterId) => {
    setExpandedClusters((prev) => ({ ...prev, [clusterId]: !prev[clusterId] }));
  };

  const handleCopySummary = () => {
    if (!summary) return;
    const textSummary = `${summary.overview}\n\nKey Insights:\n${(summary.insights || [])
      .map((i) => '• ' + i.text)
      .join('\n')}\n\nRecommendations:\n${(summary.recommendations || [])
      .map((r, i) => i + 1 + '. ' + r)
      .join('\n')}`;
    navigator.clipboard.writeText(textSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleExport = () => {
    const exportData = {
      summary,
      clusters: clusters.map((c) => ({
        name: c.name,
        summary: c.summary,
        ideas: c.ideas.map((i) => ({ text: i.text, original_text: i.original_text, author: i.author })),
      })),
      generated_at: new Date().toISOString(),
      total_ideas: totalIdeas,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brainstorm-clusters-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute stats
  const topCluster = clusters.reduce(
    (max, c) => (c.ideas.length > max.count ? { name: c.name, count: c.ideas.length } : max),
    { name: '', count: 0 }
  );

  // ---- Loading state ----
  if (isLoading) {
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
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
              <AlertCircle className="text-red-500" size={36} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Clustering Failed</h3>
              <p className="text-gray-500 mt-2 max-w-md">{error}</p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setCurrentScreen('board')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-gray-700 font-medium"
              >
                <ArrowLeft size={18} />
                Back to Board
              </button>
              <button
                onClick={fetchClusters}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors text-white font-medium"
              >
                <RefreshCw size={18} />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Empty state ----
  if (!clusters.length) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center">
              <Layers className="text-purple-400" size={36} />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">No Clusters Yet</h3>
            <p className="text-gray-500">Add ideas to your brainstorming session and try again.</p>
            <button
              onClick={() => setCurrentScreen('board')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors text-white font-medium mt-2"
            >
              <ArrowLeft size={18} />
              Back to Board
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Main view ----
  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
                  {totalIdeas} idea{totalIdeas !== 1 ? 's' : ''} organized into {totalClusters} theme
                  {totalClusters !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchClusters}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors text-white font-medium"
                title="Re-cluster ideas"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={() => setCurrentScreen('board')}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors text-white font-medium"
              >
                <ArrowLeft size={18} />
                <span>Back to Board</span>
              </button>
            </div>
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <Layers className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalClusters}</p>
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
              <p className="text-lg font-bold text-gray-800 truncate">{topCluster.name || '—'}</p>
              <p className="text-sm text-gray-500">Largest Theme ({topCluster.count} ideas)</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Sparkles className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {summary?.insights?.length || 0}
              </p>
              <p className="text-sm text-gray-500">AI Insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary Section */}
      {summary && (
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
            <p className="text-gray-700 font-medium">{summary.overview}</p>

            {summary.insights?.length > 0 && (
              <div>
                <p className="font-semibold text-purple-800 mb-2">Key Insights:</p>
                <div className="space-y-2">
                  {summary.insights.map((insight, i) => (
                    <p key={i} className="text-gray-700 flex items-start gap-2">
                      <span>{insight.icon}</span>
                      <span>{insight.text}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {summary.recommendations?.length > 0 && (
              <div>
                <p className="font-semibold text-purple-800 mb-2">Recommended Actions:</p>
                <ol className="space-y-1">
                  {summary.recommendations.map((rec, i) => (
                    <li key={i} className="text-gray-700 ml-4">
                      {i + 1}. {rec}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Theme Clusters */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Layers size={20} className="text-purple-500" />
          Theme Clusters
        </h3>

        {clusters.map((cluster) => {
          const IconComponent = ICON_MAP[cluster.icon] || Layers;
          const isExpanded = expandedClusters[cluster.id];
          const color = cluster.color || {};

          return (
            <div
              key={cluster.id}
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-lg"
            >
              {/* Cluster Header */}
              <button
                onClick={() => toggleCluster(cluster.id)}
                className={`w-full px-5 py-4 flex items-center justify-between ${color.bg || 'bg-gray-50'} 
                           border-b ${color.border || 'border-gray-200'} hover:brightness-95 transition-all`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 bg-white rounded-xl border ${color.border || 'border-gray-200'} shadow-sm`}>
                    <IconComponent className={color.icon || 'text-gray-500'} size={22} />
                  </div>
                  <div className="text-left">
                    <h4 className={`font-semibold ${color.text || 'text-gray-700'} text-lg`}>
                      {cluster.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-0.5">{cluster.summary}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 ${color.badge || 'bg-gray-100'} border ${
                      color.border || 'border-gray-200'
                    } rounded-full text-sm font-medium ${color.text || 'text-gray-700'}`}
                  >
                    {cluster.ideas.length} idea{cluster.ideas.length !== 1 ? 's' : ''}
                  </span>
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
                      className="p-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-gray-800 leading-relaxed">{idea.text}</p>
                          {idea.original_text && idea.original_text !== idea.text && (
                            <p className="text-xs text-gray-400 mt-1 italic">
                              Original: {idea.original_text}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-3 flex-wrap">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Users size={14} />
                              {idea.author}
                            </span>
                            {idea.time && (
                              <span className="text-sm text-gray-400 flex items-center gap-1">
                                <Clock size={14} />
                                {typeof idea.time === 'string' && idea.time.includes('T')
                                  ? new Date(idea.time).toLocaleTimeString()
                                  : idea.time}
                              </span>
                            )}
                            {idea.is_hesitant && (
                              <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs font-medium">
                                hesitant
                              </span>
                            )}
                            {idea.tags?.length > 0 && (
                              <div className="flex gap-1.5 flex-wrap">
                                {idea.tags.map((tag, ti) => (
                                  <span
                                    key={ti}
                                    className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {idea.entities?.length > 0 && (
                              <div className="flex gap-1.5 flex-wrap">
                                {idea.entities.map((ent, ei) => (
                                  <span
                                    key={ei}
                                    className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs font-medium"
                                  >
                                    {ent.text || ent}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
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
          Clusters generated using AI based on idea content and semantic similarity
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
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all"
          >
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIClusteringView;
