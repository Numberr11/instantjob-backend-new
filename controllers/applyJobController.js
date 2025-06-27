const ApplyJob = require("../models/applyJobModels");
const Job = require("../models/jobModels");
const Candidate = require("../models/candidate.model");

exports.applyJob = async (req, res) => {
  try {
    const { candidateId, jobId } = req.body;

    const candidate = await Candidate.findById(candidateId);
    const job = await Job.findById(jobId);

    if (!candidate || !job) {
      return res.staus(404).json({ error: "Candidate or job not found" });
    }

    const alreadyJobApplied = await ApplyJob.findOne({ candidateId, jobId });

    if (alreadyJobApplied) {
      return res.staus(400).json({ error: "You are already applied this job" });
    }

    const appliedJob = new ApplyJob({
      candidateId,
      jobId,
    });

    await appliedJob.save();
    res.status(201).json({ message: "Job applied successfully" });
  } catch (error) {
    res.status(500).json({ error: "sever error" });
  }
};


exports.checkJobAppliedOrNot = async (req, res) => {
    try {
      const { candidateId, jobId } = req.params;
  
      // Find if the job is saved for this candidate
      const applyJob = await ApplyJob.findOne({ candidateId, jobId });
  
      // If job is saved, return 1, otherwise return 0
      if (applyJob) {
        return res.status(200).json({ applied: 1 });
      } else {
        return res.status(200).json({ applied: 0 });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to check job applied or not." });
    }
  };
