# SKILL: Build ForgeTrack

**Trigger this skill when:** the user asks to build, extend, or modify ForgeTrack — the attendance and class-material tracker for The Forge AI-ML Engineering Bootcamp.

**Do NOT trigger this skill for:** generic React/Supabase tasks unrelated to ForgeTrack, or for other BOPPL products (QuickQuote has its own skill).

---

## 0. How to Use This Skill

You are building ForgeTrack inside Antigravity. Two source-of-truth documents govern this build:

1. **`ForgeTrack_Spec_Sheet.md`** — defines *what* to build: features, data model, constraints, acceptance criteria. This is the **product spec**.
2. **`ForgeTrack_Design_System.md`** — defines *how it looks*: tokens, components, screen-level application. This is the **visual spec**.

This skill defines the *build process* — the order, checkpoints, prompting discipline, and anti-patterns. When these three documents conflict, spec > design system > skill. Flag the conflict to the user before proceeding.

**Operating principles:**
- **Build in phases, never all at once.** Each phase has a validation gate. Do not start phase N+1 until phase N's gate passes.
- **Every prompt includes the relevant excerpt from spec + design system.** Do not rely on memory of "what we discussed."
- **Ship the database before the UI.** Schema is ground truth. UI that predates its schema is throwaway work.
- **The AI agent feature (F2) is built last.** It depends on a working Students table, working auth, and a working attendance write path. Do not attempt it early.
- **Mobile-first, not mobile-last.** The mentor marks attendance on a phone while walking around. If the 375px viewport breaks, the product is broken.
- **No lorem ipsum, no fake data without a seed script.** Every demo row must come from a deterministic seed file so the state is reproducible.

---

## 1. The Six Phases

| # | Phase | Gate Before Advancing |
|---|---|---|
| P0 | Foundation — project scaffold, env, tokens | App runs locally; design tokens visible on a test page |
| P1 | Database & Auth — schema, RLS, Supabase Auth | Can insert test student, student cannot read another student's row |
| P2 | Shell — app layout, router, role-aware nav, login | Mentor and student land on different routes after login |
| P3 | Mentor CRUD — Dashboard, Mark Attendance, History, Materials | Can mark attendance for today, see it on Dashboard, edit it, view per-student history |
| P4 | CSV Import Agent (F2) — the hardest feature | Can import the real Forge Google Sheet export and pass every acceptance criterion 6–10 |
| P5 | Student Portal — My Attendance, Upcoming, Materials (read-only) | Student sees only their data; direct URL access to mentor routes returns 403 |
| P6 | Polish & Acceptance — mobile, edge cases, full acceptance sweep | All 20 acceptance criteria pass |

Skipping phases causes rework. Do not skip.

---

## 2. Phase 0 — Foundation

**Preconditions:** Antigravity project opened, Supabase account available, Gemini API key available.

### Actions

1. **Initialize React + Vite + Tailwind CSS project.** Name it `forgetrack`.
2. **Install dependencies:**
   ```
   react-router-dom, @supabase/supabase-js, papaparse, xlsx,
   lucide-react, @google/generative-ai
   ```
