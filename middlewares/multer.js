const multer = require("multer");

// Store files in memory
const storage = multer.memoryStorage();

const resumeFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed for resume"), false);
  }
};

// Handle multiple fields: excel (1 file), resumes (many files)
const uploadBulkFiles = multer({ storage }).fields([
  { name: "excel", maxCount: 1 },
  { name: "resumes", maxCount: 50 }
]);

const uploadSingleCandidate = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: resumeFileFilter,
}).single("resume");

module.exports = { uploadBulkFiles, uploadSingleCandidate };
