**PRODUCT SPEC SHEET**  
**ForgeTrack**

Attendance & Class Material Tracker for The Forge Bootcamp

Prepared for: The Forge Vibe Engineering Demo

Author: Nischay B K, AI Architect & Lead Mentor

Organization: BOPPL Pvt. Ltd.

Date: April 2026

Version: 1.0

# **1\. Product Overview**

## **1.1 Product Name & Description**

| Field | Detail |
| :---- | :---- |
| Product Name | ForgeTrack |
| One-line Description | A session attendance tracker and class material library for The Forge AI-ML Engineering Bootcamp |
| Product Type | Internal tool / Web application |
| Version | 1.0 (MVP / Demo Build) |

## **1.2 Problem Statement**

The Forge bootcamp currently tracks student attendance and class materials across disconnected tools: Google Sheets for attendance, Google Drive folders for materials, and WhatsApp for ad-hoc session links. This creates three specific problems:

* **Data fragmentation:** Attendance data lives in one sheet, materials in another, and session metadata is repeated manually across both. Any change requires updating multiple places.

* **Historical data is trapped in CSVs:** Previous months of attendance data exist as exported CSV files with inconsistent column formats. These cannot be queried, searched, or visualized without manual cleanup.

* **No single view:** There is no dashboard that answers basic questions like 'What is Ravi's attendance percentage across all months?' or 'Which session had the lowest turnout?' without manual spreadsheet work.

## **1.3 Target User**

Primary user: The Lead Mentor (Nischay) who needs to mark attendance per session, upload historical attendance CSVs from previous months, access class materials organized by topic and date, and view attendance analytics across the full program duration.

Secondary user: The Co-facilitator (Varun) who needs read access to attendance records and the ability to mark attendance when the primary user is unavailable.

Student users: All enrolled students (Batch 2024-2028) who need read-only access to view their own attendance record, upcoming session details, and class materials (slides, recordings, links). Students cannot view other students' data, mark attendance, upload CSVs, or modify any records.

This requires two distinct roles: Mentor (full access) and Student (read-only, self-scoped). Authentication is required.

# 

# **2\. Core Features**

## **2.1 Feature List**

| \# | Feature | Priority | Description |
| :---- | :---- | :---- | :---- |
| F1 | Mark Attendance | Must Have | Select a session date, see the student list, mark each student as Present/Absent via checkboxes, and save. Prevent duplicate marking for the same student-session pair. |
| F2 | CSV Upload with AI Agent | Must Have | Upload a CSV file from previous months. An AI agent reads the file, detects the column mapping (handles inconsistent headers), validates the data, shows a preview with any issues flagged, and on confirmation writes the cleaned data into the database. |
| F3 | Attendance Dashboard | Must Have | Show today's session info, total students, present count, overall attendance percentage as a progress bar, and a quick list of students who are absent today. |
| F4 | Student Attendance History | Must Have | Per-student view showing their attendance record across all sessions, their overall percentage, and a visual calendar/grid of attendance. |
| F5 | Class Material Library | Should Have | Organized list of all sessions with date, topic, slide link, recording link, and notes. Searchable and filterable by month or keyword. |
| F6 | Student Portal (Read-Only) | Must Have | Authenticated student view showing: their own attendance record with percentage, upcoming session details (date, topic, time), and all class materials with clickable links. Students see only their own data. No access to other students, no edit capabilities. |
| F7 | Authentication & Role-Based Access | Must Have | Login system with two roles: Mentor (full CRUD access to all features) and Student (read-only access to own attendance, upcoming sessions, and materials). Students log in with their USN \+ password. Mentors log in with email \+ password. |

## **2.2 Feature F2 Deep Dive: CSV Upload with AI Agent**

**This is the most complex feature and requires detailed specification. The CSV upload is not a simple file parser. It uses an AI agent to handle messy, inconsistent real-world data from past months.**

### **2.2.1 Why an AI Agent for CSV Import?**

Past attendance CSVs from The Forge are not standardized. The primary format is a Google Sheets export where dates are column headers and attendance is recorded as checkbox values (TRUE/FALSE). Specific variations include:

* Pivoted layout: dates like '15/4/26', '8/4/26' are column headers, not a single 'date' column — the agent must detect this and unpivot

* Google Sheets checkbox values: TRUE/FALSE instead of P/A or Present/Absent

