const SaveJob = require('../models/saveJob');
const Job = require('../models/jobModels');
const Candidate = require('../models/candidate.model');

// Create a new save job
exports.saveJob = async (req, res) => {
    try {
      const { candidateId, jobId } = req.body;
  
      // Check if the candidate and job exist
      const candidate = await Candidate.findById(candidateId);
      const job = await Job.findById(jobId);
  
      if (!candidate || !job) {
        return res.status(404).json({ error: 'Candidate or Job not found' });
      }
  
      // Check if the candidate has already saved this job
      const existingSavedJob = await SaveJob.findOne({ candidateId, jobId });
      
      if (existingSavedJob) {
        return res.status(400).json({ error: 'You have already saved this job' });
      }
  
      // Save the job for the candidate
      const savedJob = new SaveJob({
        candidateId,
        jobId,
      });
  
      await savedJob.save();
      res.status(201).json({ message: 'Job saved successfully', savedJob });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };
  
// Get saved job by candidateId and jobId
exports.getJobCandidateDetails = async (req, res) => {
  try {
    const { candidateId, jobId } = req.params;

    const savedJob = await SaveJob.findOne({ candidateId, jobId })
    .sort({createdAt: -1})
      .populate('candidateId', 'full_name email phone')  // Populating candidate details
      .populate('jobId', 'title companyName location salaryRange jobType'); // Populating job details

    if (!savedJob) {
      return res.status(404).json({ error: 'Saved job not found' });
    }

    res.status(200).json(savedJob);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update saved job (e.g., change jobId or candidateId)
exports.updateSaveJob = async (req, res) => {
  try {
    const { saveJobId } = req.params;
    const { candidateId, jobId } = req.body;

    const updatedSaveJob = await SaveJob.findByIdAndUpdate(
      saveJobId,
      { candidateId, jobId },
      { new: true }
    );

    if (!updatedSaveJob) {
      return res.status(404).json({ error: 'Saved job not found' });
    }

    res.status(200).json({ message: 'Saved job updated', updatedSaveJob });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a saved job by saveJobId
exports.deleteSaveJob = async (req, res) => {
  try {
    const { saveJobId } = req.params;

    const deletedSaveJob = await SaveJob.findByIdAndDelete(saveJobId);

    if (!deletedSaveJob) {
      return res.status(404).json({ error: 'Saved job not found' });
    }

    res.status(200).json({ message: 'Saved job deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all saved jobs by candidateId
exports.getSavedJobsByCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const savedJobs = await SaveJob.find({ candidateId })
    .sort({createdAt: -1})
      .populate('candidateId', 'full_name email phone')
      .populate('jobId', 'title companyName location salaryRange jobType');

    if (!savedJobs || savedJobs.length === 0) {
      return res.status(404).json({ error: 'No saved jobs found for this candidate' });
    }

    res.status(200).json(savedJobs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.checkSavedJobStatus = async (req, res) => {
    try {
      const { candidateId, jobId } = req.params;
  
      // Find if the job is saved for this candidate
      const savedJob = await SaveJob.findOne({ candidateId, jobId });
  
      // If job is saved, return 1, otherwise return 0
      if (savedJob) {
        return res.status(200).json({ saved: 1 });
      } else {
        return res.status(200).json({ saved: 0 });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to check saved job status." });
    }
  };

  exports.unsaveJob = async (req, res) => {
    try {
      const { candidateId, jobId } = req.params;  // Now using params to receive candidateId and jobId
  
      // Check if the candidate and job exist
      const candidate = await Candidate.findById(candidateId);
      const job = await Job.findById(jobId);
  
      if (!candidate || !job) {
        return res.status(404).json({ error: 'Candidate or Job not found' });
      }
  
      // Find the saved job to unsave it
      const savedJob = await SaveJob.findOneAndDelete({ candidateId, jobId });
  
      if (!savedJob) {
        return res.status(400).json({ error: 'Job not found in saved jobs' });
      }
  
      res.status(200).json({ message: 'Job unsaved successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error while unsaving job' });
    }
  };
