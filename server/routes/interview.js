const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  startInterview,
  submitAnswer,
  completeInterview,
  getHistory,
  getInterview,
  // ADDED: resumeUpload is the multer middleware that reads the PDF from the request
  // before the startInterview controller function runs
  resumeUpload,
} = require('../controllers/interviewController');

router.use(protect);

// ADDED: resumeUpload.single('resume') tells multer to look for a file input named 'resume'
// in the form data. If found, it parses it and attaches it to req.file for the controller to use.
// If no file is attached, req.file is simply undefined and the interview runs as normal.
router.post('/start', resumeUpload.single('resume'), startInterview);
router.post('/answer', submitAnswer);
router.post('/complete', completeInterview);
router.get('/history', getHistory);
router.get('/:id', getInterview);

module.exports = router;
