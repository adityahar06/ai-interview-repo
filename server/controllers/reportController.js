const Report = require('../models/Report');
const Interview = require('../models/Interview');

// @desc  Get report by ID
// @route GET /api/report/:id
const getReport = async (req, res, next) => {
  try {
    // By adding userId: req.user._id, you are forcing the database to check both. The database now says: "I will only give you Report #42
    //  IF the name on the report exactly matches the person currently logged in." 
    // This completely shuts down the vulnerability known as IDOR (Insecure Direct Object Reference).
    const report = await Report.findOne({ _id: req.params.id, userId: req.user._id })
    // When you fetch this report, I want you to take the interviewId, secretly run over to the Interviews collection, find the matching interview, grab the 'role' and 'difficulty'  and more text, and stitch
    //  them directly into this report object before handing it back to me."
    //  It combines two separate pieces of data into one neat package for your frontend, behaving exactly like a JOIN command in SQL

      .populate('interviewId', 'role difficulty totalQuestions startedAt completedAt');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc  Get all reports for user
// @route GET /api/report
const getAllReports = async (req, res, next) => {
  try {
    // first This function retrieves the user's interview history for their dashboard. I chained .sort() to ensure the newest records appear first, and used .select() to perform database projection. By explicitly excluding the heavy, 
    // AI-generated text fields, I drastically reduced the API's payload size, 
    // ensuring the dashboard loads instantly even as the user's history grows."
    const reports = await Report.find({ userId: req.user._id })
    // it just sort command does not throw away the older interviews; it 
    // just rearranges the list so that the newest one is sitting at the very top.
    // -1 means Descending (Newest to Oldest). The interview taken 5 minutes ago is at the top; the interview taken last year is at the bottom.
      .sort({ createdAt: -1 })
      .populate('interviewId', 'role difficulty')
      .select('overallScore grade recommendation createdAt interviewId');

    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReport, getAllReports };