3. **Create `.env.local`** with:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   VITE_GEMINI_API_KEY=...
   ```
4. **Paste the Tailwind config from Design System §10** into `tailwind.config.js`. Do not modify the color or font values.
5. **Load Satoshi + Inter** in `index.html` via the Fontshare and Google Fonts links.
6. **Apply the cosmic glow and base styles** in `src/index.css`:
   ```css
   body {
     background: var(--bg-void);
     color: var(--text-primary);
     font-family: var(--font-body);
   }
   .app-main {
     background-image: var(--glow-cosmic);
     min-height: 100vh;
   }
   ```
7. **Create `src/lib/supabase.js`** with the client initialization.
8. **Create `src/lib/gemini.js`** with the Gemini client but no logic yet — this is a stub.
9. **Build a throwaway test page** at `/dev-tokens` that renders: one card, one button, one input, one status pill (success + danger). Confirm they match the design system visually.

### Gate
- App runs on `npm run dev` without errors.
- `/dev-tokens` renders the four components and they match the Design System spec.
- Dark background, cosmic glow visible at top.

### Common failures
- Satoshi not loading → check Fontshare link in `<head>`, not in CSS import.
- Tailwind classes not applying → check `content` paths in `tailwind.config.js`.
- Environment variables undefined → Vite requires `VITE_` prefix, and restart the dev server.

---

## 3. Phase 1 — Database & Auth

**Preconditions:** P0 gate passed. Supabase project created.

### Actions

1. **Run schema migration.** In Supabase SQL editor, execute the full schema from Spec §3.1–3.6. Six tables: `students`, `sessions`, `attendance`, `materials`, `import_log`, and the Supabase `auth.users` extension.

2. **Apply the UNIQUE constraints:**
   - `students.usn` UNIQUE
   - `sessions.date` UNIQUE
   - `attendance(student_id, session_id)` UNIQUE

3. **Apply the CHECK constraints** (spec §6.1):
   - Attendance date not in future: enforce via trigger or app-layer (trigger preferred).
   - Attendance date not before 2025-08-04: same.

4. **Enable RLS on every table.** Write the policies from Spec §3.7. For the Students and Attendance tables, the student-side policy is:
   ```sql
   CREATE POLICY "students_read_own"
     ON attendance FOR SELECT
     USING (
       student_id = (SELECT student_id FROM public.users WHERE id = auth.uid())
     );
   ```

5. **Write a seed script** at `supabase/seed.sql`:
   - 25 students (use realistic Indian names, USNs in `4SH24CS###` format, branch codes CS/AI/IS)
   - 15 sessions across Month 4, 5, 6 with real topics from the bootcamp curriculum (e.g., "8-Layer AI Stack", "ReAct Agent Pattern", "pgvector RAG", "Tiered Autonomy Multi-Agent")
   - Attendance records for every student × session combination (realistic distribution: 70–90% attendance, a few at 50–60%)
   - 2 materials per session (slides + recording)
   - 1 mentor user (email: `nischay@theboringpeople.in`), 1 co-facilitator (`varun@theboringpeople.in`), 1 test student (USN: `4SH24CS001`)
   - 2 past import_log entries to show history on the Upload screen

6. **Build an auth trigger** that auto-creates a `public.users` row with `role='student'` and a linked `student_id` whenever a new row is inserted into `students`. Default password = USN.

### Gate
- Seed script runs cleanly.
- Logging in as the test student returns only that student's attendance rows from the `attendance` table (verify with a manual query in the browser console).
- Logging in as the mentor returns all rows.
- Inserting a duplicate `(student_id, session_id)` fails with a constraint violation.
- Inserting attendance for a future date fails.

### Common failures
- RLS policy using `auth.uid()` directly on `attendance` — won't work because `auth.uid()` returns the user UUID, not the student integer ID. Must go through the `users` table mapping.
- Seed script inserts attendance before sessions exist → reorder inserts: students → sessions → attendance → materials.
- Students table RLS accidentally blocks mentor reads — verify the mentor policy uses `role = 'mentor'` not `role = 'admin'`.

---

## 4. Phase 2 — Shell & Login

**Preconditions:** P1 gate passed.

### Actions

1. **Set up React Router** with these routes:
   - `/login` — public
   - `/` — redirects based on role
   - `/dashboard`, `/attendance`, `/history`, `/materials`, `/upload` — mentor-only
   - `/me/attendance`, `/me/upcoming`, `/me/materials` — student-only
   - `/403` — forbidden page

2. **Build a `<RoleGuard>` wrapper** that reads the user's role from Supabase and redirects accordingly. Direct URL access by a student to `/upload` must redirect to `/403`, not silently fail.

3. **Build the app shell:**
   - `<Sidebar>` (spec §8.1 of design system) — role-aware, different nav items per role
   - `<TopBar>` — shows breadcrumb ("Overview / Dashboard"), a search input (placeholder only for now), and the logged-in user's display name + avatar initial
   - `<Main>` — the cosmic-glow wrapper that children render into

