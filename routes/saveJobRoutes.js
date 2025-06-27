const express = require('express');
const router = express.Router();
const saveJobController = require('../controllers/saveJobController');

// Save a job
router.post('/create', saveJobController.saveJob);

// Get saved job details by candidateId and jobId
router.get('/get/:candidateId/:jobId', saveJobController.getJobCandidateDetails);

// Update saved job by saveJobId
router.put('/update/:saveJobId', saveJobController.updateSaveJob);

// Delete saved job by saveJobId
router.delete('/delete/:saveJobId', saveJobController.deleteSaveJob);

// Get all saved jobs by candidateId
router.get('/all-job-by-candidateId/:candidateId', saveJobController.getSavedJobsByCandidate);

router.get('/saved-status/:candidateId/:jobId', saveJobController.checkSavedJobStatus);

router.delete('/unsave/:candidateId/:jobId', saveJobController.unsaveJob)


module.exports = router;
