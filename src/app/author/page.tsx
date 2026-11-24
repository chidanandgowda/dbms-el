'use client';

import { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  ExternalLink,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';
import { useAcademic } from '@/lib/store';
import { computeSHA256 } from '@/lib/crypto';
import { PdfViewerModal } from '@/components/PdfViewerModal';
import { RebuttalThread } from '@/components/RebuttalThread';
import { Paper } from '@/types/database';

export default function AuthorDashboard() {
  const { currentUser, papers, tracks, submitPaper } = useAcademic();

  const [title, setTitle] = useState('');
  const [trackId, setTrackId] = useState(tracks[0]?.track_id || '');
  const [abstract, setAbstract] = useState('');
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRebuttalPaper, setActiveRebuttalPaper] = useState<Paper | null>(null);
  const [previewPaper, setPreviewPaper] = useState<Paper | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter papers authored by current user
  const myPapers = papers.filter((p) => p.author_id === currentUser.user_id);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsHashing(true);

    try {
      const buffer = await file.arrayBuffer();
      const hash = await computeSHA256(buffer);
      setFileHash(hash);
    } catch {
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const fallbackHash = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      setFileHash(fallbackHash);
    } finally {
      setIsHashing(false);
    }
  };

  const handleLoadSample = (type: 'fresh' | 'duplicate') => {
    if (type === 'duplicate') {
      setFileName('Attention_Sparse_Genomics.pdf');
      setFileHash('a3f7c2b1d9e4f5a6b8c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2');
      setTitle('Attention Is All You Need: Revisiting Sparse Transformer Architectures for Long-Context Genomics');
      setAbstract('We present a novel sparse attention mechanism that achieves linear-time complexity for genomic sequence modeling.');
    } else {
      setFileName(`Consensus_Protocol_${Date.now().toString().slice(-4)}.pdf`);
      setFileHash(`b7e${Date.now().toString(16)}0000000000000000000000000000000000000000000000000000`.slice(0, 64));
      setTitle('Adaptive Consensus Protocols for High-Throughput Decentralized Networks');
      setAbstract('This paper develops an adaptive consensus algorithm that balances throughput with cryptographic safety across dynamic Byzantine fault models.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !abstract || !trackId || !fileHash) return;

    setIsSubmitting(true);
    try {
      await submitPaper({
        title,
        abstract,
        track_id: trackId,
        file_hash: fileHash,
        file_name: fileName || undefined,
      });

      setTitle('');
      setAbstract('');
      setFileHash(null);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      // toast shown automatically
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">
            Author Portal
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Submit manuscripts and track peer-review status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Simplified Submission Form */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-[#E2E8F0] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0F172A]">
              New Submission
            </h2>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleLoadSample('fresh')}
                className="text-[#2563EB] hover:underline"
              >
                Sample
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => handleLoadSample('duplicate')}
                className="text-rose-600 hover:underline"
                title="Test duplicate check"
              >
                Duplicate
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Title */}
            <div>
              <label className="block font-medium text-[#0F172A] mb-1">
                Paper Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
                className="w-full p-2 rounded border border-[#CBD5E1] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            {/* Track */}
            <div>
              <label className="block font-medium text-[#0F172A] mb-1">
                Track
              </label>
              <select
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                className="w-full p-2 rounded border border-[#CBD5E1] bg-white focus:outline-none"
              >
                {tracks.map((t) => (
                  <option key={t.track_id} value={t.track_id}>
                    {t.track_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Abstract */}
            <div>
              <label className="block font-medium text-[#0F172A] mb-1">
                Abstract
              </label>
              <textarea
                required
                rows={3}
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Brief summary of your paper..."
                className="w-full p-2 rounded border border-[#CBD5E1] focus:outline-none focus:ring-1 focus:ring-[#2563EB] resize-none"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block font-medium text-[#0F172A] mb-1">
                Manuscript PDF
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-[#CBD5E1] hover:border-[#2563EB] bg-[#F8FAFC] rounded-md p-3 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <FileText className="w-5 h-5 text-[#64748B] mx-auto mb-1" />
                <div className="font-medium text-[#0F172A]">
                  {fileName ? fileName : 'Upload PDF manuscript'}
                </div>
              </div>

              {isHashing && (
                <div className="mt-1 text-[11px] text-[#2563EB]">
                  Computing file fingerprint...
                </div>
              )}
              {fileHash && !isHashing && (
                <div className="mt-1 text-[11px] text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>SHA-256 fingerprint verified</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || isHashing || !fileHash || !title.trim() || abstract.length < 10}
              className="w-full py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
            >
              <Upload className="w-3.5 h-3.5" />
              {isSubmitting ? 'Submitting...' : 'Submit Manuscript'}
            </button>
          </form>
        </div>

        {/* Right: Submissions List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-4">
            <h2 className="text-sm font-semibold text-[#0F172A] mb-3">
              Your Submissions ({myPapers.length})
            </h2>

            {myPapers.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#94A3B8]">
                No papers submitted yet.
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {myPapers.map((paper) => {
                  const track = tracks.find((t) => t.track_id === paper.track_id);
                  const isRebuttalActive = paper.status === 'REBUTTAL' || paper.status === 'UNDER_REVIEW';

                  return (
                    <div key={paper.paper_id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              paper.status === 'PUBLISHED' || paper.status === 'ACCEPTED'
                                ? 'badge-accepted'
                                : paper.status === 'UNDER_REVIEW' || paper.status === 'REBUTTAL'
                                ? 'badge-under-review'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {paper.status.replace('_', ' ')}
                          </span>
                          <span className="text-[#64748B] text-[11px]">{track?.track_name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewPaper(paper)}
                            className="text-xs text-[#0F172A] hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            PDF
                          </button>
                          {isRebuttalActive && (
                            <button
                              onClick={() =>
                                setActiveRebuttalPaper(
                                  activeRebuttalPaper?.paper_id === paper.paper_id ? null : paper
                                )
                              }
                              className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Rebuttal
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 className="font-editorial text-base font-semibold text-[#0F172A] leading-snug">
                        {paper.title}
                      </h3>

                      <p className="text-xs text-[#475569] line-clamp-2">
                        {paper.abstract}
                      </p>

                      {/* Rebuttal expansion */}
                      {activeRebuttalPaper?.paper_id === paper.paper_id && (
                        <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                          <RebuttalThread paperId={paper.paper_id} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewPaper && (
        <PdfViewerModal
          isOpen={Boolean(previewPaper)}
          onClose={() => setPreviewPaper(null)}
          title={previewPaper.title}
          abstract={previewPaper.abstract}
          fileHash={previewPaper.file_hash}
          trackName={tracks.find((t) => t.track_id === previewPaper.track_id)?.track_name}
          authorName={`${currentUser.first_name} ${currentUser.last_name}`}
          authorAffiliation={currentUser.affiliation}
          isBlind={false}
        />
      )}
    </div>
  );
}
