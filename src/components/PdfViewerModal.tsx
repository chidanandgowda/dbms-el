'use client';

import { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, FileText, Fingerprint, ShieldCheck } from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  abstract: string;
  fileHash?: string | null;
  trackName?: string;
  authorName?: string;
  authorAffiliation?: string;
  isBlind?: boolean;
}

export function PdfViewerModal({
  isOpen,
  onClose,
  title,
  abstract,
  fileHash,
  trackName,
  authorName,
  authorAffiliation,
  isBlind = false,
}: PdfViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 8;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#1E293B] rounded-xl shadow-2xl border border-slate-700 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden text-white">
        {/* Toolbar */}
        <div className="h-14 bg-[#0F172A] border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-[#2563EB] shrink-0" />
            <div className="truncate">
              <h3 className="text-xs font-semibold text-slate-200 truncate">{title}</h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <span>{trackName || 'Academic Track'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Fingerprint className="w-3 h-3 text-emerald-400" />
                  SHA-256: {fileHash ? `${fileHash.slice(0, 16)}...` : 'Computed on Submit'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {isBlind && (
              <span className="badge-double-blind text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Blind Shield Active
              </span>
            )}

            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded text-xs">
              <button
                onClick={() => setZoom((z) => Math.max(75, z - 10))}
                className="p-1 hover:text-white text-slate-400"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(150, z + 10))}
                className="p-1 hover:text-white text-slate-400"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded text-xs font-mono text-slate-300">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-1 disabled:opacity-30 hover:text-white"
              >
                ◀
              </button>
              <span className="text-[11px]">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-1 disabled:opacity-30 hover:text-white"
              >
                ▶
              </button>
            </div>

            <button
              onClick={() => alert(`Simulated PDF Download: ${title}.pdf\nVerified SHA-256: ${fileHash}`)}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Paper Reader Simulation Body */}
        <div className="flex-1 bg-[#334155] overflow-y-auto p-6 flex justify-center">
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="w-[720px] min-h-[960px] bg-white text-[#0F172A] shadow-2xl p-12 transition-transform duration-100 flex flex-col justify-between"
          >
            {/* Page 1 Header */}
            {currentPage === 1 ? (
              <div>
                <div className="text-center pb-6 border-b border-slate-200">
                  <div className="text-[10px] tracking-widest uppercase font-mono text-[#64748B] mb-2">
                    {trackName || 'Conference Manuscript Submission'} • Track Peer Review
                  </div>
                  <h1 className="font-editorial text-2xl font-semibold leading-tight text-[#0F172A] max-w-xl mx-auto">
                    {title}
                  </h1>

                  {/* Author Line: strictly masked if isBlind */}
                  <div className="mt-4 text-xs">
                    {isBlind ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE] font-mono">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Author Identity Omitted for Double-Blind Review</span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold text-[#0F172A]">{authorName || 'Amara Okonkwo'}</span>
                        <div className="text-[#64748B] text-[11px] mt-0.5">
                          {authorAffiliation || 'Massachusetts Institute of Technology'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Abstract Section */}
                <div className="mt-8 px-6 py-4 bg-slate-50 border border-slate-200 rounded-md">
                  <h3 className="font-mono text-[11px] uppercase tracking-wider font-bold text-[#0F172A] mb-2">
                    Abstract
                  </h3>
                  <p className="font-editorial text-sm italic text-[#334155] leading-relaxed">
                    {abstract}
                  </p>
                </div>

                {/* Section 1 Introduction */}
                <div className="mt-8 space-y-4 text-xs text-[#334155] leading-relaxed">
                  <h2 className="font-bold text-sm text-[#0F172A] uppercase tracking-wide">
                    1. Introduction
                  </h2>
                  <p>
                    Academic peer review serves as the cornerstone of scholarly inquiry. However, modern scientific dissemination increasingly demands formal computational verification to uphold integrity against duplicate submissions, undeclared institutional conflicts of interest, and biased scoring distributions.
                  </p>
                  <p>
                    In this work, we rigorously formulate the database constraints and cryptographic hash chains necessary to guarantee provenance. By binding the document payload via its cryptographic SHA-256 digest ({fileHash?.slice(0, 16)}...) and verifying relational triggers, we establish a tamper-evident foundation for peer review.
                  </p>

                  <h2 className="font-bold text-sm text-[#0F172A] uppercase tracking-wide pt-4">
                    2. Methodological Architecture
                  </h2>
                  <p>
                    Our approach formalizes three distinct layers: (i) Cryptographic manuscript deduplication via SHA-256 digest comparisons and trigram similarity thresholds; (ii) Dynamic Conflict of Interest (COI) evaluation enforcing zero institutional overlap and cyclic review ring elimination; (iii) Normalization of reviewer scoring variance via windowed Z-score calibrations.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-xs text-[#334155] leading-relaxed">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8] border-b border-slate-100 pb-2">
                  <span>{title.slice(0, 45)}...</span>
                  <span>Page {currentPage} of {totalPages}</span>
                </div>

                <h2 className="font-bold text-sm text-[#0F172A] uppercase tracking-wide">
                  Section {currentPage}. Empirical Evaluation & Results
                </h2>
                <p>
                  Extensive evaluation across 15 benchmarking environments confirms substantial latency improvements and robustness against edge failure modes. Figure {currentPage}.1 illustrates the distribution of latency profiles under synthetic workloads.
                </p>
                <div className="h-48 border border-dashed border-slate-300 rounded flex items-center justify-center bg-slate-50 text-slate-400 font-mono text-[11px]">
                  [ Figure {currentPage}.1: Empirical Latency & Variance Distribution Across 12 Runs ]
                </div>
                <p>
                  Statistical significance tests conducted with a 95% confidence interval substantiate the primary thesis. As shown in Table {currentPage}.2, all observed deviations remain well within the acceptable threshold parameters.
                </p>
              </div>
            )}

            {/* Page Footer */}
            <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-[10px] text-[#94A3B8] font-mono">
              <span>SHA-256: {fileHash ? `${fileHash.slice(0, 20)}...` : 'e001_digest'}</span>
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
