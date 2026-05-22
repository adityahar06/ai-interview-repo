import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { interviewAPI } from '../api';
import { Brain, Loader2, ChevronRight, Zap, Shield, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'Frontend Developer', icon: '🎨', desc: 'HTML, CSS, JS, React, Vue' },
  { value: 'Backend Developer', icon: '⚙️', desc: 'Node.js, Python, APIs, DBs' },
  { value: 'Full Stack Developer', icon: '🚀', desc: 'End-to-end web development' },
  { value: 'Data Scientist', icon: '📊', desc: 'ML, Statistics, Python, SQL' },
  { value: 'Machine Learning Engineer', icon: '🤖', desc: 'Deep Learning, TF, PyTorch' },
  { value: 'DevOps Engineer', icon: '🔧', desc: 'CI/CD, Docker, K8s, Cloud' },
  { value: 'Mobile Developer', icon: '📱', desc: 'iOS, Android, React Native' },
  { value: 'System Design', icon: '🏗️', desc: 'Architecture, Scalability' },
  { value: 'Product Manager', icon: '📋', desc: 'Strategy, Roadmap, Analytics' },
  { value: 'General Software Engineer', icon: '💻', desc: 'DSA, Problem Solving, CS' },
];

const DIFFICULTIES = [
  {
    value: 'Easy',
    icon: Shield,
    color: 'from-emerald-500/20 to-teal-700/20 border-emerald-500/30 hover:border-emerald-500',
    activeColor: 'from-emerald-500/40 to-teal-700/40 border-emerald-500',
    textColor: 'text-emerald-400',
    desc: 'Basic concepts, great for beginners',
  },
  {
    value: 'Medium',
    icon: Target,
    color: 'from-primary-500/20 to-primary-700/20 border-primary-500/30 hover:border-primary-500',
    activeColor: 'from-primary-500/40 to-primary-700/40 border-primary-500',
    textColor: 'text-primary-400',
    desc: 'Applied knowledge & problem solving',
  },
  {
    value: 'Hard',
    icon: Zap,
    color: 'from-red-500/20 to-rose-700/20 border-red-500/30 hover:border-red-500',
    activeColor: 'from-red-500/40 to-rose-700/40 border-red-500',
    textColor: 'text-red-400',
    desc: 'Advanced topics & system design',
  },
];

const InterviewSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState(location.state?.role || '');
  const [selectedDifficulty, setSelectedDifficulty] = useState(location.state?.difficulty || 'Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!selectedRole) {
      toast.error('Please select a job role');
      return;
    }

    setLoading(true);
    try {
      const res = await interviewAPI.start({
        role: selectedRole,
        difficulty: selectedDifficulty,
        totalQuestions: questionCount,
      });
      toast.success('Interview started! Good luck! 🎯');
      navigate(`/interview/${res.data.interview._id}`, {
        state: { interview: res.data.interview },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 rounded-full px-4 py-2 text-primary-400 text-sm font-medium mb-4">
            <Brain className="w-4 h-4" />
            AI Interview Setup
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Configure Your Interview</h1>
          <p className="text-gray-400 text-lg">Choose your role, difficulty, and number of questions</p>
        </div>

        <div className="space-y-8 animate-slide-up">
          {/* Role Selection */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <span className="text-2xl">👔</span> Select Job Role
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ROLES.map(({ value, icon, desc }) => (
                <button
                  key={value}
                  id={`role-${value.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setSelectedRole(value)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                    selectedRole === value
                      ? 'bg-primary-500/30 border-primary-500 shadow-lg shadow-primary-500/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <p className={`font-semibold text-sm ${selectedRole === value ? 'text-primary-300' : 'text-white'}`}>
                        {value}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <span className="text-2xl">🎯</span> Difficulty Level
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DIFFICULTIES.map(({ value, icon: Icon, color, activeColor, textColor, desc }) => (
                <button
                  key={value}
                  id={`difficulty-${value.toLowerCase()}`}
                  onClick={() => setSelectedDifficulty(value)}
                  className={`p-5 rounded-xl border bg-gradient-to-br text-left transition-all duration-200 ${
                    selectedDifficulty === value ? activeColor : color
                  }`}
                >
                  <Icon className={`w-7 h-7 mb-3 ${textColor}`} />
                  <p className={`text-lg font-bold ${textColor}`}>{value}</p>
                  <p className="text-gray-400 text-sm mt-1">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <span className="text-2xl">🔢</span> Number of Questions
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-medium">Questions: <span className="text-primary-400 text-2xl font-bold">{questionCount}</span></span>
                <span className="text-gray-500 text-sm">Est. time: ~{questionCount * 3} min</span>
              </div>
              <input
                id="question-count-slider"
                type="range"
                min="3"
                max="15"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary-500/50"
                style={{ background: `linear-gradient(to right, #4c6ef5 0%, #4c6ef5 ${((questionCount - 3) / 12) * 100}%, rgba(255,255,255,0.1) ${((questionCount - 3) / 12) * 100}%, rgba(255,255,255,0.1) 100%)` }}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>3 (Quick)</span>
                <span>8 (Standard)</span>
                <span>15 (Deep Dive)</span>
              </div>
            </div>
          </div>

          {/* Summary & Start */}
          {selectedRole && (
            <div className="glass-card bg-gradient-to-r from-primary-500/10 to-accent-purple/10 border-primary-500/30 p-6 animate-fade-in">
              <h3 className="text-white font-semibold mb-3">Interview Summary</h3>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="bg-primary-500/20 border border-primary-500/30 text-primary-300 px-3 py-1 rounded-full text-sm">
                  {ROLES.find(r => r.value === selectedRole)?.icon} {selectedRole}
                </span>
                <span className="bg-white/10 border border-white/20 text-gray-300 px-3 py-1 rounded-full text-sm">
                  {selectedDifficulty} Difficulty
                </span>
                <span className="bg-white/10 border border-white/20 text-gray-300 px-3 py-1 rounded-full text-sm">
                  {questionCount} Questions
                </span>
              </div>
              <button
                id="start-interview-final-btn"
                onClick={handleStart}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Generating Questions with AI...</>
                ) : (
                  <><Brain className="w-5 h-5" /> Start AI Interview <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InterviewSetup;
