import { User, Track, Paper, ReviewAssignment, Review, RebuttalComment, Publication } from '@/types/database';

export const INITIAL_USERS: User[] = [
  {
    user_id: 'a0000000-0000-0000-0000-000000000001',
    first_name: 'Amara',
    last_name: 'Okonkwo',
    email: 'amara.okonkwo@mit.edu',
    affiliation: 'Massachusetts Institute of Technology',
    role: 'AUTHOR',
    joined_at: '2025-01-15T09:00:00Z',
  },
  {
    user_id: 'a0000000-0000-0000-0000-000000000002',
    first_name: 'Liang',
    last_name: 'Chen',
    email: 'liang.chen@tsinghua.edu.cn',
    affiliation: 'Tsinghua University',
    role: 'AUTHOR',
    joined_at: '2025-02-20T10:30:00Z',
  },
  {
    user_id: 'b0000000-0000-0000-0000-000000000001',
    first_name: 'Priya',
    last_name: 'Sharma',
    email: 'priya.sharma@ethz.ch',
    affiliation: 'ETH Zürich',
    role: 'REVIEWER',
    joined_at: '2024-11-01T08:00:00Z',
  },
  {
    user_id: 'b0000000-0000-0000-0000-000000000002',
    first_name: 'Marcus',
    last_name: 'Weber',
    email: 'marcus.weber@tum.de',
    affiliation: 'Technical University of Munich',
    role: 'REVIEWER',
    joined_at: '2024-12-10T14:00:00Z',
  },
  {
    user_id: 'c0000000-0000-0000-0000-000000000001',
    first_name: 'Elena',
    last_name: 'Vasquez',
    email: 'elena.vasquez@stanford.edu',
    affiliation: 'Stanford University',
    role: 'CHAIR',
    joined_at: '2024-06-01T06:00:00Z',
  },
  {
    user_id: 'a0000000-0000-0000-0000-000000000003',
    first_name: 'Tobias',
    last_name: 'Richter',
    email: 'tobias.richter@tum.de',
    affiliation: 'Technical University of Munich',
    role: 'AUTHOR',
    joined_at: '2025-03-05T11:00:00Z',
  },
];

export const INITIAL_TRACKS: Track[] = [
  {
    track_id: 'd0000000-0000-0000-0000-000000000001',
    track_name: 'Machine Learning & AI',
    description: 'Original research in supervised, unsupervised, and reinforcement learning, neural architectures, and AI safety.',
    min_score_threshold: 6.0,
  },
  {
    track_id: 'd0000000-0000-0000-0000-000000000002',
    track_name: 'Distributed Systems & Databases',
    description: 'Advances in distributed consensus, storage engines, query optimization, and cloud-native data platforms.',
    min_score_threshold: 5.5,
  },
  {
    track_id: 'd0000000-0000-0000-0000-000000000003',
    track_name: 'Human-Computer Interaction',
    description: 'Studies in user experience, accessibility, interaction paradigms, and computational design methodologies.',
    min_score_threshold: 5.0,
  },
];

