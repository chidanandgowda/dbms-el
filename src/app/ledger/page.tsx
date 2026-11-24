'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAcademic } from '@/lib/store';
import { PdfViewerModal } from '@/components/PdfViewerModal';
import { Paper, ChainVerificationReport } from '@/types/database';

export default function PublicationLedger() {
  const {
    publications,
    papers,
    users,
    tracks,
    verifyChain,
    simulateTamperChain,
    resetToSeedData,
  } = useAcademic();

  const [verificationReport, setVerificationReport] = useState<ChainVerificationReport | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [previewPaper, setPreviewPaper] = useState<Paper | null>(null);
  const [showChainDetails, setShowChainDetails] = useState(false);

  // Sort publications in chronological order
  const sortedPubs = [...publications].sort(
    (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
  );

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const report = await verifyChain();
      setVerificationReport(report);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-[#E2E8F0] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">
            Publication Ledger
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Peer-reviewed papers cryptographically anchored in PostgreSQL.
          </p>
        </div>

        {/* Verification Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="px-3.5 py-1.5 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {isVerifying ? 'Verifying...' : 'Verify Chain'}
          </button>

          <button
            onClick={simulateTamperChain}
            className="px-2.5 py-1.5 bg-white border border-[#E2E8F0] text-[#64748B] hover:text-rose-600 hover:border-rose-200 text-xs rounded-md transition-colors"
            title="Simulate data tampering to test detection"
          >
            Test Tamper
          </button>

          {verificationReport && !verificationReport.valid && (
            <button
              onClick={resetToSeedData}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-md flex items-center gap-1"
              title="Restore valid chain"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Verification Status Banner (Only shows when verified) */}
      {verificationReport && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
            verificationReport.valid
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
          }`}
        >
          <div className="flex items-center gap-2">
            {verificationReport.valid ? (
              <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
            )}
            <span className="font-medium">
              {verificationReport.valid
                ? `Chain intact · ${verificationReport.total} records cryptographically verified`
                : `Alert: ${verificationReport.tampered_count} tampered record(s) detected!`}
            </span>
          </div>

          <button
            onClick={() => setShowChainDetails(!showChainDetails)}
            className="text-[11px] underline opacity-80 hover:opacity-100 flex items-center gap-0.5"
          >
            {showChainDetails ? 'Hide Chain Details' : 'View Chain Details'}
            {showChainDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Optional Collapsible Technical Hash Details */}
      {showChainDetails && (
        <div className="p-4 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono space-y-3">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            PostgreSQL Hash Chain Blocks
          </div>
          {sortedPubs.map((pub, idx) => (
            <div key={pub.pub_id} className="p-2.5 bg-slate-800/80 rounded border border-slate-700 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span className="font-bold text-white">Block #{idx + 1} ({pub.doi_string})</span>
                <span className="text-slate-400">{pub.published_at.slice(0, 10)}</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                <span className="text-slate-500">prev: </span>{pub.prev_block_hash}
              </div>
              <div className="text-[10px] text-emerald-400 truncate">
                <span className="text-slate-500">hash: </span>{pub.record_hash}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Published Papers List */}
      <div className="space-y-4">
        {sortedPubs.map((pub) => {
          const paper = papers.find((p) => p.paper_id === pub.paper_id);
          if (!paper) return null;

          const author = users.find((u) => u.user_id === paper.author_id);
          const track = tracks.find((t) => t.track_id === paper.track_id);

          return (
            <article
              key={pub.pub_id}
              className="p-5 bg-white rounded-lg border border-[#E2E8F0] hover:border-slate-300 transition-colors space-y-2.5"
            >
              {/* Header meta */}
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <div className="flex items-center gap-2">
                  <span className="badge-accepted text-[10px] font-medium px-2 py-0.5 rounded">
                    Published
                  </span>
                  <span>{track?.track_name}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(pub.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              {/* Title in Newsreader */}
              <h2 className="font-editorial text-lg font-semibold text-[#0F172A] leading-snug">
                {paper.title}
              </h2>

              {/* Authors */}
              <div className="text-xs text-[#475569]">
                <span className="font-medium text-[#0F172A]">
                  {author ? `${author.first_name} ${author.last_name}` : 'Author'}
                </span>
                {author?.affiliation && (
                  <span className="text-[#64748B]"> · {author.affiliation}</span>
                )}
              </div>

              {/* Abstract */}
              <p className="text-xs text-[#475569] leading-relaxed line-clamp-3">
                {paper.abstract}
              </p>

              {/* Footer Links */}
              <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#2563EB]">
                  DOI: {pub.doi_string}
                </span>

                <button
                  onClick={() => setPreviewPaper(paper)}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Read Paper
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* PDF Reader Modal */}
      {previewPaper && (
        <PdfViewerModal
          isOpen={Boolean(previewPaper)}
          onClose={() => setPreviewPaper(null)}
          title={previewPaper.title}
          abstract={previewPaper.abstract}
          fileHash={previewPaper.file_hash}
          trackName={tracks.find((t) => t.track_id === previewPaper.track_id)?.track_name}
          authorName={
            users.find((u) => u.user_id === previewPaper.author_id)
              ? `${users.find((u) => u.user_id === previewPaper.author_id)?.first_name} ${users.find((u) => u.user_id === previewPaper.author_id)?.last_name}`
              : undefined
          }
          authorAffiliation={users.find((u) => u.user_id === previewPaper.author_id)?.affiliation}
          isBlind={false}
        />
      )}
    </div>
  );
}
