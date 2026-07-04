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
    // enum is used for strict rules that this is only allowed i any lese i sbeing stored then mongod will give error
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
  // I enabled Mongoose's native timestamps to automatically track the createdAt and updatedAt 
  // lifecycle of my documents. This completely removes the need to manually manage 
  // date objects in my controllers, ensures my database has a reliable chronological audit trail, and makes it incredibly easy to sort data for the frontend dashboards
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