export const INITIAL_PAPERS: Paper[] = [
  {
    paper_id: 'e0000000-0000-0000-0000-000000000001',
    author_id: 'a0000000-0000-0000-0000-000000000001',
    track_id: 'd0000000-0000-0000-0000-000000000001',
    title: 'Attention Is All You Need: Revisiting Sparse Transformer Architectures for Long-Context Genomics',
    normalized_title: 'attention is all you need: revisiting sparse transformer architectures for long-context genomics',
    abstract: 'We present a novel sparse attention mechanism that achieves linear-time complexity for genomic sequence modeling. Our approach introduces locality-sensitive hashing into the multi-head attention framework, reducing memory footprint by 94% while maintaining competitive accuracy on the GenomeBench-2025 suite. Extensive ablation studies across 12 datasets confirm the robustness of our method.',
    pdf_url: 'https://storage.supabase.co/papers/e001_sparse_attention.pdf',
    file_hash: 'a3f7c2b1d9e4f5a6b8c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    status: 'PUBLISHED',
    submitted_at: '2025-06-15T14:22:00Z',
  },
  {
    paper_id: 'e0000000-0000-0000-0000-000000000002',
    author_id: 'a0000000-0000-0000-0000-000000000002',
    track_id: 'd0000000-0000-0000-0000-000000000002',
    title: 'CausalDB: A Causally Consistent Distributed Database with Sub-Millisecond Cross-Region Commits',
    normalized_title: 'causaldb: a causally consistent distributed database with sub-millisecond cross-region commits',
    abstract: 'We introduce CausalDB, a geo-distributed database that provides causal consistency with commit latencies under 800 microseconds across continental regions. Our protocol leverages hybrid logical clocks with bounded clock skew and a novel dependency-tracking vector that compresses to constant space. We evaluate on a 15-region deployment spanning AWS, GCP, and Azure and demonstrate 3.2× throughput improvement over existing causal stores.',
    pdf_url: 'https://storage.supabase.co/papers/e002_causaldb.pdf',
    file_hash: 'b4a8d3c2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4',
    status: 'PUBLISHED',
    submitted_at: '2025-05-28T09:45:00Z',
  },
  {
    paper_id: 'e0000000-0000-0000-0000-000000000003',
    author_id: 'a0000000-0000-0000-0000-000000000001',
    track_id: 'd0000000-0000-0000-0000-000000000003',
    title: 'Designing Accessible Data Dashboards: A Mixed-Methods Study with Screen Reader Users',
    normalized_title: 'designing accessible data dashboards: a mixed-methods study with screen reader users',
    abstract: 'This mixed-methods study investigates the accessibility barriers faced by blind and low-vision users when interacting with modern data dashboards. Through 24 semi-structured interviews and a controlled usability evaluation with 40 participants, we identify 7 critical interaction patterns that break assistive technology compatibility. We propose and validate the ARIA-Chart design framework that improves task completion rates by 62% for screen reader users.',
    pdf_url: 'https://storage.supabase.co/papers/e003_accessible_dashboards.pdf',
    file_hash: 'c5b9e4d3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5',
    status: 'UNDER_REVIEW',
    submitted_at: '2025-08-10T16:30:00Z',
  },
  {
    paper_id: 'e0000000-0000-0000-0000-000000000004',
    author_id: 'a0000000-0000-0000-0000-000000000002',
    track_id: 'd0000000-0000-0000-0000-000000000001',
    title: 'Federated Continual Learning Under Non-IID Data Drift with Gradient Memory Replay',
    normalized_title: 'federated continual learning under non-iid data drift with gradient memory replay',
    abstract: 'We address the intersection of federated and continual learning under severe non-IID data distributions. Our Federated Gradient Memory Replay (FedGMR) framework maintains a compact, privacy-preserving gradient episodic memory on each client and employs a server-side distillation step that balances plasticity with stability. Experiments on Split-CIFAR-100 and Federated-TinyImageNet show FedGMR reduces catastrophic forgetting by 41% compared to FedAvg with EWC.',
    pdf_url: 'https://storage.supabase.co/papers/e004_fedgmr.pdf',
    file_hash: 'd6c0f5e4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6',
    status: 'REBUTTAL',
    submitted_at: '2025-07-22T11:15:00Z',
  },
  {
    paper_id: 'e0000000-0000-0000-0000-000000000005',
    author_id: 'a0000000-0000-0000-0000-000000000003',
    track_id: 'd0000000-0000-0000-0000-000000000002',
    title: 'Adaptive Consensus: Byzantine Fault Tolerance with Dynamic Validator Committees',
    normalized_title: 'adaptive consensus: byzantine fault tolerance with dynamic validator committees',
    abstract: 'We propose Adaptive Consensus, a Byzantine fault-tolerant protocol that dynamically adjusts its validator committee size based on observed network conditions and fault rates. Unlike static BFT protocols that over-provision validators, our approach monitors message delays and equivocation evidence to scale the committee between f+1 and 3f+1 validators. Formal verification in TLA+ confirms safety under partial synchrony with up to f Byzantine faults.',
    pdf_url: 'https://storage.supabase.co/papers/e005_adaptive_consensus.pdf',
    file_hash: 'e7d1a6f5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7',
    status: 'SUBMITTED',
    submitted_at: '2025-09-01T08:00:00Z',
  },
];

