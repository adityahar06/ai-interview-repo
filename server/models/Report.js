const mongoose = require('mongoose');

// I separated Reports and Interviews primarily because of Access Patterns. On the History dashboard, 
// the user only needs a lightweight list of their interviews (roles, dates, status). 
// If I embedded the massive AI report data inside the interview document, the database would 
// have to pull a lot of unnecessary, heavy data just to render a simple list. By separating them,
//  fetching the history list is very fast, and we only .populate() or fetch the Report when the user actually 
// clicks into the specific Results page
const reportSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true,
    // It tells Mongoose: "One interview can only ever have ONE report." If a glitch happens on the frontend and the user accidentally submits their interview twice, 
    // the database will aggressively block the second attempt, preventing duplicate reports and keeping your data perfectly clean.
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // his ID belongs specifically to a document inside the User collection."
    // When you call .populate(), Mongoose looks at the ref to know exactly which database collection it needs to run over to in order to fetch the rest of the data.
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
