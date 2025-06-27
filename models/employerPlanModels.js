const mongoose = require('mongoose');

const employerPlanSchema = new mongoose.Schema({
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'BuyPlan', required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  remainingJobPosts: { type: Number, required: true },
  remainingResumeViews: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('EmployerPlan', employerPlanSchema);