* DD/M/YY date format in headers (e.g., 15/4/26 \= April 15, 2026\) — not standard ISO format

* Extra columns not needed for attendance: SL No, email, n8n invite link, admission\_number — must be mapped to IGNORE

* Empty cells where a student wasn't enrolled for a session — these are not 'Absent', they mean 'no record'

* Possible blank rows or summary rows at the bottom from Google Sheets export

A traditional CSV parser would fail or silently corrupt data. An AI agent can read the CSV, understand the intent of each column regardless of naming, detect and flag anomalies, and map the data to our schema intelligently.

### 

### **2.2.2 CSV Upload Pipeline: Step by Step**

**Step 1: File Upload**

* User drags and drops a .csv or .xlsx file onto the upload area, or clicks to browse

* Client-side validation: file type must be .csv or .xlsx, maximum size 5MB, file must not be empty

* File is read client-side using PapaParse (CSV) or SheetJS (XLSX) and converted to a raw text/JSON preview

* Display: filename, row count, detected column count, file size

**Step 2: AI Agent Column Mapping**

* The raw headers and first 5 rows of data are sent to the AI agent (Gemini API call)

* The agent receives a system prompt that defines our target schema and asks it to map each source column to a target column

*Agent system prompt concept:*

*"You are a data mapping assistant. You will receive CSV column headers and sample data. Map each source column to one of these target fields: student\_name, usn, date, session\_topic, attendance\_status, or IGNORE. Also detect the date format used and the attendance marker convention (P/A, Present/Absent, 1/0, Y/N). Return your mapping as JSON."*

* Agent returns a structured JSON mapping, for example:

  *{ "SL No" \-\> IGNORE, "name" \-\> student\_name, "email" \-\> email, "n8n invite link" \-\> IGNORE, "usn" \-\> usn, "admission\_number" \-\> admission\_number, "branch\_code" \-\> branch\_code, "15/4/26" \-\> date (pivoted), "8/4/26" \-\> date (pivoted), ... } with date\_format: "DD/M/YY", attendance\_convention: "TRUE/FALSE", is\_pivoted: true*

* The mapping is displayed to the user in a visual table for review and manual override

* User can correct any mapping the agent got wrong before proceeding

**Step 3: Data Validation**

* Once mapping is confirmed, the full dataset is validated row by row

* Validation rules applied:

  * Every row must have a non-empty student name (name column)

  * Every row must have a valid USN

  * For pivoted format: each date header must parse as a valid date in DD/M/YY format

  * Attendance values must resolve to boolean: TRUE/FALSE (checkbox), P/A, Present/Absent, 1/0, Y/N are all valid

  * Empty cells in pivoted date columns mean 'no record' — skip that student-date pair entirely (do not mark as absent)

  * No duplicate against existing database records: if this student-date combo already exists, flag it

  * No duplicate entries: same student \+ same date should not appear twice in the file

* The AI agent also runs a second pass to flag anomalies:

  * Rows where a student name doesn't match any student in the database (possible typo or new student)

  * Dates that fall outside the expected program period

  * Rows that appear to be summary rows ('Total', 'Average', blank names)

**Step 4: Preview & Confirmation**

* Display a preview table showing: all rows, color-coded (green \= clean, yellow \= warning, red \= error)

* Error rows show the specific issue inline ('Date format invalid', 'Student not found in database')

* Warning rows can be resolved: 'Student "Rahul K" not found. Did you mean "Rahul Kumar"?' with a dropdown to select the correct match

* Summary bar at top: '42 rows ready to import, 3 warnings, 1 error'

* User can exclude specific rows before confirming

* 'Import' button is disabled until all errors are resolved (warnings can proceed)

**Step 5: Database Write**

* On confirmation, rows are written to the Attendance table in batches of 50

* Each batch is wrapped in a transaction: if any row in the batch fails, the entire batch rolls back

* Progress indicator shows: 'Importing... 42/42 rows'

* On completion: success summary ('42 attendance records imported for 3 sessions') with option to view the imported data

* Import metadata is logged: filename, upload timestamp, row count, user who uploaded, any warnings that were overridden

# **3\. Data Model**

The database schema consists of four primary tables and one logging table. All tables use auto-incrementing integer IDs as primary keys.

