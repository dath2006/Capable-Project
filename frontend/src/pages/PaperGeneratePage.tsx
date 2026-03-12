import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import type { SectionConfig, PaperGenerateRequest } from '../services/paperService';
import { paperService } from '../services/paperService';
import { UploadCloud, FileText, Settings, Layers, CheckCircle2, X } from 'lucide-react';

export default function PaperGeneratePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [duration, setDuration] = useState(180);
  const [difficulty, setDifficulty] = useState('mixed');
  const [audience, setAudience] = useState('undergraduate');
  const [topics, setTopics] = useState('');
  
  const [sections, setSections] = useState<SectionConfig[]>([
    { type: 'mcq', count: 10, marks_per_question: 1 }
  ]);

  const handleDisplayTally = () => {
     return sections.reduce((acc, sec) => acc + (sec.count * sec.marks_per_question), 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const addSection = () => {
    setSections([...sections, { type: 'short_answer', count: 1, marks_per_question: 2 }]);
  };

  const removeSection = (idx: number) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  const updateSection = (idx: number, field: string, val: string | number) => {
    const newSecs = [...sections];
    newSecs[idx] = { ...newSecs[idx], [field]: val };
    setSections(newSecs);
  };

  const handleGenerate = async () => {
    if (!file) {
      setError("Please select a file.");
      return;
    }
    const currentTally = handleDisplayTally();
    if (currentTally !== totalMarks) {
       setError(`Total marks mismatch. Target: ${totalMarks}, Current config: ${currentTally}`);
       return;
    }

    setLoading(true);
    setError('');

    const config: PaperGenerateRequest = {
      title: title || 'Mid-Term Examination',
      total_marks: totalMarks,
      duration_minutes: duration,
      difficulty,
      target_audience: audience,
      topic_focus: topics.split(',').map(t => t.trim()).filter(t => t),
      sections
    };

    try {
      const resp = await paperService.generatePaper(file, config);
      navigate(`/papers/${resp.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "An error occurred during generation.");
      setLoading(false);
    }
  };


  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Generate Question Paper</h2>
        
        {/* Stepper Header */}
        <div className="flex justify-between items-center mb-8 relative">
          <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-200 -z-10"></div>
          {[
            { id: 1, label: 'Upload', icon: UploadCloud },
            { id: 2, label: 'Settings', icon: Settings },
            { id: 3, label: 'Sections', icon: Layers },
            { id: 4, label: 'Review', icon: CheckCircle2 }
          ].map(s => (
            <div key={s.id} className={`flex flex-col items-center bg-slate-50 px-2 ${step >= s.id ? 'text-indigo-600' : 'text-slate-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white ${step >= s.id ? 'border-indigo-600' : 'border-slate-300'}`}>
                <s.icon size={20} />
              </div>
              <span className="text-xs font-medium mt-1">{s.label}</span>
            </div>
          ))}
        </div>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-6 border border-red-200">{error}</div>}

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Select Source Material</h3>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-50 transition-colors">
                 <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                 <input type="file" onChange={handleFileChange} className="hidden" id="file-upload" accept=".pdf,.txt,.docx" />
                 <label htmlFor="file-upload" className="cursor-pointer bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 font-medium rounded-lg inline-block mb-2 transition-colors">
                   Browse Files
                 </label>
                 <p className="text-sm text-slate-500">Supported formats: PDF, DOCX, TXT</p>
                 {file && <p className="mt-4 text-green-600 font-medium">Selected: {file.name}</p>}
              </div>
            </div>
          )}

          {/* STEP 2: SETTINGS */}
          {step === 2 && (
            <div className="animate-fade-in space-y-4">
               <h3 className="text-lg font-semibold text-slate-800 mb-4">Paper Configuration</h3>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Paper Title</label>
                 <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. Mid-Term Computing EXAM" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Total Marks</label>
                   <input type="number" value={totalMarks} onChange={e => setTotalMarks(Number(e.target.value))} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Minutes)</label>
                   <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all" />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty Loop</label>
                   <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg outline-none">
                     <option value="mixed">Mixed (Adaptive)</option>
                     <option value="easy">Easy Foundation</option>
                     <option value="medium">Medium Standard</option>
                     <option value="hard">Hard Analytical</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                   <input type="text" value={audience} onChange={e => setAudience(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg outline-none" />
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Topic Focus (Comma Separated)</label>
                 <input type="text" value={topics} onChange={e => setTopics(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg outline-none" placeholder="e.g. Backpropagation, Chapter 3" />
               </div>
            </div>
          )}

          {/* STEP 3: SECTIONS */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold text-slate-800">Build Sections</h3>
                 <div className={`font-semibold px-3 py-1 rounded-md ${handleDisplayTally() === totalMarks ? 'text-green-700 bg-green-100' : 'text-orange-700 bg-orange-100'}`}>
                   Tally: {handleDisplayTally()} / {totalMarks} Marks
                 </div>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto p-1">
                 {sections.map((sec, i) => (
                   <div key={i} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                     <div className="flex-1">
                       <select value={sec.type} onChange={e => updateSection(i, 'type', e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg outline-none">
                         <option value="mcq">Multiple Choice</option>
                         <option value="true_false">True / False</option>
                         <option value="fill_in_the_blank">Fill in the Blank</option>
                         <option value="short_answer">Short Answer</option>
                         <option value="long_answer">Long Answer</option>
                         <option value="case_study">Case Study Passage</option>
                       </select>
                     </div>
                     <div className="w-24">
                       <input type="number" min="1" value={sec.count} onChange={e => updateSection(i, 'count', Number(e.target.value))} className="w-full border border-slate-300 p-2 rounded-lg outline-none" placeholder="Count" />
                     </div>
                     <div className="text-slate-400">×</div>
                     <div className="w-24">
                       <input type="number" min="1" value={sec.marks_per_question} onChange={e => updateSection(i, 'marks_per_question', Number(e.target.value))} className="w-full border border-slate-300 p-2 rounded-lg outline-none" placeholder="Marks" />
                     </div>
                     <div className="w-16 text-right font-medium text-slate-600 border-l border-slate-300 px-2">= {sec.count * sec.marks_per_question}</div>
                     <button onClick={() => removeSection(i)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18} /></button>
                   </div>
                 ))}
                 <button onClick={addSection} className="w-full py-2 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 font-medium transition-colors">
                   + Add Section Rule
                 </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Review & Generate</h3>
              {!loading ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><span className="text-slate-500 block text-xs">File Payload</span><span className="font-medium text-slate-800">{file?.name}</span></div>
                    <div><span className="text-slate-500 block text-xs">Title</span><span className="font-medium text-slate-800">{title || 'Mid-Term Exam'}</span></div>
                    <div><span className="text-slate-500 block text-xs">Expected Marks / Target</span><span className="font-medium text-slate-800">{handleDisplayTally()} / {totalMarks}</span></div>
                    <div><span className="text-slate-500 block text-xs">Difficulty</span><span className="font-medium text-slate-800">{difficulty.toUpperCase()}</span></div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Sections Output Profile</span>
                    <ul className="list-disc list-inside text-sm font-medium text-slate-700">
                      {sections.map((s, i) => <li key={i}>{s.count}x {s.type.replace('_', ' ')} questions ({s.count * s.marks_per_question} points)</li>)}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <h4 className="text-lg font-bold text-slate-800 mb-1">Constructing Evaluation...</h4>
                  <p className="text-slate-500 animate-pulse text-sm">LLM is actively evaluating chunks and formatting chains.</p>
                </div>
              )}
            </div>
          )}

          {/* Stepper Controls */}
          <div className="flex justify-between mt-8 border-t border-slate-100 pt-4">
            <button 
              onClick={() => setStep(step - 1)} 
              disabled={step === 1 || loading}
              className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg disabled:opacity-30 transition-colors"
            >
              Back
            </button>
            {step < 4 ? (
              <button 
                onClick={() => setStep(step + 1)} 
                disabled={(step === 1 && !file)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
              >
                Next Set
              </button>
            ) : (
              <button 
                onClick={handleGenerate} 
                disabled={loading || handleDisplayTally() !== totalMarks}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? 'Generating...' : 'Issue Final Build Request'}
              </button>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
