const mongoose = require("mongoose");

const recruiterCandidateSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    jobRole: { type: String },
    exp: { type: String },
    resumeUrl: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecruiterCandidate", recruiterCandidateSchema);