## **3.1 Students Table**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique student identifier |
| name | TEXT | NOT NULL | Full name of the student |
| usn | TEXT | UNIQUE, NOT NULL | University Seat Number (e.g., 4SH22CS045) |
| admission\_number | TEXT | NULLABLE | College admission number |
| email | TEXT | NULLABLE | Student email address |
| branch\_code | TEXT | NOT NULL | Department code (e.g., CS, AI, IS) |
| batch | TEXT | DEFAULT '2024-2028' | Batch year range |
| is\_active | BOOLEAN | DEFAULT true | Whether student is currently enrolled |
| created\_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

## **3.2 Sessions Table**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique session identifier |
| date | DATE | NOT NULL, UNIQUE | Session date (one session per day max) |
| topic | TEXT | NOT NULL | Topic covered in this session |
| month\_number | INTEGER | NOT NULL | Program month (1-10) |
| duration\_hours | DECIMAL(3,1) | DEFAULT 2.0 | Session duration in hours |
| session\_type | TEXT | DEFAULT 'offline' | offline / online |
| notes | TEXT | NULLABLE | Any session-specific notes |
| created\_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

## **3.3 Attendance Table**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique attendance record |
| student\_id | INTEGER | FOREIGN KEY \-\> Students(id), NOT NULL | Reference to the student |
| session\_id | INTEGER | FOREIGN KEY \-\> Sessions(id), NOT NULL | Reference to the session |
| present | BOOLEAN | NOT NULL | true \= present, false \= absent |
| marked\_at | TIMESTAMP | DEFAULT NOW() | When attendance was recorded |
| marked\_by | TEXT | DEFAULT 'system' | Who marked it (mentor name or 'csv\_import') |
| import\_id | INTEGER | NULLABLE, FOREIGN KEY \-\> ImportLog(id) | NULL if manually marked, references ImportLog if from CSV |

**UNIQUE CONSTRAINT: (student\_id, session\_id) \- prevents duplicate attendance records for the same student in the same session.**

## **3.4 Materials Table**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique material record |
| session\_id | INTEGER | FOREIGN KEY \-\> Sessions(id), NOT NULL | Links material to a session |
| title | TEXT | NOT NULL | Material title (e.g., '8-Layer AI Application Stack') |
| type | TEXT | NOT NULL | slides / recording / document / link |
| url | TEXT | NOT NULL | URL to the material (Google Drive, YouTube, etc.) |
| description | TEXT | NULLABLE | Brief description or notes about this material |
| created\_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

## **3.5 ImportLog Table**

Tracks every CSV import operation for auditability and debugging.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique import record |
| filename | TEXT | NOT NULL | Original filename of the uploaded CSV |
| uploaded\_by | TEXT | NOT NULL | Name of the person who uploaded |
| uploaded\_at | TIMESTAMP | DEFAULT NOW() | Upload timestamp |
| total\_rows | INTEGER | NOT NULL | Total rows in the original file |
| imported\_rows | INTEGER | NOT NULL | Rows successfully imported |
| skipped\_rows | INTEGER | NOT NULL | Rows skipped (errors/duplicates) |
| warnings | TEXT | NULLABLE | JSON array of warning messages |
| column\_mapping | TEXT | NULLABLE | JSON of the AI agent's column mapping used |
| status | TEXT | NOT NULL | completed / partial / failed |

## **3.6 Users Table (Authentication)**

Managed by Supabase Auth. Each user has a role that determines their access level.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PRIMARY KEY (Supabase auto) | Supabase Auth user ID |
| email | TEXT | UNIQUE, NOT NULL | Login email for mentors, auto-generated for students (usn@forge.local) |
| role | TEXT | NOT NULL, CHECK (mentor/student) | Determines access: mentor \= full CRUD, student \= read-only own data |
| student\_id | INTEGER | NULLABLE, FOREIGN KEY \-\> Students(id) | Links student user to their Students record. NULL for mentors. |
| display\_name | TEXT | NOT NULL | Shown in the UI (mentor name or student name) |
| created\_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |

**When a student is added to the Students table, a corresponding user account is auto-created with role='student' and a default password (their USN). Students are prompted to change their password on first login.**

## **3.7 Row Level Security Policies**

These Supabase RLS policies enforce access control at the database level, not just the frontend. Even if a student somehow bypasses the UI, they cannot access other students' data.

