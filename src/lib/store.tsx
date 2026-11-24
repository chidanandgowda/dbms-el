'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useMemo } from 'react';
import {
  User,
  Track,
  Paper,
  ReviewAssignment,
  Review,
  RebuttalComment,
  Publication,
  BlindReviewerPaper,
  CalibratedScore,
  PaperScoreSummary,
  TrackAnalytics,
  ChainVerificationReport,
  UserRole,
} from '@/types/database';
import {
  INITIAL_USERS,
  INITIAL_TRACKS,
  INITIAL_PAPERS,
  INITIAL_ASSIGNMENTS,
  INITIAL_REVIEWS,
  INITIAL_REBUTTALS,
  INITIAL_PUBLICATIONS,
} from './seed-data';
import { computeSHA256, calculateTrigramSimilarity, normalizeTitle } from './crypto';

interface ToastMessage {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
  code?: string;
}

interface AcademicContextType {
  // Current user / role switcher
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  setRole: (role: UserRole) => void;

  // Data
  tracks: Track[];
  papers: Paper[];
  assignments: ReviewAssignment[];
  reviews: Review[];
  rebuttals: RebuttalComment[];
  publications: Publication[];

  // Views
  getBlindReviewerPapers: () => BlindReviewerPaper[];
  getCalibratedScores: () => CalibratedScore[];
  getPaperScoreSummaries: () => PaperScoreSummary[];
  getTrackAnalytics: () => TrackAnalytics[];
  getThreadedRebuttalsForPaper: (paperId: string) => RebuttalComment[];

  // Operations
  submitPaper: (data: {
    title: string;
    abstract: string;
    track_id: string;
    pdf_url?: string;
    file_hash: string;
    file_name?: string;
  }) => Promise<{ paper: Paper; similarityWarning?: string }>;

  assignReviewer: (data: { paper_id: string; reviewer_id: string }) => Promise<ReviewAssignment>;
  submitReview: (data: {
    assignment_id: string;
    originality_score: number;
    technical_score: number;
    clarity_score: number;
    written_feedback: string;
  }) => Promise<Review>;

  addRebuttalComment: (data: {
    paper_id: string;
    body: string;
    parent_comment_id?: string | null;
  }) => Promise<RebuttalComment>;

  publishPaper: (data: { paper_id: string; doi_string?: string }) => Promise<Publication>;

