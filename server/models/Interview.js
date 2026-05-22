const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: '' },
  score: { type: Number, default: null, min: 0, max: 10 },
  feedback: { type: String, default: '' },
  timeTaken: { type: Number, default: 0 }, // seconds
  skipped: { type: Boolean, default: false },
});

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: [
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'Data Scientist',
      'Machine Learning Engineer',
      'DevOps Engineer',
      'Mobile Developer',
      'System Design',
      'Product Manager',
      'General Software Engineer',
    ],
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
  totalQuestions: {
    type: Number,
    default: 5,
    min: 3,
    max: 15,
  },
  currentQuestionIndex: {
    type: Number,
    default: 0,
  },
  questions: [questionSchema],
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'abandoned'],
    default: 'pending',
  },
  overallScore: {
    type: Number,
    default: null,
  },
  aiSummary: {
    type: String,
    default: '',
  },
  startedAt: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
