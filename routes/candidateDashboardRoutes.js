const express = require('express');
const router = express.Router();
const jobController = require('../controllers/candidateDashboardController');

// GET /api/jobs/recommended/:candidateId?page=1&limit=9
router.get('/recommended/:candidateId', jobController.getRecommendedJobs);
router.get('/saved-job/:candidateId', jobController.getSavedJobs)
router.get('/applied-job/:candidateId', jobController.getAppliedJobs)
router.get('/candidate-stats/:candidateId', jobController.getCandidateStats)
router.get('/search/:candidateId', jobController.searchJobs)
router.get('/profile-tasks/:candidateId', jobController.getProfileTasks)

module.exports = router;
