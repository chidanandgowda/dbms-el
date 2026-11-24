export type UserRole = 'AUTHOR' | 'REVIEWER' | 'CHAIR';

export type PaperStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REBUTTAL'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PUBLISHED';

export type AssignmentStatus = 'ASSIGNED' | 'COMPLETED';

export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  affiliation: string;
  role: UserRole;
  joined_at: string;
}

export interface Track {
  track_id: string;
  track_name: string;
  description: string | null;
  min_score_threshold: number;
}

export interface Paper {
  paper_id: string;
  author_id: string;
  track_id: string;
  title: string;
  normalized_title: string;
  abstract: string;
  pdf_url: string | null;
  file_hash: string | null;
  status: PaperStatus;
  submitted_at: string;
  // Joined fields for display
  author?: User;
  track?: Track;
}

export interface ReviewAssignment {
  assignment_id: string;
  paper_id: string;
  reviewer_id: string;
  assigned_at: string;
  status: AssignmentStatus;
  // Joined fields
  paper?: Paper;
  reviewer?: User;
  review?: Review;
}

export interface Review {
  review_id: string;
  assignment_id: string;
  originality_score: number; // 1..10
  technical_score: number;   // 1..10
  clarity_score: number;     // 1..10
  written_feedback: string;
  submitted_at: string;
  // Computed / joined fields
  raw_weighted_score?: number;
  reviewer?: User;
}

export interface RebuttalComment {
  comment_id: string;
  paper_id: string;
  user_id: string;
  parent_comment_id: string | null;
  body: string;
  created_at: string;
  // CTE fields
  depth?: number;
  user_role?: UserRole;
  display_name?: string;
  children?: RebuttalComment[];
}

export interface Publication {
  pub_id: string;
  paper_id: string;
  doi_string: string;
  published_at: string;
  prev_block_hash: string;
  record_hash: string;
  // Joined paper
  paper?: Paper;
}

export interface BlindReviewerPaper {
  paper_id: string;
  track_id: string;
  track_name: string;
  title: string;
  abstract: string;
  pdf_url: string | null;
  status: PaperStatus;
  submitted_at: string;
  author_id: string | null;
  author_name: string;
  author_affiliation: string;
  double_blind_active: boolean;
  assignment_id?: string;
  assignment_status?: AssignmentStatus;
  existing_review?: Review;
}

export interface CalibratedScore {
  paper_id: string;
  paper_title: string;
  track_name: string;
  reviewer_id: string;
  reviewer_name: string;
  review_id: string;
  originality_score: number;
  technical_score: number;
  clarity_score: number;
  raw_weighted_score: number;
  reviewer_mean: number;
  reviewer_stddev: number;
  reviewer_review_count: number;
  z_score: number;
  calibrated_score: number;
  reviewer_tendency: 'HARSH' | 'LENIENT' | 'MODERATE';
  written_feedback: string;
  review_submitted_at: string;
}

export interface PaperScoreSummary {
  paper_id: string;
  paper_title: string;
  track_name: string;
  review_count: number;
  avg_raw_score: number;
  avg_calibrated_score: number;
  score_variance: number;
  min_raw: number;
  max_raw: number;
  high_variance_alert: boolean;
}

export interface TrackAnalytics {
  track_id: string;
  track_name: string;
  min_score_threshold: number;
  total_papers: number;
  submitted_count: number;
  under_review_count: number;
  rebuttal_count: number;
  accepted_count: number;
  rejected_count: number;
  published_count: number;
  acceptance_rate_pct: number | null;
}

export interface ChainVerificationReport {
  valid: boolean;
  total: number;
  tampered_count: number;
  tampered: Array<{
    pub_id: string;
    doi: string;
    issue: string;
    expected: string;
    actual: string;
  }>;
  message: string;
}
