const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const verifyToken = require('../middlewares/verifyToken');

router.post('/create', verifyToken, jobController.createJob);
router.get('/get', jobController.getJobs);
router.get('/get/:id', jobController.getJobById);
router.put('/update/:id', jobController.updateJob);
router.put('/delete/:id', jobController.deleteJob);
router.get('/get-jobs-category', jobController.getIndustryStats)
router.get('/get-all-jobs', jobController.getAllJobs)
router.get('/get-jobs-filter', jobController.getFilterOptions)
router.get('/admin-pannel', jobController.getJobsForAdminPannel);
router.get('/in-active', jobController.getInActiveJobsForAdminPannel)
router.get('/admin-dashboard-stats', jobController.getAdminDashboardStats)
router.patch('/update-status/:id', jobController.jobStatusUpdate)

module.exports = router;
