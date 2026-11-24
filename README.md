# Academic Peer-Review & Publication Management System
**"Database-Enforced Academic Integrity"**

> Built with **Next.js (App Router, TypeScript)**, **Tailwind CSS**, and **Supabase (PostgreSQL + Supabase Storage)**.

---

## 💡 What is this Website? (The Simple Explanation)

If you have never seen an academic publishing system before, think of it like this:

In universities and scientific journals (like *Nature*, *IEEE*, or *ACM*), researchers write scientific papers. Before a paper gets published to the world, it goes through a strict process called **Peer Review**:

1. **Authors** write and submit a research paper.
2. **Reviewers** (other expert professors/scientists) read the paper and score it (`Originality`, `Technical Rigor`, `Clarity`). To be fair, reviewers must **not** know who wrote the paper (this is called **Double-Blind Review**).
3. **The Track Chair (Admin / Editor-in-Chief)** oversees the process. They make sure reviewers don't have a conflict of interest (e.g. grading their own paper or a colleague from their same university). They also adjust for harsh vs. lenient graders and decide which papers get published.
4. **The Publication Ledger** is the public scientific archive. Once a paper is published, it gets a permanent DOI (digital identifier) and is locked forever so nobody can tamper with it or plagiarize it.

### Why is this project special? ("Database-Enforced Academic Integrity")
In standard web applications, checks are written in simple frontend JavaScript (which anyone can bypass using browser DevTools or API calls).

In **this system**, every critical rule is natively enforced **inside the PostgreSQL database** using:
- **Triggers** that automatically block illegal actions (like reviewing your own paper or submitting duplicate files).
- **SQL Views** that physically scrub author names before data is sent across the network.
- **Window Functions** that calculate statistical Z-scores to balance harsh vs. lenient reviewers.
- **`pgcrypto` Hash-Chains** that link published papers together like a mini-blockchain to prove nothing was secretly edited.

---

## 🎬 5-Minute Demonstration Guide (How to Present This to Others)

Follow this exact walkthrough when demonstrating the project to professors, evaluators, or colleagues.

### 🌟 Act 0: The Setup (10 Seconds)
1. Open the website: `http://localhost:3000`.
2. Point out the clean layout:
   - **Left Sidebar**: 4 workspaces (**Publications**, **Author Portal**, **Reviewer Workspace**, **Chair Dashboard**).
   - **Bottom of Sidebar**: The **"Switch Persona"** box. Explain: *"In a real system, different users log in with different accounts. For this demo, we have a quick persona switcher so we can see the app through the eyes of an Author, a Reviewer, and the Track Chair."*

---

### 🌟 Act 1: The Public Publication Ledger (`/ledger`)
*Goal: Show the public scientific journal and how cryptographic tamper-proofing works.*

1. Click on **Publications** in the left sidebar.
2. **What to say:** *"This is the public archive of published papers, with verified DOIs, abstracts, and publication dates."*
3. Click the green **"Verify Chain"** button at the top right.
   - **Point out:** A green banner appears saying `✓ Chain intact · 2 records cryptographically verified`.
   - **Explain:** *"Under the hood, PostgreSQL uses pgcrypto to hash-chain each publication using SHA-256. If any record in the database is modified or tampered with, the cryptographic chain breaks."*
4. Click the small **"Test Tamper"** button, then click **"Verify Chain"** again.
   - **Point out:** The banner instantly turns red with an integrity alert: `Alert: 1 tampered record(s) detected!`.
   - **Explain:** *"The database caught that Block #1 was altered. Now click 'Reset' to restore the valid chain."*

---

### 🌟 Act 2: The Author Portal & Deduplication (`/author`)
*Goal: Show how authors submit papers and how the database blocks duplicate files and plagiarism.*

1. Switch persona to **Author** at the bottom left (select **Amara Okonkwo** or **Liang Chen**).
2. Click **Author Portal** in the sidebar.
3. Click the small **"Sample"** button at the top of the form.
   - **Point out:** The form automatically fills with sample paper text, and the file upload box computes a **SHA-256 cryptographic fingerprint** in the browser.
4. Click **"Submit Manuscript"**.
   - **Point out:** A green success notification pops up, and the paper appears in "Your Submissions" with status `Submitted`.
5. Now, test duplicate rejection: Click the red **"Duplicate"** sample button, then click **"Submit Manuscript"**.
   - **Point out:** The database immediately throws a red PostgreSQL error: `UNIQUE(file_hash) violation`.
   - **Explain:** *"Because file hashes are enforced UNIQUE at the database level, no author can ever re-submit the exact same PDF or plagiarize existing manuscripts."*
