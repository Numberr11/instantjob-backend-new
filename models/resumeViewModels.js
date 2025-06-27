const mongoose = require('mongoose');

const resumeViewSchema = new mongoose.Schema({
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  viewedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ResumeView', resumeViewSchema);