export const INITIAL_ASSIGNMENTS: ReviewAssignment[] = [
  // Paper 1
  {
    assignment_id: 'f0000000-0000-0000-0000-000000000001',
    paper_id: 'e0000000-0000-0000-0000-000000000001',
    reviewer_id: 'b0000000-0000-0000-0000-000000000001', // Priya (ETH)
    assigned_at: '2025-06-20T10:00:00Z',
    status: 'COMPLETED',
  },
  {
    assignment_id: 'f0000000-0000-0000-0000-000000000002',
    paper_id: 'e0000000-0000-0000-0000-000000000001',
    reviewer_id: 'b0000000-0000-0000-0000-000000000002', // Marcus (TUM)
    assigned_at: '2025-06-20T10:05:00Z',
    status: 'COMPLETED',
  },
  // Paper 2
  {
    assignment_id: 'f0000000-0000-0000-0000-000000000003',
    paper_id: 'e0000000-0000-0000-0000-000000000002',
    reviewer_id: 'b0000000-0000-0000-0000-000000000001', // Priya
    assigned_at: '2025-06-05T09:00:00Z',
    status: 'COMPLETED',
  },
  {
    assignment_id: 'f0000000-0000-0000-0000-000000000004',
    paper_id: 'e0000000-0000-0000-0000-000000000002',
    reviewer_id: 'b0000000-0000-0000-0000-000000000002', // Marcus
    assigned_at: '2025-06-05T09:05:00Z',
    status: 'COMPLETED',
  },
  // Paper 3
  {
    assignment_id: 'f0000000-0000-0000-0000-000000000005',
    paper_id: 'e0000000-0000-0000-0000-000000000003',
    reviewer_id: 'b0000000-0000-0000-0000-000000000001', // Priya
    assigned_at: '2025-08-20T14:00:00Z',
    status: 'ASSIGNED',
  },
  {
    assignment_id: 'f0000000-0000-0000-0000-000000000006',
    paper_id: 'e0000000-0000-0000-0000-000000000003',
    reviewer_id: 'b0000000-0000-0000-0000-000000000002', // Marcus
    assigned_at: '2025-08-20T14:05:00Z',
    status: 'ASSIGNED',
  },
  // Paper 4
  {
    assignment_id: 'f0000000-0000-0000-0000-000000000007',
    paper_id: 'e0000000-0000-0000-0000-000000000004',
    reviewer_id: 'b0000000-0000-0000-0000-000000000001', // Priya
    assigned_at: '2025-07-30T10:00:00Z',
    status: 'COMPLETED',
  },
  {
    assignment_id: 'f0000000-0000-0000-0000-000000000008',
    paper_id: 'e0000000-0000-0000-0000-000000000004',
    reviewer_id: 'b0000000-0000-0000-0000-000000000002', // Marcus
    assigned_at: '2025-07-30T10:05:00Z',
    status: 'COMPLETED',
  },
];

