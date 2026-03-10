import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import type { QuestionPaper } from '../services/paperService';
import { paperService } from '../services/paperService';
import { BookOpen, FileText, Trash2 } from 'lucide-react';

export default function PaperDashboard() {
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPapers = async () => {
    try {
      const data = await paperService.getPapers();
      setPapers(data);
    } catch (err) {
      console.error(err);
      if ((err as any)?.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [navigate]);

  const handleDelete = async (id: number) => {
    if (!confirm('Area you sure you want to delete this paper?')) return;
    try {
      await paperService.deletePaper(id);
      setPapers(papers.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Your Question Papers</h2>
          <p className="text-slate-500 text-sm mt-1">Review your generated question papers or create a new one.</p>
        </div>
        <Link 
          to="/papers/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <FileText size={18} /> Generate New
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : papers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No question papers yet</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">Upload a document and configure your settings to instantly generate a structured exam paper.</p>
          <Link to="/papers/new" className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium px-4 py-2 rounded-lg transition-colors">
            Create your first paper
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {papers.map((paper) => (
            <div key={paper.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded">
                    {paper.difficulty.toUpperCase()}
                  </div>
                  <button onClick={() => handleDelete(paper.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 className="font-semibold text-slate-800 text-lg mb-1 line-clamp-2" title={paper.title}>
                  {paper.title}
                </h3>
                <p className="text-slate-500 text-sm mb-4 truncate text-ellipsis" title={paper.source_filename}>
                  Source: {paper.source_filename}
                </p>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                    <span>{paper.total_marks} Marks</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                    <span>{paper.duration_minutes} Min</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 border-t border-slate-100 p-3 flex justify-between">
                 <Link 
                  to={`/papers/${paper.id}`} 
                  className="flex-1 text-center text-indigo-600 hover:bg-indigo-50 py-1.5 rounded transition-colors text-sm font-medium"
                >
                  Preview Paper
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
