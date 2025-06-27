const mongoose = require('mongoose');

// Define the SaveJob Schema
const saveJobSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
}, { timestamps: true });

// Create the SaveJob model
const SaveJob = mongoose.model('SaveJob', saveJobSchema);

module.exports = SaveJob;