4. **Build the Login screen** per Design System §11.1:
   - Tab toggle: Mentor (email) / Student (USN)
   - On student login: call `supabase.auth.signInWithPassword({ email: \`${usn}@forge.local\`, password })`
   - On mentor login: use the email directly
   - First-time student login: after auth, if `password === usn`, route to a "Change Password" screen before letting them in

5. **Build the 403 page** — a clean, friendly "You don't have access to this page" with a button to return to the appropriate home route based on role.

### Gate
- Mentor login redirects to `/dashboard`. Student login redirects to `/me/attendance`.
- Student typing `/upload` in the URL lands on `/403`.
- Sidebar shows different nav items depending on role.
- Logout clears the session and redirects to `/login`.
- Logo, cosmic glow, and active-state nav item all match the design system.

### Common failures
- Using `<form>` inside a React artifact — do not. Use `onClick` on the submit button. (This applies if you preview this in a Claude artifact; in a real Antigravity-built app, forms are fine.)
- Student login failing because the auto-created `public.users` row is missing — verify the trigger from P1 actually runs. Test by inserting a student and checking if the user row appears.
- Race condition: route guard runs before Supabase session rehydrates on page refresh. Always render a loading state while `supabase.auth.getSession()` resolves.

---

## 5. Phase 3 — Mentor CRUD

**Preconditions:** P2 gate passed.

Build these four screens in this order. Each is independently testable.

### 5.1 Dashboard (`/dashboard`)

