import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import type { QuestionPaper } from '../services/paperService';
import { paperService } from '../services/paperService';
import { ArrowLeft, Download, Eye, EyeOff, RefreshCcw } from 'lucide-react';

export default function PaperPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [regeneratingQ, setRegeneratingQ] = useState<number | null>(null);

  useEffect(() => {
    const fetchPaper = async () => {
      try {
        const data = await paperService.getPaper(Number(id));
        setPaper(data);
      } catch (err) {
        console.error(err);
        navigate('/papers');
      } finally {
        setLoading(false);
      }
    };
    fetchPaper();
  }, [id, navigate]);

  const handleExport = (format: string, type: string) => {
    window.open(paperService.exportPaperUrl(Number(id), format, type), '_blank');
  };

  const handleRegenerate = async (qId: number, secIdx: number, qIdx: number) => {
    if (!paper) return;
    setRegeneratingQ(qId);
    try {
      const newQuestion = await paperService.regenerateQuestion(paper.id, qId);
      const updatedPaper = { ...paper };
      updatedPaper.sections[secIdx].questions[qIdx] = newQuestion;
      setPaper(updatedPaper);
    } catch (err) {
      alert('Failed to regenerate specific question.');
    } finally {
      setRegeneratingQ(null);
    }
  };


  if (loading) return (
    <DashboardLayout>
       <div className="flex flex-col justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Loading Document Layout...</p>
       </div>
    </DashboardLayout>
  );

  if (!paper) return <DashboardLayout><h1>Not Found</h1></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/papers')} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{paper.title}</h1>
              <p className="text-sm text-slate-500 font-medium">Source: {paper.source_filename} | Total Marks: {paper.total_marks}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setShowAnswers(!showAnswers)}
              className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors border ${showAnswers ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {showAnswers ? <><EyeOff size={18} /> Hide Key</> : <><Eye size={18} /> Show Key</>}
            </button>
            
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm">
                <Download size={18} /> Export
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 flex flex-col overflow-hidden">
                <button onClick={() => handleExport('pdf', 'both')} className="text-left px-4 py-3 text-sm font-medium hover:bg-slate-50 border-b border-slate-100 text-slate-700">PDF - Exam & Key</button>
                <button onClick={() => handleExport('pdf', 'paper')} className="text-left px-4 py-3 text-sm font-medium hover:bg-slate-50 border-b border-slate-100 text-slate-700">PDF - Exam Only</button>
                <button onClick={() => handleExport('docx', 'both')} className="text-left px-4 py-3 text-sm font-medium hover:bg-slate-50 text-slate-700">DOCX - Exam & Key</button>
              </div>
            </div>
          </div>
        </div>

        {/* Paper Document Body */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-8 py-10 md:px-12 md:py-16 min-h-[800px]">
           <div className="text-center mb-10 border-b-2 border-slate-800 pb-6">
             <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">{paper.title}</h2>
             <div className="flex justify-between items-center text-sm font-medium text-slate-700 uppercase tracking-wider">
               <span>Time: {paper.duration_minutes} Mins</span>
               <span>Target: {paper.target_audience}</span>
               <span>Max Marks: {paper.total_marks}</span>
             </div>
           </div>

           <div className="space-y-12">
             {paper.sections.map((sec, sIdx) => (
               <div key={sec.id}>
                 <div className="mb-6 border-b border-slate-300 pb-2">
                   <h3 className="text-lg font-bold text-slate-800 uppercase tracking-widest">
                     Section {(sIdx + 1)}: {sec.section_type.replace('_', ' ')}
                   </h3>
                   <p className="text-sm text-slate-500 font-medium italic mt-1">({sec.questions.reduce((acc, q) => acc + q.marks, 0)} Marks Total)</p>
                 </div>

                 <div className="space-y-8">
                   {sec.questions.map((q, qIdx) => (
                     <div key={q.id} className="relative group pl-6 md:pl-8">
                       <span className="absolute left-0 top-0 font-bold text-slate-800">{qIdx + 1}.</span>
                       
                       <div className="flex justify-between items-start mb-2">
                         <div className="flex-1 whitespace-pre-wrap font-medium text-slate-800 text-lg leading-relaxed">
                           {q.question_text}
                         </div>
                         <div className="ml-4 flex items-center gap-3">
                           <span className="text-slate-500 font-semibold whitespace-nowrap">[{q.marks}]</span>
                           <button 
                             onClick={() => handleRegenerate(q.id, sIdx, qIdx)}
                             disabled={regeneratingQ === q.id}
                             title="Regenerate this specific question"
                             className={`text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100 ${regeneratingQ === q.id ? 'animate-spin opacity-100 text-indigo-600' : ''}`}
                           >
                             <RefreshCcw size={16} />
                           </button>
                         </div>
                       </div>
                       
                       {/* Options UI for MCQ */}
                       {sec.section_type === 'mcq' && q.options && (
                         <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700 font-medium pl-2">
                           {JSON.parse(q.options).map((opt: string, i: number) => (
                             <div key={i} className="flex gap-2">
                               <span className="font-bold">{String.fromCharCode(65 + i)}.</span> {opt}
                             </div>
                           ))}
                         </div>
                       )}

                       {/* Answer Key Overlay */}
                       {showAnswers && q.answer_key && (
                         <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-sm animate-fade-in">
                           <div className="font-semibold text-green-800 mb-1">Answer Key:</div>
                           <div className="text-green-700 font-medium mb-2">{q.answer_key.correct_answer}</div>
                           
                           {q.answer_key.explanation && (
                             <>
                               <div className="font-semibold text-green-800 mb-1 mt-3">Explanation / Rubric:</div>
                               <div className="text-green-700">{q.answer_key.explanation}</div>
                             </>
                           )}
                         </div>
                       )}

                     </div>
                   ))}
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
