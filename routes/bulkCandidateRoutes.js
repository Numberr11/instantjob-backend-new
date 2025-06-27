const express = require("express");
const router = express.Router();
const bulkCandidateController = require("../controllers/uploadBulkCandidates");
const { uploadBulkFiles, uploadSingleCandidate } = require("../middlewares/multer");

router.post("/upload-bulk-candidates", uploadBulkFiles, bulkCandidateController.uploadBulkCandidates);
router.post('/upload-single-candidate', uploadSingleCandidate, bulkCandidateController.addSingleCandidate)
router.get('/get-all-bulk-candidate', bulkCandidateController.getBulkCandidates)
router.put('/bulk-cand-update/:id', bulkCandidateController.updateBulkCandidate)
router.delete('/bulk-cand-delete/:id', bulkCandidateController.deleteBulkCandidate)


module.exports = router;
