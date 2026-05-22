const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getReport, getAllReports } = require('../controllers/reportController');

router.use(protect);

router.get('/', getAllReports);
router.get('/:id', getReport);

module.exports = router;
