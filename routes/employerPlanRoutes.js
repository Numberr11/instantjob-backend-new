const express = require('express');
const router = express.Router();


const employerPlanController = require('../controllers/employerPlanController')

router.post('/buy', employerPlanController.purchasePlan)


module.exports = router;