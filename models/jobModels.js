const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  companyName: { type: String, required: true },
  location: { type: String, required: true },
  salaryRange: { type: String, required: true }, // e.g. ₹20-30 LPA
  jobType: { type: String},
  minExp: { type: Number, required: true }, // Minimum experience in years
  maxExp: { type: Number, required: true }, 
  keySkills: { type: [String], default: [] },
  industryType: { type: String, required: true },
  postedAt: { type: Date, default: Date.now },
  category: { type: String }, // e.g., IT, Finance, etc.
  applyBy: { type: Date },
  openings: { type: Number },
  description: { type: String },
  responsibilities: { type: [String], default: [] },
  qualifications: { type: [String], default: [] },
  benefits: { type: [String], default: [] },
  companyDescription: { type: String },
  status: { type: String, enum: ['Active', 'In-Active'], default: 'Active' },
  companyLogo: { type: String }, 

  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'postedByModel'
  },
  postedByModel: {
    type: String,
    required: true,
    enum: ['admin', 'employer']
  },
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
