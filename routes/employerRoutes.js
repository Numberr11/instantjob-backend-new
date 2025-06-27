const express = require('express');
  const router = express.Router();
  const { signupEmployer, loginEmployer, getAllEmployers, updateEmployerStatus, getEmployerById, getEmployerStats, getApplicationTrends, getRecentApplicants, updateJobApplicationStatus, bulkSignupEmployers, getJobsByEmployer, getJobFiltersByEmployer, updateJobStatus, updateEmployerPassword, updateEmployer } = require('../controllers/employerController');
const restrictTo = require('../middlewares/restrictTo');

  router.post('/signup', signupEmployer);
  router.post('/login', loginEmployer);
  router.get('/get-all', restrictTo('admin'), getAllEmployers)
  router.patch('/verify/:id', updateEmployerStatus)
  router.get('/get/:id', getEmployerById)
  router.get('/dashboard-stats/:id', getEmployerStats)
  router.get('/dashboard-applications-trends/:id', getApplicationTrends)
  router.get('/dashboard/applicants/:id', getRecentApplicants)
  router.patch('/update/job-app/status/:id', updateJobApplicationStatus)
  router.post('/bulk-signup', bulkSignupEmployers)
  router.get('/get-jobs-by-employer/:id', getJobsByEmployer)
  router.get('/get-job-filters-for-employer/:id', getJobFiltersByEmployer)
  router.put('/update-job-status/:id', updateJobStatus)
  router.put('/update-password/:id',updateEmployerPassword)
  router.put('/update-employer-profile/:id',updateEmployer)

  module.exports = router;