export const INITIAL_REVIEWS: Review[] = [
  // Paper 1
  {
    review_id: 'aa000000-0000-0000-0000-000000000001',
    assignment_id: 'f0000000-0000-0000-0000-000000000001',
    originality_score: 5,
    technical_score: 5,
    clarity_score: 4,
    written_feedback: 'The sparse attention mechanism shows incremental improvement over existing locality-sensitive hashing approaches. While the 94% memory reduction claim is supported by experiments, the genomic-specific evaluation limits generalizability. The ablation study methodology is acceptable but would benefit from cross-domain benchmarks. Writing is dense in places; Section 4.2 needs restructuring.',
    submitted_at: '2025-07-01T11:00:00Z',
  },
  {
    review_id: 'aa000000-0000-0000-0000-000000000002',
    assignment_id: 'f0000000-0000-0000-0000-000000000002',
    originality_score: 9,
    technical_score: 8,
    clarity_score: 9,
    written_feedback: 'Excellent contribution to efficient attention mechanisms. The marriage of LSH with multi-head attention is elegant and well-motivated. Experimental results on GenomeBench-2025 are compelling. The paper is exceptionally well-written and clearly structured. Minor suggestion: include wall-clock training time comparisons alongside the FLOP analysis.',
    submitted_at: '2025-07-02T15:30:00Z',
  },
  // Paper 2
  {
    review_id: 'aa000000-0000-0000-0000-000000000003',
    assignment_id: 'f0000000-0000-0000-0000-000000000003',
    originality_score: 4,
    technical_score: 5,
    clarity_score: 3,
    written_feedback: 'The causal consistency protocol is technically sound but the novelty over existing hybrid logical clock approaches (Kulkarni et al. 2024) is marginal. The constant-space dependency tracking claim needs formal proof — the sketch in Appendix B has a gap in Lemma 3. The 15-region evaluation is impressive but the workload is synthetic; real application benchmarks are missing. Writing quality in Sections 5-6 is below venue standards.',
    submitted_at: '2025-06-18T10:00:00Z',
  },
  {
    review_id: 'aa000000-0000-0000-0000-000000000004',
    assignment_id: 'f0000000-0000-0000-0000-000000000004',
    originality_score: 8,
    technical_score: 9,
    clarity_score: 7,
    written_feedback: 'CausalDB makes a strong contribution to the distributed databases literature. The sub-millisecond cross-region commit latency is a remarkable engineering achievement. The hybrid logical clock integration is well-designed and the multi-cloud evaluation adds credibility. I appreciate the comprehensive TPC-C adaptation. Some notation inconsistencies in Section 3 should be fixed but do not detract from the contribution.',
    submitted_at: '2025-06-19T16:45:00Z',
  },
  // Paper 4
  {
    review_id: 'aa000000-0000-0000-0000-000000000005',
    assignment_id: 'f0000000-0000-0000-0000-000000000007',
    originality_score: 3,
    technical_score: 4,
    clarity_score: 5,
    written_feedback: 'The combination of federated learning with continual learning is timely, but the gradient memory replay mechanism is a straightforward extension of GEM to the federated setting. The privacy analysis in Section 4.3 is insufficient — differential privacy guarantees are claimed but not formally proven. Split-CIFAR-100 is a toy benchmark for 2025; evaluation on more realistic federated datasets (LEAF, FedScale) is needed. That said, the writing is clear and the experimental protocol is well-documented.',
    submitted_at: '2025-08-10T09:30:00Z',
  },
  {
    review_id: 'aa000000-0000-0000-0000-000000000006',
    assignment_id: 'f0000000-0000-0000-0000-000000000008',
    originality_score: 7,
    technical_score: 7,
    clarity_score: 8,
    written_feedback: 'FedGMR addresses an important and under-explored intersection of federated and continual learning. The gradient episodic memory design is practical and the server-side distillation is a nice touch. The 41% reduction in catastrophic forgetting is meaningful. I would like to see analysis of communication overhead per round compared to baseline FL methods. Well-written paper overall with clear figures and reproducibility details.',
    submitted_at: '2025-08-11T14:00:00Z',
  },
];

