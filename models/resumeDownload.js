const mongoose = require("mongoose");

const ResumeDownloadSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate", 
      required: true,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
    },
    isSave: {
      type: Boolean,
      default: false,
    },
    isDownload: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);


ResumeDownloadSchema.index({ candidateId: 1, employerId: 1 }, { unique: true });

const ResumeDownload = mongoose.model("ResumeDownload", ResumeDownloadSchema);

module.exports = ResumeDownload;
