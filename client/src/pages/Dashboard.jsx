import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { interviewAPI, reportAPI } from '../api';
import Navbar from '../components/layout/Navbar';
import {
  Brain, Trophy, Target, Clock, TrendingUp, Plus, ChevronRight,
  Star, Award, Zap, BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="glass-card-hover p-6 flex items-center gap-4">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <div>
      <p className="text-gray-400 text-sm font-medium">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const gradeColor = (grade) => {
  const map = {
    'A+': 'text-emerald-400', 'A': 'text-emerald-400',
    'B+': 'text-primary-400', 'B': 'text-primary-400',
    'C+': 'text-amber-400', 'C': 'text-amber-400',
    'D': 'text-orange-400', 'F': 'text-red-400',
  };
  return map[grade] || 'text-gray-400';
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [histRes, repRes] = await Promise.all([
          interviewAPI.getHistory(),
          reportAPI.getAll(),
        ]);
        setHistory(histRes.data.interviews || []);
        setReports(repRes.data.reports || []);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchData();
  }, []);

  const completed = history.filter(i => i.status === 'completed');
  const avgScore = completed.length
    ? (completed.reduce((s, i) => s + (i.overallScore || 0), 0) / completed.length).toFixed(1)
    : '—';

  const recentReports = reports.slice(0, 5);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Banner */}
        <div className="glass-card bg-gradient-to-r from-primary-600/20 to-accent-purple/20 border-primary-500/30 p-8 mb-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="particle" style={{ left: `${20 * i}%`, top: '50%', animationDelay: `${i * 0.6}s` }} />
            ))}
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 text-sm font-semibold">Ready to practice?</span>
              </div>
              <h1 className="text-4xl font-black text-white mb-2">
                Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>! 👋
              </h1>
              <p className="text-gray-300 text-lg">
                You've completed <strong className="text-white">{user?.totalInterviews || 0}</strong> interviews.
                {user?.totalInterviews > 0
                  ? ` Your average score is ${user?.averageScore}/10.`
                  : ' Start your first AI interview now!'}
              </p>
            </div>
            <Link to="/interview/setup" id="start-interview-btn" className="btn-primary flex items-center gap-2 whitespace-nowrap text-lg px-8 py-4">
              <Plus className="w-5 h-5" />
              New Interview
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            icon={Trophy}
            label="Total Interviews"
            value={user?.totalInterviews || 0}
            sub="All time"
            color="bg-gradient-to-br from-amber-500 to-orange-600"
          />
          <StatCard
            icon={Target}
            label="Average Score"
            value={user?.averageScore ? `${user.averageScore}/10` : '—'}
            sub="Across all sessions"
            color="bg-gradient-to-br from-primary-500 to-primary-700"
          />
          <StatCard
            icon={Award}
            label="Completed"
            value={completed.length}
            sub="Sessions finished"
            color="bg-gradient-to-br from-emerald-500 to-teal-700"
          />
          <StatCard
            icon={Zap}
            label="Best Score"
            value={completed.length
              ? `${Math.max(...completed.map(i => i.overallScore || 0)).toFixed(1)}/10`
              : '—'}
            sub="Personal best"
            color="bg-gradient-to-br from-accent-purple to-purple-800"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Interviews */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary-400" />
                Recent Interviews
              </h2>
              <Link to="/history" className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loadingHistory ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="glass-card p-5 animate-pulse">
                    <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Brain className="w-16 h-16 text-primary-400/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No interviews yet</h3>
                <p className="text-gray-500 mb-6">Start your first AI-powered interview!</p>
                <Link to="/interview/setup" className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Start Interview
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {history.slice(0, 5).map((interview) => (
                  <div key={interview._id} className="glass-card-hover p-5 flex items-center justify-between group cursor-pointer"
                    onClick={() => interview.status === 'completed' && navigate(`/results/${interview._id}`)}>
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-primary-500/20 to-accent-purple/20 border border-primary-500/30 rounded-xl flex items-center justify-center">
                        <Brain className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">{interview.role}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            interview.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' :
                            interview.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-emerald-500/20 text-emerald-400'
                          }`}>{interview.difficulty}</span>
                          <span className="text-gray-500 text-xs">{interview.totalQuestions}Q</span>
                          <span className="text-gray-600 text-xs">
                            {new Date(interview.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        interview.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        interview.status === 'active' ? 'bg-primary-500/20 text-primary-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {interview.status}
                      </span>
                      {interview.status === 'completed' && (
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-primary-400 transition-colors" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Start Panel */}
          <div>
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Quick Start
            </h2>
            <div className="space-y-3">
              {[
                { role: 'Frontend Developer', icon: '🎨', diff: 'Medium', color: 'from-primary-500/20 to-primary-700/20' },
                { role: 'Backend Developer', icon: '⚙️', diff: 'Medium', color: 'from-emerald-500/20 to-teal-700/20' },
                { role: 'Full Stack Developer', icon: '🚀', diff: 'Hard', color: 'from-accent-purple/20 to-purple-800/20' },
                { role: 'Data Scientist', icon: '📊', diff: 'Hard', color: 'from-accent-cyan/20 to-cyan-800/20' },
                { role: 'System Design', icon: '🏗️', diff: 'Hard', color: 'from-amber-500/20 to-orange-700/20' },
              ].map(({ role, icon, diff, color }) => (
                <button
                  key={role}
                  onClick={() => navigate('/interview/setup', { state: { role, difficulty: diff } })}
                  className={`w-full glass-card-hover bg-gradient-to-r ${color} p-4 flex items-center justify-between group text-left`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <div>
                      <p className="text-white text-sm font-semibold">{role}</p>
                      <p className="text-gray-400 text-xs">{diff} difficulty</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
