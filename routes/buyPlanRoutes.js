const express = require('express');
const router = express.Router();

const buyPlanController = require('../controllers/buyPlanController')


router.post('/create', buyPlanController.createPlan)


module.exports = router;
