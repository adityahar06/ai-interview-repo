import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Brain, Eye, EyeOff, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}! 🎉`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900/50 via-dark-100 to-dark-500 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Animated particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              width: `${Math.random() * 60 + 20}px`,
              height: `${Math.random() * 60 + 20}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
            }}
          />
        ))}

        <div className="relative z-10 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-purple rounded-3xl flex items-center justify-center mx-auto mb-8 glow-primary">
            <Brain className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-5xl font-black gradient-text mb-4">InterviewAI</h1>
          <p className="text-gray-300 text-xl mb-8 max-w-sm leading-relaxed">
            Practice technical interviews with AI-powered feedback and real-time evaluation
          </p>
          <div className="space-y-4">
            {[
              '🎯 Role-specific question banks',
              '🤖 Gemini AI-powered evaluation',
              '📊 Detailed performance reports',
              '⏱️ Real-time feedback & scoring',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 glass-card px-4 py-3 text-left">
                <span className="text-lg">{feature.split(' ')[0]}</span>
                <span className="text-gray-300 text-sm">{feature.split(' ').slice(1).join(' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">InterviewAI</span>
          </div>

          <div className="glass-card p-8">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary-400" />
                <span className="text-primary-400 text-sm font-semibold uppercase tracking-wider">Welcome Back</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Sign in to your account</h2>
              <p className="text-gray-400 mt-2">Don't have an account? <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Create one free</Link></p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input-field"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="input-field pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                id="login-btn"
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
                ) : (
                  <><span>Sign In</span><ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
              <p className="text-xs text-gray-400 text-center">
                🔒 Your sessions and interview data are securely stored and encrypted
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
