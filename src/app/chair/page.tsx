'use client';

import { useState } from 'react';
import {
  UserCheck,
  CheckCircle,
  BookOpen,
} from 'lucide-react';
import { useAcademic } from '@/lib/store';

export default function ChairDashboard() {
  const {
    papers,
    users,
    tracks,
    assignReviewer,
    getCalibratedScores,
    getPaperScoreSummaries,
    publishPaper,
  } = useAcademic();

  const [selectedPaperId, setSelectedPaperId] = useState(papers[2]?.paper_id || papers[0]?.paper_id || '');
  const [selectedReviewerId, setSelectedReviewerId] = useState(
    users.find((u) => u.role === 'REVIEWER')?.user_id || users[2]?.user_id || ''
  );
  const [isAssigning, setIsAssigning] = useState(false);
  const [publishingPaperId, setPublishingPaperId] = useState<string | null>(null);

  const calibratedScores = getCalibratedScores();
  const scoreSummaries = getPaperScoreSummaries();

  const totalPapers = papers.length;
  const inReviewCount = papers.filter((p) => p.status === 'UNDER_REVIEW' || p.status === 'REBUTTAL').length;
  const publishedCount = papers.filter((p) => p.status === 'PUBLISHED').length;

  const handleAssign = async () => {
    if (!selectedPaperId || !selectedReviewerId) return;
    setIsAssigning(true);
    try {
      await assignReviewer({
        paper_id: selectedPaperId,
        reviewer_id: selectedReviewerId,
      });
    } catch {
      // toast shown automatically
    } finally {
      setIsAssigning(false);
    }
  };

  const handleTestSelfReview = async () => {
    const target = papers.find((p) => p.paper_id === selectedPaperId);
    if (!target) return;
    setIsAssigning(true);
    try {
      await assignReviewer({
        paper_id: target.paper_id,
        reviewer_id: target.author_id,
      });
    } catch {
      // trigger caught
    } finally {
      setIsAssigning(false);
    }
  };

  const handleTestInstitutionalConflict = async () => {
    setIsAssigning(true);
    try {
      const paper5 = papers.find((p) => p.paper_id === 'e0000000-0000-0000-0000-000000000005') || papers[0];
      const tumReviewer = users.find((u) => u.email === 'marcus.weber@tum.de') || users[3];
      await assignReviewer({
        paper_id: paper5.paper_id,
        reviewer_id: tumReviewer.user_id,
      });
    } catch {
      // trigger caught
    } finally {
      setIsAssigning(false);
    }
  };

  const handleTestReviewRing = async () => {
    setIsAssigning(true);
    try {
      const paper4 = papers.find((p) => p.paper_id === 'e0000000-0000-0000-0000-000000000004') || papers[0];
      const reviewer = users.find((u) => u.user_id === 'b0000000-0000-0000-0000-000000000001') || users[2];
      await assignReviewer({
        paper_id: paper4.paper_id,
        reviewer_id: reviewer.user_id,
      });
    } catch {
      // trigger caught
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePromoteToLedger = async (paperId: string) => {
    setPublishingPaperId(paperId);
    try {
      await publishPaper({ paper_id: paperId });
    } finally {
      setPublishingPaperId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">
            Chair Dashboard
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Reviewer assignments, bias calibration, and publication decisions.
          </p>
        </div>
      </div>

      {/* Simple Summary Stats */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
          <span className="text-[#64748B] text-[11px] block">Total Papers</span>
          <span className="text-lg font-bold text-[#0F172A]">{totalPapers}</span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
          <span className="text-[#64748B] text-[11px] block">In Review</span>
          <span className="text-lg font-bold text-amber-700">{inReviewCount}</span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
          <span className="text-[#64748B] text-[11px] block">Published</span>
          <span className="text-lg font-bold text-emerald-700">{publishedCount}</span>
        </div>
      </div>

      {/* 1. Reviewer Assignment Card */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 space-y-4 shadow-xs">
        <h2 className="text-sm font-semibold text-[#0F172A]">
          Assign Reviewer
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[#64748B] mb-1">Paper</label>
            <select
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="w-full p-2 rounded border border-[#CBD5E1] bg-white truncate"
            >
              {papers.map((p) => (
                <option key={p.paper_id} value={p.paper_id}>
                  {p.title.slice(0, 50)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#64748B] mb-1">Reviewer</label>
            <select
              value={selectedReviewerId}
              onChange={(e) => setSelectedReviewerId(e.target.value)}
              className="w-full p-2 rounded border border-[#CBD5E1] bg-white truncate"
            >
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.first_name} {u.last_name} ({u.affiliation})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions & Simple Tests */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            onClick={handleAssign}
            disabled={isAssigning}
            className="px-3.5 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Assign Reviewer
          </button>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[#94A3B8]">Test conflicts:</span>
            <button
              onClick={handleTestSelfReview}
              className="px-2 py-1 bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 rounded text-[#475569] transition-colors"
            >
              Self-Review
            </button>
            <button
              onClick={handleTestInstitutionalConflict}
              className="px-2 py-1 bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 rounded text-[#475569] transition-colors"
            >
              Same Institution
            </button>
            <button
              onClick={handleTestReviewRing}
              className="px-2 py-1 bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 rounded text-[#475569] transition-colors"
            >
              Review Ring
            </button>
          </div>
        </div>
      </div>

      {/* 2. Reviewer Bias Calibration Table */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A]">
            Reviewer Scores & Bias Calibration
          </h2>
          <p className="text-xs text-[#64748B]">
            Raw scores normalized via Z-scores to balance harsh and lenient graders.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2 px-3 font-medium">Paper</th>
                <th className="py-2 px-3 font-medium">Reviewer</th>
                <th className="py-2 px-3 font-medium">Grading Tendency</th>
                <th className="py-2 px-3 text-right font-medium">Raw Score</th>
                <th className="py-2 px-3 text-right font-medium text-[#2563EB]">Calibrated Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {calibratedScores.map((score) => (
                <tr key={score.review_id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-medium text-[#0F172A] max-w-xs truncate">
                    {score.paper_title}
                  </td>
                  <td className="py-2.5 px-3 text-[#475569]">
                    {score.reviewer_name}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        score.reviewer_tendency === 'HARSH'
                          ? 'badge-rejected'
                          : score.reviewer_tendency === 'LENIENT'
                          ? 'badge-accepted'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {score.reviewer_tendency.toLowerCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-[#0F172A]">
                    {score.raw_weighted_score}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2563EB]">
                    {score.calibrated_score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Paper Decision & Publishing Actions */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 space-y-3">
        <h2 className="text-sm font-semibold text-[#0F172A]">
          Decisions & Publication Promotion
        </h2>

        <div className="divide-y divide-[#E2E8F0]">
          {scoreSummaries.map((summary) => {
            const paper = papers.find((p) => p.paper_id === summary.paper_id);
            const isPublished = paper?.status === 'PUBLISHED';

            return (
              <div key={summary.paper_id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs">
                <div className="min-w-0">
                  <div className="font-semibold text-[#0F172A] truncate">
                    {summary.paper_title}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-3">
                    <span>{summary.track_name}</span>
                    <span>·</span>
                    <span>Raw Avg: <strong className="text-[#0F172A]">{summary.avg_raw_score}</strong></span>
                    <span>·</span>
                    <span>Calibrated Avg: <strong className="text-[#2563EB]">{summary.avg_calibrated_score}</strong></span>
                  </div>
                </div>

                <div className="shrink-0">
                  {isPublished ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Published
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePromoteToLedger(summary.paper_id)}
                      disabled={publishingPaperId === summary.paper_id}
                      className="px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <BookOpen className="w-3 h-3" />
                      Publish to Ledger
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
