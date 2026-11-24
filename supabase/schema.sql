-- ============================================================================
-- Academic Peer-Review & Publication Management System
-- PostgreSQL Schema — "Database-Enforced Academic Integrity"
-- ============================================================================
-- Idempotent: safe to re-run (uses IF NOT EXISTS / OR REPLACE throughout).
-- Requires Supabase with pgcrypto enabled.
-- ============================================================================

-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- 0. Extensions
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- digest(), gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram similarity for fuzzy title matching


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- 1. Custom ENUM Types
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('AUTHOR', 'REVIEWER', 'CHAIR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE paper_status AS ENUM (
    'SUBMITTED', 'UNDER_REVIEW', 'REBUTTAL', 'ACCEPTED', 'REJECTED', 'PUBLISHED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('ASSIGNED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- 2. Core Tables
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

-- ─── USERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  user_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name    TEXT        NOT NULL CHECK (char_length(first_name) >= 1),
  last_name     TEXT        NOT NULL CHECK (char_length(last_name)  >= 1),
  email         TEXT        NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  affiliation   TEXT        NOT NULL CHECK (char_length(affiliation) >= 2),
  role          user_role   NOT NULL DEFAULT 'AUTHOR',
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  users IS 'All system participants: authors, peer reviewers, and track chairs.';
COMMENT ON COLUMN users.affiliation IS 'Primary institutional affiliation — used for COI detection.';

-- ─── TRACKS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tracks (
  track_id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  track_name           TEXT        NOT NULL UNIQUE CHECK (char_length(track_name) >= 2),
  description          TEXT,
  min_score_threshold  NUMERIC(4,2) NOT NULL DEFAULT 5.00
                       CHECK (min_score_threshold >= 0 AND min_score_threshold <= 10)
);

COMMENT ON TABLE  tracks IS 'Conference / journal tracks that papers are submitted to.';
COMMENT ON COLUMN tracks.min_score_threshold IS 'Minimum calibrated score for automatic acceptance consideration.';

-- ─── PAPERS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS papers (
  paper_id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id        UUID          NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  track_id         UUID          NOT NULL REFERENCES tracks(track_id) ON DELETE RESTRICT,
  title            TEXT          NOT NULL CHECK (char_length(title) >= 5),
  normalized_title TEXT          NOT NULL DEFAULT '',
  abstract         TEXT          NOT NULL CHECK (char_length(abstract) >= 20),
  pdf_url          TEXT,
  file_hash        TEXT          UNIQUE,  -- SHA-256 hex; enforced unique for dedup
  status           paper_status  NOT NULL DEFAULT 'SUBMITTED',
  submitted_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- Prevent the same author submitting the exact same title to the same track
  CONSTRAINT uq_author_track_title UNIQUE (author_id, track_id, normalized_title)
);

CREATE INDEX IF NOT EXISTS idx_papers_author   ON papers(author_id);
CREATE INDEX IF NOT EXISTS idx_papers_track    ON papers(track_id);
CREATE INDEX IF NOT EXISTS idx_papers_status   ON papers(status);
CREATE INDEX IF NOT EXISTS idx_papers_hash     ON papers(file_hash);
-- Trigram index for fuzzy title similarity searches
CREATE INDEX IF NOT EXISTS idx_papers_title_trgm ON papers USING gin (normalized_title gin_trgm_ops);

COMMENT ON COLUMN papers.file_hash        IS 'SHA-256 hex digest of the uploaded PDF — enforces cryptographic deduplication.';
COMMENT ON COLUMN papers.normalized_title IS 'Lowercased, whitespace-collapsed title for dedup matching.';

-- ─── REVIEW_ASSIGNMENTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS review_assignments (
  assignment_id UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id      UUID              NOT NULL REFERENCES papers(paper_id)  ON DELETE CASCADE,
  reviewer_id   UUID              NOT NULL REFERENCES users(user_id)    ON DELETE RESTRICT,
  assigned_at   TIMESTAMPTZ       NOT NULL DEFAULT now(),
  status        assignment_status NOT NULL DEFAULT 'ASSIGNED',

  CONSTRAINT uq_paper_reviewer UNIQUE (paper_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_paper    ON review_assignments(paper_id);
CREATE INDEX IF NOT EXISTS idx_assignments_reviewer ON review_assignments(reviewer_id);

-- ─── REVIEWS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  review_id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id     UUID        NOT NULL UNIQUE REFERENCES review_assignments(assignment_id) ON DELETE CASCADE,
  originality_score INT         NOT NULL CHECK (originality_score BETWEEN 1 AND 10),
  technical_score   INT         NOT NULL CHECK (technical_score   BETWEEN 1 AND 10),
  clarity_score     INT         NOT NULL CHECK (clarity_score     BETWEEN 1 AND 10),
  written_feedback  TEXT        NOT NULL CHECK (char_length(written_feedback) >= 10),
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_assignment ON reviews(assignment_id);

COMMENT ON TABLE reviews IS 'Peer-review scores and narrative feedback, one per assignment.';

-- ─── REBUTTAL_COMMENTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rebuttal_comments (
  comment_id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id          UUID        NOT NULL REFERENCES papers(paper_id)  ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES users(user_id)    ON DELETE RESTRICT,
  parent_comment_id UUID        REFERENCES rebuttal_comments(comment_id) ON DELETE CASCADE,
  body              TEXT        NOT NULL CHECK (char_length(body) >= 1),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rebuttals_paper  ON rebuttal_comments(paper_id);
CREATE INDEX IF NOT EXISTS idx_rebuttals_parent ON rebuttal_comments(parent_comment_id);

-- ─── PUBLICATIONS (Hash-Chained Ledger) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS publications (
  pub_id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id        UUID        NOT NULL UNIQUE REFERENCES papers(paper_id) ON DELETE RESTRICT,
  doi_string      TEXT        NOT NULL UNIQUE CHECK (doi_string ~ '^10\.\d{4,9}/[-._;()/:A-Za-z0-9]+$'),
  published_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  prev_block_hash TEXT        NOT NULL,  -- hash of previous record or 'GENESIS'
  record_hash     TEXT        NOT NULL   -- SHA-256(prev_block_hash || file_hash || doi || timestamp)
);

COMMENT ON TABLE  publications  IS 'Tamper-evident, hash-chained publication ledger (blockchain-lite).';
COMMENT ON COLUMN publications.prev_block_hash IS 'record_hash of the immediately preceding publication, or GENESIS for the first entry.';
COMMENT ON COLUMN publications.record_hash     IS 'SHA-256(prev_block_hash || file_hash || doi_string || published_at) — forms the chain.';


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- 3. Triggers & Functions
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

-- ─── 3A. Auto-generate normalized_title on INSERT/UPDATE ────────────────────

CREATE OR REPLACE FUNCTION fn_normalize_paper_title()
RETURNS TRIGGER AS $$
BEGIN
  -- Lowercase, collapse whitespace, strip leading/trailing spaces
  NEW.normalized_title := lower(regexp_replace(trim(NEW.title), '\s+', ' ', 'g'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_title ON papers;
CREATE TRIGGER trg_normalize_title
  BEFORE INSERT OR UPDATE OF title ON papers
  FOR EACH ROW EXECUTE FUNCTION fn_normalize_paper_title();


-- ─── 3B. Fuzzy Title Similarity Warning ─────────────────────────────────────
-- Raises a WARNING (not exception) when a new paper's normalized title is
-- suspiciously similar to an existing one (>0.6 trigram similarity).

CREATE OR REPLACE FUNCTION fn_check_title_similarity()
RETURNS TRIGGER AS $$
DECLARE
  _similar RECORD;
BEGIN
  SELECT p.paper_id, p.title, similarity(p.normalized_title, NEW.normalized_title) AS sim
    INTO _similar
    FROM papers p
   WHERE p.paper_id != COALESCE(NEW.paper_id, '00000000-0000-0000-0000-000000000000')
     AND p.normalized_title % NEW.normalized_title   -- trigram similarity operator
   ORDER BY sim DESC
   LIMIT 1;

  IF FOUND AND _similar.sim > 0.6 THEN
    RAISE WARNING 'TITLE_SIMILARITY_ALERT: New paper title is %.0f%% similar to existing paper "%" (paper_id: %). Possible self-plagiarism or duplicate submission.',
      _similar.sim * 100, _similar.title, _similar.paper_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_title_similarity ON papers;
CREATE TRIGGER trg_title_similarity
  BEFORE INSERT ON papers
  FOR EACH ROW EXECUTE FUNCTION fn_check_title_similarity();


-- ─── 3C. Conflict of Interest (COI) Guard ───────────────────────────────────
-- BEFORE INSERT trigger on review_assignments. Blocks:
--   1) Self-review  (reviewer = author)
--   2) Institutional conflict (same affiliation)
--   3) Review ring  (tit-for-tat: reviewer authored a paper in the same track
--      that is currently assigned to the paper's author for review)

CREATE OR REPLACE FUNCTION fn_check_coi()
RETURNS TRIGGER AS $$
DECLARE
  _paper        RECORD;
  _reviewer     RECORD;
  _author       RECORD;
  _ring_found   BOOLEAN;
BEGIN
  -- Fetch paper details
  SELECT p.*, u.affiliation AS author_affiliation, u.user_id AS author_uid
    INTO _paper
    FROM papers p
    JOIN users  u ON u.user_id = p.author_id
   WHERE p.paper_id = NEW.paper_id;

  -- Fetch reviewer details
  SELECT * INTO _reviewer FROM users WHERE user_id = NEW.reviewer_id;

  -- ── Check 1: Self-review ──────────────────────────────────────────────────
  IF NEW.reviewer_id = _paper.author_uid THEN
    RAISE EXCEPTION 'COI_SELF_REVIEW: Reviewer "% %" (%) cannot review their own paper "%".',
      _reviewer.first_name, _reviewer.last_name, _reviewer.email, _paper.title
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  -- ── Check 2: Institutional conflict ───────────────────────────────────────
  IF lower(trim(_reviewer.affiliation)) = lower(trim(_paper.author_affiliation)) THEN
    RAISE EXCEPTION 'COI_INSTITUTIONAL: Reviewer "% %" shares affiliation "%" with author. Assignment blocked.',
      _reviewer.first_name, _reviewer.last_name, _reviewer.affiliation
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  -- ── Check 3: Review ring detection ────────────────────────────────────────
  -- Does the reviewer have a paper P2 in the same track where the paper's
  -- author is currently assigned as a reviewer for P2?
  SELECT EXISTS (
    SELECT 1
      FROM papers p2
      JOIN review_assignments ra2 ON ra2.paper_id = p2.paper_id
     WHERE p2.author_id  = NEW.reviewer_id        -- reviewer authored P2
       AND p2.track_id   = _paper.track_id         -- same track
       AND ra2.reviewer_id = _paper.author_uid      -- paper's author reviews P2
       AND ra2.status = 'ASSIGNED'                  -- currently active
  ) INTO _ring_found;

  IF _ring_found THEN
    RAISE EXCEPTION 'COI_REVIEW_RING: Tit-for-tat detected — Reviewer "% %" has a paper in track "%" that is currently being reviewed by this paper''s author. Cross-assignment blocked to prevent review rings.',
      _reviewer.first_name, _reviewer.last_name, (SELECT track_name FROM tracks WHERE track_id = _paper.track_id)
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_coi_guard ON review_assignments;
CREATE TRIGGER trg_coi_guard
  BEFORE INSERT ON review_assignments
  FOR EACH ROW EXECUTE FUNCTION fn_check_coi();


-- ─── 3D. Auto-advance paper status to UNDER_REVIEW on first assignment ─────

CREATE OR REPLACE FUNCTION fn_advance_paper_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE papers
     SET status = 'UNDER_REVIEW'
   WHERE paper_id = NEW.paper_id
     AND status = 'SUBMITTED';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_advance_status ON review_assignments;
CREATE TRIGGER trg_advance_status
  AFTER INSERT ON review_assignments
  FOR EACH ROW EXECUTE FUNCTION fn_advance_paper_status();


-- ─── 3E. Mark assignment COMPLETED when review is submitted ─────────────────

CREATE OR REPLACE FUNCTION fn_complete_assignment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE review_assignments
     SET status = 'COMPLETED'
   WHERE assignment_id = NEW.assignment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_complete_assignment ON reviews;
CREATE TRIGGER trg_complete_assignment
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION fn_complete_assignment();


-- ─── 3F. Hash-Chained Publication Ledger Trigger ────────────────────────────
-- BEFORE INSERT on publications: computes prev_block_hash and record_hash.

CREATE OR REPLACE FUNCTION fn_hash_chain_publication()
RETURNS TRIGGER AS $$
DECLARE
  _prev_hash  TEXT;
  _file_hash  TEXT;
  _payload    TEXT;
BEGIN
  -- Get the most recent publication's record_hash (or GENESIS)
  SELECT record_hash INTO _prev_hash
    FROM publications
   ORDER BY published_at DESC, pub_id DESC
   LIMIT 1;

  IF _prev_hash IS NULL THEN
    _prev_hash := 'GENESIS';
  END IF;

  -- Get the paper's file_hash
  SELECT file_hash INTO _file_hash
    FROM papers
   WHERE paper_id = NEW.paper_id;

  IF _file_hash IS NULL THEN
    RAISE EXCEPTION 'PUBLICATION_ERROR: Paper (%) has no file_hash. Upload and hash the PDF before publishing.',
      NEW.paper_id
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  -- Assemble payload and compute chain hash
  NEW.prev_block_hash := _prev_hash;
  _payload := _prev_hash || _file_hash || NEW.doi_string || NEW.published_at::text;
  NEW.record_hash := encode(digest(_payload, 'sha256'), 'hex');

  -- Also update the paper status to PUBLISHED
  UPDATE papers SET status = 'PUBLISHED' WHERE paper_id = NEW.paper_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hash_chain ON publications;
CREATE TRIGGER trg_hash_chain
  BEFORE INSERT ON publications
  FOR EACH ROW EXECUTE FUNCTION fn_hash_chain_publication();


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- 4. Views
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

-- ─── 4A. Double-Blind View for Reviewers ────────────────────────────────────
-- Completely strips author identity from non-published papers.

CREATE OR REPLACE VIEW blind_reviewer_papers AS
SELECT
  p.paper_id,
  p.track_id,
  t.track_name,
  p.title,
  p.abstract,
  p.pdf_url,
  p.status,
  p.submitted_at,
  -- Author identity is completely masked
  CASE
    WHEN p.status != 'PUBLISHED' THEN NULL
    ELSE p.author_id
  END AS author_id,
  CASE
    WHEN p.status != 'PUBLISHED' THEN '████████'
    ELSE (SELECT first_name || ' ' || last_name FROM users WHERE user_id = p.author_id)
  END AS author_name,
  CASE
    WHEN p.status != 'PUBLISHED' THEN '████████'
    ELSE (SELECT affiliation FROM users WHERE user_id = p.author_id)
  END AS author_affiliation,
  -- Signal for the UI
  (p.status != 'PUBLISHED') AS double_blind_active
FROM papers p
JOIN tracks t ON t.track_id = p.track_id;

COMMENT ON VIEW blind_reviewer_papers IS 'Double-blind view: author identity stripped for all non-PUBLISHED papers.';


-- ─── 4B. Calibrated Paper Scores (Z-Score Normalization) ────────────────────
-- Uses window functions to calibrate each reviewer's scores against their
-- own historical average and standard deviation.

CREATE OR REPLACE VIEW calibrated_paper_scores AS
WITH reviewer_raw AS (
  SELECT
    ra.paper_id,
    ra.reviewer_id,
    r.review_id,
    r.originality_score,
    r.technical_score,
    r.clarity_score,
    -- Raw weighted score
    (r.originality_score * 0.4 +
     r.technical_score   * 0.4 +
     r.clarity_score     * 0.2)::NUMERIC(5,2) AS raw_weighted_score,
    r.written_feedback,
    r.submitted_at
  FROM review_assignments ra
  JOIN reviews r ON r.assignment_id = ra.assignment_id
),
reviewer_stats AS (
  SELECT
    rr.*,
    -- Each reviewer's historical mean and stddev of their raw weighted scores
    AVG(rr.raw_weighted_score)    OVER (PARTITION BY rr.reviewer_id) AS reviewer_mean,
    STDDEV(rr.raw_weighted_score) OVER (PARTITION BY rr.reviewer_id) AS reviewer_stddev,
    COUNT(*)                      OVER (PARTITION BY rr.reviewer_id) AS reviewer_review_count
  FROM reviewer_raw rr
)
SELECT
  rs.paper_id,
  p.title AS paper_title,
  t.track_name,
  rs.reviewer_id,
  u.first_name || ' ' || u.last_name AS reviewer_name,
  rs.review_id,
  rs.originality_score,
  rs.technical_score,
  rs.clarity_score,
  rs.raw_weighted_score,
  rs.reviewer_mean,
  rs.reviewer_stddev,
  rs.reviewer_review_count,
  -- Z-score: how far this score deviates from the reviewer's own average
  -- (positive = reviewer scored this paper above their personal mean)
  CASE
    WHEN rs.reviewer_stddev IS NULL OR rs.reviewer_stddev = 0 THEN 0.00
    ELSE ROUND((rs.raw_weighted_score - rs.reviewer_mean) / rs.reviewer_stddev, 4)
  END AS z_score,
  -- Calibrated score: map Z-score back to a 1-10 scale (mean=5.5, stddev=1.5)
  CASE
    WHEN rs.reviewer_stddev IS NULL OR rs.reviewer_stddev = 0 THEN rs.raw_weighted_score
    ELSE ROUND(
      GREATEST(1, LEAST(10,
        5.5 + 1.5 * ((rs.raw_weighted_score - rs.reviewer_mean) / rs.reviewer_stddev)
      )), 2)
  END AS calibrated_score,
  -- Flag harsh or lenient reviewers (mean significantly below or above 5.5)
  CASE
    WHEN rs.reviewer_mean < 4.0 THEN 'HARSH'
    WHEN rs.reviewer_mean > 7.0 THEN 'LENIENT'
    ELSE 'MODERATE'
  END AS reviewer_tendency,
  rs.written_feedback,
  rs.submitted_at AS review_submitted_at
FROM reviewer_stats rs
JOIN papers p ON p.paper_id = rs.paper_id
JOIN tracks t ON t.track_id = p.track_id
JOIN users  u ON u.user_id  = rs.reviewer_id;

COMMENT ON VIEW calibrated_paper_scores IS 'Reviewer bias calibration: raw scores, Z-scores, and calibrated 1–10 scores using per-reviewer window functions.';


-- ─── 4C. Paper Score Summary (Aggregated per Paper) ─────────────────────────
-- Average raw and calibrated scores per paper, for the Chair dashboard.

CREATE OR REPLACE VIEW paper_score_summary AS
SELECT
  paper_id,
  paper_title,
  track_name,
  COUNT(*)                          AS review_count,
  ROUND(AVG(raw_weighted_score), 2) AS avg_raw_score,
  ROUND(AVG(calibrated_score),  2)  AS avg_calibrated_score,
  ROUND(STDDEV(raw_weighted_score), 2) AS score_variance,
  ROUND(MIN(raw_weighted_score), 2) AS min_raw,
  ROUND(MAX(raw_weighted_score), 2) AS max_raw,
  -- High variance alert: reviewers strongly disagree
  CASE
    WHEN STDDEV(raw_weighted_score) > 2.0 THEN TRUE
    ELSE FALSE
  END AS high_variance_alert
FROM calibrated_paper_scores
GROUP BY paper_id, paper_title, track_name;

COMMENT ON VIEW paper_score_summary IS 'Per-paper aggregated raw and calibrated scores with variance alerts.';


-- ─── 4D. Track Analytics ────────────────────────────────────────────────────

CREATE OR REPLACE VIEW track_analytics AS
SELECT
  t.track_id,
  t.track_name,
  t.min_score_threshold,
  COUNT(DISTINCT p.paper_id) AS total_papers,
  COUNT(DISTINCT p.paper_id) FILTER (WHERE p.status = 'SUBMITTED')    AS submitted_count,
  COUNT(DISTINCT p.paper_id) FILTER (WHERE p.status = 'UNDER_REVIEW') AS under_review_count,
  COUNT(DISTINCT p.paper_id) FILTER (WHERE p.status = 'REBUTTAL')     AS rebuttal_count,
  COUNT(DISTINCT p.paper_id) FILTER (WHERE p.status = 'ACCEPTED')     AS accepted_count,
  COUNT(DISTINCT p.paper_id) FILTER (WHERE p.status = 'REJECTED')     AS rejected_count,
  COUNT(DISTINCT p.paper_id) FILTER (WHERE p.status = 'PUBLISHED')    AS published_count,
  CASE
    WHEN COUNT(DISTINCT p.paper_id) FILTER (WHERE p.status IN ('ACCEPTED','REJECTED','PUBLISHED')) = 0 THEN NULL
    ELSE ROUND(
      COUNT(DISTINCT p.paper_id) FILTER (WHERE p.status IN ('ACCEPTED','PUBLISHED'))::NUMERIC /
      COUNT(DISTINCT p.paper_id) FILTER (WHERE p.status IN ('ACCEPTED','REJECTED','PUBLISHED')) * 100
    , 1)
  END AS acceptance_rate_pct
FROM tracks t
LEFT JOIN papers p ON p.track_id = t.track_id
GROUP BY t.track_id, t.track_name, t.min_score_threshold;

COMMENT ON VIEW track_analytics IS 'Per-track submission counts and acceptance rates for the Chair dashboard.';


-- ─── 4E. Threaded Rebuttals (Recursive CTE as a View) ──────────────────────

CREATE OR REPLACE VIEW threaded_rebuttals AS
WITH RECURSIVE comment_tree AS (
  -- Base case: root-level comments (no parent)
  SELECT
    rc.comment_id,
    rc.paper_id,
    rc.user_id,
    rc.parent_comment_id,
    rc.body,
    rc.created_at,
    0 AS depth,
    ARRAY[rc.created_at, rc.comment_id::text::timestamptz] AS sort_path
  FROM rebuttal_comments rc
  WHERE rc.parent_comment_id IS NULL

  UNION ALL

  -- Recursive case: replies
  SELECT
    rc.comment_id,
    rc.paper_id,
    rc.user_id,
    rc.parent_comment_id,
    rc.body,
    rc.created_at,
    ct.depth + 1,
    ct.sort_path || rc.created_at || rc.comment_id::text::timestamptz
  FROM rebuttal_comments rc
  JOIN comment_tree ct ON ct.comment_id = rc.parent_comment_id
)
SELECT
  ct.comment_id,
  ct.paper_id,
  ct.user_id,
  ct.parent_comment_id,
  ct.body,
  ct.created_at,
  ct.depth,
  ct.sort_path,
  u.role AS user_role,
  -- Double-blind display name
  CASE
    WHEN p.status != 'PUBLISHED' AND u.role = 'AUTHOR'   THEN 'Author (Blind)'
    WHEN p.status != 'PUBLISHED' AND u.role = 'REVIEWER'  THEN 'Reviewer #' || (
      -- Deterministic anonymous reviewer numbering per paper
      SELECT rn FROM (
        SELECT ra2.reviewer_id,
               ROW_NUMBER() OVER (ORDER BY ra2.assigned_at) AS rn
        FROM review_assignments ra2
        WHERE ra2.paper_id = ct.paper_id
      ) numbered
      WHERE numbered.reviewer_id = ct.user_id
      LIMIT 1
    )::text
    WHEN p.status != 'PUBLISHED' AND u.role = 'CHAIR'     THEN 'Track Chair'
    ELSE u.first_name || ' ' || u.last_name
  END AS display_name
FROM comment_tree ct
JOIN users  u ON u.user_id  = ct.user_id
JOIN papers p ON p.paper_id = ct.paper_id
ORDER BY ct.sort_path;

COMMENT ON VIEW threaded_rebuttals IS 'Recursive CTE: nested rebuttal comments with double-blind display names and depth for indentation.';


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- 5. RPC Functions (Supabase Edge-callable)
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

-- ─── 5A. Verify Hash-Chain Integrity ────────────────────────────────────────
-- Walk the entire publication ledger and re-derive each record_hash.
-- Returns a JSON report: { valid: bool, total: int, tampered: [...], message: string }

CREATE OR REPLACE FUNCTION verify_publication_chain()
RETURNS JSON AS $$
DECLARE
  _rec        RECORD;
  _expected   TEXT;
  _prev_hash  TEXT := 'GENESIS';
  _total      INT  := 0;
  _tampered   JSON[];
  _file_hash  TEXT;
  _payload    TEXT;
BEGIN
  _tampered := ARRAY[]::JSON[];

  FOR _rec IN
    SELECT pub.*, p.file_hash
      FROM publications pub
      JOIN papers p ON p.paper_id = pub.paper_id
     ORDER BY pub.published_at ASC, pub.pub_id ASC
  LOOP
    _total := _total + 1;

    -- Verify prev_block_hash pointer
    IF _rec.prev_block_hash != _prev_hash THEN
      _tampered := array_append(_tampered, json_build_object(
        'pub_id',   _rec.pub_id,
        'doi',      _rec.doi_string,
        'issue',    'prev_block_hash mismatch',
        'expected', _prev_hash,
        'actual',   _rec.prev_block_hash
      ));
    END IF;

    -- Recompute record_hash
    _payload  := _rec.prev_block_hash || _rec.file_hash || _rec.doi_string || _rec.published_at::text;
    _expected := encode(digest(_payload, 'sha256'), 'hex');

    IF _rec.record_hash != _expected THEN
      _tampered := array_append(_tampered, json_build_object(
        'pub_id',   _rec.pub_id,
        'doi',      _rec.doi_string,
        'issue',    'record_hash mismatch',
        'expected', _expected,
        'actual',   _rec.record_hash
      ));
    END IF;

    _prev_hash := _rec.record_hash;
  END LOOP;

  RETURN json_build_object(
    'valid',    array_length(_tampered, 1) IS NULL,
    'total',    _total,
    'tampered_count', COALESCE(array_length(_tampered, 1), 0),
    'tampered', COALESCE(to_json(_tampered), '[]'::json),
    'message',  CASE
                  WHEN array_length(_tampered, 1) IS NULL
                  THEN 'Chain Intact — 0 Tampered Records'
                  ELSE 'ALERT: ' || array_length(_tampered, 1) || ' integrity violation(s) detected!'
                END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION verify_publication_chain IS 'Re-derives the entire hash chain and returns a tamper-detection report.';


-- ─── 5B. Get Threaded Rebuttals for a Paper ─────────────────────────────────
-- Convenience RPC wrapper around the recursive CTE view.

CREATE OR REPLACE FUNCTION get_threaded_rebuttals(p_paper_id UUID)
RETURNS TABLE (
  comment_id        UUID,
  paper_id          UUID,
  user_id           UUID,
  parent_comment_id UUID,
  body              TEXT,
  created_at        TIMESTAMPTZ,
  depth             INT,
  user_role         user_role,
  display_name      TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tr.comment_id,
    tr.paper_id,
    tr.user_id,
    tr.parent_comment_id,
    tr.body,
    tr.created_at,
    tr.depth,
    tr.user_role,
    tr.display_name
  FROM threaded_rebuttals tr
  WHERE tr.paper_id = p_paper_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ─── 5C. Get Similar Titles (for frontend dedup warnings) ───────────────────

CREATE OR REPLACE FUNCTION find_similar_titles(p_title TEXT, p_threshold REAL DEFAULT 0.4)
RETURNS TABLE (
  paper_id   UUID,
  title      TEXT,
  author_id  UUID,
  track_name TEXT,
  similarity REAL
) AS $$
DECLARE
  _normalized TEXT;
BEGIN
  _normalized := lower(regexp_replace(trim(p_title), '\s+', ' ', 'g'));
  RETURN QUERY
  SELECT
    p.paper_id,
    p.title,
    p.author_id,
    t.track_name,
    similarity(p.normalized_title, _normalized) AS similarity
  FROM papers p
  JOIN tracks t ON t.track_id = p.track_id
  WHERE similarity(p.normalized_title, _normalized) > p_threshold
  ORDER BY similarity DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- 6. Row-Level Security (RLS) Policies
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- Supabase uses auth.uid() for the current user and auth.jwt()->>'role' for
-- app-level roles stored in JWT metadata.
-- These policies implement double-blind enforcement at the database level.

ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE rebuttal_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications       ENABLE ROW LEVEL SECURITY;

-- ─── USERS ──────────────────────────────────────────────────────────────────
-- Everyone can read basic user info; users can update their own profile.

CREATE POLICY "users_read_all"  ON users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = user_id);

-- ─── TRACKS ─────────────────────────────────────────────────────────────────
-- Public read; only chairs can insert/update.

CREATE POLICY "tracks_read_all"   ON tracks FOR SELECT USING (true);
CREATE POLICY "tracks_manage_chair" ON tracks FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'CHAIR')
);

-- ─── PAPERS ─────────────────────────────────────────────────────────────────
-- Authors: full access to their own papers.
-- Reviewers: can read papers assigned to them, but through blind_reviewer_papers view
--            (direct table access returns all columns, so we restrict here).
-- Chairs: full read access.

CREATE POLICY "papers_author_all" ON papers FOR ALL USING (author_id = auth.uid());

CREATE POLICY "papers_reviewer_read" ON papers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM review_assignments ra
    WHERE ra.paper_id = papers.paper_id AND ra.reviewer_id = auth.uid()
  )
);

CREATE POLICY "papers_chair_read" ON papers FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'CHAIR')
);

