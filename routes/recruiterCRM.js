const express = require("express");
const router = express.Router();
const RecruiterCRM = require("../controllers/recruiterCRMController.js")
const verifyToken = require("../middlewares/verifyToken.js");
const restrictTo = require("../middlewares/restrictTo");

// Create new candidate
router.post("/", verifyToken, RecruiterCRM.addCandidate);

// Update candidate
router.put("/:id", verifyToken, RecruiterCRM.updateCandidate);

// Delete candidate
router.delete("/:id", verifyToken, RecruiterCRM.deleteCandidate);

// Get recruiter's candidates with filtering
router.get("/", verifyToken, RecruiterCRM.viewCandidates);

// Get single candidate details
// router.get("/:id", verifyToken, RecruiterCRM.getCandidate);


router.get("/candidates", verifyToken ,restrictTo("admin"), RecruiterCRM.viewAllCandidates);


module.exports = router;
