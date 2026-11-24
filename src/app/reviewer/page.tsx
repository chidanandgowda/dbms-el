'use client';

import { useState } from 'react';
import {
  FileText,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  Sliders,
  MessageSquare,
} from 'lucide-react';
import { useAcademic } from '@/lib/store';
import { RawPayloadModal } from '@/components/RawPayloadModal';
import { RebuttalThread } from '@/components/RebuttalThread';
import { BlindReviewerPaper } from '@/types/database';

export default function ReviewerWorkspace() {
  const { currentUser, getBlindReviewerPapers, submitReview } = useAcademic();
  const assignedPapers = getBlindReviewerPapers();

  const [selectedPaper, setSelectedPaper] = useState<BlindReviewerPaper | null>(
    assignedPapers[0] || null
  );

  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [originality, setOriginality] = useState(7);
  const [technical, setTechnical] = useState(8);
  const [clarity, setClarity] = useState(8);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'rubric' | 'rebuttal'>('rubric');

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 4;

  const isCompleted = selectedPaper?.assignment_status === 'COMPLETED';
  const weightedScore = Number((originality * 0.4 + technical * 0.4 + clarity * 0.2).toFixed(2));

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaper?.assignment_id || feedback.length < 10) return;

    setIsSubmitting(true);
    try {
      await submitReview({
        assignment_id: selectedPaper.assignment_id,
        originality_score: originality,
        technical_score: technical,
        clarity_score: clarity,
        written_feedback: feedback.trim(),
      });
      const updated = getBlindReviewerPapers().find((p) => p.paper_id === selectedPaper.paper_id);
      if (updated) setSelectedPaper(updated);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">
              Reviewer Workspace
            </h1>
            <span className="badge-double-blind text-[10px] px-2 py-0.5 rounded font-medium">
              Double-Blind Active
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Author identities are masked. Review manuscripts and submit grading scores.
          </p>
        </div>

        <button
          onClick={() => setIsInspectorOpen(true)}
          className="text-xs text-[#475569] hover:text-[#0F172A] border border-[#CBD5E1] bg-white px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-indigo-600" />
          <span>Inspect DB Payload</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Assigned Papers */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
          <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-[#0F172A]">
            Assigned Papers ({assignedPapers.length})
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {assignedPapers.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#94A3B8]">
                No papers assigned to you.
              </div>
            ) : (
              assignedPapers.map((paper) => {
                const isSelected = selectedPaper?.paper_id === paper.paper_id;
                const isDone = paper.assignment_status === 'COMPLETED';

                return (
                  <div
                    key={paper.paper_id}
                    onClick={() => {
                      setSelectedPaper(paper);
                      if (paper.existing_review) {
                        setOriginality(paper.existing_review.originality_score);
                        setTechnical(paper.existing_review.technical_score);
                        setClarity(paper.existing_review.clarity_score);
                        setFeedback(paper.existing_review.written_feedback);
                      } else {
                        setOriginality(7);
                        setTechnical(8);
                        setClarity(8);
                        setFeedback('');
                      }
                    }}
                    className={`p-3.5 cursor-pointer text-xs transition-colors ${
                      isSelected ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[11px]">
                      <span className="text-[#64748B]">{paper.track_name}</span>
                      {isDone ? (
                        <span className="text-emerald-700 font-medium">Reviewed</span>
                      ) : (
                        <span className="text-amber-700 font-medium">Pending</span>
                      )}
                    </div>

                    <h3 className="font-editorial text-sm font-semibold text-[#0F172A] leading-snug line-clamp-2">
                      {paper.title}
                    </h3>

                    <div className="mt-1.5 text-[10px] text-[#94A3B8]">
                      Author: <span className="text-slate-400">████████ (Masked)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Split Reader & Rubric */}
        {selectedPaper && (
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Pane: Simple Manuscript Reader */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 flex flex-col justify-between h-[520px]">
              <div>
                <div className="flex items-center justify-between text-xs text-[#64748B] border-b border-[#F1F5F9] pb-2 mb-3">
                  <span className="font-medium text-[#0F172A]">Manuscript</span>
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-1 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span>{currentPage} / {totalPages}</span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-1 disabled:opacity-30"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-editorial text-base font-semibold text-[#0F172A] leading-snug mb-2">
                  {selectedPaper.title}
                </h3>

                <div className="p-3 bg-slate-50 rounded text-xs text-[#475569] leading-relaxed mb-3">
                  <span className="font-semibold text-[#0F172A] block text-[11px] mb-1">Abstract</span>
                  {selectedPaper.abstract}
                </div>

                <div className="text-xs text-[#475569] space-y-2 leading-relaxed">
                  <p className="font-medium text-[#0F172A]">1. Introduction</p>
                  <p>
                    This research investigates computational boundaries and empirical efficiency across distributed benchmarks.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F1F5F9] text-[10px] text-[#94A3B8]">
                Double-blind view active · Author identity omitted
              </div>
            </div>

            {/* Right Pane: Simple Rubric */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 flex flex-col h-[520px]">
              {/* Tab Header */}
              <div className="flex border-b border-[#E2E8F0] pb-2 mb-3 gap-2">
                <button
                  onClick={() => setActiveTab('rubric')}
                  className={`text-xs font-medium pb-1 border-b-2 transition-colors ${
                    activeTab === 'rubric'
                      ? 'border-[#0F172A] text-[#0F172A]'
                      : 'border-transparent text-[#64748B]'
                  }`}
                >
                  Scoring Rubric
                </button>
                <button
                  onClick={() => setActiveTab('rebuttal')}
                  className={`text-xs font-medium pb-1 border-b-2 transition-colors ${
                    activeTab === 'rebuttal'
                      ? 'border-[#0F172A] text-[#0F172A]'
                      : 'border-transparent text-[#64748B]'
                  }`}
                >
                  Rebuttal Thread
                </button>
              </div>

              {activeTab === 'rubric' ? (
                <form onSubmit={handleReviewSubmit} className="flex-1 flex flex-col justify-between text-xs">
                  <div className="space-y-3">
                    {/* Originality */}
                    <div>
                      <div className="flex justify-between text-[11px] font-medium mb-1">
                        <span>Originality (40%)</span>
                        <span className="font-bold text-[#2563EB]">{originality}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        disabled={isCompleted}
                        value={originality}
                        onChange={(e) => setOriginality(Number(e.target.value))}
                        className="w-full accent-[#2563EB]"
                      />
                    </div>

                    {/* Technical */}
                    <div>
                      <div className="flex justify-between text-[11px] font-medium mb-1">
                        <span>Technical Rigor (40%)</span>
                        <span className="font-bold text-[#2563EB]">{technical}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        disabled={isCompleted}
                        value={technical}
                        onChange={(e) => setTechnical(Number(e.target.value))}
                        className="w-full accent-[#2563EB]"
                      />
                    </div>

                    {/* Clarity */}
                    <div>
                      <div className="flex justify-between text-[11px] font-medium mb-1">
                        <span>Clarity (20%)</span>
                        <span className="font-bold text-[#2563EB]">{clarity}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        disabled={isCompleted}
                        value={clarity}
                        onChange={(e) => setClarity(Number(e.target.value))}
                        className="w-full accent-[#2563EB]"
                      />
                    </div>

                    {/* Weighted Score */}
                    <div className="p-2 bg-slate-50 rounded flex justify-between items-center text-xs">
                      <span className="text-[#64748B]">Weighted Score:</span>
                      <span className="font-bold text-sm text-[#0F172A]">{weightedScore} / 10</span>
                    </div>

                    {/* Feedback */}
                    <div>
                      <label className="block font-medium mb-1 text-[11px]">Written Feedback</label>
                      <textarea
                        rows={3}
                        required
                        disabled={isCompleted}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Constructive feedback for the authors..."
                        className="w-full p-2 rounded border border-[#CBD5E1] focus:outline-none focus:ring-1 focus:ring-[#2563EB] resize-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#F1F5F9] mt-2">
                    {isCompleted ? (
                      <div className="text-center text-emerald-700 font-medium py-1">
                        ✓ Review Submitted
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting || feedback.length < 10}
                        className="w-full py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded font-medium disabled:opacity-50 transition-colors"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="overflow-y-auto flex-1">
                  <RebuttalThread paperId={selectedPaper.paper_id} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <RawPayloadModal
        paper={selectedPaper}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />
    </div>
  );
}
