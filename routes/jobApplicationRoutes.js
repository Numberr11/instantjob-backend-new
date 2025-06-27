const express = require('express')

const router = express.Router()

const jobApplicationsController = require('../controllers/jobApplications')


router.get('/get-job-candidates-details', jobApplicationsController.getJobCandidateDetails);

module.exports = router