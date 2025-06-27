const mongoose = require("mongoose");

const bulkCandidateSchema = new mongoose.Schema({
  full_name: String,
  email: String,
  phone: String,
  gender: String,
  currentLocation: String,
  prefferedLocation: String,
  currentpackage: String,
  expectedpackage: String,
  linkedinProfile: String,
  jobRole: String,
  totalExperience: String,
  relevantExperience: String,
  currentOrganization: String,
  noticePeriod: String,
  resumeUrl: String, // Final S3 URL
}, { timestamps: true });

module.exports = mongoose.model("BulkCandidate", bulkCandidateSchema);
