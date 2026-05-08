import React, { useState, useRef, useEffect } from 'react';
import * as xlsx from 'xlsx';
import { supabase } from '../../lib/supabase';
import { genAI } from '../../lib/gemini';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, ChevronRight, Check } from 'lucide-react';

export default function UploadCSV() {
  const [file, setFile] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [step, setStep] = useState(1); // 1: Upload, 2: Select Sheets, 3: Date config, 4: Preview/Process, 5: Done
  
  const [sheetData, setSheetData] = useState({});
  const [dateMapping, setDateMapping] = useState({}); // { 'Day 1': '2025-10-01' }
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  
  // Date config state
  const [startDate, setStartDate] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const addLog = (msg, type = 'info') => setLogs(prev => [...prev, { msg, type, time: new Date() }]);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        setWorkbook(wb);
        setSelectedSheets(wb.SheetNames.slice(0, 1));
        
        const data = {};
        wb.SheetNames.forEach(name => {
          const ws = wb.Sheets[name];
          data[name] = xlsx.utils.sheet_to_json(ws, { header: 1 });
        });
        setSheetData(data);
        setStep(2);
      } catch (err) {
        addLog(`Error parsing file: ${err.message}`, 'error');
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const toggleSheet = (sheetName) => {
    setSelectedSheets(prev => 
      prev.includes(sheetName) ? prev.filter(s => s !== sheetName) : [...prev, sheetName]
    );
  };

  const analyzeHeadersWithAI = async () => {
    if (selectedSheets.length === 0) return;
    setIsProcessing(true);
    setStep(3);
    addLog('Analyzing headers with AI to identify attendance columns...', 'info');

    try {
      // Pick a sample sheet to analyze
      const sampleSheet = sheetData[selectedSheets[0]];
      if (!sampleSheet || sampleSheet.length === 0) {
        throw new Error(`Sheet "${selectedSheets[0]}" appears to be empty.`);
      }
      
      // Filter out completely empty rows and take top 10 rows to be safe
      const sampleHeaders = sampleSheet
        .filter(row => row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== ''))
        .slice(0, 10); 
        
      console.log("Debug - Sample Headers:", sampleHeaders);
      
      const prompt = `
      You are an expert data analyst. Look at the following rows from an attendance spreadsheet:
      ${JSON.stringify(sampleHeaders)}
      
      Your task is to identify the column indexes (0-based) for the following student details: 'name', 'email', 'usn', 'branch'.
      Also, identify the columns that represent 'Attendance' for each session/day. 
      The headers might be split across multiple rows (e.g. 'Day 1' on row 1, and 'Attendance' on row 2).
      
      Return ONLY a JSON object with this exact structure:
      {
        "studentFields": {
          "name": <col index or null>,
          "email": <col index or null>,
          "usn": <col index or null>,
          "branch": <col index or null>
        },
        "sessions": [
          { "name": "Day 1", "attendanceColIndex": <col index> },
          { "name": "Day 2", "attendanceColIndex": <col index> }
        ]
      }
      Do not return markdown, only the raw JSON string.
      `;
      console.log("Debug - AI Prompt:", prompt);
      
      const modelsToTry = [
        "gemini-3-flash-preview",
        "gemini-3.1-pro-preview",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-1.5-flash"
      ];
      
      let result = null;
      let lastError = null;
      
      for (const modelName of modelsToTry) {
        try {
          if (!prompt || prompt.length < 10) {
            throw new Error("Prompt is empty or too short. Please check your sheet data.");
          }
          addLog(`Trying AI model: ${modelName}...`, 'info');
          const model = genAI.getGenerativeModel({ model: modelName });
          result = await model.generateContent(prompt);
          if (result) {
            addLog(`Success with model: ${modelName}`, 'success');
            break;
          }
        } catch (err) {
          lastError = err;
          console.warn(`Model ${modelName} failed:`, err);
        }
      }
      
      if (!result) {
        throw new Error(`All AI models failed. Last error: ${lastError?.message}. Please ensure the Generative Language API is enabled for your API key in Google Cloud Console.`);
      }

      let responseText = result.response.text().trim();
      if(responseText.startsWith('\`\`\`json')) {
        responseText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      }
      
      const parsed = JSON.parse(responseText);
      const days = parsed.sessions.map(s => s.name);
      addLog(`AI identified sessions: ${days.join(', ')}`, 'success');
      
      // Save the mapping for later
      setSheetData(prev => ({ ...prev, aiMapping: parsed }));
      
      // Initialize date mapping for these days
      const mapping = {};
      days.forEach(d => mapping[d] = '');
      setDateMapping(mapping);
      
    } catch (err) {
      addLog(`AI Analysis failed: ${err.message}. Please configure dates manually.`, 'error');
      // Fallback: manually parse top rows
      setDateMapping({'Day 1': '', 'Day 2': '', 'Day 3': ''});
    }
    setIsProcessing(false);
  };

  const generateDates = () => {
    if (!startDate || selectedDays.length === 0) {
      alert('Please select a start date and class days.');
      return;
    }
    
    let currentDate = new Date(startDate);
    const newMapping = { ...dateMapping };
    const daysArr = Object.keys(newMapping);
    
    let dayIndex = 0;
    while (dayIndex < daysArr.length) {
      const dayOfWeekName = daysOfWeek[currentDate.getDay()];
      if (selectedDays.includes(dayOfWeekName)) {
         // It's a class day
         newMapping[daysArr[dayIndex]] = currentDate.toISOString().split('T')[0];
         dayIndex++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setDateMapping(newMapping);
  };

  const processImport = async () => {
    setIsProcessing(true);
    setStep(4);
    addLog('Starting bulk import process...', 'info');

    try {
      // 1. Fetch existing sessions to check duplicates
      const { data: existingSessions, error: sessErr } = await supabase.from('sessions').select('*');
      if (sessErr) throw sessErr;
      
      const existingDates = existingSessions.map(s => s.date);
      
      // 2. Warn about duplicates
      const plannedDates = Object.values(dateMapping).filter(d => d);
      const duplicates = plannedDates.filter(d => existingDates.includes(d));
      
      if (duplicates.length > 0) {
        addLog(`Warning: Found existing sessions for dates: ${duplicates.join(', ')}. Records for these dates will be merged/skipped.`, 'warning');
      }

      // 3. For each selected sheet, extract data
      let totalStudents = 0;
      let totalAttendance = 0;
      
      for (const sheetName of selectedSheets) {
        addLog(`Processing sheet: ${sheetName}...`, 'info');
        const rows = sheetData[sheetName];
        
        // Find row index where student data begins (usually after headers, row 3 or 4)
        // We'll skip rows that don't look like student rows (no valid email or usn)
        
        for (let i = 2; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 5) continue;
          
          const aiMapping = sheetData.aiMapping;
          const nameCol = aiMapping.studentFields.name !== null ? aiMapping.studentFields.name : 1;
          const emailCol = aiMapping.studentFields.email !== null ? aiMapping.studentFields.email : 2;
          const usnCol = aiMapping.studentFields.usn !== null ? aiMapping.studentFields.usn : 3;
          const branchCol = aiMapping.studentFields.branch !== null ? aiMapping.studentFields.branch : 6;

          const name = row[nameCol];
          const email = row[emailCol];
          const usn = row[usnCol] || row[4]; 
          const branch = row[branchCol] || 'Unknown';
          
          if (!usn || typeof usn !== 'string' || !usn.includes('24')) continue; // rudimentary filter
          
          // Upsert student
          const { data: student, error: studentErr } = await supabase
            .from('students')
            .upsert({ name, email, usn, branch_code: branch, batch: '2024-2028' }, { onConflict: 'usn' })
            .select()
            .single();
            
          if (studentErr) {
             addLog(`Error upserting student ${usn}: ${studentErr.message}`, 'error');
             continue;
          }
          totalStudents++;
          
          const daysArr = Object.keys(dateMapping);
          for(let d=0; d < aiMapping.sessions.length; d++) {
             const sessionInfo = aiMapping.sessions[d];
             const date = dateMapping[sessionInfo.name];
             if (!date) continue;
             
             // Ensure session exists
             let sessionId;
             const existingSess = existingSessions.find(s => s.date === date);
             if (existingSess) {
               sessionId = existingSess.id;
             } else {
               const { data: newSess, error: newSessErr } = await supabase
                 .from('sessions')
                 .insert({ date, topic: sessionInfo.name, month_number: new Date(date).getMonth() + 1 })
                 .select()
                 .single();
               if(newSessErr) throw newSessErr;
               sessionId = newSess.id;
               existingSessions.push(newSess); // cache
             }
             
             const isPresent = row[sessionInfo.attendanceColIndex] === true || row[sessionInfo.attendanceColIndex] === 'true' || row[sessionInfo.attendanceColIndex] === 'P';
             
             // Insert attendance
             const { error: attErr } = await supabase
               .from('attendance')
               .upsert({ student_id: student.id, session_id: sessionId, present: isPresent, marked_by: 'AI Importer' }, { onConflict: 'student_id, session_id' });
               
             if(!attErr) totalAttendance++;
          }
        }
      }
      
      addLog(`Successfully imported ${totalStudents} students and ${totalAttendance} attendance records.`, 'success');
      setStep(5);
    } catch (err) {
      addLog(`Import failed: ${err.message}`, 'error');
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col flex-1 h-full animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <h1 className="text-display-md text-fg-primary mb-8 tracking-tight">AI Bulk Import</h1>
      
      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8 text-sm font-medium">
         {[
           { id: 1, label: 'Upload' },
           { id: 2, label: 'Sheets' },
           { id: 3, label: 'Dates' },
           { id: 4, label: 'Process' }
         ].map(s => (
           <React.Fragment key={s.id}>
             <span className={step >= s.id ? 'text-primary' : 'text-fg-tertiary'}>{s.label}</span>
             {s.id < 4 && <ChevronRight className="w-4 h-4 text-fg-quaternary" />}
           </React.Fragment>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {step === 1 && (
            <div className="card p-12 border-dashed flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 transition-colors">
              <input type="file" accept=".xlsx, .csv" onChange={handleFileUpload} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-fg-primary mb-2">Upload Attendance Sheet</h3>
                <p className="text-fg-secondary">Drag and drop or click to browse .xlsx or .csv files.</p>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-fg-primary mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Select Sheets to Import
              </h3>
              <p className="text-fg-secondary mb-6 text-sm">
                We detected multiple sheets. Select the ones you want to process.
              </p>
              <div className="space-y-3">
                {workbook?.SheetNames.map(name => (
                  <label key={name} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-bg-secondary cursor-pointer hover:border-primary/50">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                      checked={selectedSheets.includes(name)}
                      onChange={() => toggleSheet(name)}
                    />
                    <span className="text-fg-primary font-medium">{name}</span>
                    <span className="ml-auto text-xs text-fg-tertiary bg-bg-tertiary px-2 py-1 rounded-md">
                      {sheetData[name].length} rows
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={analyzeHeadersWithAI}
                  disabled={selectedSheets.length === 0 || isProcessing}
                  className="btn btn-primary"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze with AI'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-fg-primary mb-4">Configure Missing Dates</h3>
              <p className="text-fg-secondary text-sm mb-6">
                The AI detected session columns without explicit dates. Tell us when these classes occurred.
              </p>
              
              <div className="bg-bg-secondary p-4 rounded-xl border border-border mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-fg-secondary mb-2">Program Start Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-fg-primary focus:outline-none focus:border-primary"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-fg-secondary mb-2">Class Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                         const fullDay = daysOfWeek[idx+1] || 'Saturday';
                         const isSel = selectedDays.includes(fullDay);
                         return (
                           <button 
                             key={day}
                             onClick={() => setSelectedDays(prev => isSel ? prev.filter(d => d !== fullDay) : [...prev, fullDay])}
                             className={`px-3 py-1 text-xs rounded-full border transition-colors ${isSel ? 'bg-primary/20 border-primary text-primary' : 'bg-bg-primary border-border text-fg-tertiary'}`}
                           >
                             {day}
                           </button>
                         )
                      })}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={generateDates} className="btn btn-secondary py-1.5 px-4 text-sm">
                    Generate Dates
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {Object.keys(dateMapping).map(day => (
                  <div key={day} className="flex items-center justify-between p-3 rounded-lg border border-border bg-bg-primary">
                    <span className="text-sm font-medium text-fg-primary">{day}</span>
                    <input 
                      type="date" 
                      className="bg-bg-secondary border border-border rounded-md px-2 py-1 text-sm text-fg-primary focus:outline-none focus:border-primary"
                      value={dateMapping[day]}
                      onChange={(e) => setDateMapping({...dateMapping, [day]: e.target.value})}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={processImport}
                  className="btn btn-primary"
                >
                  Start Import Process
                </button>
              </div>
            </div>
          )}

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
                {step === 4 ? 'Processing Data...' : 'Import Complete!'}
              </h2>
              <p className="text-fg-secondary">
                {step === 4 ? 'The AI is mapping records and saving to the database.' : 'All students and attendance records have been imported.'}
              </p>
              {step === 5 && (
                <button className="btn btn-primary mt-8" onClick={() => window.location.reload()}>
                  Import Another File
                </button>
              )}
            </div>
          )}

        </div>

        {/* Logs / AI Thoughts Sidebar */}
        <div className="lg:col-span-1">
          <div className="card h-full flex flex-col">
            <h3 className="text-sm font-bold text-fg-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              AI Activity Log
            </h3>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar text-sm">
              {logs.length === 0 && (
                <p className="text-fg-quaternary text-center py-8">No activity yet. Upload a file to begin.</p>
              )}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    log.type === 'error' ? 'bg-red-500' : 
                    log.type === 'success' ? 'bg-green-500' : 
                    log.type === 'warning' ? 'bg-yellow-500' : 'bg-primary'
                  }`} />
                  <div>
                    <p className={`text-fg-primary ${log.type === 'error' ? 'text-red-400' : ''}`}>{log.msg}</p>
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
