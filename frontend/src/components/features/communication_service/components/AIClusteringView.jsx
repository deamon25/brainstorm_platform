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
  BarChart3,
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

// Colors for cluster dots
const CLUSTER_COLORS = ['#185FA5', '#1D9E75', '#7F77DD', '#D85A30', '#B5539F', '#2B8A82'];

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
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-brand-navy-light rounded-2xl flex items-center justify-center">
                <Brain className="text-brand-navy-mid animate-pulse" size={32} />
              </div>
              <Sparkles className="absolute -top-2 -right-2 text-brand-navy-mid animate-bounce" size={18} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Analyzing Ideas...</h3>
              <p className="text-sm text-gray-400 mt-1">Clustering by themes and generating insights</p>
            </div>
            <div className="flex gap-1.5 mt-2">
              <div className="w-2 h-2 bg-brand-navy-mid/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-brand-navy-mid/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-brand-navy-mid/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
              <AlertCircle className="text-red-400" size={28} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Clustering Failed</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-md">{error}</p>
            </div>
            <div className="flex gap-2.5 mt-2">
              <button
                onClick={() => setCurrentScreen('board')}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-gray-600 text-xs font-medium"
              >
                <ArrowLeft size={14} />
                Back to Board
              </button>
              <button
                onClick={fetchClusters}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-navy rounded-xl hover:bg-brand-navy-mid transition-colors text-white text-xs font-medium"
              >
                <RefreshCw size={14} />
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
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center">
              <Layers className="text-purple-400" size={28} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">No Clusters Yet</h3>
            <p className="text-sm text-gray-400">Add ideas to your brainstorming session and try again.</p>
            <button
              onClick={() => setCurrentScreen('board')}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-navy rounded-xl hover:bg-brand-navy-mid transition-colors text-white text-xs font-medium mt-2"
            >
              <ArrowLeft size={14} />
              Back to Board
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Main view ----
  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-xl">
            <BarChart3 className="text-purple-500" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">AI Clustering & Insights</h2>
            <p className="text-xs text-gray-400">
              {totalIdeas} idea{totalIdeas !== 1 ? 's' : ''} organized into {totalClusters} theme{totalClusters !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchClusters}
            className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-all"
            title="Re-cluster"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setCurrentScreen('board')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-lg text-xs font-medium
                       text-gray-600 hover:bg-gray-200 transition-all"
          >
            <ArrowLeft size={14} />
            <span>Board</span>
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Lightbulb, label: 'Total Ideas', value: totalIdeas, color: 'bg-brand-navy-light text-brand-navy-mid' },
          { icon: Layers, label: 'Themes Found', value: totalClusters, color: 'bg-purple-50 text-purple-500' },
          { icon: TrendingUp, label: 'Largest Theme', value: topCluster.count, sublabel: topCluster.name, color: 'bg-amber-50 text-amber-500' },
          { icon: Sparkles, label: 'AI Insights', value: summary?.insights?.length || 0, color: 'bg-brand-teal-light text-brand-teal' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xl font-semibold text-gray-800">{stat.value}</p>
                <p className="text-xs text-gray-400 truncate">{stat.sublabel || stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="bg-white rounded-xl border border-gray-200/60 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FileText className="text-purple-500" size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Session Summary</h3>
                <p className="text-xs text-gray-400">AI-generated from your brainstorming</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1 px-2.5 py-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors text-xs"
              >
                {copiedSummary ? <Check size={13} className="text-brand-teal" /> : <Copy size={13} />}
                <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-2.5 py-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors text-xs"
              >
                <Download size={13} />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">{summary.overview}</p>

            {summary.insights?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Key Insights</p>
                <div className="space-y-1.5">
                  {summary.insights.map((insight, i) => (
                    <p key={i} className="text-xs text-gray-600 flex items-start gap-2 leading-relaxed">
                      <span className="text-sm">{insight.icon}</span>
                      <span>{insight.text}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {summary.recommendations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Recommendations</p>
                <ol className="space-y-1">
                  {summary.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2 leading-relaxed">
                      <span className="font-mono text-gray-400 text-xs">{i + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Theme Clusters */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <Layers size={12} className="text-purple-400" />
          Theme Clusters
        </h3>

        <div className="grid md:grid-cols-2 gap-3">
          {clusters.map((cluster, clusterIndex) => {
            const IconComponent = ICON_MAP[cluster.icon] || Layers;
            const isExpanded = expandedClusters[cluster.id];
            const color = cluster.color || {};
            const dotColor = CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length];

            return (
              <div
                key={cluster.id}
                className="bg-white rounded-xl border border-gray-200/60 overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                {/* Cluster Header */}
                <button
                  onClick={() => toggleCluster(cluster.id)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dotColor }}
                    ></div>
                    <div className="text-left min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 truncate">{cluster.name}</h4>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{cluster.summary}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
                    <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                      {cluster.ideas.length}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="text-gray-300" size={16} />
                    ) : (
                      <ChevronRight className="text-gray-300" size={16} />
                    )}
                  </div>
                </button>

                {/* Cluster Ideas */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-2 border-t border-gray-50 animate-fade-in">
                    {cluster.ideas.map((idea) => (
                      <div
                        key={idea.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-all"
                      >
                        <p className="text-xs text-gray-800 leading-relaxed">{idea.text}</p>
                        {idea.original_text && idea.original_text !== idea.text && (
                          <p className="text-xs text-gray-400 mt-1.5 italic">
                            Original: {idea.original_text}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                            <Users size={11} />
                            {idea.author}
                          </span>
                          {idea.time && (
                            <span className="text-xs text-gray-300 flex items-center gap-1 font-mono">
                              <Clock size={11} />
                              {typeof idea.time === 'string' && idea.time.includes('T')
                                ? new Date(idea.time).toLocaleTimeString()
                                : idea.time}
                            </span>
                          )}
                          {idea.is_hesitant && (
                            <span className="px-2 py-0.5 bg-hesitation-med text-hesitation-med-text rounded text-xs font-mono font-medium">
                              hesitant
                            </span>
                          )}
                          {idea.tags?.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {idea.tags.map((tag, ti) => (
                                <span key={ti} className="px-2 py-0.5 bg-brand-navy-light text-brand-navy-mid rounded text-xs font-mono">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {idea.entities?.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {idea.entities.map((ent, ei) => (
                                <span key={ei} className="px-2 py-0.5 bg-entity-sprint-bg text-entity-sprint-text rounded text-xs font-mono">
                                  {ent.text || ent}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl border border-gray-200/60 p-4 flex items-center justify-between shadow-sm">
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <Sparkles size={12} className="text-purple-400" />
          <span className="font-mono">Clusters generated using AI semantic similarity</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentScreen('capture')}
            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            Add More Ideas
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-brand-navy text-brand-navy-light rounded-lg text-xs font-medium
                       shadow-md shadow-brand-navy/15 hover:shadow-lg transition-all"
          >
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIClusteringView;
