'use client';

import { X, ShieldAlert, CheckCircle, Database } from 'lucide-react';
import { BlindReviewerPaper } from '@/types/database';

interface RawPayloadModalProps {
  paper: BlindReviewerPaper | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RawPayloadModal({ paper, isOpen, onClose }: RawPayloadModalProps) {
  if (!isOpen || !paper) return null;

  const rawDbRow = {
    paper_id: paper.paper_id,
    track_id: paper.track_id,
    track_name: paper.track_name,
    title: paper.title,
    abstract: paper.abstract,
    pdf_url: paper.pdf_url,
    status: paper.status,
    submitted_at: paper.submitted_at,
    author_id: paper.author_id,
    author_name: paper.author_name,
    author_affiliation: paper.author_affiliation,
    double_blind_active: paper.double_blind_active,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-100 rounded-md text-indigo-700">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
                PostgreSQL View Payload Inspector
                <span className="badge-double-blind text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                  VIEW: blind_reviewer_papers
                </span>
              </h3>
              <p className="text-xs text-[#64748B]">
                Verify database-level double-blind identity shielding for peer reviews.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-md hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audit Callout */}
        <div className="p-4 bg-indigo-50/70 border-b border-indigo-100 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950">
            <span className="font-semibold">Double-Blind Shield Enforcement:</span>
            <p className="mt-0.5 text-indigo-900/90 leading-relaxed">
              Because <code className="font-mono bg-white px-1 py-0.5 rounded border border-indigo-200">papers.status != &apos;PUBLISHED&apos;</code>, the PostgreSQL SQL view completely strips
              <code className="font-mono bg-white px-1 py-0.5 rounded border border-indigo-200 mx-1">author_id (NULL)</code>,
              <code className="font-mono bg-white px-1 py-0.5 rounded border border-indigo-200 mr-1">author_name (&apos;████████&apos;)</code>,
              and <code className="font-mono bg-white px-1 py-0.5 rounded border border-indigo-200">affiliation (&apos;████████&apos;)</code>.
              Reviewers never receive author metadata over the network.
            </p>
          </div>
        </div>

        {/* JSON Code Viewer */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#0F172A] text-slate-200 font-mono text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 mb-2 border-b border-slate-800">
            <span>SELECT * FROM blind_reviewer_papers WHERE paper_id = &apos;{paper.paper_id}&apos;;</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              Identity Stripped
            </span>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {JSON.stringify(rawDbRow, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