* Students table: Mentors can SELECT/INSERT/UPDATE/DELETE all rows. Students can SELECT only the row WHERE id \= auth.user().student\_id.

* Sessions table: Mentors can SELECT/INSERT/UPDATE/DELETE. Students can SELECT all sessions (they need to see upcoming session info).

* Attendance table: Mentors can SELECT/INSERT/UPDATE/DELETE all rows. Students can SELECT only WHERE student\_id \= auth.user().student\_id.

* Materials table: Mentors can SELECT/INSERT/UPDATE/DELETE. Students can SELECT all materials (read-only access to study resources).

* ImportLog table: Mentors can SELECT/INSERT. Students have NO access.

## **3.8 Entity Relationships**

* Students 1:N Attendance (one student has many attendance records)

* Sessions 1:N Attendance (one session has many attendance records)

* Sessions 1:N Materials (one session can have multiple materials: slides, recording, etc.)

* ImportLog 1:N Attendance (one CSV import creates many attendance records, tracked via import\_id)

* Attendance is the junction table between Students and Sessions (many-to-many relationship)

* Users 1:1 Students (one user account per student, linked via student\_id. Mentors have no student\_id)

# **4\. Tech Stack**

| Layer | Technology | Rationale |
| :---- | :---- | :---- |
| Frontend | React (Antigravity default) | Component-based, Antigravity generates React by default, students are familiar from Streamlit conceptual mapping |
| Styling | Tailwind CSS | Utility-first, no custom CSS files needed, Antigravity handles this well |
| CSV Parsing | PapaParse (client-side) | Lightweight, handles edge cases (quoted fields, encoding), no server needed for initial parse |
| XLSX Parsing | SheetJS (client-side) | Handles Excel files if students export from Google Sheets as .xlsx instead of .csv |
| AI Agent | Google Gemini API (gemini-2.0-flash) | Free tier available, fast inference, good at structured JSON output for column mapping |
| Database | Supabase PostgreSQL | Students already know Supabase from The Forge; built-in Auth, Row Level Security for role-based access, free tier sufficient |
| Authentication | Supabase Auth | Built-in email/password auth with role metadata, integrates with Row Level Security (RLS) to enforce mentor vs student access at the database level |
| Authorization | Supabase Row Level Security (RLS) | Policies enforce that students can only SELECT their own attendance rows (WHERE student\_id \= auth.uid()), mentors have full access. Security enforced at database level, not just UI level |
| State Management | React useState/useReducer | No external state library needed for this scope |
| Icons | Lucide React | Clean, consistent icon set available in Antigravity |

# 

# 

# **5\. Screen Specifications**

## **5.1 Dashboard (Home Screen)**

**Purpose: At-a-glance view of today's session and overall program health.**

Layout: Single page, no scrolling needed for primary information.

* Top bar: App name 'ForgeTrack' \+ navigation links (Dashboard, Mark Attendance, History, Materials, Upload CSV)

* Card 1 \- Today's Session: date, topic, session type (online/offline), duration

* Card 2 \- Today's Attendance: present count / total students, progress bar with percentage, list of absent students (names only, max 5 shown, 'and N more' if overflow)

* Card 3 \- Program Overview: total sessions conducted, overall average attendance %, student with highest attendance, student with lowest attendance

* Card 4 \- Recent Activity: last 5 actions (e.g., 'Attendance marked for Session 42', 'CSV imported: month5\_attendance.csv \- 120 records')

## **5.2 Mark Attendance Screen**

**Purpose: Mark attendance for a specific session.**

* Date picker (defaults to today, cannot select future dates)

* Session info display: auto-populates topic if session exists for selected date; if no session exists, show a form to create one (topic, duration, type)

* Student list: all active students displayed as a checklist, sorted alphabetically by name

* Each row: checkbox \+ student name \+ USN \+ branch\_code

* 'Select All Present' and 'Select All Absent' quick-action buttons

* If attendance already exists for this session: checkboxes pre-filled with existing data, 'Update' button instead of 'Save'

* Save button: disabled until at least one checkbox is changed; shows confirmation count ('Mark 22 present, 3 absent?')

* After save: success toast notification, redirect to Dashboard

## **5.3 Student History Screen**

**Purpose: View attendance history for a specific student.**

* Student selector: dropdown or search box to pick a student

* Student profile card: name, USN, branch, overall attendance percentage with color coding (green \>75%, yellow 60-75%, red \<60%)

