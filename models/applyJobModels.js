const mongoose = require("mongoose");

const applyJobScehma = new mongoose.Schema({
    candidateId: {type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true},
    jobId: {type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true},
    status: { type: String, default: "new", enum: ["new", "shortlisted", "interview", "hired", "rejected"] }, 
}, {timestamps: true})


const applyJob = mongoose.model("JobApplied", applyJobScehma)

module.exports = applyJob;