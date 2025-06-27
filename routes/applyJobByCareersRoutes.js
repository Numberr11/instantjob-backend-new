const express = require("express");
const router = express.Router();
const { applyJobController } = require("../controllers/candidateApplyJobsByCareers");
const { uploadSingleCandidate } = require("../middlewares/multer");

router.post("/apply-job-by-careers", uploadSingleCandidate, applyJobController);

module.exports = router;
