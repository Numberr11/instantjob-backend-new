const mongoose = require('mongoose');

const candApplyJobByCareersSchema = new mongoose.Schema({
  firstName: { type: String },
  middleName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  contact: { type: String },
  experience: { type: String },
  email: { type: String},
  title: { type: String },
  resumeUrl: { type: String },
}, {timestamps: true});

module.exports = mongoose.model('CandidateApplyJobByCareers', candApplyJobByCareersSchema);