* Attendance grid: calendar-style view or table showing every session date, color-coded (green \= present, red \= absent, grey \= no session)

* Statistics: total sessions attended / total sessions, current streak (consecutive present days), longest streak

* Monthly breakdown: collapsible sections showing attendance per month

## **5.4 Class Materials Screen**

**Purpose: Browse and search all class materials organized by session.**

* Filter bar: dropdown to filter by month (Month 1, Month 2, ... Month 6), search box for keyword search across topics and material titles

* Material cards: one card per session date, showing date, topic, and a list of attached materials (each with an icon by type: slides, recording, document, link) that are clickable links

* Add material button: opens a form to add a new material to an existing session (select session, enter title, type, URL, optional description)

* Empty state: 'No materials found for this filter' with a call-to-action to add materials

## **5.5 CSV Upload Screen**

**Purpose: Upload and import historical attendance data from CSV files.**

* Step indicator at top: Upload \-\> Map Columns \-\> Validate \-\> Import (shows current step highlighted)

* Step 1 \- Upload: Drag-and-drop zone with file type and size limits displayed. On file drop: show filename, row count, column count, file size. 'Next' button to proceed.

* Step 2 \- Map Columns: Two-column layout. Left: detected source columns with sample data. Right: dropdown for each, pre-filled by AI agent mapping. User can override any mapping. 'IGNORE' option for unwanted columns. Session metadata input: if date/topic are not in the CSV, provide manual input fields. 'Next' button to proceed.

* Step 3 \- Validate: Full data preview table, color-coded rows (green/yellow/red). Error panel on the right showing issues grouped by type. User can exclude individual rows via checkbox. Warning resolution: inline dropdowns for fuzzy-matched student names. Summary bar: 'X ready, Y warnings, Z errors'. 'Import' button (disabled until all errors resolved).

* Step 4 \- Import: Progress bar during import. On completion: success summary with counts (imported, skipped, warnings). Link to view imported records. Option to upload another file.

* Import history: below the upload area, show a table of past imports (filename, date, rows imported, status) from the ImportLog table

## **5.6 Login Screen**

**Purpose: Authenticate users and route them to the correct view based on their role.**

* Clean centered login form: email/USN field \+ password field \+ 'Sign In' button

* Toggle between 'Mentor Login' (email \+ password) and 'Student Login' (USN \+ password)

* On successful mentor login: redirect to Mentor Dashboard (full app with all features)

* On successful student login: redirect to Student Portal (read-only view, scoped to their data)

* Error handling: 'Invalid credentials' for wrong password, 'Account not found' for unknown email/USN

* First-time student login: if password matches default (their USN), prompt to set a new password before proceeding

* 'Forgot Password' link for mentors only (students reset through mentor)

## **5.7 Student Portal: My Attendance**

**Purpose: Students view their own attendance record. They cannot see other students' data.**

* Header: student name, USN, branch, batch — pulled from their authenticated session

* Attendance percentage: large, prominent display with color coding (green \>75%, yellow 60-75%, red \<60%)

* Attendance calendar: month-view calendar with color-coded dots (green \= present, red \= absent, grey \= no session). Students can navigate between months.

* Session-by-session table: date, topic, status (Present/Absent), duration. Sorted most recent first.

* Monthly breakdown: collapsible sections showing attendance count per month (e.g., 'Month 4: 8/10 sessions, 80%')

* No edit capability. No access to other students. Pure read-only view.

## **5.8 Student Portal: Upcoming Sessions**

**Purpose: Students see what's coming next so they can prepare.**

* Next session card (prominent): date, topic, session type (online/offline), time, any notes from the mentor

* If no upcoming session is scheduled: show 'No upcoming sessions scheduled yet. Check back later.'

* Upcoming sessions list: next 5 scheduled sessions (if pre-scheduled) with date and topic

* Past sessions: last 3 completed sessions with their topics for context ('Last class: 8-Layer AI Application Stack')

## **5.9 Student Portal: Study Materials**

**Purpose: Students access all class materials (slides, recordings, documents, links).**

* Same content as the Mentor's Materials Library but read-only (no Add/Edit/Delete buttons)

* Filter by month, search by keyword

* Material cards: session date \+ topic \+ clickable links with type icons (slides, recording, document, link)

* Links open in a new tab