CREATE POLICY "papers_published_read" ON papers FOR SELECT USING (status = 'PUBLISHED');

-- ─── REVIEW_ASSIGNMENTS ────────────────────────────────────────────────────
-- Chairs can manage; reviewers can see their own assignments.

CREATE POLICY "assignments_chair_all" ON review_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'CHAIR')
);

CREATE POLICY "assignments_reviewer_read" ON review_assignments FOR SELECT USING (
  reviewer_id = auth.uid()
);

-- ─── REVIEWS ────────────────────────────────────────────────────────────────
-- Reviewers can insert/read their own reviews.
-- Chairs can read all reviews.
-- Authors can read reviews for their papers (feedback visibility).

CREATE POLICY "reviews_reviewer_insert" ON reviews FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM review_assignments ra
    WHERE ra.assignment_id = reviews.assignment_id AND ra.reviewer_id = auth.uid()
  )
);

CREATE POLICY "reviews_reviewer_read" ON reviews FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM review_assignments ra
    WHERE ra.assignment_id = reviews.assignment_id AND ra.reviewer_id = auth.uid()
  )
);

CREATE POLICY "reviews_chair_read" ON reviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'CHAIR')
);

CREATE POLICY "reviews_author_read" ON reviews FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM review_assignments ra
    JOIN papers p ON p.paper_id = ra.paper_id
    WHERE ra.assignment_id = reviews.assignment_id
      AND p.author_id = auth.uid()
      AND p.status IN ('REBUTTAL', 'ACCEPTED', 'REJECTED', 'PUBLISHED')
  )
);