  verifyChain: () => Promise<ChainVerificationReport>;
  simulateTamperChain: () => Promise<void>;
  resetToSeedData: () => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const AcademicContext = createContext<AcademicContextType | null>(null);

const STORAGE_KEY = 'academic_system_db_v1';

export function AcademicProvider({ children }: { children: ReactNode }) {
  // Users & State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  // Default user is Elena Vasquez (Chair)
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[4]);

  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [papers, setPapers] = useState<Paper[]>(INITIAL_PAPERS);
  const [assignments, setAssignments] = useState<ReviewAssignment[]>(INITIAL_ASSIGNMENTS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [rebuttals, setRebuttals] = useState<RebuttalComment[]>(INITIAL_REBUTTALS);
  const [publications, setPublications] = useState<Publication[]>(INITIAL_PUBLICATIONS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Hydrate from localStorage on client
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.papers && parsed.assignments && parsed.reviews) {
          setUsers(parsed.users || INITIAL_USERS);
          setTracks(parsed.tracks || INITIAL_TRACKS);
          setPapers(parsed.papers);
          setAssignments(parsed.assignments);
          setReviews(parsed.reviews);
          setRebuttals(parsed.rebuttals || INITIAL_REBUTTALS);
          setPublications(parsed.publications || INITIAL_PUBLICATIONS);
          if (parsed.currentUserId) {
            const found = (parsed.users || INITIAL_USERS).find((u: User) => u.user_id === parsed.currentUserId);
            if (found) setCurrentUser(found);
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save changes to localStorage
  const saveState = (
    newPapers = papers,
    newAssignments = assignments,
    newReviews = reviews,
    newRebuttals = rebuttals,
    newPublications = publications,
    newUsers = users,
    activeUser = currentUser
  ) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          users: newUsers,
          tracks,
          papers: newPapers,
          assignments: newAssignments,
          reviews: newReviews,
          rebuttals: newRebuttals,
          publications: newPublications,
          currentUserId: activeUser.user_id,
        })
      );
    } catch {
      // ignore
    }
  };

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const setRole = (role: UserRole) => {
    const candidate = users.find((u) => u.role === role);
    if (candidate) {
      setCurrentUser(candidate);
      saveState(papers, assignments, reviews, rebuttals, publications, users, candidate);
      addToast({
        type: 'info',
        title: `Switched Role to ${role}`,
        description: `Now active as ${candidate.first_name} ${candidate.last_name} (${candidate.affiliation})`,
      });
    }
  };

  const resetToSeedData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUsers(INITIAL_USERS);
    setTracks(INITIAL_TRACKS);
    setPapers(INITIAL_PAPERS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setReviews(INITIAL_REVIEWS);
    setRebuttals(INITIAL_REBUTTALS);
    setPublications(INITIAL_PUBLICATIONS);
    setCurrentUser(INITIAL_USERS[4]); // Chair
    addToast({
      type: 'success',
      title: 'Database Reset',
      description: 'Reset all tables and state to canonical seed data.',
    });
  };

  // ─── Trigger 3A & Deduplication: submitPaper ──────────────────────────────
  const submitPaper = async (data: {
    title: string;
    abstract: string;
    track_id: string;
    pdf_url?: string;
    file_hash: string;
    file_name?: string;
  }) => {
    const normTitle = normalizeTitle(data.title);

    // 1. Enforce UNIQUE constraint on papers.file_hash
    const existingHash = papers.find((p) => p.file_hash?.toLowerCase() === data.file_hash.toLowerCase());
    if (existingHash) {
      const err = new Error(
        `UNIQUE_VIOLATION: duplicate key value violates unique constraint "papers_file_hash_key". This manuscript PDF matches existing paper: "${existingHash.title}". Exact re-submissions or cross-track duplications are blocked.`
      );
      addToast({
        type: 'error',
        title: 'PostgreSQL Constraint: UNIQUE(file_hash)',
        description: `Duplicate SHA-256 detected: ${data.file_hash.slice(0, 16)}... Matches paper "${existingHash.title}".`,
        code: '23505 (unique_violation)',
      });
      throw err;
    }

    // 2. Enforce UNIQUE(author_id, track_id, normalized_title)
    const existingTitleTrack = papers.find(
      (p) => p.author_id === currentUser.user_id && p.track_id === data.track_id && p.normalized_title === normTitle
    );
    if (existingTitleTrack) {
      const err = new Error(
        `UNIQUE_VIOLATION: Author has already submitted this manuscript title to this track.`
      );
      addToast({
        type: 'error',
        title: 'PostgreSQL Constraint: uq_author_track_title',
        description: 'You have already submitted an identical title in this track.',
        code: '23505 (unique_violation)',
      });
      throw err;
    }

    // 3. Trigger 3B: Fuzzy Title Similarity Warning (> 0.6 trigram similarity)
    let similarityWarning: string | undefined;
    for (const p of papers) {
      const sim = calculateTrigramSimilarity(p.normalized_title, normTitle);
      if (sim > 0.6) {
        similarityWarning = `TITLE_SIMILARITY_ALERT: New paper title is ${Math.round(
          sim * 100
        )}% similar to existing paper "${p.title}" (ID: ${p.paper_id.slice(0, 8)}). Possible self-plagiarism or cross-track duplicate.`;
        addToast({
          type: 'warning',
          title: 'PostgreSQL Trigger: trg_title_similarity',
          description: similarityWarning,
          code: 'TRIGGER_WARNING_01',
        });
        break;
      }
    }

    const newPaper: Paper = {
      paper_id: `e0000000-${Math.random().toString(36).substring(2, 6)}-0000-0000-${Date.now().toString(16).slice(-12)}`,
      author_id: currentUser.user_id,
      track_id: data.track_id,
      title: data.title.trim(),
      normalized_title: normTitle,
      abstract: data.abstract.trim(),
      pdf_url: data.pdf_url || `/papers/${data.file_name || 'manuscript.pdf'}`,
      file_hash: data.file_hash,
      status: 'SUBMITTED',
      submitted_at: new Date().toISOString(),
    };

    const updated = [newPaper, ...papers];
    setPapers(updated);
    saveState(updated, assignments, reviews, rebuttals, publications, users, currentUser);

    addToast({
      type: 'success',
      title: 'Paper Submitted Successfully',
      description: `Manuscript "${data.title.slice(0, 35)}..." recorded with SHA-256: ${data.file_hash.slice(0, 12)}...`,
    });

    return { paper: newPaper, similarityWarning };
  };

  // ─── Trigger 3C: Conflict of Interest (COI) Guard ─────────────────────────
  const assignReviewer = async ({ paper_id, reviewer_id }: { paper_id: string; reviewer_id: string }) => {
    const targetPaper = papers.find((p) => p.paper_id === paper_id);
    if (!targetPaper) throw new Error('Paper not found');

    const author = users.find((u) => u.user_id === targetPaper.author_id);
    const reviewer = users.find((u) => u.user_id === reviewer_id);
    if (!reviewer || !author) throw new Error('User details missing');

    // Check unique constraint uq_paper_reviewer
    const alreadyAssigned = assignments.find((a) => a.paper_id === paper_id && a.reviewer_id === reviewer_id);
    if (alreadyAssigned) {
      const err = new Error('This reviewer is already assigned to this paper.');
      addToast({
        type: 'error',
        title: 'PostgreSQL Constraint: uq_paper_reviewer',
        description: `${reviewer.first_name} ${reviewer.last_name} is already assigned to this paper.`,
        code: '23505 (unique_violation)',
      });
      throw err;
    }

    // ── Check 1: Self-review ───────────────────────────────────────────────
    if (reviewer_id === targetPaper.author_id) {
      const msg = `COI_SELF_REVIEW: Reviewer "${reviewer.first_name} ${reviewer.last_name}" (${reviewer.email}) cannot review their own paper "${targetPaper.title}".`;
      addToast({
        type: 'error',
        title: 'PostgreSQL Trigger: COI_SELF_REVIEW',
        description: msg,
        code: 'integrity_constraint_violation',
      });
      throw new Error(msg);
    }

    // ── Check 2: Institutional conflict ────────────────────────────────────
    if (reviewer.affiliation.trim().toLowerCase() === author.affiliation.trim().toLowerCase()) {
      const msg = `COI_INSTITUTIONAL: Reviewer "${reviewer.first_name} ${reviewer.last_name}" shares affiliation "${reviewer.affiliation}" with author "${author.first_name} ${author.last_name}". Assignment blocked.`;
      addToast({
        type: 'error',
        title: 'PostgreSQL Trigger: COI_INSTITUTIONAL',
        description: msg,
        code: 'integrity_constraint_violation',
      });
      throw new Error(msg);
    }

    // ── Check 3: Review ring detection ─────────────────────────────────────
    // Does reviewer have a paper in the same track currently assigned to this paper's author?
    const hasRing = papers.some((p2) => {
      if (p2.author_id !== reviewer_id) return false;
      if (p2.track_id !== targetPaper.track_id) return false;
      return assignments.some(
        (ra2) => ra2.paper_id === p2.paper_id && ra2.reviewer_id === author.user_id && ra2.status === 'ASSIGNED'
      );
    });

    if (hasRing) {
      const track = tracks.find((t) => t.track_id === targetPaper.track_id);
      const msg = `COI_REVIEW_RING: Tit-for-tat detected — Reviewer "${reviewer.first_name} ${reviewer.last_name}" has an active paper in track "${track?.track_name}" that is currently being reviewed by this paper's author. Cross-assignment blocked to prevent review rings.`;
      addToast({
        type: 'error',
        title: 'PostgreSQL Trigger: COI_REVIEW_RING',
        description: msg,
        code: 'integrity_constraint_violation',
      });
      throw new Error(msg);
    }

    // Passed COI checks!
    const newAssignment: ReviewAssignment = {
      assignment_id: `f0000000-${Math.random().toString(36).substring(2, 6)}-0000-0000-${Date.now().toString(16).slice(-12)}`,
      paper_id,
      reviewer_id,
      assigned_at: new Date().toISOString(),
      status: 'ASSIGNED',
    };

    // Trigger 3D: Auto-advance status to UNDER_REVIEW
    let updatedPapers = papers;
    if (targetPaper.status === 'SUBMITTED') {
      updatedPapers = papers.map((p) => (p.paper_id === paper_id ? { ...p, status: 'UNDER_REVIEW' } : p));
      setPapers(updatedPapers);
    }

    const updatedAssignments = [...assignments, newAssignment];
    setAssignments(updatedAssignments);
    saveState(updatedPapers, updatedAssignments, reviews, rebuttals, publications, users, currentUser);

    addToast({
      type: 'success',
      title: 'Reviewer Assigned',
      description: `Assigned ${reviewer.first_name} ${reviewer.last_name} (All 3 COI trigger checks passed).`,
    });

    return newAssignment;
  };

  // ─── Trigger 3E: Submit Review & Mark Assignment COMPLETED ────────────────
  const submitReview = async ({
    assignment_id,
    originality_score,
    technical_score,
    clarity_score,
    written_feedback,
  }: {
    assignment_id: string;
    originality_score: number;
    technical_score: number;
    clarity_score: number;
    written_feedback: string;
  }) => {
    const newReview: Review = {
      review_id: `aa000000-${Math.random().toString(36).substring(2, 6)}-0000-0000-${Date.now().toString(16).slice(-12)}`,
      assignment_id,
      originality_score,
      technical_score,
      clarity_score,
      written_feedback,
      submitted_at: new Date().toISOString(),
    };

    // Trigger 3E: Mark assignment COMPLETED
    const updatedAssignments = assignments.map((a) =>
      a.assignment_id === assignment_id ? { ...a, status: 'COMPLETED' as const } : a
    );
    const updatedReviews = [...reviews, newReview];

    setAssignments(updatedAssignments);
    setReviews(updatedReviews);
    saveState(papers, updatedAssignments, updatedReviews, rebuttals, publications, users, currentUser);

    addToast({
      type: 'success',
      title: 'Review Submitted',
      description: `Scores: Orig ${originality_score}/10, Tech ${technical_score}/10, Clar ${clarity_score}/10 recorded. Assignment marked COMPLETED.`,
    });

    return newReview;
  };

  // ─── Rebuttal Comments ────────────────────────────────────────────────────
  const addRebuttalComment = async ({
    paper_id,
    body,
    parent_comment_id = null,
  }: {
    paper_id: string;
    body: string;
    parent_comment_id?: string | null;
  }) => {
    const newComment: RebuttalComment = {
      comment_id: `bb000000-${Math.random().toString(36).substring(2, 6)}-0000-0000-${Date.now().toString(16).slice(-12)}`,
      paper_id,
      user_id: currentUser.user_id,
      parent_comment_id: parent_comment_id || null,
      body,
      created_at: new Date().toISOString(),
    };

    const updated = [...rebuttals, newComment];
    setRebuttals(updated);
    saveState(papers, assignments, reviews, updated, publications, users, currentUser);

    addToast({
      type: 'success',
      title: 'Comment Posted',
      description: 'Your rebuttal comment has been added to the discussion tree.',
    });

    return newComment;
  };

  // ─── Trigger 3F: Hash-Chained Publication Ledger ──────────────────────────
  const publishPaper = async ({ paper_id, doi_string }: { paper_id: string; doi_string?: string }) => {
    const paper = papers.find((p) => p.paper_id === paper_id);
    if (!paper) throw new Error('Paper not found');

    if (!paper.file_hash) {
      const err = new Error(
        `PUBLICATION_ERROR: Paper (${paper_id}) has no file_hash. Upload and hash the PDF before publishing.`
      );
      addToast({
        type: 'error',
        title: 'PostgreSQL Trigger: fn_hash_chain_publication',
        description: err.message,
        code: 'integrity_constraint_violation',
      });
      throw err;
    }

    // Previous block hash from the last publication
    const sortedPubs = [...publications].sort(
      (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
    );
    const lastPub = sortedPubs[sortedPubs.length - 1];
    const prev_block_hash = lastPub ? lastPub.record_hash : 'GENESIS';

    const doi = doi_string || `10.1145/3626789.${Math.floor(1000000 + Math.random() * 9000000)}`;
    const published_at = new Date().toISOString();

    // Trigger calculation: encode(digest(prev_block_hash || file_hash || doi || published_at, 'sha256'), 'hex')
    const payload = `${prev_block_hash}${paper.file_hash}${doi}${published_at}`;
    const record_hash = await computeSHA256(payload);

    const newPub: Publication = {
      pub_id: `cc000000-${Math.random().toString(36).substring(2, 6)}-0000-0000-${Date.now().toString(16).slice(-12)}`,
      paper_id,
      doi_string: doi,
      published_at,
      prev_block_hash,
      record_hash,
    };

    // Trigger updates paper status to PUBLISHED
    const updatedPapers = papers.map((p) => (p.paper_id === paper_id ? { ...p, status: 'PUBLISHED' as const } : p));
    const updatedPubs = [...publications, newPub];

    setPapers(updatedPapers);
    setPublications(updatedPubs);
    saveState(updatedPapers, assignments, reviews, rebuttals, updatedPubs, users, currentUser);

    addToast({
      type: 'success',
      title: 'Paper Promoted to Publication Ledger',
      description: `DOI: ${doi} chained from ${prev_block_hash.slice(0, 10)}... Hash: ${record_hash.slice(0, 10)}...`,
    });

    return newPub;
  };

  // ─── RPC 5A: verify_publication_chain ─────────────────────────────────────
  const verifyChain = async (): Promise<ChainVerificationReport> => {
    const sorted = [...publications].sort(
      (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
    );

    let prevHash = 'GENESIS';
    const tampered: ChainVerificationReport['tampered'] = [];

    for (const pub of sorted) {
      const paper = papers.find((p) => p.paper_id === pub.paper_id);
      const fileHash = paper?.file_hash || '';

      // Check prev_block_hash pointer
      if (pub.prev_block_hash !== prevHash) {
        tampered.push({
          pub_id: pub.pub_id,
          doi: pub.doi_string,
          issue: 'prev_block_hash mismatch (Broken chain linkage)',
          expected: prevHash,
          actual: pub.prev_block_hash,
        });
      }

      // Recompute record_hash
      const payload = `${pub.prev_block_hash}${fileHash}${pub.doi_string}${pub.published_at}`;
      const expectedHash = await computeSHA256(payload);

      if (pub.record_hash !== expectedHash) {
        tampered.push({
          pub_id: pub.pub_id,
          doi: pub.doi_string,
          issue: 'record_hash mismatch (Payload cryptographic tampering)',
          expected: expectedHash,
          actual: pub.record_hash,
        });
      }

      prevHash = pub.record_hash;
    }

    const isValid = tampered.length === 0;
    return {
      valid: isValid,
      total: sorted.length,
      tampered_count: tampered.length,
      tampered,
      message: isValid ? 'Chain Intact — 0 Tampered Records' : `ALERT: ${tampered.length} integrity violation(s) detected!`,
    };
  };

  // Tamper simulator for demoing detection
  const simulateTamperChain = async () => {
    if (publications.length === 0) return;
    const tamperedPubs = publications.map((p, idx) => {
      if (idx === 0) {
        return {
          ...p,
          record_hash: 'bad000000000000000000000000000000000000000000000000000000000bad0',
        };
      }
      return p;
    });
    setPublications(tamperedPubs);
    saveState(papers, assignments, reviews, rebuttals, tamperedPubs, users, currentUser);
    addToast({
      type: 'warning',
      title: 'Tampering Simulated on Block #1',
      description: 'Modified block hash maliciously. Click "Verify Ledger Integrity" to audit.',
    });
  };

  // ─── View 4A: blind_reviewer_papers ───────────────────────────────────────
  const getBlindReviewerPapers = (): BlindReviewerPaper[] => {
    // Only papers assigned to current reviewer
    const reviewerAssignments = assignments.filter((a) => a.reviewer_id === currentUser.user_id);

    return reviewerAssignments
      .map((a) => {
        const p = papers.find((paper) => paper.paper_id === a.paper_id);
        if (!p) return null;
        const track = tracks.find((t) => t.track_id === p.track_id);
        const author = users.find((u) => u.user_id === p.author_id);
        const existingReview = reviews.find((r) => r.assignment_id === a.assignment_id);

        const isPublished = p.status === 'PUBLISHED';

        return {
          paper_id: p.paper_id,
          track_id: p.track_id,
          track_name: track?.track_name || 'General',
          title: p.title,
          abstract: p.abstract,
          pdf_url: p.pdf_url,
          status: p.status,
          submitted_at: p.submitted_at,
          // Double-blind masking: strip author fields if not published
          author_id: isPublished ? p.author_id : null,
          author_name: isPublished && author ? `${author.first_name} ${author.last_name}` : '████████',
          author_affiliation: isPublished && author ? author.affiliation : '████████',
          double_blind_active: !isPublished,
          assignment_id: a.assignment_id,
          assignment_status: a.status,
          existing_review: existingReview,
        };
      })
      .filter(Boolean) as BlindReviewerPaper[];
  };

  // ─── View 4B: calibrated_paper_scores (Window Functions) ──────────────────
  const getCalibratedScores = (): CalibratedScore[] => {
    // Group reviews by reviewer to compute AVG() and STDDEV() over (PARTITION BY reviewer_id)
    const reviewerReviewsMap = new Map<string, number[]>();

    reviews.forEach((r) => {
      const assignment = assignments.find((a) => a.assignment_id === r.assignment_id);
      if (!assignment) return;
      const raw = r.originality_score * 0.4 + r.technical_score * 0.4 + r.clarity_score * 0.2;
      const list = reviewerReviewsMap.get(assignment.reviewer_id) || [];
      list.push(raw);
      reviewerReviewsMap.set(assignment.reviewer_id, list);
    });

    const reviewerStats = new Map<string, { mean: number; stddev: number; count: number }>();
    reviewerReviewsMap.forEach((scores, revId) => {
      const count = scores.length;
      const sum = scores.reduce((a, b) => a + b, 0);
      const mean = sum / count;
      let variance = 0;
      if (count > 1) {
        variance = scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (count - 1);
      }
      const stddev = Math.sqrt(variance);
      reviewerStats.set(revId, { mean, stddev, count });
    });

    return reviews
      .map((r) => {
        const assignment = assignments.find((a) => a.assignment_id === r.assignment_id);
        if (!assignment) return null;
        const paper = papers.find((p) => p.paper_id === assignment.paper_id);
        const reviewer = users.find((u) => u.user_id === assignment.reviewer_id);
        const track = tracks.find((t) => t.track_id === paper?.track_id);
        if (!paper || !reviewer) return null;

        const raw = Number((r.originality_score * 0.4 + r.technical_score * 0.4 + r.clarity_score * 0.2).toFixed(2));
        const stats = reviewerStats.get(assignment.reviewer_id) || { mean: raw, stddev: 0, count: 1 };

        let zScore = 0;
        let calibrated = raw;
        if (stats.stddev > 0.0001) {
          zScore = Number(((raw - stats.mean) / stats.stddev).toFixed(4));
          // map Z-score back to 1-10 scale (mean=5.5, stddev=1.5)
          calibrated = Number(Math.max(1, Math.min(10, 5.5 + 1.5 * zScore)).toFixed(2));
        }

        let tendency: 'HARSH' | 'LENIENT' | 'MODERATE' = 'MODERATE';
        if (stats.mean < 5.0) tendency = 'HARSH';
        else if (stats.mean > 7.0) tendency = 'LENIENT';

        return {
          paper_id: paper.paper_id,
          paper_title: paper.title,
          track_name: track?.track_name || 'General',
          reviewer_id: reviewer.user_id,
          reviewer_name: `${reviewer.first_name} ${reviewer.last_name}`,
          review_id: r.review_id,
          originality_score: r.originality_score,
          technical_score: r.technical_score,
          clarity_score: r.clarity_score,
          raw_weighted_score: raw,
          reviewer_mean: Number(stats.mean.toFixed(2)),
          reviewer_stddev: Number(stats.stddev.toFixed(2)),
          reviewer_review_count: stats.count,
          z_score: zScore,
          calibrated_score: calibrated,
          reviewer_tendency: tendency,
          written_feedback: r.written_feedback,
          review_submitted_at: r.submitted_at,
        };
      })
      .filter(Boolean) as CalibratedScore[];
  };

  // ─── View 4C: paper_score_summary ─────────────────────────────────────────
  const getPaperScoreSummaries = (): PaperScoreSummary[] => {
    const calibrated = getCalibratedScores();
    const grouped = new Map<string, CalibratedScore[]>();

    calibrated.forEach((item) => {
      const list = grouped.get(item.paper_id) || [];
      list.push(item);
      grouped.set(item.paper_id, list);
    });

    const summaries: PaperScoreSummary[] = [];
    grouped.forEach((items, pId) => {
      const count = items.length;
      const rawScores = items.map((i) => i.raw_weighted_score);
      const calScores = items.map((i) => i.calibrated_score);
      const avgRaw = Number((rawScores.reduce((a, b) => a + b, 0) / count).toFixed(2));
      const avgCal = Number((calScores.reduce((a, b) => a + b, 0) / count).toFixed(2));

      let variance = 0;
      if (count > 1) {
        variance = rawScores.reduce((acc, val) => acc + Math.pow(val - avgRaw, 2), 0) / (count - 1);
      }
      const scoreVariance = Number(Math.sqrt(variance).toFixed(2));

      summaries.push({
        paper_id: pId,
        paper_title: items[0].paper_title,
        track_name: items[0].track_name,
        review_count: count,
        avg_raw_score: avgRaw,
        avg_calibrated_score: avgCal,
        score_variance: scoreVariance,
        min_raw: Math.min(...rawScores),
        max_raw: Math.max(...rawScores),
        high_variance_alert: scoreVariance > 2.0,
      });
    });

    return summaries;
  };

  // ─── View 4D: track_analytics ─────────────────────────────────────────────
  const getTrackAnalytics = (): TrackAnalytics[] => {
    return tracks.map((t) => {
      const trackPapers = papers.filter((p) => p.track_id === t.track_id);
      const submitted = trackPapers.filter((p) => p.status === 'SUBMITTED').length;
      const underReview = trackPapers.filter((p) => p.status === 'UNDER_REVIEW').length;
      const rebuttal = trackPapers.filter((p) => p.status === 'REBUTTAL').length;
      const accepted = trackPapers.filter((p) => p.status === 'ACCEPTED').length;
      const rejected = trackPapers.filter((p) => p.status === 'REJECTED').length;
      const published = trackPapers.filter((p) => p.status === 'PUBLISHED').length;

      const decidedCount = accepted + rejected + published;
      let acceptanceRate: number | null = null;
      if (decidedCount > 0) {
        acceptanceRate = Number((((accepted + published) / decidedCount) * 100).toFixed(1));
      }

      return {
        track_id: t.track_id,
        track_name: t.track_name,
        min_score_threshold: t.min_score_threshold,
        total_papers: trackPapers.length,
        submitted_count: submitted,
        under_review_count: underReview,
        rebuttal_count: rebuttal,
        accepted_count: accepted,
        rejected_count: rejected,
        published_count: published,
        acceptance_rate_pct: acceptanceRate,
      };
    });
  };

  // ─── View 4E: threaded_rebuttals (Recursive CTE Tree) ──────────────────────
  const getThreadedRebuttalsForPaper = (paperId: string): RebuttalComment[] => {
    const paper = papers.find((p) => p.paper_id === paperId);
    if (!paper) return [];

    const paperComments = rebuttals.filter((r) => r.paper_id === paperId);
    const paperAssignments = assignments.filter((a) => a.paper_id === paperId);

    // Deterministic reviewer numbering matching schema.sql
    const reviewerNumberMap = new Map<string, number>();
    paperAssignments
      .sort((a, b) => new Date(a.assigned_at).getTime() - new Date(b.assigned_at).getTime())
      .forEach((a, index) => {
        reviewerNumberMap.set(a.reviewer_id, index + 1);
      });

    // Helper to get double-blind display name
    const getDisplayName = (userId: string) => {
      const u = users.find((usr) => usr.user_id === userId);
      if (!u) return 'Anonymous';

      if (paper.status !== 'PUBLISHED') {
        if (u.role === 'AUTHOR') return 'Author (Blind)';
        if (u.role === 'REVIEWER') {
          const num = reviewerNumberMap.get(userId) || 1;
          return `Reviewer #${num}`;
        }
        if (u.role === 'CHAIR') return 'Track Chair';
      }
      return `${u.first_name} ${u.last_name}`;
    };

    // Recursive tree building with depth
    const buildTree = (parentId: string | null, depth: number): RebuttalComment[] => {
      return paperComments
        .filter((c) => (c.parent_comment_id || null) === parentId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((c) => {
          const user = users.find((u) => u.user_id === c.user_id);
          return {
            ...c,
            depth,
            user_role: user?.role,
            display_name: getDisplayName(c.user_id),
            children: buildTree(c.comment_id, depth + 1),
          };
        });
    };

    return buildTree(null, 0);
  };

  const value = useMemo(
    () => ({
      currentUser,
      users,
      setCurrentUser,
      setRole,
      tracks,
      papers,
      assignments,
      reviews,
      rebuttals,
      publications,
      getBlindReviewerPapers,
      getCalibratedScores,
      getPaperScoreSummaries,
      getTrackAnalytics,
      getThreadedRebuttalsForPaper,
      submitPaper,
      assignReviewer,
      submitReview,
      addRebuttalComment,
      publishPaper,
      verifyChain,
      simulateTamperChain,
      resetToSeedData,
      toasts,
      addToast,
      removeToast,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser, users, tracks, papers, assignments, reviews, rebuttals, publications, toasts]
  );

  return <AcademicContext.Provider value={value}>{children}</AcademicContext.Provider>;
}

export function useAcademic() {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
}
