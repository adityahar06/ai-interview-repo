import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { reportAPI } from '../api';
import Navbar from '../components/layout/Navbar';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  Brain, Trophy, TrendingUp, TrendingDown, Star, CheckCircle,
  AlertCircle, ArrowRight, Download, RotateCcw, ChevronDown, ChevronUp, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const gradeConfig = {
  'A+': { color: '#10b981', bg: 'from-emerald-500/20 to-teal-700/20', border: 'border-emerald-500/40', label: 'Outstanding' },
  'A':  { color: '#10b981', bg: 'from-emerald-500/20 to-teal-700/20', border: 'border-emerald-500/40', label: 'Excellent' },
  'B+': { color: '#5c7cfa', bg: 'from-primary-500/20 to-primary-700/20', border: 'border-primary-500/40', label: 'Very Good' },
  'B':  { color: '#5c7cfa', bg: 'from-primary-500/20 to-primary-700/20', border: 'border-primary-500/40', label: 'Good' },
  'C+': { color: '#f59e0b', bg: 'from-amber-500/20 to-orange-700/20', border: 'border-amber-500/40', label: 'Average' },
  'C':  { color: '#f59e0b', bg: 'from-amber-500/20 to-orange-700/20', border: 'border-amber-500/40', label: 'Fair' },
  'D':  { color: '#f97316', bg: 'from-orange-500/20 to-red-700/20', border: 'border-orange-500/40', label: 'Below Average' },
  'F':  { color: '#f43f5e', bg: 'from-red-500/20 to-rose-700/20', border: 'border-red-500/40', label: 'Needs Work' },
};

const recommendationConfig = {
  Hire: { color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', icon: '✅' },
  Consider: { color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40', icon: '🤔' },
  Reject: { color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40', icon: '❌' },
};

const Results = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState(null);

  const reportId = location.state?.reportId;

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // Try to find the report for this interview ID or use the passed reportId
        let res;
        if (reportId) {
          res = await reportAPI.getById(reportId);
        } else {
          // Fallback: get all reports and find one for this interview
          const allRes = await reportAPI.getAll();
          const found = allRes.data.reports.find(r => r.interviewId?._id === id || r.interviewId === id);
          if (!found) throw new Error('Report not found');
          res = await reportAPI.getById(found._id);
        }
        setReport(res.data.report);
      } catch (err) {
        toast.error('Failed to load report');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id, reportId]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="flex justify-center gap-2 mb-4">
              <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
            </div>
            <p className="text-gray-400">Loading your performance report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const gc = gradeConfig[report.grade] || gradeConfig['C'];
  const rc = recommendationConfig[report.recommendation] || recommendationConfig['Consider'];
  const interview = report.interviewId;

  const chartData = report.questionBreakdown.map((q, i) => ({
    name: `Q${i + 1}`,
    score: q.score,
  }));

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 rounded-full px-4 py-2 text-primary-400 text-sm font-medium mb-4">
            <Trophy className="w-4 h-4" /> Interview Complete
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Your Performance Report</h1>
          <p className="text-gray-400">
            {interview?.role} · {interview?.difficulty} · {report.questionBreakdown.length} Questions
          </p>
        </div>

        {/* Score Hero */}
        <div className={`glass-card bg-gradient-to-br ${gc.bg} border ${gc.border} p-8 mb-8 animate-slide-up`}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Circular Score */}
            <div className="w-36 h-36 flex-shrink-0">
              <CircularProgressbar
                value={(report.overallScore / 10) * 100}
                text={`${report.overallScore}/10`}
                styles={buildStyles({
                  pathColor: gc.color,
                  textColor: '#ffffff',
                  trailColor: 'rgba(255,255,255,0.1)',
                  textSize: '18px',
                })}
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-4">
                <div>
                  <div className="text-6xl font-black" style={{ color: gc.color }}>{report.grade}</div>
                  <div className="text-gray-300 font-medium">{gc.label}</div>
                </div>
                <div className={`border rounded-full px-4 py-2 text-sm font-bold flex items-center gap-2 ${rc.bg} ${rc.color}`}>
                  <span>{rc.icon}</span>
                  Recommendation: {report.recommendation}
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">{report.summary}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Strengths */}
          <div className="glass-card p-6 animate-slide-up">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Strengths
            </h2>
            <ul className="space-y-3">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="glass-card p-6 animate-slide-up animation-delay-200">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-400" /> Areas to Improve
            </h2>
            <ul className="space-y-3">
              {report.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Score Chart */}
        <div className="glass-card p-6 mb-8 animate-slide-up">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary-400" /> Score Breakdown
          </h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  formatter={(val) => [`${val}/10`, 'Score']}
                />
                <Bar dataKey="score" fill="url(#scoreGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5c7cfa" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="glass-card p-6 mb-8 animate-slide-up">
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary-400" /> Question Details
          </h2>
          <div className="space-y-3">
            {report.questionBreakdown.map((q, i) => (
              <div key={i} className="glass-card-hover rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                      q.score >= 7 ? 'bg-emerald-500/20 text-emerald-400' :
                      q.score >= 4 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{q.score || 0}</div>
                    <p className="text-gray-300 text-sm truncate">{q.question}</p>
                  </div>
                  {expandedQ === i
                    ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  }
                </button>
                {expandedQ === i && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 animate-fade-in">
                    <p className="text-white text-sm font-medium mb-2">{q.question}</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{q.feedback || 'No feedback available.'}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
          <Link to="/interview/setup" className="btn-primary flex-1 flex items-center justify-center gap-2 py-4">
            <RotateCcw className="w-5 h-5" /> New Interview
          </Link>
          <Link to="/dashboard" className="btn-secondary flex-1 flex items-center justify-center gap-2 py-4">
            <Award className="w-5 h-5" /> Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Results;
