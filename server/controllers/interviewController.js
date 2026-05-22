const Interview = require('../models/Interview');
const User = require('../models/User');
const Report = require('../models/Report');
const { generateInterviewQuestions, evaluateAnswer, generateReport } = require('../services/geminiService');

// @desc  Start a new interview
// @route POST /api/interview/start
const startInterview = async (req, res, next) => {
  try {
    const { role, difficulty, totalQuestions } = req.body;

    if (!role || !difficulty) {
      return res.status(400).json({ success: false, message: 'Role and difficulty are required' });
    }

    const count = Math.min(Math.max(parseInt(totalQuestions) || 5, 3), 15);

    // Generate questions using Gemini AI
    const questionTexts = await generateInterviewQuestions(role, difficulty, count);

    const questions = questionTexts.map(q => ({ question: q }));

    const interview = await Interview.create({
      userId: req.user._id,
      role,
      difficulty,
      totalQuestions: count,
      questions,
      status: 'active',
      startedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      interview: {
        _id: interview._id,
        role: interview.role,
        difficulty: interview.difficulty,
        totalQuestions: interview.totalQuestions,
        currentQuestionIndex: 0,
        currentQuestion: interview.questions[0].question,
        status: interview.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Submit an answer and get next question
// @route POST /api/interview/answer
const submitAnswer = async (req, res, next) => {
  try {
    const { interviewId, answer, timeTaken, skipped } = req.body;

    const interview = await Interview.findOne({ _id: interviewId, userId: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    if (interview.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Interview is not active' });
    }

    const currentIndex = interview.currentQuestionIndex;
    const currentQuestion = interview.questions[currentIndex];

    // Evaluate the answer with AI
    let evaluation = { score: 0, feedback: 'Question skipped.' };
    if (!skipped && answer && answer.trim()) {
      evaluation = await evaluateAnswer(
        interview.role,
        interview.difficulty,
        currentQuestion.question,
        answer
      );
    }

    // Update current question
    interview.questions[currentIndex].answer = answer || '';
    interview.questions[currentIndex].score = evaluation.score;
    interview.questions[currentIndex].feedback = evaluation.feedback;
    interview.questions[currentIndex].timeTaken = timeTaken || 0;
    interview.questions[currentIndex].skipped = !!skipped;

    const nextIndex = currentIndex + 1;
    const isLastQuestion = nextIndex >= interview.totalQuestions;

    interview.currentQuestionIndex = nextIndex;

    if (isLastQuestion) {
      interview.status = 'completed';
      interview.completedAt = new Date();
    }

    await interview.save();

    const responseData = {
      success: true,
      questionFeedback: evaluation,
      isLastQuestion,
    };

    if (!isLastQuestion) {
      responseData.nextQuestion = {
        question: interview.questions[nextIndex].question,
        questionNumber: nextIndex + 1,
        totalQuestions: interview.totalQuestions,
      };
    }

    res.json(responseData);
  } catch (error) {
    next(error);
  }
};

// @desc  Complete interview & generate report
// @route POST /api/interview/complete
const completeInterview = async (req, res, next) => {
  try {
    const { interviewId } = req.body;

    const interview = await Interview.findOne({ _id: interviewId, userId: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Force complete if not already
    if (interview.status !== 'completed') {
      interview.status = 'completed';
      interview.completedAt = new Date();
      await interview.save();
    }

    // Check if report already exists
    const existingReport = await Report.findOne({ interviewId });
    if (existingReport) {
      return res.json({ success: true, reportId: existingReport._id });
    }

    // Calculate overall score
    const scoredQuestions = interview.questions.filter(q => q.score !== null);
    const overallScore = scoredQuestions.length > 0
      ? scoredQuestions.reduce((sum, q) => sum + q.score, 0) / scoredQuestions.length
      : 0;

    // Generate AI report
    const aiReport = await generateReport(interview.role, interview.difficulty, interview.questions);

    // Save report
    const report = await Report.create({
      interviewId: interview._id,
      userId: req.user._id,
      overallScore: parseFloat(overallScore.toFixed(1)),
      summary: aiReport.summary,
      strengths: aiReport.strengths,
      improvements: aiReport.improvements,
      questionBreakdown: interview.questions.map(q => ({
        question: q.question,
        score: q.score || 0,
        feedback: q.feedback || '',
      })),
    });

    // Update user stats
    const user = await User.findById(req.user._id);
    const totalInterviews = user.totalInterviews + 1;
    const newAvg = ((user.averageScore * user.totalInterviews) + overallScore) / totalInterviews;
    
    user.totalInterviews = totalInterviews;
    user.averageScore = parseFloat(newAvg.toFixed(1));
    await user.save();

    res.json({ success: true, reportId: report._id });
  } catch (error) {
    next(error);
  }
};

// @desc  Get interview history
// @route GET /api/interview/history
const getHistory = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('role difficulty status overallScore totalQuestions startedAt completedAt createdAt')
      .limit(20);

    res.json({ success: true, interviews });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single interview
// @route GET /api/interview/:id
const getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    res.json({ success: true, interview });
  } catch (error) {
    next(error);
  }
};

module.exports = { startInterview, submitAnswer, completeInterview, getHistory, getInterview };