* Students can see ALL materials across all months, not just sessions they attended — this is intentional so absent students can catch up

## 

## 

## **5.10 Navigation: Role-Based**

**The navigation bar changes based on the logged-in user's role:**

Mentor navigation: Dashboard | Mark Attendance | Student History | Materials | Upload CSV | Logout

Student navigation: My Attendance | Upcoming | Materials | Logout

The mentor-only screens (Mark Attendance, Student History, Upload CSV) are not just hidden — the routes themselves return 403 Forbidden if a student attempts to access them directly via URL.

# **6\. Constraints & Business Rules**

**These are the non-negotiable rules that prevent the application from producing incorrect or inconsistent data. Every constraint listed here MUST be specified in prompts to the AI builder. If a constraint is not explicitly stated, the AI will make a silent decision that may violate it.**

## **6.1 Data Integrity Constraints**

1. **No duplicate attendance:** A student cannot have two attendance records for the same session. Enforced at database level via UNIQUE(student\_id, session\_id) and at application level before insert.

2. **No future dates:** Attendance cannot be marked for a date in the future. The date picker must disable all dates after today.

3. **No backdating beyond program start:** Dates before August 4, 2025 (program start date) must be rejected.

4. **Student USN is unique:** No two students can share the same USN. Enforced at database level.

5. **One session per date:** The Sessions table has a UNIQUE constraint on the date column. Only one session can exist per calendar day.

6. **CSV import is atomic per batch:** If any row in a batch of 50 fails during import, the entire batch rolls back. No partial batch writes.

## **6.2 UI/UX Constraints**

1. **Mobile responsive:** All screens must be usable on a mobile device (minimum 375px width). The attendance marking screen must work on a phone since the mentor may mark attendance while walking around the classroom.

2. **Role-based access is mandatory:** Students must only see their own attendance data. This is enforced at the database level via Supabase RLS, not just at the UI level. Even if a student modifies the frontend code, the database will reject queries for other students' data.

3. **Mentor-only routes are protected:** Mark Attendance, Student History (all students view), Upload CSV, and session/material management are only accessible to users with role='mentor'. Direct URL access by students returns 403\.

4. **Student default password must be changed:** On first login, if the student's password matches their USN (default), they are forced to set a new password before accessing the portal.

5. **Confirmation before destructive actions:** Any action that modifies or deletes data must show a confirmation dialog. This includes: saving attendance, importing CSV data, deleting a session, and removing a material.

## 

## 

## **6.3 CSV Import Constraints**

1. **Maximum file size: 5MB.** Files larger than this are rejected with a clear error message.

2. **Accepted formats: .csv and .xlsx only.** Other file types are rejected at the client-side validation step.

3. **AI agent mapping must be user-confirmed:** The auto-detected column mapping is always shown for review. The import never proceeds without explicit user confirmation of the mapping.

4. **Unresolved errors block import:** If any row has an error (not a warning), the Import button is disabled. Warnings can proceed; errors cannot.

5. **Every import is logged:** The ImportLog table records every upload attempt, including failures. This creates an audit trail.

# **7\. Sample CSV Formats the Agent Must Handle**

These are the real CSV structures the AI agent will encounter. Format A is the primary format — this is how The Forge actually tracks attendance in Google Sheets today.

## **7.1 Format A: The Forge Google Sheet Export (Primary Format)**

**This is the actual format exported from The Forge's attendance sheet. It is a pivoted layout: dates are column headers, attendance is recorded as Google Sheets checkbox values (TRUE/FALSE).**

| SL No | name | email | n8n invite link | usn | admission\_number | branch\_code | 15/4/26 | 8/4/26 | 2/4/26 | 1/4/26 | 28/3/26 |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Abhishek Sharma | abhishek@gmail.com | https://n8n.io/... | 4SH24CS001 | 24CS001 | CS | TRUE | TRUE | FALSE | TRUE | TRUE |
| 2 | Divya Kulkarni | divya@gmail.com | https://n8n.io/... | 4SH24CS002 | 24CS002 | AI | TRUE | FALSE | TRUE | TRUE | FALSE |
| 3 | Ravi Kumar | ravi@gmail.com | https://n8n.io/... | 4SH24CS003 | 24CS003 | CS | FALSE | TRUE | TRUE | FALSE | TRUE |

**What the AI agent must do with this format:**