6. Click **"Rebuttal"** on any paper in your submissions list (e.g. Paper #4).
   - **Point out:** A threaded discussion opens showing replies between authors and reviewers with identities blinded (`Author (Blind)` vs `Reviewer #1`).

---

### 🌟 Act 3: Reviewer Workspace & Double-Blind Shield (`/reviewer`)
*Goal: Show how peer reviewers score papers without knowing who wrote them.*

1. Switch persona to **Reviewer** at the bottom left (select **Priya Sharma**).
2. Click **Reviewer Workspace** in the sidebar.
3. **Point out:** Notice that for all papers, the author's name is completely masked as `████████`.
4. Click the button at the top: **"Inspect DB Payload"**.
   - **Explain:** *"Evaluators often ask: 'Are you just hiding the name with CSS?' This modal proves that the PostgreSQL SQL View `blind_reviewer_papers` actually sets `author_id: null` and strips names at the database layer. Even if a reviewer inspects network traffic, author identities do not exist in the payload!"*
5. Close the modal. Click on any paper to open the workspace.
   - **Left pane**: The simulated manuscript reader.
   - **Right pane**: The multi-criteria scoring rubric (**Originality**, **Technical Rigor**, **Clarity**).
6. Drag the sliders: point out how the **Weighted Score** updates in real-time `(40% Orig + 40% Tech + 20% Clarity)`.
7. Type brief feedback and click **"Submit Review"**.

---

### 🌟 Act 4: Chair Dashboard & Conflict of Interest Triggers (`/chair`)
*Goal: Demonstrate the 3 database triggers and Reviewer Bias Calibration (Z-Score).*

1. Switch persona to **Chair** at the bottom left (select **Elena Vasquez**).
2. Click **Chair Dashboard** in the sidebar.
3. **Show Conflict of Interest (COI) Triggers:**
   - Under **Assign Reviewer**, explain: *"Before a reviewer is assigned, PostgreSQL trigger `trg_coi_guard` checks for 3 types of academic corruption:"*
   - Click **"Self-Review"**: Red toast pops up: `COI_SELF_REVIEW: Reviewer cannot review their own paper`.
   - Click **"Same Institution"**: Red toast pops up: `COI_INSTITUTIONAL: Reviewer shares affiliation (TUM) with author`.
   - Click **"Review Ring"**: Red toast pops up: `COI_REVIEW_RING: Tit-for-tat detected — reviewer has a paper being reviewed by this author`.
   - **Explain:** *"These are not frontend `if` statements—these are PostgreSQL trigger exceptions that protect academic fairness."*
4. **Show Reviewer Bias Calibration (Novelty 1):**
   - Scroll to the **Reviewer Scores & Bias Calibration** table.
   - **Point out:** Priya Sharma is flagged as a **"harsh"** reviewer (average scores ~4.0), while Marcus Weber is flagged as **"lenient"** (average scores ~8.0).
   - **Explain:** *"Using PostgreSQL Window Functions (`AVG() OVER` and `STDDEV() OVER`), the database calculates a statistical Z-Score for each reviewer. It normalizes their grades into a calibrated 1–10 score so that a paper assigned to a harsh grader is not unfairly penalized!"*
5. **Show Publication to Ledger (Novelty 2):**
   - Scroll to **Decisions & Publication Promotion**.
   - Click **"Publish to Ledger"** on an accepted paper.
   - Navigate back to **Publications**: point out that the newly published paper is now chained into the immutable ledger with a fresh DOI!

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router, TypeScript) | Modern server/client rendering and routing |
| **Styling** | Tailwind CSS | Editorial journal visual design system |
| **Database** | PostgreSQL / Supabase | Relational schema, triggers, views, RLS |
| **Crypto** | `pgcrypto` + Web Crypto API | SHA-256 deduplication and hash-chain ledger |
| **Similarity** | `pg_trgm` | Trigram fuzzy title matching for self-plagiarism alerts |
| **Icons** | Lucide React | Clean, modern iconography |

---

## 🚀 Running the Project Locally

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start the Development Server
```bash
pnpm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

*(Note: The application has a built-in PostgreSQL engine simulation that runs out-of-the-box with all sample data and triggers loaded. No external setup is required to run the demo!)*

---

## 🌐 Connecting to a Live Supabase Project (Optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard and run [supabase/schema.sql](file:///c:/All%20projects/DBMS/supabase/schema.sql).
3. Then run [supabase/seed.sql](file:///c:/All%20projects/DBMS/supabase/seed.sql) to load initial data.
4. Copy `.env.example` to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
5. Restart `pnpm run dev`.
