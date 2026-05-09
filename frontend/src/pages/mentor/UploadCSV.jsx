import React, { useState } from 'react';
import * as xlsx from 'xlsx';
import { supabase } from '../../lib/supabase';
import { genAI } from '../../lib/gemini';
import { formatDate } from '../../lib/utils';
import {
  Upload, FileSpreadsheet, AlertCircle, Loader2,
  ChevronRight, Check, Trash2, Zap, Calendar, Sparkles, ShieldCheck
} from 'lucide-react';

// ─── Date parsing helpers ──────────────────────────────────────────────────────

/**
 * Tries to parse a date string in formats like:
 *   30/04/26, 30/04/2026, 30-04-26, 30-04-2026, 8/4/2026
 * Returns ISO string "YYYY-MM-DD" or null.
 */
function parseIndianDate(str) {
  if (!str || typeof str !== 'string') return null;
  // Match D/M/YY, D/M/YYYY, D-M-YY, D-M-YYYY
  const m = str.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (!m) return null;
  let [, d, mo, y] = m;
  if (y.length === 2) y = '20' + y;
  const date = new Date(parseInt(y), parseInt(mo) - 1, parseInt(d));
  if (isNaN(date)) return null;
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Given a row (array) and a data-row column, returns {colIndex, isoDate}
 * for all cells in that row that look like Indian dates.
 */
function extractDateColumns(row) {
  const result = [];
  row.forEach((cell, idx) => {
    const iso = parseIndianDate(String(cell ?? ''));
    if (iso) result.push({ colIndex: idx, isoDate: iso });
  });
  return result;
}

/**
 * Detect if a sheet uses date-in-header format:
 *   - Find a header row where ≥3 consecutive cells are parseable Indian dates.
 *   - Also find the student field columns (name, email, usn, branch).
 * Returns null if not detected.
 */
function detectDateHeaderSheet(rows) {
  for (let rowIdx = 0; rowIdx < Math.min(rows.length, 5); rowIdx++) {
    const row = rows[rowIdx];
    if (!row) continue;
    const dateCols = extractDateColumns(row);
    if (dateCols.length >= 3) {
      // Found a date-header row. Now look for student field columns.
      // They are usually in the same row or the row above.
      // Typical: SL NO | name | email | [n8n link] | usn | admission_no | branch | date1 | date2 ...
      // We scan for keywords.
      const headerStr = row.map(c => String(c ?? '').toLowerCase());
      const nameCol   = headerStr.findIndex(h => h === 'name');
      const emailCol  = headerStr.findIndex(h => h.includes('email'));
      const usnCol    = headerStr.findIndex(h => h === 'usn');
      const branchCol = headerStr.findIndex(h => h.includes('branch'));

      return {
        headerRowIdx: rowIdx,
        dataStartRow: rowIdx + 1,
        nameCol:   nameCol   >= 0 ? nameCol   : 1,
        emailCol:  emailCol  >= 0 ? emailCol  : 2,
        usnCol:    usnCol    >= 0 ? usnCol    : 4,
        branchCol: branchCol >= 0 ? branchCol : 6,
        sessions: dateCols.map(({ colIndex, isoDate }) => ({
          colIndex,
          isoDate,
          // Sort-friendly label
          label: `Session ${isoDate}`,
        })),
      };
    }
  }
  return null;
}

// ─── component ─────────────────────────────────────────────────────────────────

export default function UploadCSV() {
  const [file, setFile]               = useState(null);
  const [workbook, setWorkbook]       = useState(null);
  const [sheetData, setSheetData]     = useState({});     // raw rows per sheet name
  const [detections, setDetections]   = useState({});     // detected structure per sheet
  const [selectedSheets, setSelectedSheets] = useState([]);

  // step: 1=upload  2=review  3=ai-clean  4=process  5=done
  const [step, setStep]               = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCleaning, setIsCleaning]   = useState(false);
  const [logs, setLogs]               = useState([]);

  // AI cleaning results: array of { original, cleaned, corrections[] }
  const [cleaningReport, setCleaningReport] = useState([]);
  // Final cleaned rows per sheetName (replaces raw sheetData rows for import)
  const [cleanedData, setCleanedData] = useState({});

  // Remove-all state
  const [isRemoving, setIsRemoving]   = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const addLog = (msg, type = 'info') =>
    setLogs(prev => [...prev, { msg, type, time: new Date() }]);

  // ── file upload ──────────────────────────────────────────────────────────────

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setLogs([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = xlsx.read(bstr, { type: 'binary', cellDates: false });
        setWorkbook(wb);

        const data = {};
        const detected = {};

        wb.SheetNames.forEach(name => {
          const ws = wb.Sheets[name];
          // raw: false → all cells as formatted strings (needed for date parsing)
          const rows = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false });
          data[name] = rows;
          const det = detectDateHeaderSheet(rows);
          if (det) {
            detected[name] = det;
            addLog(`✓ Sheet "${name}": detected ${det.sessions.length} session dates automatically.`, 'success');
          } else {
            addLog(`Sheet "${name}": no date headers found — will skip.`, 'warning');
          }
        });

        setSheetData(data);
        setDetections(detected);

        // Auto-select sheets that have detectable structure
        const autoSelect = Object.keys(detected);
        setSelectedSheets(autoSelect.length > 0 ? autoSelect : wb.SheetNames.slice(0, 1));

        if (Object.keys(detected).length > 0) {
          const earliest = Object.values(detected)
            .flatMap(d => d.sessions.map(s => s.isoDate))
            .sort()[0];
          addLog(
            `📅 Program start date auto-detected: ${formatDate(earliest)}`,
            'success'
          );
        }

        setStep(2);
      } catch (err) {
        addLog(`Error parsing file: ${err.message}`, 'error');
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const toggleSheet = (name) =>
    setSelectedSheets(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );

  // ── AI data cleaning ─────────────────────────────────────────────────────────

  const runAICleaning = async () => {
    setIsCleaning(true);
    setCleaningReport([]);
    addLog('🤖 AI scanning student data for errors…', 'info');

    try {
      // Collect all student rows from selected sheets
      const allStudentRows = [];
      for (const sheetName of selectedSheets) {
        const det = detections[sheetName];
        if (!det) continue;
        const rows = sheetData[sheetName];
        for (let i = det.dataStartRow; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 4) continue;
          const usn = String(row[det.usnCol] ?? '').trim();
          if (!usn || usn.length < 5) continue;
          allStudentRows.push({
            _sheet: sheetName,
            _rowIdx: i,
            name:   String(row[det.nameCol]   ?? '').trim(),
            email:  String(row[det.emailCol]  ?? '').trim(),
            usn,
            branch: String(row[det.branchCol] ?? '').trim() || 'Unknown',
          });
        }
      }

      addLog(`Sending ${allStudentRows.length} records to AI for cleaning…`, 'info');

      const prompt = `You are a data quality expert for an Indian engineering college attendance system.
Fix errors in the following student records JSON array. For each record:
1. USN: Must match pattern like 4SF24XX### (4SF=institution, 24=year, XX=2-letter branch code, ###=3-digit number). Fix obvious typos, spacing, case.
2. Email: Must be valid email format. Fix obvious typos (gmial→gmail, yaho→yahoo, etc.).
3. Name: Trim extra whitespace, normalize to UPPER CASE (as per college records).
4. Branch: Must be 2-letter code matching the branch in the USN (e.g. CI, CS, IS, ME, EC, EE).

Return ONLY a valid JSON array (no markdown) with the same length. Each object must have:
{
  "name": "...",
  "email": "...",
  "usn": "...",
  "branch": "...",
  "_sheet": "...",
  "_rowIdx": ...,
  "corrections": ["description of each fix made, empty array if nothing changed"]
}

Records:
${JSON.stringify(allStudentRows, null, 0)}`;

      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      let responseText = null;

      for (const modelName of modelsToTry) {
        try {
          addLog(`Trying model: ${modelName}…`, 'info');
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          responseText = result.response.text().trim()
            .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
          addLog(`✓ AI responded with ${modelName}`, 'success');
          break;
        } catch (err) {
          addLog(`Model ${modelName} failed: ${err.message}`, 'warning');
        }
      }

      if (!responseText) throw new Error('All AI models failed to respond.');

      const cleaned = JSON.parse(responseText);

      // Build report
      const report = cleaned.map((c, idx) => ({
        original: allStudentRows[idx],
        cleaned: c,
        corrections: c.corrections || [],
      }));

      const totalFixes = report.reduce((s, r) => s + r.corrections.length, 0);
      addLog(`✅ AI cleaned ${allStudentRows.length} records — ${totalFixes} corrections made.`, 'success');
      setCleaningReport(report);

      // Build cleaned row maps per sheet so processImport uses them
      const newCleanedData = {};
      for (const sheetName of selectedSheets) {
        const det = detections[sheetName];
        if (!det) continue;
        // Clone original rows
        const rows = sheetData[sheetName].map(r => r ? [...r] : r);
        // Overwrite student fields with AI-cleaned values
        cleaned
          .filter(c => c._sheet === sheetName)
          .forEach(c => {
            const row = rows[c._rowIdx];
            if (!row) return;
            row[det.nameCol]   = c.name;
            row[det.emailCol]  = c.email;
            row[det.usnCol]    = c.usn;
            row[det.branchCol] = c.branch;
          });
        newCleanedData[sheetName] = rows;
      }
      setCleanedData(newCleanedData);
      setStep(3);

    } catch (err) {
      addLog(`AI cleaning failed: ${err.message} — proceeding with raw data.`, 'error');
      // Fallback: use raw data
      const fallback = {};
      selectedSheets.forEach(s => { fallback[s] = sheetData[s]; });
      setCleanedData(fallback);
      setStep(3);
    }
    setIsCleaning(false);
  };

  // ── remove all ───────────────────────────────────────────────────────────────

  const removeAllStudents = async () => {
    setShowRemoveConfirm(false);
    setIsRemoving(true);
    addLog('Removing all student and attendance data…', 'info');
    try {
      await supabase.from('attendance').delete().neq('id', 0);
      await supabase.from('sessions').delete().neq('id', 0);
      await supabase.from('students').delete().neq('id', 0);
      await supabase.from('users').delete().eq('role', 'student');
      addLog('All students, sessions and attendance records removed.', 'success');
    } catch (err) {
      addLog(`Removal failed: ${err.message}`, 'error');
    }
    setIsRemoving(false);
  };

  // ── import ───────────────────────────────────────────────────────────────────

  const isPresent = (cellValue) => {
    if (cellValue === null || cellValue === undefined || cellValue === '') return false;
    const v = String(cellValue).trim().toUpperCase();
    return v === 'TRUE' || v === 'YES' || v === 'P' || v === 'PRESENT' || v === '1';
  };

  const processImport = async () => {
    setIsProcessing(true);
    setStep(4);
    addLog('Starting import…', 'info');

    try {
      // Load existing sessions once
      const { data: existingSessions, error: sessErr } = await supabase
        .from('sessions').select('*');
      if (sessErr) throw sessErr;
      const sessionCache = {}; // isoDate → session row
      existingSessions.forEach(s => { sessionCache[s.date] = s; });

      let totalStudents = 0;
      let totalAttendance = 0;

      for (const sheetName of selectedSheets) {
        const det = detections[sheetName];
        if (!det) {
          addLog(`Skipping "${sheetName}" — no date structure detected.`, 'warning');
          continue;
        }

        addLog(`Processing sheet: ${sheetName} (${det.sessions.length} sessions)…`, 'info');
        const rows = sheetData[sheetName];

        // ── Ensure sessions exist in DB ──────────────────────────────────────
        for (const sess of det.sessions) {
          if (!sessionCache[sess.isoDate]) {
            const d = new Date(sess.isoDate);
            const { data: newSess, error: newSessErr } = await supabase
              .from('sessions')
              .insert({
                date: sess.isoDate,
                topic: `Session — ${formatDate(sess.isoDate)}`,
                month_number: d.getMonth() + 1,
                duration_hours: 2.0,
                session_type: 'offline',
              })
              .select().single();
            if (newSessErr) {
              addLog(`Could not create session ${formatDate(sess.isoDate)}: ${newSessErr.message}`, 'warning');
            } else {
              sessionCache[sess.isoDate] = newSess;
            }
          }
        }

        // ── Process each student row (use AI-cleaned data if available) ──────
        const attBatch = [];
        const sourceRows = cleanedData[sheetName] || rows;

        for (let i = det.dataStartRow; i < sourceRows.length; i++) {
          const row = sourceRows[i];
          if (!row || row.length < 4) continue;

          const name   = String(row[det.nameCol]   ?? '').trim();
          const email  = String(row[det.emailCol]  ?? '').trim();
          const usn    = String(row[det.usnCol]    ?? '').trim();
          const branch = String(row[det.branchCol] ?? '').trim() || 'Unknown';

          if (!usn || usn === 'undefined' || usn.length < 5) continue;
          if (!name || name.toLowerCase() === 'name') continue; // skip header echoes

          // Upsert student
          const { data: student, error: stuErr } = await supabase
            .from('students')
            .upsert(
              { name, email, usn, branch_code: branch, batch: '2024-2028' },
              { onConflict: 'usn' }
            )
            .select().single();

          if (stuErr) {
            addLog(`Error importing ${usn}: ${stuErr.message}`, 'error');
            continue;
          }
          totalStudents++;

          // Collect attendance rows
          for (const sess of det.sessions) {
            const dbSess = sessionCache[sess.isoDate];
            if (!dbSess) continue;
            attBatch.push({
              student_id: student.id,
              session_id: dbSess.id,
              present: isPresent(row[sess.colIndex]),
              marked_by: 'AI Importer',
            });
          }
        }

        // Batch upsert attendance in chunks of 100
        const CHUNK = 100;
        for (let i = 0; i < attBatch.length; i += CHUNK) {
          const chunk = attBatch.slice(i, i + CHUNK);
          const { error: attErr } = await supabase
            .from('attendance')
            .upsert(chunk, { onConflict: 'student_id,session_id' });
          if (attErr) addLog(`Attendance batch error: ${attErr.message}`, 'warning');
          else totalAttendance += chunk.length;
        }
      }

      addLog(
        `✅ Import complete: ${totalStudents} students, ${totalAttendance} attendance records.`,
        'success'
      );
      setStep(5);
    } catch (err) {
      addLog(`Import failed: ${err.message}`, 'error');
      setIsProcessing(false);
    }
    setIsProcessing(false);
  };

  // ── render ────────────────────────────────────────────────────────────────────

  // Compute earliest detected date across selected sheets
  const detectedStartDate = (() => {
    const dates = selectedSheets
      .flatMap(s => (detections[s]?.sessions ?? []).map(d => d.isoDate))
      .filter(Boolean)
      .sort();
    return dates[0] ?? null;
  })();

  const totalDetectedSessions = selectedSheets
    .reduce((acc, s) => acc + (detections[s]?.sessions?.length ?? 0), 0);

  return (
    <div className="flex flex-col flex-1 h-full animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <h1 className="text-display-md text-fg-primary mb-8 tracking-tight">Smart Bulk Import</h1>

      {/* Danger Zone */}
      <div className="mb-6 p-4 rounded-xl border border-danger/30 bg-danger-bg flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Trash2 className="w-5 h-5 text-danger shrink-0" />
          <div>
            <p className="text-sm font-semibold text-danger">Remove All Imported Students</p>
            <p className="text-xs text-fg-secondary">Deletes all students, sessions and attendance records.</p>
          </div>
        </div>
        {showRemoveConfirm ? (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setShowRemoveConfirm(false)} className="px-3 py-1.5 text-xs rounded-lg border border-border bg-bg-primary text-fg-secondary hover:bg-bg-secondary transition-colors">Cancel</button>
            <button onClick={removeAllStudents} disabled={isRemoving} className="px-3 py-1.5 text-xs rounded-lg bg-danger text-white font-semibold hover:bg-danger/80 transition-colors disabled:opacity-50">
              {isRemoving ? 'Removing…' : 'Confirm Delete'}
            </button>
          </div>
        ) : (
          <button onClick={() => setShowRemoveConfirm(true)} className="shrink-0 px-3 py-1.5 text-xs rounded-lg border border-danger/50 text-danger hover:bg-danger/10 transition-colors font-semibold">
            Remove All
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8 text-sm font-medium">
        {[
          { id: 1, label: 'Upload' },
          { id: 2, label: 'Review' },
          { id: 3, label: 'AI Clean' },
          { id: 4, label: 'Import' },
          { id: 5, label: 'Done' },
        ].map(s => (
          <React.Fragment key={s.id}>
            <span className={step >= s.id ? 'text-primary font-semibold' : 'text-fg-tertiary'}>{s.label}</span>
            {s.id < 5 && <ChevronRight className="w-4 h-4 text-fg-quaternary" />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="card p-12 border-dashed flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 transition-colors">
              <input type="file" accept=".xlsx,.csv" onChange={handleFileUpload} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-fg-primary mb-2">Upload Attendance Sheet</h3>
                <p className="text-fg-secondary">Drag and drop or click to browse .xlsx files.</p>
                <p className="text-xs text-fg-tertiary mt-3">Supports sheets with date column headers (DD/MM/YY format)</p>
              </label>
            </div>
          )}

          {/* Step 2: Review & Import */}
          {step === 2 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-fg-primary mb-1 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Review & Import
              </h3>
              <p className="text-fg-secondary text-sm mb-6">
                The importer auto-detected session dates from your file. Select the sheets to import.
              </p>

              {/* Auto-detected info strip */}
              {detectedStartDate && (
                <div className="mb-6 flex flex-wrap gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-fg-secondary">Program Start:</span>
                    <span className="font-semibold text-fg-primary">{formatDate(detectedStartDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-fg-secondary">Sessions Found:</span>
                    <span className="font-semibold text-fg-primary">{totalDetectedSessions}</span>
                  </div>
                </div>
              )}

              {/* Sheet list */}
              <div className="space-y-3 mb-8">
                {workbook?.SheetNames.map(name => {
                  const det = detections[name];
                  return (
                    <label key={name} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${det ? 'border-primary/30 bg-primary/5 hover:border-primary/50' : 'border-border bg-bg-secondary opacity-60'}`}>
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-border text-primary"
                        checked={selectedSheets.includes(name)}
                        onChange={() => det && toggleSheet(name)}
                        disabled={!det}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-fg-primary font-medium block truncate">{name}</span>
                        {det ? (
                          <span className="text-xs text-primary mt-0.5 block">
                            ✓ {det.sessions.length} dates · starts {formatDate(det.sessions.sort((a,b) => a.isoDate.localeCompare(b.isoDate))[0]?.isoDate)}
                          </span>
                        ) : (
                          <span className="text-xs text-fg-tertiary mt-0.5 block">No date headers detected</span>
                        )}
                      </div>
                      <span className="ml-auto text-xs text-fg-tertiary bg-bg-tertiary px-2 py-1 rounded-md shrink-0">
                        {sheetData[name]?.length} rows
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={runAICleaning}
                  disabled={selectedSheets.length === 0 || isCleaning}
                  className="btn btn-secondary gap-2"
                >
                  {isCleaning
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Cleaning Data…</>
                    : <><Sparkles className="w-5 h-5" /> AI Clean &amp; Validate</>}
                </button>
                <button
                  onClick={() => { const fallback = {}; selectedSheets.forEach(s => { fallback[s] = sheetData[s]; }); setCleanedData(fallback); setStep(3); }}
                  disabled={selectedSheets.length === 0}
                  className="btn btn-primary gap-2 opacity-70 hover:opacity-100"
                >
                  <Zap className="w-5 h-5" /> Skip &amp; Import Raw
                </button>
              </div>
            </div>
          )}

          {/* Step 3: AI Corrections Preview */}
          {step === 3 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-fg-primary mb-1 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                AI Data Quality Report
              </h3>
              <p className="text-fg-secondary text-sm mb-4">
                {cleaningReport.length > 0
                  ? `AI reviewed ${cleaningReport.length} student records. Records with corrections are highlighted below.`
                  : 'Using raw data (AI cleaning was skipped).'}
              </p>

              {cleaningReport.length > 0 && (
                <div className="mb-6 max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {cleaningReport.filter(r => r.corrections.length > 0).map((r, i) => (
                    <div key={i} className="p-3 rounded-lg border border-warning/30 bg-warning/5 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-fg-primary">{r.cleaned.name}</span>
                        <span className="font-mono text-xs text-fg-tertiary">{r.cleaned.usn}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {r.corrections.map((fix, fi) => (
                          <li key={fi} className="text-warning text-xs">{fix}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {cleaningReport.filter(r => r.corrections.length > 0).length === 0 && (
                    <p className="text-success text-sm text-center py-4">✅ No errors found — all records are clean!</p>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={processImport} disabled={isProcessing} className="btn btn-primary gap-2">
                  {isProcessing
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Importing…</>
                    : <><Zap className="w-5 h-5" /> Confirm &amp; Import</>}
                </button>
              </div>
            </div>
          )}

          {/* Step 4/5: Processing / Done */}
          {(step === 4 || step === 5) && (
            <div className="card text-center py-12">
              {step === 4 ? (
                <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10" />
                </div>
              )}
              <h2 className="text-2xl font-bold text-fg-primary mb-2">
                {step === 4 ? 'Importing Data…' : 'Import Complete!'}
              </h2>
              <p className="text-fg-secondary">
                {step === 4
                  ? 'Saving cleaned student and attendance records to the database.'
                  : 'All students and attendance records have been imported.'}
              </p>
              {step === 5 && (
                <button className="btn btn-primary mt-8" onClick={() => window.location.reload()}>
                  Import Another File
                </button>
              )}
            </div>
          )}
        </div>

        {/* Log Sidebar */}
        <div className="lg:col-span-1">
          <div className="card h-full flex flex-col max-h-[600px]">
            <h3 className="text-sm font-bold text-fg-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Import Log
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar text-sm">
              {logs.length === 0 && (
                <p className="text-fg-quaternary text-center py-8">No activity yet. Upload a file to begin.</p>
              )}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                    log.type === 'error'   ? 'bg-red-500' :
                    log.type === 'success' ? 'bg-green-500' :
                    log.type === 'warning' ? 'bg-yellow-500' : 'bg-primary'
                  }`} />
                  <div>
                    <p className={log.type === 'error' ? 'text-red-400' : 'text-fg-primary'}>{log.msg}</p>
                    <span className="text-xs text-fg-quaternary">{log.time.toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
