const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
  },
  summary: { type: String, default: '' },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  questionBreakdown: [
    {
      question: String,
      score: Number,
      feedback: String,
    },
  ],
  recommendation: {
    type: String,
    enum: ['Hire', 'Consider', 'Reject'],
    default: 'Consider',
  },
}, { timestamps: true });

// Auto-compute grade from score
reportSchema.pre('save', function (next) {
  const s = this.overallScore;
  if (s >= 9.5) this.grade = 'A+';
  else if (s >= 8.5) this.grade = 'A';
  else if (s >= 7.5) this.grade = 'B+';
  else if (s >= 6.5) this.grade = 'B';
  else if (s >= 5.5) this.grade = 'C+';
  else if (s >= 4.5) this.grade = 'C';
  else if (s >= 3.5) this.grade = 'D';
  else this.grade = 'F';

  if (s >= 7) this.recommendation = 'Hire';
  else if (s >= 5) this.recommendation = 'Consider';
  else this.recommendation = 'Reject';

  next();
});

module.exports = mongoose.model('Report', reportSchema);
