/**
 * Preview Mode Component (Screen 2)
 * AI-enhanced idea preview with tone control
 * This is the core innovation - always shown to boost user confidence
 */
import React, { useState } from 'react';
import {
  Eye,
  Check,
  Edit3,
  X,
  Sparkles,
  AlertTriangle,
  Tag,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import useBrainstormStore from '../store/brainstormStore';
import { createIdea, rephraseText } from '../api/brainstormApi';

const PreviewMode = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [localRephrasedText, setLocalRephrasedText] = useState(null);
  
  const {
    draftIdea,
    previewData,
    currentSession,
    isAnonymous,
    participantId,
    isLoading,
    setIsLoading,
    setCurrentScreen,
    addIdea,
    resetTypingMetrics,
    setDraftIdea,
    setPreviewData,
  } = useBrainstormStore();

  if (!previewData || !draftIdea) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <AlertTriangle className="mx-auto text-yellow-500 mb-3\" size={32} />
          <p className="text-yellow-800">No idea to preview. Please go back and enter your idea.</p>
          <button
            onClick={() => setCurrentScreen('capture')}
            className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Back to Capture
          </button>
        </div>
      </div>
    );
  }

  const displayRephrasedText = localRephrasedText || previewData.rephrased_text || draftIdea.original_text;
  const hesitationInfo = previewData.hesitation;
  const rephraseModel = previewData.rephrase_model;

  const handleAccept = async () => {
    console.log('Accept clicked - currentSession:', currentSession);
    setIsLoading(true);
    try {
      // Use session ID or create a default one
      const sessionId = currentSession?._id || currentSession?.id || 'default_session';
      
      const ideaData = {
        session_id: sessionId,
        participant_id: isAnonymous ? null : (participantId || 'user_' + Date.now()),
        original_text: draftIdea.original_text,
        rephrased_text: displayRephrasedText,
        entities: previewData.entities || [],
        hesitation_score: hesitationInfo?.score || 0,
        is_hesitant: hesitationInfo?.is_hesitant || false,
        typing_metrics: draftIdea.typing_metrics || {},
        is_approved: true,
        tags: [],
      };

      console.log('Creating idea with data:', ideaData);
      const createdIdea = await createIdea(ideaData);
      console.log('Idea created:', createdIdea);
      addIdea(createdIdea);
      
      // Reset and go to board
      resetTypingMetrics();
      setDraftIdea(null);
      setPreviewData(null);
      setCurrentScreen('board');
    } catch (error) {
      console.error('Error creating idea:', error);
      alert('Failed to save idea: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setEditedText(displayRephrasedText);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setLocalRephrasedText(editedText);
    setIsEditing(false);
  };

  const handleReject = () => {
    setDraftIdea(null);
    setPreviewData(null);
    resetTypingMetrics();
    setCurrentScreen('capture');
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const result = await rephraseText(draftIdea.original_text);
      setLocalRephrasedText(result.rephrased_text);
    } catch (error) {
      console.error('Error regenerating:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const getHesitationBadge = () => {
    if (!hesitationInfo) return null;
    
    if (hesitationInfo.is_hesitant) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm">
          <AlertTriangle size={14} />
          <span>We noticed some hesitation — take your time to review</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm">
        <Check size={14} />
        <span>Your idea looks confident!</span>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Eye className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Review Before Sharing</h2>
              <p className="text-purple-100 text-sm mt-0.5">
                See how AI enhanced your idea — you have full control
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Hesitation Badge */}
          <div className="flex justify-center">
            {getHesitationBadge()}
          </div>

          {/* Comparison Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original Text */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                Your Original
              </h3>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-[120px]">
                <p className="text-gray-700 leading-relaxed">{draftIdea.original_text}</p>
              </div>
            </div>

            {/* Enhanced Text */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wide flex items-center gap-2">
                <Sparkles size={14} />
                AI Enhanced
              </h3>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 min-h-[120px] relative">
                {isEditing ? (
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full h-full min-h-[100px] bg-white rounded-lg p-3 border border-purple-300 
                               focus:ring-2 focus:ring-purple-500 resize-none"
                    autoFocus
                  />
                ) : (
                  <p className="text-gray-800 leading-relaxed">{displayRephrasedText}</p>
                )}
                {rephraseModel && !isEditing && (
                  <span className="absolute top-3 right-3 text-[11px] px-2 py-0.5 rounded-full bg-white text-purple-700 border border-purple-200">
                    {rephraseModel}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Arrow indicator for mobile */}
          <div className="md:hidden flex justify-center">
            <ArrowRight className="text-purple-400" size={24} />
          </div>

          {/* Entities Detected */}
          {previewData.entities && previewData.entities.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <Tag size={16} />
                Key Elements Preserved
              </h4>
              <div className="flex flex-wrap gap-2">
                {previewData.entities.map((entity, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm font-medium
                               border border-blue-200 shadow-sm"
                  >
                    {entity.text}
                    <span className="ml-1 text-blue-400 text-xs">({entity.label})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Expandable Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-600">Technical Details</span>
            {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showDetails && (
            <div className="p-4 bg-gray-50 rounded-xl space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">Hesitation Score:</span>
                  <span className="ml-2 font-mono text-gray-800">
                    {hesitationInfo?.score?.toFixed(4) || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Backspaces:</span>
                  <span className="ml-2 font-mono text-gray-800">
                    {hesitationInfo?.metrics?.delFreq || draftIdea.typing_metrics?.delFreq || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Cursor Movements:</span>
                  <span className="ml-2 font-mono text-gray-800">
                    {hesitationInfo?.metrics?.leftFreq || draftIdea.typing_metrics?.leftFreq || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Typing Time:</span>
                  <span className="ml-2 font-mono text-gray-800">
                    {((hesitationInfo?.metrics?.TotTime || draftIdea.typing_metrics?.TotTime || 0) / 1000).toFixed(1)}s
                  </span>
                </div>
              </div>
              {previewData.masked_text && (
                <div className="pt-3 border-t border-gray-200">
                  <span className="text-gray-500">Entity-restored Text:</span>
                  <p className="mt-1 font-mono text-xs text-gray-600 bg-white p-2 rounded">
                    {previewData.masked_text}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
            {/* Left side - Regenerate */}
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-800 
                         hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <RefreshCw className={isRegenerating ? 'animate-spin' : ''} size={18} />
              <span>Regenerate</span>
            </button>

            {/* Right side - Main actions */}
            <div className="flex items-center gap-3">
              {/* Reject */}
              <button
                onClick={handleReject}
                className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 
                           rounded-xl font-medium transition-all duration-200"
              >
                <X size={18} />
                <span>Discard</span>
              </button>

              {/* Edit */}
              {isEditing ? (
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700
                             rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                >
                  <Check size={18} />
                  <span>Save Edit</span>
                </button>
              ) : (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700
                             rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
                >
                  <Edit3 size={18} />
                  <span>Edit</span>
                </button>
              )}

              {/* Accept */}
              <button
                onClick={handleAccept}
                disabled={isLoading || isEditing}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500
                           text-white rounded-xl font-semibold shadow-lg shadow-green-500/30
                           hover:shadow-xl hover:shadow-green-500/40 hover:scale-105
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                           transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    <span>Accept & Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewMode;
