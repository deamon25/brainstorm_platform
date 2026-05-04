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
  ArrowLeft,
} from 'lucide-react';
import useBrainstormStore from '../store/brainstormStore';
import { createIdea, rephraseText } from '../api/brainstormApi';

import { getEntityColor } from '../utils/entityColor';

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
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <AlertTriangle className="mx-auto text-amber-400 mb-3" size={28} />
          <p className="text-amber-700 text-sm mb-4">No idea to preview. Please go back and enter your idea.</p>
          <button
            onClick={() => setCurrentScreen('capture')}
            className="px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-navy-mid transition-colors"
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

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-navy-light rounded-xl">
            <Eye className="text-brand-navy-mid" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Review Before Sharing</h2>
            <p className="text-xs text-gray-400">Compare your original with the AI-enhanced version</p>
          </div>
        </div>
        {/* Hesitation Badge */}
        {hesitationInfo && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            hesitationInfo.is_hesitant 
              ? 'bg-hesitation-med text-hesitation-med-text' 
              : 'bg-hesitation-low text-hesitation-low-text'
          }`}>
            {hesitationInfo.is_hesitant 
              ? <><AlertTriangle size={13} /><span>Hesitation detected</span></>
              : <><Check size={13} /><span>Confident delivery</span></>
            }
          </div>
        )}
      </div>

      {/* Comparison Section */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Original Text */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
            Original
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">{draftIdea.original_text}</p>
        </div>

        {/* Enhanced Text */}
        <div className="bg-white rounded-xl border border-brand-navy-mid/20 p-5 shadow-sm relative">
          <h3 className="text-xs font-semibold text-brand-navy-mid uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Sparkles size={12} />
            AI Enhanced
            {rephraseModel && !isEditing && (
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-brand-navy-light text-brand-navy-mid font-mono font-normal normal-case">
                {rephraseModel}
              </span>
            )}
          </h3>
          {isEditing ? (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full h-full min-h-24 bg-gray-50 rounded-lg p-3 border border-brand-navy-mid/20 
                         focus:ring-2 focus:ring-brand-navy-mid/15 resize-none text-sm outline-none"
              autoFocus
            />
          ) : (
            <p className="text-sm text-gray-800 leading-relaxed">{displayRephrasedText}</p>
          )}
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="bg-white rounded-xl border border-gray-200/60 p-5 shadow-sm mb-4">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Analysis Summary
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg px-3 py-2.5">
            <p className="text-xs text-gray-400 mb-0.5">Entities</p>
            <p className="font-mono text-lg font-semibold text-gray-800">{previewData.entities?.length || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2.5">
            <p className="text-xs text-gray-400 mb-0.5">Hesitation</p>
            <p className="font-mono text-lg font-semibold text-gray-800">{hesitationInfo?.score?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2.5">
            <p className="text-xs text-gray-400 mb-0.5">Suggestions</p>
            <p className="font-mono text-lg font-semibold text-gray-800">{previewData.suggestions?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Entities */}
      {previewData.entities && previewData.entities.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200/60 p-5 shadow-sm mb-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Tag size={12} className="text-gray-400" />
            Preserved Entities
          </h4>
          <div className="flex flex-wrap gap-2">
            {previewData.entities.map((entity, idx) => (
              <span
                key={idx}
                className={`font-mono text-xs font-medium px-2.5 py-1 rounded-lg ${getEntityColor(entity.label)}`}
              >
                {entity.text}
                <span className="ml-1.5 opacity-50">{entity.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Technical Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200/60 
                   hover:bg-gray-50 transition-colors text-xs font-medium text-gray-500 mb-4 shadow-sm"
      >
        <span>Technical Details</span>
        {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {showDetails && (
        <div className="bg-white rounded-xl border border-gray-200/60 p-5 shadow-sm mb-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400 text-xs">Hesitation Score</span>
              <p className="font-mono text-sm font-medium text-gray-800 mt-0.5">
                {hesitationInfo?.score?.toFixed(4) || 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Backspaces</span>
              <p className="font-mono text-sm font-medium text-gray-800 mt-0.5">
                {hesitationInfo?.metrics?.delFreq || draftIdea.typing_metrics?.delFreq || 0}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Cursor Movements</span>
              <p className="font-mono text-sm font-medium text-gray-800 mt-0.5">
                {hesitationInfo?.metrics?.leftFreq || draftIdea.typing_metrics?.leftFreq || 0}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Typing Time</span>
              <p className="font-mono text-sm font-medium text-gray-800 mt-0.5">
                {((hesitationInfo?.metrics?.TotTime || draftIdea.typing_metrics?.TotTime || 0) / 1000).toFixed(1)}s
              </p>
            </div>
          </div>
          {previewData.masked_text && (
            <div className="pt-4 mt-4 border-t border-gray-100">
              <span className="text-gray-400 text-xs">Entity-masked Text</span>
              <p className="mt-1.5 font-mono text-xs text-gray-500 bg-gray-50 p-3 rounded-lg leading-relaxed">
                {previewData.masked_text}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-2 px-4 py-2.5 text-gray-500 hover:text-brand-navy-mid 
                     hover:bg-brand-navy-light/30 rounded-xl transition-all duration-200 text-xs font-medium"
        >
          <RefreshCw className={isRegenerating ? 'animate-spin' : ''} size={14} />
          <span>Regenerate</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReject}
            className="flex items-center gap-1.5 px-4 py-2.5 text-gray-400 border border-gray-200 
                       rounded-xl text-xs font-medium hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
          >
            <X size={14} />
            <span>Discard</span>
          </button>

          {isEditing ? (
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-700
                         rounded-xl text-xs font-medium hover:bg-gray-200 transition-all"
            >
              <Check size={14} />
              <span>Save Edit</span>
            </button>
          ) : (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-700
                         rounded-xl text-xs font-medium hover:bg-gray-200 transition-all"
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </button>
          )}

          <button
            onClick={handleAccept}
            disabled={isLoading || isEditing}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-navy text-brand-navy-light
                       rounded-xl text-xs font-semibold shadow-lg shadow-brand-navy/20
                       hover:shadow-xl hover:shadow-brand-navy/30
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-200"
          >
            {isLoading ? (
              <><Loader2 className="animate-spin" size={14} /><span>Saving...</span></>
            ) : (
              <><Check size={14} /><span>Confirm & Submit</span><ArrowRight size={14} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewMode;