export const INITIAL_REBUTTALS: RebuttalComment[] = [
  {
    comment_id: 'bb000000-0000-0000-0000-000000000001',
    paper_id: 'e0000000-0000-0000-0000-000000000004',
    user_id: 'a0000000-0000-0000-0000-000000000002', // Liang
    parent_comment_id: null,
    body: "We thank both reviewers for their thorough and constructive feedback. We address each concern below, beginning with Reviewer #1's points on novelty and privacy analysis.",
    created_at: '2025-08-15T10:00:00Z',
  },
  {
    comment_id: 'bb000000-0000-0000-0000-000000000002',
    paper_id: 'e0000000-0000-0000-0000-000000000004',
    user_id: 'b0000000-0000-0000-0000-000000000001', // Priya
    parent_comment_id: 'bb000000-0000-0000-0000-000000000001',
    body: "Thank you for the response. Regarding the GEM extension claim — could you clarify specifically which components are novel beyond applying GEM to FedAvg? The server-side distillation is interesting but I'd like to understand the theoretical contribution more precisely.",
    created_at: '2025-08-16T09:00:00Z',
  },
  {
    comment_id: 'bb000000-0000-0000-0000-000000000003',
    paper_id: 'e0000000-0000-0000-0000-000000000004',
    user_id: 'a0000000-0000-0000-0000-000000000002', // Liang
    parent_comment_id: 'bb000000-0000-0000-0000-000000000002',
    body: 'Thank you for the follow-up. The key novelty beyond GEM is threefold: (1) our gradient memory is compressed using random projections to satisfy (ε,δ)-DP without a trusted aggregator, (2) the server distillation uses a task-agnostic knowledge distillation loss that doesn\'t require task boundaries, and (3) we provide convergence guarantees under non-IID drift (Theorem 2). We have added a formal DP proof in Appendix C of the revised manuscript (now 4 pages) and replaced Split-CIFAR-100 with LEAF-FEMNIST and FedScale-Google-Speech in Tables 3-4.',
    created_at: '2025-08-17T14:30:00Z',
  },
  {
    comment_id: 'bb000000-0000-0000-0000-000000000004',
    paper_id: 'e0000000-0000-0000-0000-000000000004',
    user_id: 'b0000000-0000-0000-0000-000000000002', // Marcus
    parent_comment_id: null,
    body: "The revised manuscript addresses my communication overhead concern well (new Table 5). The per-round overhead of FedGMR is only 1.3× FedAvg, which is very reasonable given the forgetting reduction. I'm inclined to increase my scores.",
    created_at: '2025-08-18T11:00:00Z',
  },
  {
    comment_id: 'bb000000-0000-0000-0000-000000000005',
    paper_id: 'e0000000-0000-0000-0000-000000000004',
    user_id: 'b0000000-0000-0000-0000-000000000001', // Priya
    parent_comment_id: 'bb000000-0000-0000-0000-000000000003',
    body: 'The added DP proof in Appendix C is rigorous and addresses my concern. The switch to LEAF-FEMNIST is appreciated. I acknowledge the novelty is clearer now with the three contributions itemized. I will revise my assessment upward, though I maintain that the positioning relative to FedProx+MAS should be clearer in the related work section.',
    created_at: '2025-08-19T10:00:00Z',
  },
  {
    comment_id: 'bb000000-0000-0000-0000-000000000006',
    paper_id: 'e0000000-0000-0000-0000-000000000004',
    user_id: 'c0000000-0000-0000-0000-000000000001', // Elena (Chair)
    parent_comment_id: null,
    body: 'Thank you to both reviewers and the authors for a productive rebuttal. The revised manuscript substantially strengthens the contribution. I will incorporate the updated scores into the final decision. Please ensure the camera-ready addresses the remaining minor concerns about FedProx+MAS positioning.',
    created_at: '2025-08-20T16:00:00Z',
  },
];

// Helper to compute standard deterministic hash chain matching seed.sql
export const INITIAL_PUBLICATIONS: Publication[] = [
  {
    pub_id: 'cc000000-0000-0000-0000-000000000001',
    paper_id: 'e0000000-0000-0000-0000-000000000002', // CausalDB
    doi_string: '10.1145/3626789.3627001',
    published_at: '2025-09-15T00:00:00Z',
    prev_block_hash: 'GENESIS',
    // SHA256('GENESIS' + file_hash + doi + published_at)
    record_hash: '3d870a29f8c5b169a941584b4700d8d73b06cf72a5a0cbbf490c0a969bf6f807',
  },
  {
    pub_id: 'cc000000-0000-0000-0000-000000000002',
    paper_id: 'e0000000-0000-0000-0000-000000000001', // Sparse Attention
    doi_string: '10.1145/3626789.3627042',
    published_at: '2025-10-01T00:00:00Z',
    prev_block_hash: '3d870a29f8c5b169a941584b4700d8d73b06cf72a5a0cbbf490c0a969bf6f807',
    record_hash: '9f24c6eeea3da6e07661b2e6501712a23ebccb67a1dfa1e948c279435b5463f2',
  },
];
