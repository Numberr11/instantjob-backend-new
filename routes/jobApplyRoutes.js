const express = require('express')

const router = express.Router()

const appliedJobController = require('../controllers/applyJobController')

router.post('/create', appliedJobController.applyJob)

router.get('/applied-or-not/:candidateId/:jobId', appliedJobController.checkJobAppliedOrNot);

module.exports = router