const Report = require('../models/Report');
const Interview = require('../models/Interview');

// @desc  Get report by ID
// @route GET /api/report/:id
const getReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: req.user._id })
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
    const reports = await Report.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('interviewId', 'role difficulty')
      .select('overallScore grade recommendation createdAt interviewId');

    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReport, getAllReports };
