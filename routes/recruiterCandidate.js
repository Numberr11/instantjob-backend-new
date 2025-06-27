const express = require("express");
const router = express.Router();

const {
  addCandidate,
  getAllCandidates,
  updateCandidate,
  deleteCandidate,
  getCandidatesByRecruiter,
} = require("../controllers/recruiterCandidateController");
const { uploadResume } = require("../middlewares/multerS3");
const verifyToken = require("../middlewares/verifyToken");

router.post(
  "/create",
  verifyToken,
  uploadResume.single("resume"),
  addCandidate
);
router.get("/get-all", getAllCandidates);
router.get("/get-by-recruiterId", verifyToken, getCandidatesByRecruiter);

router.put(
  "/update/:id",
  verifyToken,
  uploadResume.single("resume"),
  updateCandidate
);
router.delete("/delete/:id", verifyToken, deleteCandidate);

module.exports = router;
