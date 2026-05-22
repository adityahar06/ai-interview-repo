const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  startInterview,
  submitAnswer,
  completeInterview,
  getHistory,
  getInterview,
} = require('../controllers/interviewController');

router.use(protect);

router.post('/start', startInterview);
router.post('/answer', submitAnswer);
router.post('/complete', completeInterview);
router.get('/history', getHistory);
router.get('/:id', getInterview);

module.exports = router;