Follow Design System §11.2. Four cards plus a hero and a ticker strip:
- **Hero:** "Welcome Back, {mentor_name}" — use `text-display-hero`
- **Ticker strip:** Total Sessions | Overall Attendance % | Active Students | Last Session Date (all live queries)
- **Card 1 (Today's Session):** Query `sessions` where `date = today`. Show topic, type, duration. If no session exists for today, show a "Create Session" primary button.
- **Card 2 (Today's Attendance):** Progress bar + present/total count + absent student list (max 5 + "N more"). Pulls from `attendance` joined to today's session. If no attendance marked yet, show "Not yet marked" + a button to `/attendance`.
- **Card 3 (Program Overview):** Aggregate queries — total sessions count, avg attendance %, highest and lowest attendance students.
- **Card 4 (Recent Activity):** Union of last 5 items from `attendance.marked_at` (deduped by session) and `import_log.uploaded_at`. Each item renders as `[icon] [action description] [relative timestamp]`.

**Query discipline:** every card runs its own Supabase query in its own `useEffect`. Do not fetch all data in the parent. Each card shows its own loading skeleton.

### 5.2 Mark Attendance (`/attendance`)

Follow Spec §F1 and Design System §11.3.

- Date picker — disabled for future dates and for dates before `2025-08-04`.
- On date selection, query `sessions` for that date.
  - If session exists: show topic + duration inline.
  - If no session: show a mini-form to create one (topic, duration, type). Creating a session is its own DB write.
- Student list: query all `students WHERE is_active = true`, sorted by `name`.
- If attendance rows exist for (session_id, each student): pre-fill the checkboxes.
- "Select All Present" / "Select All Absent" — toggle every checkbox.
- Save button: UPSERT into `attendance` table. Use `upsert()` with `onConflict: 'student_id,session_id'` to handle re-marking cleanly. Set `marked_by` to the current user's display_name.
- Show a confirmation toast ("Marked 22 present, 3 absent") and redirect to `/dashboard`.

**Critical:** Spec §6.1 requires confirmation dialogs for destructive actions. Saving attendance over existing attendance is destructive. Show a modal: "You are updating existing attendance. Proceed?"

### 5.3 Student History (`/history`)

Follow Design System §11.4. Student search combobox at top. Once selected:

- Left card: student profile — name, USN, branch, batch, overall attendance % (color-coded: green >75%, yellow 60–75%, red <60%).
- Right card: attendance heatmap grid — one cell per session, 7 columns wide, colored per design system §8.8.
- Below: full-width table of every session: date, topic, status pill, duration.
- Stats row: total attended / total sessions, current streak, longest streak — compute client-side from the fetched attendance rows.

### 5.4 Materials (`/materials`)

Follow Spec §F5 and Design System §11.6.

- Filter bar: month dropdown (populate from distinct `sessions.month_number`), search input (filters across topic and material title), "Add Material" primary button.
- Grid of cards — one per session that has materials. Card shows date (caption), topic (h3), then a list of materials with type icons (slides, recording, document, link).
- "Add Material" opens a modal: select session, title, type dropdown, URL, description. Validates URL format before insert.

### Gate
- Mark attendance for today → refresh dashboard → Card 2 updates without a hard reload.
- Mark attendance for today a second time → confirmation modal appears; on confirm, old values are overwritten.
- Navigate to `/history`, pick a student → percentage matches manual calculation from the database.
- Navigate to `/materials`, add a material → it appears in the grid immediately.

### Common failures
- Attendance save using `insert()` instead of `upsert()` — will fail on re-marking with a unique constraint violation.
- Student History percentage calculated as `present_count / total_attendance_rows` — this is wrong. Correct: `present_count / total_sessions_where_this_student_was_active`.
- Materials grid not refreshing after insert — you forgot to re-fetch or to optimistically update the local state.

---

## 6. Phase 4 — CSV Import Agent (F2)

**Preconditions:** P3 gate passed. All four mentor CRUD screens work.

This is the most complex feature. Build it in five sub-steps — do not try to build it monolithically.

### 6.1 File Upload UI (Step 1 of the pipeline)

- Drag-drop zone per Design System §11.5 Step 1.
- Client-side validation: `.csv` or `.xlsx` only, max 5MB.
- On drop: parse with PapaParse (for CSV) or SheetJS (for XLSX).
- Display filename, row count, column count, file size.
- Store the parsed raw data in component state. Do not upload anything to Supabase yet.
- "Next" button → advances to Step 2.

### 6.2 AI Column Mapping Agent (Step 2 of the pipeline)

**This is the core of F2.** Build it carefully.

- When the user clicks "Next" on Step 1, send a request to Gemini with:
  - **System prompt:** the exact prompt concept from Spec §2.2.2 Step 2.
  - **User message:** the headers array + the first 5 rows of data as JSON.
  - **Response schema:** force JSON output mode. Schema:
    ```json
    {
      "mapping": { "<source_column>": "<target_field_or_IGNORE>" },
      "date_format": "DD/M/YY" | "DD/MM/YYYY" | "YYYY-MM-DD" | "D-MMM" | "OTHER",
      "attendance_convention": "TRUE/FALSE" | "P/A" | "Present/Absent" | "1/0" | "Y/N",
      "is_pivoted": true | false,
      "date_columns": ["15/4/26", "8/4/26", ...]   // only if is_pivoted
    }
    ```

- Target fields the agent is allowed to map to: `student_name`, `usn`, `admission_number`, `email`, `branch_code`, `date`, `session_topic`, `attendance_status`, `IGNORE`.

- **Critical:** after the agent returns, show the mapping in a 2-column editable table (source column on left, target field dropdown on right, pre-filled with agent's choice). The user MUST be able to override any mapping. Do not auto-advance.

- Display the detected `is_pivoted`, `date_format`, `attendance_convention` as chips the user can toggle/change.

- "Next" → advances to Step 3 with the confirmed mapping.

**Gemini call pattern:**
```javascript
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0,   // deterministic mapping
  },
});
const result = await model.generateContent([systemPrompt, userPrompt]);
const mapping = JSON.parse(result.response.text());
```

### 6.3 Unpivot + Validation (Step 3 of the pipeline)

Once mapping is confirmed, transform the raw data into candidate attendance rows.

**If `is_pivoted === true`:**
For each row in the CSV, and for each date column, produce a candidate record:
```js
{
  student_name, usn, email, admission_number, branch_code,
  date: parseDate(dateColumnHeader, date_format),
  status: parseStatus(cellValue, attendance_convention),
  source_row: originalRowIndex,
  source_date_col: dateColumnHeader,
}
```
**Skip empty cells entirely** — they mean "no record," not "absent" (Spec §2.2.1, §7.3).

**If `is_pivoted === false`:** one candidate per row, straightforward mapping.

**Run validation rules** from Spec §2.2.2 Step 3 on every candidate:
- Non-empty name, valid USN
- Date parses successfully and is within program bounds (>= 2025-08-04, <= today)
- Status resolves to boolean
- Not a duplicate against existing DB records
- Not a duplicate within the file (same student + date twice)
- Student name exists in DB OR fuzzy-matches an existing student at ≥80% Levenshtein similarity

Tag each candidate with: `status: 'clean' | 'warning' | 'error'` and a human-readable reason.

**Run the anomaly pass** (second Gemini call, optional but recommended):
- Send the list of rows with warnings to Gemini and ask it to suggest fixes. Example: for a student name "Rahul K" not in DB, suggest "Rahul Kumar" if it's the closest match.

**Render the preview table** per Design System §11.5 Step 3:
- Color-coded rows (green/yellow/red left borders)
- Error rows: inline red reason, excluded from import automatically
- Warning rows: inline dropdown to resolve (e.g., "Did you mean Rahul Kumar?")
- Summary bar: "X ready, Y warnings, Z errors"
- "Import" button disabled until all errors are resolved or excluded.

### 6.4 Batch Write (Step 4 of the pipeline)

On "Import" click:

1. Write the `import_log` row first with `status = 'in_progress'`. Capture the returned ID.
2. Resolve or create session rows: for every distinct date in the candidate set, upsert into `sessions` (if session doesn't exist for that date, create it with `topic = 'Imported session'`, `month_number` computed from date, `duration_hours = 2.0`).
3. Resolve student rows: for every distinct USN in candidates, upsert into `students`.
4. Build the final attendance rows with `student_id`, `session_id`, `present`, `marked_by = 'csv_import'`, `import_id = <captured>`.
5. **Batch the attendance inserts in groups of 50**, wrapped in transactions. Use Supabase's `rpc()` with a stored function if needed, or sequential calls with a catch-all rollback via soft-delete of the import_log row.
6. Update progress UI: "Importing... 42/42 rows."
7. On completion: update import_log to `status = 'completed'` with final counts, show success summary, offer "View imported data" link.
8. On partial failure: update import_log to `status = 'partial'`, surface which batches failed.

### 6.5 Import History Display

At the bottom of the CSV Upload screen, render a table of `import_log` rows:
- Filename, uploaded_at, uploaded_by, total/imported/skipped, status
- Click a row → expand to show warnings and column_mapping JSON

### Gate (all Spec §8 acceptance criteria 6–10 must pass)
- **Upload the real Forge Google Sheet export** (Format A, pivoted, TRUE/FALSE, DD/M/YY dates). The agent correctly detects pivoted layout.
- Agent maps `SL No` → IGNORE, `n8n invite link` → IGNORE, `name` → student_name, etc.
- Empty cells produce no attendance record (not marked absent).
- Blank rows and summary rows are skipped silently.
- A simple single-session CSV (Format B) also imports without pivoting.
- `import_log` captures the import with correct counts.
- Re-uploading the same file shows duplicate warnings, does not create duplicate records.

### Common failures
- **Gemini returns malformed JSON** → set `responseMimeType: "application/json"` and use `temperature: 0`. Wrap the JSON.parse in try/catch and show "AI mapping failed, please map columns manually" as a fallback — user can still proceed.
- **Date parsing treats `15/4/26` as `1915-04-26`** → your parser is using default year expansion. Explicitly add 2000 for 2-digit years when < 50.
- **Empty cells create false "absent" records** — re-read Spec §2.2.1 and §7.3. Empty ≠ absent. Skip the pair entirely.
- **Batch transaction isn't actually atomic** — Supabase client `upsert()` is not transactional across multiple calls. Use a Postgres function (rpc) to get true transaction semantics, or accept partial-batch risk and always log exactly which rows made it.
- **Agent hallucinates a target field name** (e.g., returns `"attendance_pct"`) — validate the response against the allowed target field enum. Reject and show error if invalid.

---

## 7. Phase 5 — Student Portal

**Preconditions:** P4 gate passed.

Build three screens, each simpler than their mentor counterparts because they're read-only and self-scoped.

### 7.1 My Attendance (`/me/attendance`)

Design System §11.7.
- Hero: student name (display-lg), USN + branch + batch (body-sm tertiary).
- Giant attendance % card — text-display-hero, color-coded. Below: "X of Y sessions attended."
- Heatmap calendar (month-switchable).
- Session-by-session table — date, topic, status pill, duration.

**Query:** `supabase.from('attendance').select('*, sessions(*)').eq('student_id', currentStudentId)`. The RLS policy already scopes this automatically — but verify with a test.

### 7.2 Upcoming (`/me/upcoming`)

Design System §11.8.
- Next session hero card — query `sessions` where `date > today`, order by date ascending, limit 1. If none, show the empty state.
- Next 5 upcoming list + last 3 past list.

### 7.3 Materials (`/me/materials`)

Read-only version of the mentor Materials screen. Same layout, no "Add Material" button, no edit/delete actions. All materials are visible (students see every month's materials regardless of attendance — spec §5.9).

### Gate
- Student logs in, lands on `/me/attendance`, sees only their own data.
- Querying `/me/attendance` in the network tab shows the RLS-filtered response (verify only one student_id present).
- Direct URL access to `/upload` as a student → 403.
- Student clicks a material link → opens in a new tab.
- Empty state on Upcoming when no future sessions exist.

### Common failures
- Using `.eq('student_id', ...)` AND RLS — they don't conflict, but if you forget the `.eq()` and rely on RLS alone, any aggregate query leaks timing. Always scope explicitly at the query level too.
- Heatmap shows wrong colors because the RLS-filtered query returned fewer rows than expected — double-check you're joining to sessions so that "no record" sessions still render as grey cells.

---

## 8. Phase 6 — Polish & Acceptance

**Preconditions:** P5 gate passed.

### Actions

1. **Walk through all 20 acceptance criteria in Spec §8.** Check each one off. Any failure = go back and fix.

2. **Mobile sweep at 375px:**
   - Sidebar → becomes a bottom nav or hamburger drawer.
   - All cards stack to single column.
   - Hero display text scales down (use `clamp()` or responsive Tailwind classes: `text-4xl md:text-display-md lg:text-display-lg`).
   - Tables scroll horizontally inside a container, never break layout.
   - Touch targets ≥44×44px.

3. **Confirmation dialogs** on all destructive actions (spec §6.2.5): saving attendance over existing, importing CSV, deleting session, removing material.

4. **Empty states** on every screen that queries data: Dashboard when no session today, History when no student selected, Materials when filter returns nothing, Upcoming when no future sessions.

5. **Loading skeletons** (not spinners) on every data-fetching card. Skeletons should match the shape of the content, not be a generic rectangle.

6. **Keyboard navigation:** tab order is logical, focus ring is visible (uses `accent-glow` per design system), Escape closes modals.

7. **Console clean:** zero errors, zero unhandled promise rejections, zero React key warnings. Ship nothing with a red squiggle in DevTools.

### Final Gate — Ship Readiness Checklist

- [ ] All 20 acceptance criteria from Spec §8 verified
- [ ] Design system checklist from Design System §13 all checked
- [ ] Seeded demo data lets a fresh user immediately see Dashboard populated
- [ ] Real Forge CSV imports cleanly end-to-end
- [ ] Mentor and student roles each have a clean login → primary task flow
- [ ] Works on a 375px iPhone viewport
- [ ] README documents: how to run locally, how to seed, how to switch between mentor/student demo accounts

---

## 9. Prompting Discipline (for the User When Talking to You)

When the user asks you to do something, follow these patterns. If their prompt doesn't include what you need, ask once, concisely.

**Good prompt from user:**
> "Build Phase 3.2 — Mark Attendance. Follow Spec §F1 and Design System §11.3. Don't build the CSV feature yet."

**Bad prompt from user:**
> "Make the attendance thing work."

→ Respond by asking which phase, and point them at this skill file.

**When user says "just make it work":**
- Do not skip phases.
- Do not skip the database → RLS → UI order.
- If you must cut scope, cut *features* (e.g., skip F5 Materials for now), not *layers* (e.g., skipping RLS to "make the UI render faster" creates a security hole that stays in the codebase).

---

## 10. Anti-Patterns (Do NOT Do These)

| Anti-pattern | Why it's wrong | What to do instead |
|---|---|---|
| Building the UI before the schema exists | UI assumes shapes that don't match the DB → rewrite on both sides | Schema first, always |
| Using `localStorage` to "cache" the logged-in user's role | Can be tampered with; student can impersonate mentor | Re-query Supabase on every route change |
| Skipping RLS because "the UI already hides it" | Anyone with devtools can bypass the UI | RLS is non-negotiable |
| Using `insert()` for attendance writes | Breaks on re-marking | Use `upsert({ onConflict: 'student_id,session_id' })` |
| Hardcoded hex colors (`#10B981`, `#fff`) | Breaks the design system, inconsistent across screens | Use CSS variables / Tailwind tokens from Design System §10 |
| Generic spinner everywhere | Feels cheap, doesn't signal what's loading | Skeletons matching content shape |
| Treating empty CSV cells as "Absent" | Corrupts historical data for students not yet enrolled on that date | Skip the (student, date) pair entirely |
| Building F2 (CSV agent) without first having F1 working | Cannot test F2 without attendance write path already proven | Build F2 in Phase 4, not earlier |
| Using `<form onSubmit>` in a Claude artifact preview | Breaks in the artifact sandbox | Use `onClick` on the submit button |
| Showing raw error strings from Gemini or Supabase to the user | Leaks internals, looks unprofessional | Wrap in a friendly message, log the real error to console |
| Marking attendance for a future date | Violates Spec §6.1.2 | Disable future dates in the picker |
| Quoting copyrighted characters or brand IP in UI illustrations | Legal risk | Use Lucide icons, no mascots, no branded imagery |

---

## 11. Debugging Playbook

| Symptom | Likely cause | Fix |
|---|---|---|
| Student sees other students' data | RLS not enabled, or policy wrong | `ALTER TABLE attendance ENABLE ROW LEVEL SECURITY` + verify policy uses `auth.uid()` → `users.student_id` mapping |
| Mentor login works, student login fails | Auto-user trigger didn't run when students were seeded | Manually insert `public.users` rows, or re-run the trigger as a one-off |
| CSV agent returns inconsistent mappings | Temperature too high, or prompt lacks schema anchor | Set `temperature: 0`, tighten the prompt, enforce JSON mode |
| Date headers like `15/4/26` parsed as 1926 | Year expansion bug | Custom parser: if year < 50, add 2000; else add 1900 |
| Import fails partway, DB left in weird state | Batch not transactional | Wrap in Postgres RPC, or log partial and surface to user |
| "Attendance %" shows 0% for all students | Query joins wrong, or dividing by zero | Guard: `total === 0 ? '—' : (present / total * 100)` |
| Mobile layout breaks | Hardcoded widths, not using `max-w-*` + `w-full` | Replace fixed widths with responsive utilities |
| Focus ring invisible | Forgot to apply `focus:ring` in Tailwind or CSS variable not loaded | Verify `--shadow-focus` token and `:focus-visible` rules |

---

## 12. What Success Looks Like

At the end of Phase 6, the user (Nischay) can:

1. Open ForgeTrack on his laptop → log in as mentor → mark today's attendance in under 30 seconds.
2. Open ForgeTrack on his phone at 375px viewport → mark attendance walking around the classroom.
3. Drag a month-5 CSV export from Google Sheets onto the Upload screen → review the AI-detected mapping → confirm → watch 120 records import.
4. Hand a student their USN + default password → student logs in → sees only their own attendance and a clear view of upcoming sessions.
5. Present this to his Forge cohort as the working example of what Vibe Engineering produces: a spec-first, architected, production-grade app built with AI — not a vibe-coded demo that collapses under real data.

If all five are true, the skill succeeded.

---

**End of skill.** Load alongside `ForgeTrack_Spec_Sheet.md` and `ForgeTrack_Design_System.md` in every Antigravity session that touches this codebase.