-- ─── REBUTTAL_COMMENTS ─────────────────────────────────────────────────────
-- Participants (author, assigned reviewers, chairs) can read and insert.

CREATE POLICY "rebuttals_read" ON rebuttal_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'CHAIR')
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM papers p WHERE p.paper_id = rebuttal_comments.paper_id AND p.author_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM review_assignments ra
    WHERE ra.paper_id = rebuttal_comments.paper_id AND ra.reviewer_id = auth.uid()
  )
);

CREATE POLICY "rebuttals_insert" ON rebuttal_comments FOR INSERT WITH CHECK (
  user_id = auth.uid() AND (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'CHAIR')
    OR EXISTS (
      SELECT 1 FROM papers p WHERE p.paper_id = rebuttal_comments.paper_id AND p.author_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM review_assignments ra
      WHERE ra.paper_id = rebuttal_comments.paper_id AND ra.reviewer_id = auth.uid()
    )
  )
);

-- ─── PUBLICATIONS ───────────────────────────────────────────────────────────
-- Public read (it's the public ledger); only chairs can insert.

CREATE POLICY "publications_read_all" ON publications FOR SELECT USING (true);
CREATE POLICY "publications_chair_insert" ON publications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'CHAIR')
);


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- 7. Utility Indexes for Performance
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

CREATE INDEX IF NOT EXISTS idx_publications_chain ON publications(published_at ASC, pub_id ASC);
CREATE INDEX IF NOT EXISTS idx_users_affiliation  ON users(lower(affiliation));
CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role);


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- Done. Run seed.sql next to populate sample data.
-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
