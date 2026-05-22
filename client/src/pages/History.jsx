import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { interviewAPI } from '../api';
import { Brain, ChevronRight, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const History = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    interviewAPI.getHistory()
      .then(res => setInterviews(res.data.interviews || []))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = interviews.filter(iv => {
    const matchFilter = filter === 'all' || iv.status === filter;
    const matchSearch = iv.role.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Interview History</h1>
          <p className="text-gray-400">All your past interview sessions</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by role..."
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'completed', 'active', 'abandoned'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                  filter === f
                    ? 'bg-primary-500/30 border border-primary-500/60 text-primary-300'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card p-5 animate-pulse h-20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <Brain className="w-16 h-16 text-primary-400/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No interviews found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((iv) => (
              <div
                key={iv._id}
                onClick={() => iv.status === 'completed' && navigate(`/results/${iv._id}`)}
                className={`glass-card-hover p-5 flex items-center justify-between ${iv.status === 'completed' ? 'cursor-pointer group' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-accent-purple/20 border border-primary-500/30 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{iv.role}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        iv.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' :
                        iv.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>{iv.difficulty}</span>
                      <span className="text-gray-500 text-xs">{iv.totalQuestions} questions</span>
                      <span className="text-gray-600 text-xs">
                        {new Date(iv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium border ${
                    iv.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
                    iv.status === 'active' ? 'bg-primary-500/20 border-primary-500/40 text-primary-400' :
                    'bg-gray-500/20 border-gray-500/40 text-gray-400'
                  }`}>
                    {iv.status}
                  </span>
                  {iv.status === 'completed' && (
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-primary-400 transition-colors" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