* Detect that this is a pivoted layout — date columns are headers, not a single 'date' column

* Identify which columns are student info (SL No, name, email, n8n invite link, usn, admission\_number, branch\_code) and which are date columns (15/4/26, 8/4/26, etc.)

* Map student info: name \-\> student\_name, usn \-\> usn, branch\_code \-\> branch\_code, email \-\> email, admission\_number \-\> admission\_number. IGNORE: SL No, n8n invite link

* Parse date headers in DD/M/YY format (e.g., 15/4/26 \= April 15, 2026; 28/3/26 \= March 28, 2026\)

* Detect attendance convention: TRUE \= present, FALSE \= absent (Google Sheets checkbox export)

* Unpivot: each student \+ date \+ TRUE/FALSE combination becomes one row in the Attendance table. A student with 5 date columns produces 5 attendance records.

* Upsert students: if a USN already exists in the Students table, update the record. If new, create the student with name, usn, email, admission\_number, branch\_code.

## 

## 

## **7.2 Format B: Single-Session Manual CSV**

An alternative format if someone exports or creates a simple attendance list for one session.

| Student Name | USN | Date | Status |
| :---- | :---- | :---- | :---- |
| Abhishek Sharma | 4SH24CS001 | 2026-04-15 | P |
| Divya Kulkarni | 4SH24CS002 | 2026-04-15 | A |
| Ravi Kumar | 4SH24CS003 | 2026-04-15 | P |

*Simpler format: one row per student per session. Agent maps: Student Name \-\> student\_name, USN \-\> usn, Date \-\> date (YYYY-MM-DD format), Status \-\> attendance\_status (P/A convention). No unpivoting needed.*

## **7.3 Format C: Real-World Edge Cases**

Variations the agent must handle gracefully:

* Empty checkbox cells: some cells might be empty instead of TRUE/FALSE (student joined mid-month). Treat empty as 'no record' — do not create an attendance entry for that student-date pair.

* Blank rows: Google Sheets exports sometimes include empty rows between data. Agent must skip these silently.

* Summary rows at bottom: rows where name contains 'Total', 'Average', or is blank. Auto-exclude with a note.

* Mixed date formats in headers: most dates will be DD/M/YY but some sheets might have DD/MM/YYYY or D-MMM. The agent must normalize all to a consistent format.

* Abbreviated or misspelled names: 'Abhishek S.' instead of 'Abhishek Sharma'. Use fuzzy matching against existing Students table with 80% Levenshtein similarity threshold.

* Extra columns from Google Sheets: columns like 'n8n invite link', 'SL No', or any column the agent doesn't recognize should be auto-mapped to IGNORE.

# **8\. Acceptance Criteria**

The demo is considered complete when all of the following are true:

1. Dashboard loads with correct counts from seed data

2. Attendance can be marked for today and saved without errors

3. Attempting to mark duplicate attendance shows 'Already marked' with existing data

4. Future dates are disabled in the date picker

5. Student history page shows correct attendance percentage and session-by-session breakdown

6. The Forge Google Sheet export (Format A — pivoted, TRUE/FALSE, DD/M/YY dates) can be uploaded, mapped, unpivoted, and imported successfully

7. AI agent correctly detects pivoted layout, maps student columns, IGNOREs SL No and n8n invite link, and parses DD/M/YY date headers

8. Empty checkbox cells (student not enrolled for that date) are skipped — no attendance record created for that pair

9. A simple single-session CSV (Format B) also imports correctly without pivoting

10. Import history shows all past uploads in the ImportLog

11. Materials library displays session materials with clickable links

12. All screens are responsive on a 375px mobile viewport

13. Mentor can log in with email \+ password and sees the full navigation (Dashboard, Mark Attendance, History, Materials, Upload CSV)

14. Student can log in with USN \+ password and sees only the student navigation (My Attendance, Upcoming, Materials)

15. Student portal shows correct attendance percentage and session-by-session history for the logged-in student only

16. Student cannot access mentor-only routes (Mark Attendance, Upload CSV) via direct URL — returns 403 or redirects to student portal

17. Student can view all class materials across all months and open links in new tabs

18. Student portal Upcoming screen shows the next scheduled session or a 'No upcoming sessions' message

19. First-time student login with default password (USN) forces password change before accessing the portal

20. No console errors, no unhandled promise rejections, no blank screens on any user flow