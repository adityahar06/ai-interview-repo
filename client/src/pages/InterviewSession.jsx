import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { interviewAPI } from '../api';
import useTimer from '../hooks/useTimer';
import Navbar from '../components/layout/Navbar';
import {
  Brain, Send, SkipForward, Clock, Loader2, MessageSquare,
  ChevronRight, AlertCircle, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const InterviewSession = () => {
  // it direclty Grabs the interview ID directly from the URL (e.g., /interview/12345 -> id is 12345).
  const { id } = useParams();
  // Gives you the power to teleport the user to a different page later (like the results page).
  const navigate = useNavigate();
  // To make the transition into the interview instant, I check useLocation to see if the previous page passed the interview data in memory. If it did, I render the first question instantly without hitting the database. 
  // However, I also built a robust fallback: if the user refreshes the page and loses that memory state, the app reads the ID from the URL using useParams and fetches the data so the app doesn't crash.
  const location = useLocation();

  const [interview, setInterview] = useState(location.state?.interview || null);
  const [currentQuestion, setCurrentQuestion] = useState(interview?.currentQuestion || '');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(interview?.totalQuestions || 5);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const textareaRef = useRef(null);
 // When that clock hits exactly zero, it triggers handleTimerExpire.
  const handleTimerExpire = useCallback((elapsed) => {
    // This is a crucial safety check. Imagine the timer hits 0.00 seconds at the exact same millisecond the user clicks the "Submit" button. 
    // Without this check, the app would try to submit the answer twice, crashing the server. 
    // This line says: "If the app is already in the middle of submitting, ignore the alarm
    if (!submitting) {
      toast(' Time up! Auto-submitting...', { icon: '⏱️' });
      handleSubmitAnswer(true, elapsed);
    }
    // If you didn't have [submitting] in the array, your memorized alarm function wouldn't know about the change. It would still think submitting is false. 
    // If the timer hit zero a second later, it would bypass your if (!submitting) safety check and submit the answer a second time, 
    // crashing the server
  }, [submitting]);

  const timer = useTimer(120, handleTimerExpire);

  useEffect(() => {
    // The first useEffect acts as my component initialization and disaster recovery. It runs once on mount. 
    // If the router state was lost—like if the user refreshed the page—it falls back to fetching the session data using the URL params so the app doesn't crash. 
    // If the fetch fails, it safely redirects them.
    if (!interview) {
      interviewAPI.getById(id).then(res => {
        const iv = res.data.interview;
        setInterview(iv);
        const idx = iv.currentQuestionIndex;
        setCurrentQuestion(iv.questions[idx]?.question || '');
        setQuestionNumber(idx + 1);
        setTotalQuestions(iv.totalQuestions);
      }).catch(() => navigate('/dashboard'));
    }
    timer.start();
    // The empty array at the very bottom means: "Run this code exactly one time, the very millisecond this page opens."
  }, []);
// Unlike the first hook, this array has a variable inside it. This tells React: "Watch the currentQuestion variable. 
// Every single time it changes to a new question, run this code again."
  useEffect(() => {
    // .focus() physically forces the computer's typing cursor inside the text box.
    // textareaRef.current points exactly to the HTML <textarea> (the answer box) on your screen.
    if (textareaRef.current) textareaRef.current.focus();
  }, [currentQuestion]);


  const handleSubmitAnswer = async (skipped = false, elapsed = timer.elapsed) => {
    if (submitting || isCompleting) return;
    setSubmitting(true);
    timer.pause();

    try {
      const res = await interviewAPI.submitAnswer({
        interviewId: id,
        answer: skipped ? '' : answer.trim(),
        timeTaken: elapsed,
        skipped,
      });

      setLastFeedback(res.data.questionFeedback);
      setShowFeedback(true);
      setAnswer('');

      if (res.data.isLastQuestion) {
        // Complete interview
        setTimeout(async () => {
          setIsCompleting(true);
          setShowFeedback(false);
          try {
            const completeRes = await interviewAPI.complete({ interviewId: id });
            toast.success('Interview complete! Generating your report...');
            navigate(`/results/${id}`, { state: { reportId: completeRes.data.reportId } });
          } catch {
            toast.error('Failed to generate report');
            navigate('/dashboard');
          }
        }, 3000);
      } else {
        setTimeout(() => {
          setCurrentQuestion(res.data.nextQuestion.question);
          setQuestionNumber(res.data.nextQuestion.questionNumber);
          setShowFeedback(false);
          timer.reset(120);
          setTimeout(() => timer.start(), 100);
          setSubmitting(false);
        }, 3000);
      }
    } catch (err) {
      toast.error('Failed to submit answer');
      setSubmitting(false);
      timer.start();
    }
  };

  const progress = ((questionNumber - 1) / totalQuestions) * 100;

  if (!currentQuestion && !interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/5">
        <div
          className="h-full progress-bar-animated transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-5 h-5 text-primary-400" />
              <span className="text-primary-400 font-semibold text-sm">{interview?.role}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                interview?.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' :
                interview?.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>{interview?.difficulty}</span>
            </div>
            <p className="text-gray-400 text-sm">
              Question <span className="text-white font-bold">{questionNumber}</span> of{' '}
              <span className="text-white font-bold">{totalQuestions}</span>
            </p>
          </div>

          {/* Timer */}
          <div className={`glass-card px-4 py-2 flex items-center gap-2 ${
            timer.isDanger ? 'border-red-500/60 bg-red-500/10 animate-pulse' :
            timer.isWarning ? 'border-amber-500/60 bg-amber-500/10' :
            'border-white/10'
          }`}>
            <Clock className={`w-4 h-4 ${
              timer.isDanger ? 'text-red-400' :
              timer.isWarning ? 'text-amber-400' :
              'text-primary-400'
            }`} />
            <span className={`font-mono font-bold text-lg ${
              timer.isDanger ? 'text-red-400' :
              timer.isWarning ? 'text-amber-400' :
              'text-white'
            }`}>
              {timer.formatTime(timer.timeLeft)}
            </span>
          </div>
        </div>

        {/* Completing loader */}
        {isCompleting && (
          <div className="glass-card p-12 text-center animate-fade-in mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center animate-pulse">
                <Brain className="w-9 h-9 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Generating Your Report...</h2>
            <p className="text-gray-400">AI is analyzing your performance. Please wait...</p>
            <div className="flex justify-center gap-2 mt-6">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        {/* Feedback overlay */}
        {showFeedback && lastFeedback && !isCompleting && (
          <div className="glass-card border-primary-500/30 p-6 mb-6 animate-slide-up">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                lastFeedback.score >= 7 ? 'bg-emerald-500/20 text-emerald-400' :
                lastFeedback.score >= 4 ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {lastFeedback.score >= 7 ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-white">AI Feedback</h3>
                  <span className={`text-2xl font-black ${
                    lastFeedback.score >= 7 ? 'text-emerald-400' :
                    lastFeedback.score >= 4 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>{lastFeedback.score}/10</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{lastFeedback.feedback}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-gray-400 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading next question...
            </div>
          </div>
        )}

        {/* Question Card */}
        {!isCompleting && (
          <div className="ai-bubble mb-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-accent-purple rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-primary-400 text-sm font-semibold">InterviewAI</span>
              <span className="text-gray-500 text-xs ml-auto">Question {questionNumber}</span>
            </div>
            <p className="text-white text-lg leading-relaxed font-medium">{currentQuestion}</p>
          </div>
        )}

        {/* Answer Input */}
        {!showFeedback && !isCompleting && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card p-1">
              <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm font-medium">Your Answer</span>
              </div>
              <textarea
                ref={textareaRef}
                id="answer-textarea"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here... Be thorough and specific."
                className="w-full bg-transparent px-4 py-3 text-white placeholder-gray-500 outline-none resize-none text-sm leading-relaxed"
                rows={8}
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === 'Enter') handleSubmitAnswer();
                }}
              />
              <div className="flex items-center justify-between px-4 py-2 border-t border-white/5">
                <span className="text-gray-500 text-xs">{answer.length} characters · Ctrl+Enter to submit</span>
                <span className="text-gray-500 text-xs">{answer.split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                id="skip-btn"
                onClick={() => handleSubmitAnswer(true)}
                disabled={submitting}
                className="btn-secondary flex items-center gap-2 px-5"
              >
                <SkipForward className="w-4 h-4" /> Skip
              </button>
              <button
                id="submit-answer-btn"
                onClick={() => handleSubmitAnswer(false)}
                disabled={submitting || !answer.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating...</>
                ) : (
                  <><Send className="w-4 h-4" /> Submit Answer <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default InterviewSession;
